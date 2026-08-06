/**
 * Authentication Routes
 * 
 * [SECURITY CHECKLIST §1.1] Strong Password Hashing (bcrypt 12 rounds)
 * [SECURITY CHECKLIST §1.3] Generic Login Errors ("Invalid email or password")
 * [SECURITY CHECKLIST §1.4] Rate Limiting for Logins (loginRateLimiter + account lockout)
 * [SECURITY CHECKLIST §1.5] Validated Tokens (JWT via generateToken)
 * [SECURITY CHECKLIST §1.6] Strong Password Policy (validatePassword)
 * [SECURITY CHECKLIST §1.7] Logout Invalidates Session (revokeJWTByValue)
 * 
 * Secure endpoints for user registration and login.
 * 
 * Security Features Implemented:
 * 1. Password validation against strong policy
 * 2. bcrypt password hashing with proper salt rounds
 * 3. Rate limiting to prevent brute-force attacks
 * 4. Generic error messages to prevent user enumeration
 * 5. JWT-based session management
 * 6. Account lockout after failed attempts
 * 
 * IMPORTANT: Never log or return passwords in any form!
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import StaffUser from '../models/StaffUser';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import Resident from '../models/Resident';
import Distribution from '../models/Distribution';
import Claim from '../models/Claim';
import ResidentQrScanLog from '../models/ResidentQrScanLog';
import { validatePassword, isCommonPassword } from '../utils/passwordValidator';
import { generateToken } from '../middleware/authMiddleware';
import { loginRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../validation/validateRequest';
import { loginResendOtpBody, loginVerifyOtpBody, registerBody, validatePasswordBody } from '../validation/auth.schema';
import { userLoginSchema } from '../schemas/authSchemas';
import { revokeJWTByValue } from '../services/tokenRevocationService';
import { logAudit } from '../utils/audit';
import { sendLoginVerifyOtpEmail } from '../utils/mailer';

const router = Router();

function auditLoginFailure(req: Request, identifier: string, reason: string) {
  logAudit(req, 'LOGIN_FAILURE', 'Auth', '', { identifier, reason }).catch(() => {});
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'LGU', lastName: 'Staff' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * bcrypt Salt Rounds Configuration
 * [SECURITY CHECKLIST §1.1] bcrypt cost factor = 12 (industry standard)
 * 
 * Security Explanation:
 * - Salt rounds determine the computational cost of hashing
 * - Higher rounds = more secure but slower
 * - 12 rounds is the current industry standard (2024)
 * - Each increment doubles the computation time
 * 
 * Recommended values:
 * - 10: ~10 hashes/second (minimum acceptable)
 * - 12: ~2-3 hashes/second (recommended)
 * - 14: Very slow but extremely secure
 * 
 * Why this matters:
 * - If your database is compromised, attackers need to crack hashes
 * - Higher salt rounds make brute-force attacks impractical
 * - A 12-round hash takes ~2-3 seconds to verify (fine for login)
 */
const SALT_ROUNDS = 12;
const DUMMY_BCRYPT_HASH = '$2b$12$KIXTOzaOGBy05XHs9hLKyuBP7dsQVG4x5vjXPMNGSBKLVoKJGxbW6';
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_PENDING_TOKEN_EXPIRY = '10m';

/**
 * Account lockout tracking (in-memory for demo)
 * [SECURITY CHECKLIST §1.4] Account lockout — 5 attempts / 15 min lockout
 * 
 * In production, use Redis or database for:
 * - Persistence across server restarts
 * - Distributed rate limiting across multiple servers
 * 
 * Tracks failed login attempts per email to implement account lockout
 */
interface LoginAttempt {
  attempts: number;
  lockedUntil: Date | null;
  lastAttempt: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const ATTEMPT_RESET_MINUTES = 30;

type MobileOtpPendingPayload = {
  sub?: string;
  purpose?: 'otp_pending_login_2fa';
};

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not set');
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
}

function generateOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

function issueMobileOtpToken(userId: string): string {
  return jwt.sign(
    { sub: userId, purpose: 'otp_pending_login_2fa' },
    getJWTSecret(),
    { expiresIn: OTP_PENDING_TOKEN_EXPIRY, algorithm: 'HS256' } as SignOptions,
  );
}

async function saveMobileLoginOtp(staffUser: InstanceType<typeof StaffUser>, otp: string): Promise<void> {
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

  await LoginVerifyOtp.findOneAndUpdate(
    { emailLower: staffUser.emailLower, purpose: 'LOGIN_2FA' },
    {
      userId: staffUser._id,
      emailLower: staffUser.emailLower,
      purpose: 'LOGIN_2FA',
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      usedAt: null,
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastSentAt: new Date(),
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

/**
 * Check if account is locked
 */
function isAccountLocked(email: string): { locked: boolean; remainingMinutes?: number } {
  const attempt = loginAttempts.get(email.toLowerCase());
  
  if (!attempt || !attempt.lockedUntil) {
    return { locked: false };
  }
  
  const now = new Date();
  if (now < attempt.lockedUntil) {
    const remainingMs = attempt.lockedUntil.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return { locked: true, remainingMinutes };
  }
  
  // Lock expired, reset attempts
  loginAttempts.delete(email.toLowerCase());
  return { locked: false };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const normalizedEmail = email.toLowerCase();
  const now = new Date();
  const attempt = loginAttempts.get(normalizedEmail);
  
  if (!attempt) {
    loginAttempts.set(normalizedEmail, {
      attempts: 1,
      lockedUntil: null,
      lastAttempt: now,
    });
    return;
  }
  
  // Reset if last attempt was long ago
  const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime();
  if (timeSinceLastAttempt > ATTEMPT_RESET_MINUTES * 60 * 1000) {
    loginAttempts.set(normalizedEmail, {
      attempts: 1,
      lockedUntil: null,
      lastAttempt: now,
    });
    return;
  }
  
  // Increment attempt counter
  attempt.attempts++;
  attempt.lastAttempt = now;
  
  // Lock account if too many attempts
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    console.warn(`[SECURITY] Account locked due to failed attempts: ${normalizedEmail}`);
  }
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

/**
 * POST /api/auth/register
 * 
 * Create a new user account with secure password handling.
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required, must meet policy)
 * - firstName: string (required)
 * - lastName: string (required)
 * 
 * Security measures:
 * 1. Rate limiting via registrationRateLimiter middleware
 * 2. Password policy validation
 * 3. Common password rejection
 * 4. bcrypt hashing before storage
 * 5. Password never logged or returned
 */
router.post('/register', registrationRateLimiter, validateRequest({ body: registerBody }), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        fields: ['email', 'password', 'firstName', 'lastName'],
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }
    
    // Validate password against strong policy
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }
    
    // Reject commonly used weak passwords
    if (isCommonPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'This password is too common. Please choose a stronger password.',
      });
    }
    
    // Check if user already exists
    // Note: Using generic message to prevent user enumeration
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Generic message - don't reveal that email exists
      return res.status(400).json({
        success: false,
        message: 'Unable to create account. Please try a different email.',
      });
    }
    
    /**
     * Hash the password with bcrypt
     * 
     * How bcrypt works:
     * 1. Generates a random salt (built into the hash)
     * 2. Combines password + salt
     * 3. Runs through bcrypt algorithm SALT_ROUNDS times
     * 4. Produces a 60-character hash string
     * 
     * The hash includes: algorithm version, salt rounds, salt, and hash
     * Example: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.R8lNmfW2FgMH.S
     */
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create new user with hashed password
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword, // NEVER store plaintext password!
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    
    await user.save();
    
    // Generate JWT token for immediate login
    const scopedBarangays =
      user.role === 'Volunteer' && user.barangay ? [user.barangay] : undefined;
    const token = generateToken(user._id.toString(), user.email, user.role, scopedBarangays);
    
    // Return success WITHOUT the password
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
        token,
      },
    });
    
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
});

/**
 * POST /api/auth/login
 * 
 * Authenticate user with email and password.
 * 
 * Request body:
 * - email: string
 * - password: string
 * 
 * Security measures:
 * 1. IP-based rate limiting (loginRateLimiter)
 * 2. Account-based lockout after failed attempts
 * 3. Constant-time password comparison (bcrypt.compare)
 * 4. Generic error messages to prevent enumeration
 * 5. Failed attempts are logged for security monitoring
 */
router.post('/login', loginRateLimiter, validateRequest({ body: userLoginSchema }), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }
    
    const normalizedEmail = email.toLowerCase();
    
    // Check for account lockout BEFORE database lookup
    // This prevents timing attacks and reduces DB load during attacks
    const lockStatus = isAccountLocked(normalizedEmail);
    if (lockStatus.locked) {
      console.warn(`[SECURITY] Login attempt on locked account: ${normalizedEmail}`);
      auditLoginFailure(req, normalizedEmail, 'account_locked');
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${lockStatus.remainingMinutes} minutes.`,
        locked: true,
        retryAfter: `${lockStatus.remainingMinutes} minutes`,
      });
    }
    
    // Find legacy user by email (explicitly select password since it's excluded by default)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    /**
     * Security: Constant-time comparison
     * 
     * Even if user doesn't exist, we still run bcrypt.compare
     * with a dummy hash to prevent timing attacks that could
     * reveal whether an email is registered.
     */
    if (!user) {
      // Fallback: allow LGU_STAFF accounts created from web admin.
      const staffUser = (await StaffUser.findOne({ emailLower: normalizedEmail }).select('+passwordHash'))
        || (await StaffUser.findOne({ email: normalizedEmail }).select('+passwordHash'));

      if (!staffUser) {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
        recordFailedAttempt(normalizedEmail);
        auditLoginFailure(req, normalizedEmail, 'invalid_credentials');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const staffPasswordHash = staffUser.passwordHash;
      if (!staffPasswordHash) {
        recordFailedAttempt(normalizedEmail);
        auditLoginFailure(req, normalizedEmail, 'invalid_credentials');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }
      const isStaffPasswordValid = await bcrypt.compare(password, staffPasswordHash);
      if (!isStaffPasswordValid) {
        recordFailedAttempt(normalizedEmail);
        const attempts = loginAttempts.get(normalizedEmail);
        console.warn(`[SECURITY] Failed login attempt for: ${normalizedEmail} (${attempts?.attempts || 1}/${MAX_LOGIN_ATTEMPTS})`);
        auditLoginFailure(req, normalizedEmail, 'invalid_credentials');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      clearFailedAttempts(normalizedEmail);

      if (!staffUser.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact an administrator.',
          code: 'ACCOUNT_INACTIVE',
        });
      }

      const otp = generateOtp();
      await saveMobileLoginOtp(staffUser, otp);

      try {
        await sendLoginVerifyOtpEmail(staffUser.email, otp);
      } catch (mailErr) {
        console.error('[MAILER] Failed to send mobile login verification OTP:', (mailErr as Error).message);
        return res.status(500).json({
          success: false,
          message: 'Unable to send verification code.',
          code: 'OTP_SEND_FAILED',
        });
      }

      logAudit(req, 'LOGIN_OTP_SENT', 'Auth', staffUser._id.toString(), {
        identifier: normalizedEmail,
        role: 'LGU_STAFF',
        flow: 'MOBILE_LOGIN_2FA',
      }).catch(() => {});

      return res.json({
        success: true,
        otpRequired: true,
        otpToken: issueMobileOtpToken(staffUser._id.toString()),
        message: 'A verification code has been sent to your registered Gmail address.',
      });
    }

    /**
     * Compare password with stored hash using bcrypt.compare
     * 
     * How it works:
     * 1. Extract salt from stored hash
     * 2. Hash the provided password with same salt
     * 3. Compare resulting hashes in constant time
     * 
     * bcrypt.compare is safe against timing attacks because it
     * uses constant-time string comparison internally.
     */
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      recordFailedAttempt(normalizedEmail);
      
      // Log failed attempt for security monitoring
      const attempts = loginAttempts.get(normalizedEmail);
      console.warn(`[SECURITY] Failed login attempt for: ${normalizedEmail} (${attempts?.attempts || 1}/${MAX_LOGIN_ATTEMPTS})`);
      auditLoginFailure(req, normalizedEmail, 'invalid_credentials');
      
      // Generic message - don't reveal which field was wrong
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Clear failed attempts on successful login
    clearFailedAttempts(normalizedEmail);
    
    // Check if user account is active
    if (user.status !== 'Active') {
      auditLoginFailure(req, normalizedEmail, 'account_inactive');
      return res.status(403).json({
        success: false,
        message: user.status === 'Suspended' 
          ? 'Your account has been suspended. Please contact an administrator.'
          : 'Your account is inactive. Please contact an administrator.',
        code: 'ACCOUNT_INACTIVE',
      });
    }
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token with role
    const scopedBarangays =
      user.role === 'Volunteer' && user.barangay ? [user.barangay] : undefined;
    const token = generateToken(user._id.toString(), user.email, user.role, scopedBarangays);
    
    // Log successful login (for audit trail)
    console.log(`[AUTH] Successful login: ${normalizedEmail} (${user.role})`);
    logAudit(req, 'LOGIN_SUCCESS', 'Auth', user._id.toString(), {
      identifier: normalizedEmail,
      role: user.role,
    }).catch(() => {});
    
    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          assignedBarangays: scopedBarangays || [],
          barangay: user.barangay,
        },
        token,
      },
    });
    
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
});

/**
 * POST /api/auth/logout
 *
 * Revokes the currently supplied bearer token.
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      await revokeJWTByValue(token, 'access');
    }

    res.json({
      success: true,
      message: 'Logged out.',
    });
  } catch (error) {
    console.error('[AUTH LOGOUT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
});

/**
 * POST /api/auth/validate-password
 * 
 * Utility endpoint to check password strength without creating account.
 * Useful for real-time password strength feedback on frontend.
 * 
 * This endpoint has no rate limiting as it doesn't reveal sensitive info.
 */
router.post('/validate-password', validateRequest({ body: validatePasswordBody }), (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
    });
  }
  
  const validation = validatePassword(password);
  const isCommon = isCommonPassword(password);
  
  res.json({
    success: true,
    data: {
      isValid: validation.isValid && !isCommon,
      strength: validation.strength,
      errors: [
        ...validation.errors,
        ...(isCommon ? ['This password is too common'] : []),
      ],
    },
  });
});

/**
 * GET /api/auth/me
 * 
 * Get current authenticated user's profile.
 * 
 * Security:
 * - Requires valid JWT token
 * - Returns user data without password
 */
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }
    
    if (role === 'LGU_STAFF') {
      const staff = await StaffUser.findById(userId).select('-passwordHash');
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      const names = splitFullName(staff.fullName || '');
      return res.json({
        success: true,
        data: {
          id: staff._id,
          email: staff.email,
          firstName: names.firstName,
          lastName: names.lastName,
          role: 'LGU_STAFF',
          status: staff.isActive ? 'Active' : 'Inactive',
          assignedBarangays: staff.assignedBarangays,
          barangay: Array.isArray(staff.assignedBarangays) && staff.assignedBarangays.length > 0
            ? staff.assignedBarangays[0]
            : undefined,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        assignedBarangays: user.role === 'Volunteer' && user.barangay ? [user.barangay] : [],
        barangay: user.barangay,
        phoneNumber: user.phoneNumber,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[AUTH ME ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
});

/**
 * PATCH /api/mobile-auth/me
 *
 * Update authenticated mobile user profile fields.
 * Supported:
 * - Volunteer/Admin/Staff: firstName, lastName, phoneNumber
 * - LGU_STAFF: firstName, lastName (stored as StaffUser.fullName)
 */
router.patch('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const payload = req.body || {};
    const hasAnyField =
      payload.firstName !== undefined ||
      payload.lastName !== undefined ||
      payload.phoneNumber !== undefined;

    if (!hasAnyField) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const normalizeName = (value: unknown, field: string): string | undefined => {
      if (value === undefined) return undefined;
      if (typeof value !== 'string') {
        throw new Error(`${field} must be a string`);
      }
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error(`${field} cannot be empty`);
      }
      if (trimmed.length > 50) {
        throw new Error(`${field} cannot exceed 50 characters`);
      }
      return trimmed;
    };

    const firstName = normalizeName(payload.firstName, 'firstName');
    const lastName = normalizeName(payload.lastName, 'lastName');

    let phoneNumber: string | undefined;
    if (payload.phoneNumber !== undefined) {
      if (typeof payload.phoneNumber !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'phoneNumber must be a string',
        });
      }
      const trimmed = payload.phoneNumber.trim();
      if (trimmed && !/^(\+63|0)?[0-9]{10,11}$/.test(trimmed)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid Philippine phone number',
        });
      }
      phoneNumber = trimmed || undefined;
    }

    if (role === 'LGU_STAFF') {
      const staff = await StaffUser.findById(userId);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const currentNames = splitFullName(staff.fullName || '');
      const nextFirst = firstName ?? currentNames.firstName;
      const nextLast = lastName ?? currentNames.lastName;
      staff.fullName = `${nextFirst} ${nextLast}`.trim();
      await staff.save();

      const updatedNames = splitFullName(staff.fullName);
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: staff._id,
          email: staff.email,
          firstName: updatedNames.firstName,
          lastName: updatedNames.lastName,
          role: 'LGU_STAFF',
          status: staff.isActive ? 'Active' : 'Inactive',
          assignedBarangays: staff.assignedBarangays,
          barangay: Array.isArray(staff.assignedBarangays) && staff.assignedBarangays.length > 0
            ? staff.assignedBarangays[0]
            : undefined,
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        assignedBarangays: user.role === 'Volunteer' && user.barangay ? [user.barangay] : [],
        barangay: user.barangay,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    const message = (error as Error).message || 'An error occurred';
    if (message.includes('must be a string') || message.includes('cannot')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error('[AUTH PATCH /me ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating profile',
    });
  }
});

/**
 * GET /api/mobile-auth/dashboard-summary
 *
 * Returns scoped dashboard stats for mobile volunteer/staff users.
 */
router.get('/dashboard-summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!['Volunteer', 'LGU_STAFF', 'Staff', 'Admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    let scopedBarangays: string[] = [];

    if (role === 'LGU_STAFF') {
      const staff = await StaffUser.findById(userId).select('assignedBarangays').lean();
      scopedBarangays = Array.isArray(staff?.assignedBarangays) ? staff!.assignedBarangays : [];
    } else {
      const user = await User.findById(userId).select('barangay').lean();
      scopedBarangays = user?.barangay ? [user.barangay] : [];
    }

    scopedBarangays = Array.from(new Set(scopedBarangays.filter(Boolean)));

    if (scopedBarangays.length === 0) {
      return res.json({
        success: true,
        data: {
          scopedBarangays: [],
          residents: {
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
          },
          distributions: {
            total: 0,
            active: 0,
          },
          claims: {
            confirmedToday: 0,
          },
          scans: {
            today: 0,
            yesterday: 0,
            trend: 0,
          },
        },
      });
    }

    const residentScope = { barangay: mongoose.trusted({ $in: scopedBarangays }) };
    const [totalResidents, approvedResidents, pendingResidents, rejectedResidents] = await Promise.all([
      Resident.countDocuments(residentScope),
      Resident.countDocuments({ ...residentScope, status: 'Approved' }),
      Resident.countDocuments({ ...residentScope, status: 'Pending' }),
      Resident.countDocuments({ ...residentScope, status: 'Rejected' }),
    ]);

    const scopedDistributions = await Distribution.find({
      $or: mongoose.trusted([
        { barangay: { $in: scopedBarangays } },
        { assignedBarangays: { $in: scopedBarangays } },
      ]),
    })
      .select('_id status')
      .lean();

    const totalDistributions = scopedDistributions.length;
    const activeDistributions = scopedDistributions.filter((d) => d.status !== 'Claimed').length;

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTomorrow = new Date(startToday);
    startTomorrow.setDate(startTomorrow.getDate() + 1);
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);

    const [scansToday, scansYesterday, confirmedClaimsToday] = await Promise.all([
      ResidentQrScanLog.countDocuments({
        scannerId: userId,
        result: 'VALID',
        createdAt: {
          $gte: startToday,
          $lt: startTomorrow,
        },
      }),
      ResidentQrScanLog.countDocuments({
        scannerId: userId,
        result: 'VALID',
        createdAt: {
          $gte: startYesterday,
          $lt: startToday,
        },
      }),
      Claim.countDocuments({
        claimCategory: 'DISTRIBUTION',
        barangay: mongoose.trusted({ $in: scopedBarangays }),
        status: 'CONFIRMED',
        createdAt: {
          $gte: startToday,
          $lt: startTomorrow,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        scopedBarangays,
        residents: {
          total: totalResidents,
          approved: approvedResidents,
          pending: pendingResidents,
          rejected: rejectedResidents,
        },
        distributions: {
          total: totalDistributions,
          active: activeDistributions,
        },
        claims: {
          confirmedToday: confirmedClaimsToday,
        },
        scans: {
          today: scansToday,
          yesterday: scansYesterday,
          trend: scansToday - scansYesterday,
        },
      },
    });
  } catch (error) {
    console.error('[DASHBOARD SUMMARY ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard summary',
    });
  }
});

export default router;

