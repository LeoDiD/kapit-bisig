/**
 * Authentication Routes
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
import User from '../models/User';
import { validatePassword, isCommonPassword } from '../utils/passwordValidator';
import { generateToken } from '../middleware/authMiddleware';
import { loginRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * bcrypt Salt Rounds Configuration
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

/**
 * Account lockout tracking (in-memory for demo)
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
router.post('/register', registrationRateLimiter, async (req: Request, res: Response) => {
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
    const token = generateToken(user._id.toString(), user.email);
    
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
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
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
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${lockStatus.remainingMinutes} minutes.`,
        locked: true,
        retryAfter: `${lockStatus.remainingMinutes} minutes`,
      });
    }
    
    // Find user by email (explicitly select password since it's excluded by default)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    /**
     * Security: Constant-time comparison
     * 
     * Even if user doesn't exist, we still run bcrypt.compare
     * with a dummy hash to prevent timing attacks that could
     * reveal whether an email is registered.
     */
    if (!user) {
      // Dummy comparison to maintain constant response time
      await bcrypt.compare(password, '$2b$12$dummyhashtopreventtimingattacks');
      recordFailedAttempt(normalizedEmail);
      
      // Generic message - same as wrong password
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
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
      
      // Generic message - don't reveal which field was wrong
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Clear failed attempts on successful login
    clearFailedAttempts(normalizedEmail);
    
    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);
    
    // Log successful login (for audit trail)
    console.log(`[AUTH] Successful login: ${normalizedEmail}`);
    
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
 * POST /api/auth/validate-password
 * 
 * Utility endpoint to check password strength without creating account.
 * Useful for real-time password strength feedback on frontend.
 * 
 * This endpoint has no rate limiting as it doesn't reveal sensitive info.
 */
router.post('/validate-password', (req: Request, res: Response) => {
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

export default router;

