/**
 * Household Registration Routes
 * 
 * Secure API endpoints for household token validation and registration.
 * 
 * Security Features:
 * 1. Rate limiting on all endpoints
 * 2. Brute-force detection and blocking
 * 3. Input validation and sanitization
 * 4. Comprehensive audit logging
 * 5. Atomic token locking for concurrent registration protection
 * 
 * Endpoints:
 * - POST /validate-token: Check if a token is valid (before registration)
 * - POST /register: Complete household registration with token
 * 
 * Flow:
 * 1. User enters token → validate-token endpoint checks validity
 * 2. User fills registration form
 * 3. User submits → register endpoint acquires lock, creates resident, marks token used
 * 
 * Concurrency Protection:
 * - If multiple family members submit simultaneously, only ONE succeeds
 * - Others receive "Registration in progress" error
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { householdRegistrationService } from '../services/householdRegistrationService';
import RegistrationAuditLog from '../models/RegistrationAuditLog';
import { generateRequestId, householdTokenService } from '../services/householdTokenService';
import HouseholdToken from '../models/HouseholdToken';
import Resident from '../models/Resident';
import ResidentPasswordResetOtp from '../models/ResidentPasswordResetOtp';
import Distribution from '../models/Distribution';
import Claim from '../models/Claim';
import ResidentQrScanLog from '../models/ResidentQrScanLog';
import { computeEventHash, computeHouseholdHash } from '../utils/hashHelpers';
import { isClaimedOnChain, submitClaimOnChain } from '../services/blockchainService';
import bcrypt from 'bcrypt';
import {
  loginRateLimiter,
  passwordResetRateLimiter,
  tokenValidationRateLimiter,
  householdRegistrationRateLimiter,
  mobileLookupRateLimiter,
} from '../middleware/rateLimiter';
import { validateRequest } from '../validation/validateRequest';
import {
  validateTokenBody,
  recordDuplicateBlockBody,
  registerHouseholdBody,
  checkMobileBody,
} from '../validation/household.schema';
import { validateBase64Image } from '../validation/imageValidation';
import { normalizeIdNumber } from '../utils/idVerification';
import { authMiddleware, generateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  isValidPhilippineMobileNumber,
  normalizePhilippineMobileNumber,
} from '../utils/mobileNumber';
import {
  householdForgotResetSchema,
  householdForgotSendOtpSchema,
  householdForgotVerifyOtpSchema,
  householdLoginSchema,
} from '../schemas/authSchemas';
import { revokeJWTByValue } from '../services/tokenRevocationService';
import { sendResetOtpEmail } from '../utils/mailer';
import { validatePasswordStrength } from '../utils/passwordValidator';

const router = Router();
const CLAIMED_STATUSES = ['PENDING_CHAIN', 'CHAIN_SUBMITTED', 'CONFIRMED', 'CHAIN_FAILED'] as const;
const PASSWORD_RESET_OTP_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_OTP_MAX_ATTEMPTS = 5;
const RESIDENT_RESET_TOKEN_EXPIRY = '10m';

/**
 * Debug endpoint to check tokens in database
 * Remove this in production!
 */
router.get('/debug-tokens', async (_req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
      });
    }

    const tokens = await HouseholdToken.find({
      status: { $in: ['UNUSED', 'LOCKED'] },
      expiresAt: { $gt: new Date() },
    }).setOptions({ sanitizeFilter: false });
    
    const testToken = 'JFTP-3OMT-Y9Q7';
    let matchResult = 'No match';
    
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(testToken, token.tokenHash);
      if (isMatch) {
        matchResult = `Match found: ${token.tokenPrefix}`;
        break;
      }
    }
    
    res.json({
      tokenCount: tokens.length,
      tokenPrefixes: tokens.map(t => t.tokenPrefix),
      testToken,
      matchResult,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get client IP address
 * Handles X-Forwarded-For for proxy setups
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Get user agent string
 */
function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

function generateOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  if (s.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
  return s;
}

/**
 * Sanitize token input
 */
function sanitizeToken(token: string): string {
  if (!token || typeof token !== 'string') {
    return '';
  }
  // Remove whitespace and convert to uppercase
  return token.trim().toUpperCase();
}

interface ResidentQrPayloadV1 {
  v: 1;
  t: 'resident';
  rid: string; // residentCode
}

type CachedScanResult = {
  residentId: string;
  residentCode: string;
  maskedName: string;
  barangay: string;
  city: string;
  status: string;
  cachedAt: number;
};

const SCAN_CACHE_TTL_MS = 30 * 1000;
const scanLookupCache = new Map<string, CachedScanResult>();

const residentAvatarUploadsDir = path.resolve(__dirname, '../../public/uploads/resident-avatars');
if (!fs.existsSync(residentAvatarUploadsDir)) {
  fs.mkdirSync(residentAvatarUploadsDir, { recursive: true });
}

const residentAvatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, residentAvatarUploadsDir),
  filename: (req: any, file, cb) => {
    const userId = req.user?.userId || 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `resident-avatar-${userId}${ext}`);
  },
});

const residentAvatarUpload = multer({
  storage: residentAvatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

function getResidentQrPayload(residentCode: string): string {
  const payload: ResidentQrPayloadV1 = {
    v: 1,
    t: 'resident',
    rid: residentCode,
  };

  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `KBQR1.${encoded}`;
}

function getMaskedName(fullName: string): string {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'Uxxxx Uxxxx';
  }
  if (parts.length === 1) {
    const firstInitial = parts[0][0]?.toUpperCase() || 'U';
    return `${firstInitial}xxxx`;
  }

  const firstInitial = parts[0][0]?.toUpperCase() || 'U';
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || 'U';
  return `${firstInitial}xxxx ${lastInitial}xxxx`;
}

const residentNameNoiseWords = new Set([
  'APPROVED',
  'PENDING',
  'REJECTED',
  'VERIFIED',
  'ACTIVE',
  'INACTIVE',
  'RESIDENT',
  'HOUSEHOLD',
]);

function normalizeResidentName(input: { firstName?: string; lastName?: string; fullName?: string }): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const cleanParts = (raw: string): string[] =>
    String(raw || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .filter((part) => !residentNameNoiseWords.has(part.toUpperCase()));

  let firstParts = cleanParts(input.firstName || '');
  let lastParts = cleanParts(input.lastName || '');
  const fullParts = cleanParts(input.fullName || '');

  if (firstParts.length === 0 && fullParts.length > 0) {
    firstParts = [fullParts[0]];
  }
  if (lastParts.length === 0 && fullParts.length > 1) {
    lastParts = [fullParts[fullParts.length - 1]];
  }

  const firstName = firstParts.join(' ').trim();
  const lastName = lastParts.join(' ').trim();
  const fullName = `${firstName} ${lastName}`.trim() || fullParts.join(' ').trim();

  return { firstName, lastName, fullName };
}

function getResidentDisplayName(input: { firstName?: string; lastName?: string; fullName?: string }): string {
  return normalizeResidentName(input).fullName;
}

function isAllowedScannerRole(role: string | undefined): boolean {
  if (!role) return false;
  return ['Volunteer', 'Staff', 'Admin', 'LGU_STAFF', 'SUPERADMIN'].includes(role);
}

function parseResidentCodeFromQr(qrData: string): string | null {
  if (!qrData || typeof qrData !== 'string') {
    return null;
  }

  const trimmed = qrData.trim();

  // Accept direct resident code for manual test input.
  if (/^[A-Z]{2}-\d{4}-\d{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (!trimmed.startsWith('KBQR1.')) {
    return null;
  }

  try {
    const encodedPayload = trimmed.slice('KBQR1.'.length);
    const decodedPayload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const parsed = JSON.parse(decodedPayload) as Partial<ResidentQrPayloadV1>;

    if (parsed.v !== 1 || parsed.t !== 'resident' || typeof parsed.rid !== 'string') {
      return null;
    }

    return parsed.rid.toUpperCase();
  } catch {
    return null;
  }
}

function cacheScanResult(cacheKey: string, value: Omit<CachedScanResult, 'cachedAt'>): void {
  scanLookupCache.set(cacheKey, {
    ...value,
    cachedAt: Date.now(),
  });
}

function getCachedScanResult(cacheKey: string): CachedScanResult | null {
  const cached = scanLookupCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.cachedAt;
  if (age > SCAN_CACHE_TTL_MS) {
    scanLookupCache.delete(cacheKey);
    return null;
  }

  return cached;
}

/**
 * Validate Token Endpoint
 * 
 * POST /api/household/validate-token
 * 
 * Checks if a token is valid before starting registration.
 * Returns household info if valid (auto-fills address fields).
 * 
 * Request body:
 * {
 *   token: string  // Format: XXXX-XXXX-XXXX
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   valid: boolean,
 *   message: string,
 *   householdInfo?: {
 *     headOfHousehold: string,
 *     address: string,
 *     barangay: string,
 *     expectedMembers: number
 *   }
 * }
 */
router.post('/validate-token', tokenValidationRateLimiter, validateRequest({ body: validateTokenBody }), async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  try {
    const { token, barangay } = req.body;
    
    // Input validation
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Token is required',
        errorCode: 'MISSING_TOKEN',
      });
    }
    
    const sanitizedToken = sanitizeToken(token);
    const sanitizedBarangay = barangay && typeof barangay === 'string' ? barangay.trim() : undefined;
    
    // Check for brute force attempts
    const bruteForceCheck = await RegistrationAuditLog.detectBruteForce(ipAddress, 15, 10);
    if (bruteForceCheck.detected) {
      await RegistrationAuditLog.log({
        eventType: 'BRUTE_FORCE_DETECTED',
        severity: 'CRITICAL',
        tokenPrefix: sanitizedToken.replace(/-/g, '').slice(0, 4),
        ipAddress,
        userAgent,
        requestId,
        message: `Brute force detected: ${bruteForceCheck.attemptCount} failed attempts`,
        metadata: { attemptCount: bruteForceCheck.attemptCount },
        success: false,
        errorCode: 'BRUTE_FORCE',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(429).json({
        success: false,
        valid: false,
        message: 'Too many failed attempts. Please try again later.',
        errorCode: 'RATE_LIMITED',
      });
    }
    
    // Validate token format
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(sanitizedToken)) {
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_INVALID',
        severity: 'WARNING',
        tokenPrefix: sanitizedToken.slice(0, 4),
        ipAddress,
        userAgent,
        requestId,
        message: 'Invalid token format',
        success: false,
        errorCode: 'INVALID_FORMAT',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(400).json({
        success: true,
        valid: false,
        message: 'Invalid token format. Please enter a valid token (XXXX-XXXX-XXXX).',
        errorCode: 'INVALID_FORMAT',
      });
    }
    
    // Validate token (with barangay filter for faster lookup)
    const result = await householdRegistrationService.validateToken(
      sanitizedToken,
      ipAddress,
      userAgent,
      sanitizedBarangay
    );
    
    return res.status(result.valid ? 200 : 400).json(result);
    
  } catch (error) {
    console.error('[HouseholdRoutes] Token validation error:', error);
    
    await RegistrationAuditLog.log({
      eventType: 'TOKEN_INVALID',
      severity: 'ERROR',
      ipAddress,
      userAgent,
      requestId,
      message: `Validation error: ${(error as Error).message}`,
      success: false,
      errorCode: 'SYSTEM_ERROR',
      processingTimeMs: Date.now() - startTime,
    });
    
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Unable to validate token. Please try again.',
      errorCode: 'SYSTEM_ERROR',
    });
  }
});

/**
 * Register Household Endpoint
 * 
 * POST /api/household/register
 * 
 * Complete registration with household token.
 * Uses atomic locking to ensure only ONE registration per token.
 * 
 * Request body: Full registration data including householdToken
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   residentId?: string,
 *   householdInfo?: { ... }
 * }
 */
router.post('/register', householdRegistrationRateLimiter, validateRequest({ body: registerHouseholdBody }), async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  try {
    const registrationData = req.body;
    
    // Input validation
    if (!registrationData || typeof registrationData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errorCode: 'INVALID_REQUEST',
      });
    }
    
    // Sanitize token
    if (registrationData.householdToken) {
      registrationData.householdToken = sanitizeToken(registrationData.householdToken);
    }
    
    // Check for brute force
    const bruteForceCheck = await RegistrationAuditLog.detectBruteForce(ipAddress, 30, 5);
    if (bruteForceCheck.detected) {
      await RegistrationAuditLog.log({
        eventType: 'BRUTE_FORCE_DETECTED',
        severity: 'CRITICAL',
        tokenPrefix: registrationData.householdToken?.replace(/-/g, '').slice(0, 4),
        ipAddress,
        userAgent,
        requestId,
        message: `Brute force on registration: ${bruteForceCheck.attemptCount} failed attempts`,
        metadata: { attemptCount: bruteForceCheck.attemptCount },
        success: false,
        errorCode: 'BRUTE_FORCE',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please try again later.',
        errorCode: 'RATE_LIMITED',
      });
    }
    
    // Validate required fields exist
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'mobileNumber',
      'password', 'barangay', 'streetAddress', 'householdToken',
      'idType', 'idNumber', 'frontIdImage', 'backIdImage', 'faceImage',
    ];
    
    const missingFields = requiredFields.filter(field => !registrationData[field]);
    if (missingFields.length > 0) {
      await RegistrationAuditLog.log({
        eventType: 'REGISTRATION_FAILED',
        severity: 'WARNING',
        tokenPrefix: registrationData.householdToken?.replace(/-/g, '').slice(0, 4),
        ipAddress,
        userAgent,
        requestId,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        metadata: { missingFields },
        success: false,
        errorCode: 'MISSING_FIELDS',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        errorCode: 'MISSING_FIELDS',
        validationErrors: missingFields.map((field) => ({
          field,
          code: 'REQUIRED',
          message: `${field} is required`,
        })),
      });
    }
    
    // Validate token format
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(registrationData.householdToken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
        errorCode: 'INVALID_TOKEN_FORMAT',
      });
    }
    
    registrationData.idNumber = normalizeIdNumber(registrationData.idType, registrationData.idNumber);

    const [frontValidation, backValidation, faceValidation] = await Promise.all([
      validateBase64Image(registrationData.frontIdImage, {
        fieldName: 'Front ID image',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
      validateBase64Image(registrationData.backIdImage, {
        fieldName: 'Back ID image',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
      validateBase64Image(registrationData.faceImage, {
        fieldName: 'Face image',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 160,
        minHeight: 160,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
    ]);

    const failedValidation = [frontValidation, backValidation, faceValidation].find((v) => !v.ok);
    if (failedValidation && !failedValidation.ok) {
      const field = failedValidation.message.toLowerCase().includes('front')
        ? 'frontIdImage'
        : failedValidation.message.toLowerCase().includes('back')
          ? 'backIdImage'
          : 'faceImage';
      return res.status(400).json({
        success: false,
        message: failedValidation.message,
        errorCode: 'IMAGE_VALIDATION_FAILED',
        validationErrors: [{
          field,
          code: 'INVALID_IMAGE',
          message: failedValidation.message,
        }],
      });
    }

    // Process registration
    const result = await householdRegistrationService.registerResident(
      registrationData,
      ipAddress,
      userAgent
    );
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: result.message,
        residentId: result.residentId?.toString(),
        residentCode: result.residentCode,
        householdInfo: result.householdInfo,
      });
    } else {
      // Map error codes to HTTP status codes
      const statusCodes: Record<string, number> = {
        'TOKEN_NOT_FOUND': 400,
        'TOKEN_EXPIRED': 400,
        'TOKEN_ALREADY_USED': 409,
        'TOKEN_REVIEW_REQUIRED': 403,
        'LOCK_CONFLICT': 409, // Conflict - another registration in progress
        'VALIDATION_FAILED': 400,
        'VALIDATION_ERROR': 400,
        'DUPLICATE_MOBILE': 409,
        'DUPLICATE_ID': 409,
        'SYSTEM_ERROR': 500,
      };
      
      const statusCode = statusCodes[result.errorCode || ''] || 400;
      
      return res.status(statusCode).json({
        success: false,
        message: result.message,
        errorCode: result.errorCode,
        validationErrors: result.validationErrors,
      });
    }
    
  } catch (error) {
    console.error('[HouseholdRoutes] Registration error:', error);
    
    await RegistrationAuditLog.log({
      eventType: 'REGISTRATION_FAILED',
      severity: 'ERROR',
      ipAddress,
      userAgent,
      requestId,
      message: `Registration error: ${(error as Error).message}`,
      success: false,
      errorCode: 'SYSTEM_ERROR',
      processingTimeMs: Date.now() - startTime,
    });
    
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      errorCode: 'SYSTEM_ERROR',
    });
  }
});

/**
 * Resident Login Endpoint
 *
 * POST /api/household/auth/login
 *
 * Authenticates a registered household resident using mobile number + password.
 * Pending residents are allowed to sign in for limited access (home/profile only).
 * Rejected residents are blocked from sign-in.
 */
router.post('/auth/login', loginRateLimiter, validateRequest({ body: householdLoginSchema }), async (req: Request, res: Response) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password || typeof mobileNumber !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required',
      });
    }

    const normalizedMobile = normalizePhilippineMobileNumber(mobileNumber.trim());
    if (!isValidPhilippineMobileNumber(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format',
      });
    }

    const resident = await Resident.findOne({ mobileNumber: normalizedMobile }).select('+password');

    if (!resident) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password',
      });
    }

    const storedPassword = resident.password || '';
    let passwordValid = false;

    if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
      passwordValid = await bcrypt.compare(password, storedPassword);
    } else {
      passwordValid = password === storedPassword;
      if (passwordValid) {
        resident.password = password;
        await resident.save();
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password',
      });
    }

    if (resident.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your registration was rejected. Please contact your barangay office.',
        code: 'REGISTRATION_REJECTED',
      });
    }

    const token = generateToken(resident._id.toString(), normalizedMobile, 'Resident');

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: resident._id,
          firstName: resident.firstName,
          lastName: resident.lastName,
          fullName: resident.fullName,
          mobileNumber: resident.mobileNumber,
          barangay: resident.barangay,
          status: resident.status,
          role: 'Resident',
        },
        token,
      },
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Resident login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process login.',
    });
  }
});

/**
 * Resident Logout Endpoint
 *
 * POST /api/household/auth/logout
 *
 * Invalidates the active bearer token server-side via JWT revocation list.
 */
router.post('/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      await revokeJWTByValue(token, 'access');
    }
    return res.json({
      success: true,
      message: 'Logged out.',
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Resident logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process logout.',
    });
  }
});

/**
 * Resident Session Endpoint
 *
 * GET /api/household/auth/me
 *
 * Returns the authenticated resident profile.
 */
router.get('/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const resident = await Resident.findById(userId).select(
      'residentCode avatarUrl firstName lastName fullName mobileNumber email barangay city streetAddress householdSize status createdAt'
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    const normalizedName = normalizeResidentName({
      firstName: resident.firstName,
      lastName: resident.lastName,
      fullName: resident.fullName,
    });

    return res.json({
      success: true,
      data: {
        id: resident._id.toString(),
        residentCode: resident.residentCode,
        avatarUrl: resident.avatarUrl || null,
        firstName: normalizedName.firstName || resident.firstName,
        lastName: normalizedName.lastName || resident.lastName,
        fullName: normalizedName.fullName || resident.fullName,
        mobileNumber: resident.mobileNumber,
        email: resident.email || '',
        barangay: resident.barangay,
        city: resident.city || '',
        streetAddress: resident.streetAddress,
        householdSize: resident.householdSize,
        status: resident.status,
      },
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Resident /auth/me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch resident profile.',
    });
  }
});

/**
 * Resident Profile Update Endpoint
 *
 * PATCH /api/household/auth/me
 *
 * Allows authenticated resident to update selected profile fields.
 */
router.patch('/auth/me', mobileLookupRateLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Resident') {
      return res.status(403).json({
        success: false,
        message: 'Only resident accounts can update this profile.',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payload = req.body || {};
    const updates: Record<string, any> = {};

    const maybeSetTrimmed = (field: string) => {
      const value = payload[field];
      if (value === undefined) return;
      if (typeof value !== 'string') {
        throw new Error(`${field} must be a string`);
      }
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error(`${field} cannot be empty`);
      }
      updates[field] = trimmed;
    };

    maybeSetTrimmed('firstName');
    maybeSetTrimmed('lastName');
    maybeSetTrimmed('streetAddress');
    maybeSetTrimmed('city');

    if (payload.email !== undefined) {
      if (typeof payload.email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'email must be a string',
        });
      }

      const normalizedEmail = payload.email.trim().toLowerCase();
      if (normalizedEmail.length > 0 && !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }

      if (normalizedEmail) {
        const existingEmailOwner = await Resident.findOne({
          _id: { $ne: userId },
          emailLower: normalizedEmail,
        })
          .select('_id')
          .lean();
        if (existingEmailOwner) {
          return res.status(409).json({
            success: false,
            message: 'Email is already in use',
          });
        }
      }

      updates.email = normalizedEmail;
    }

    if (payload.mobileNumber !== undefined) {
      if (typeof payload.mobileNumber !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'mobileNumber must be a string',
        });
      }
      const normalizedMobile = normalizePhilippineMobileNumber(payload.mobileNumber.trim());
      if (!isValidPhilippineMobileNumber(normalizedMobile)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format',
        });
      }
      const existing = await Resident.findOne({
        _id: { $ne: userId },
        mobileNumber: normalizedMobile,
      })
        .select('_id')
        .lean();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number is already in use',
        });
      }
      updates.mobileNumber = normalizedMobile;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const resident = await Resident.findById(userId).select(
      'residentCode avatarUrl firstName lastName fullName mobileNumber email barangay city streetAddress householdSize status'
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    Object.assign(resident, updates);
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      resident.fullName = `${resident.firstName} ${resident.lastName}`.trim();
    }

    await resident.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: resident._id.toString(),
        residentCode: resident.residentCode,
        avatarUrl: resident.avatarUrl || null,
        firstName: resident.firstName,
        lastName: resident.lastName,
        fullName: resident.fullName,
        mobileNumber: resident.mobileNumber,
        email: resident.email || '',
        barangay: resident.barangay,
        city: resident.city || '',
        streetAddress: resident.streetAddress,
        householdSize: resident.householdSize,
        status: resident.status,
      },
    });
  } catch (error) {
    const message = (error as Error).message || '';
    if (message.includes('must be a string') || message.includes('cannot be empty')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }
    console.error('[HouseholdRoutes] Resident PATCH /auth/me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update resident profile.',
    });
  }
});

/**
 * Resident Avatar Upload Endpoint
 *
 * POST /api/household/auth/me/avatar
 *
 * Stores resident profile photo and returns public avatar URL.
 */
router.post(
  '/auth/me/avatar',
  mobileLookupRateLimiter,
  authMiddleware,
  residentAvatarUpload.single('avatar'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role !== 'Resident') {
        return res.status(403).json({
          success: false,
          message: 'Only resident accounts can update this profile.',
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const uploadedFile = (req as Request & { file?: Express.Multer.File }).file;
      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const avatarUrl = `/uploads/resident-avatars/${uploadedFile.filename}`;
      await Resident.findByIdAndUpdate(userId, { avatarUrl });

      return res.json({
        success: true,
        message: 'Profile photo updated successfully',
        data: { avatarUrl },
      });
    } catch (error) {
      console.error('[HouseholdRoutes] Resident avatar upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to upload profile photo.',
      });
    }
  }
);

/**
 * Resident Distribution Feed Endpoint
 *
 * GET /api/household/distributions
 *
 * Returns distributions that cover the authenticated resident's barangay.
 */
router.get('/distributions', mobileLookupRateLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Resident') {
      return res.status(403).json({
        success: false,
        message: 'Only resident accounts can access this feed.',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const resident = await Resident.findById(userId).select('barangay status');
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    if (resident.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message:
          resident.status === 'Pending'
            ? 'Your account is still pending approval. Distribution feed is unavailable.'
            : 'Resident account is not approved.',
        code: resident.status === 'Pending' ? 'PENDING_APPROVAL' : 'REGISTRATION_NOT_APPROVED',
      });
    }

    const residentBarangay = resident.barangay;
    const allDistributions = await Distribution.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const coveredDistributions = allDistributions
      .filter((d) => d.barangay === residentBarangay || (d.assignedBarangays ?? []).some((b) => b === residentBarangay))
      .map((d) => ({
        id: d._id.toString(),
        barangay: d.barangay,
        assignedBarangays: d.assignedBarangays ?? [],
        scheduled: d.scheduled,
        notes: d.notes || '',
        status: d.status,
        createdAt: d.createdAt,
      }));

    const residentClaims = await Claim.find({
      residentId: userId,
      status: mongoose.trusted({ $in: [...CLAIMED_STATUSES] }),
    })
      .setOptions({ sanitizeFilter: false })
      .select('distributionId status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const claimByDistribution = new Map<string, string>();
    for (const claim of residentClaims) {
      if (claim?.distributionId) {
        claimByDistribution.set(String(claim.distributionId), String(claim.status || ''));
      }
    }

    const data = coveredDistributions.map((d) => {
      const claimStatus = claimByDistribution.get(d.id) || null;
      return {
        ...d,
        residentClaimed: Boolean(claimStatus),
        residentClaimStatus: claimStatus,
      };
    });

    // Fallback: if no covered distributions are currently visible but resident already has
    // claim records, return claimed cards so home screen doesn't appear empty.
    if (data.length === 0 && residentClaims.length > 0) {
      const claimedDistributionIds = Array.from(
        new Set(residentClaims.map((c) => String(c.distributionId)).filter(Boolean)),
      );

      const claimedDistributions = claimedDistributionIds.length
        ? await Distribution.find({
            _id: mongoose.trusted({
              $in: claimedDistributionIds.map((id) => new mongoose.Types.ObjectId(id)),
            }),
          })
            .sort({ createdAt: -1 })
            .lean()
        : [];

      const fallbackData = claimedDistributions.map((d) => ({
        id: d._id.toString(),
        barangay: d.barangay,
        assignedBarangays: d.assignedBarangays ?? [],
        scheduled: d.scheduled,
        notes: d.notes || '',
        status: d.status,
        createdAt: d.createdAt,
        residentClaimed: true,
        residentClaimStatus: claimByDistribution.get(d._id.toString()) || 'CONFIRMED',
      }));

      return res.json({
        success: true,
        data: fallbackData,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Resident /distributions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch distributions.',
    });
  }
});

/**
 * Resident Forgot Password OTP (Email/Gmail)
 *
 * POST /api/household/auth/forgot-password/send-otp
 * POST /api/household/auth/forgot-password/verify-otp
 * POST /api/household/auth/forgot-password/reset
 */
router.post('/auth/forgot-password/send-otp', passwordResetRateLimiter, validateRequest({ body: householdForgotSendOtpSchema }), async (req: Request, res: Response) => {
  try {
    const emailLower = String(req.body.email || '').trim().toLowerCase();

    const resident = await Resident.findOne({
      emailLower,
      status: { $ne: 'Rejected' },
    }).select('_id email emailLower');

    if (resident) {
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 12);

      await ResidentPasswordResetOtp.findOneAndUpdate(
        { emailLower },
        {
          residentId: resident._id,
          emailLower,
          otpHash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_OTP_EXPIRY_MINUTES * 60 * 1000),
          attemptsLeft: PASSWORD_RESET_OTP_MAX_ATTEMPTS,
          lastSentAt: new Date(),
          createdAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      try {
        await sendResetOtpEmail(resident.email || emailLower, otp);
      } catch (mailErr) {
        console.error('[MAILER] Failed to send resident reset OTP:', (mailErr as Error).message);
      }
    }

    return res.json({
      success: true,
      message: 'If the email exists, an OTP was sent.',
    });
  } catch (error) {
    console.error('[HOUSEHOLD_FORGOT_SEND_OTP]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

router.post('/auth/forgot-password/verify-otp', passwordResetRateLimiter, validateRequest({ body: householdForgotVerifyOtpSchema }), async (req: Request, res: Response) => {
  try {
    const emailLower = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '');

    const record = await ResidentPasswordResetOtp.findOne({ emailLower });
    if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code.',
      });
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
      await record.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code.',
      });
    }

    const resident = await Resident.findById(record.residentId).select('_id');
    if (!resident) {
      await ResidentPasswordResetOtp.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code.',
      });
    }

    const resetToken = jwt.sign(
      { sub: resident._id.toString(), purpose: 'resident_password_reset' },
      getJWTSecret(),
      { expiresIn: RESIDENT_RESET_TOKEN_EXPIRY, algorithm: 'HS256' } as SignOptions,
    );

    await ResidentPasswordResetOtp.deleteOne({ _id: record._id });

    return res.json({
      success: true,
      resetToken,
    });
  } catch (error) {
    console.error('[HOUSEHOLD_FORGOT_VERIFY_OTP]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

router.post('/auth/forgot-password/reset', passwordResetRateLimiter, validateRequest({ body: householdForgotResetSchema }), async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body as { resetToken: string; newPassword: string };

    let payload: { sub?: string; purpose?: string };
    try {
      payload = jwt.verify(resetToken, getJWTSecret()) as { sub?: string; purpose?: string };
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    if (payload.purpose !== 'resident_password_reset' || !payload.sub) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.ok) {
      return res.status(400).json({
        success: false,
        message: 'Password is too weak.',
        errors: pwCheck.reason ? pwCheck.reason.split('; ') : ['Password is too weak'],
      });
    }

    const resident = await Resident.findById(payload.sub).select('+password');
    if (!resident) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    resident.password = await bcrypt.hash(newPassword, 12);
    await resident.save();

    if (resident.emailLower) {
      await ResidentPasswordResetOtp.deleteMany({
        $or: [{ residentId: resident._id }, { emailLower: resident.emailLower }],
      });
    } else {
      await ResidentPasswordResetOtp.deleteMany({ residentId: resident._id });
    }

    return res.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error) {
    console.error('[HOUSEHOLD_FORGOT_RESET_PASSWORD]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

/**
 * Record Duplicate Face BLOCK Attempt Endpoint
 *
 * POST /api/household/record-duplicate-block
 *
 * Records duplicate-face BLOCK events by token.
 * After 3 BLOCK attempts, token is temporarily blocked for review (24h).
 */
router.post(
  '/record-duplicate-block',
  householdRegistrationRateLimiter,
  validateRequest({ body: recordDuplicateBlockBody }),
  async (req: Request, res: Response) => {
    const requestId = generateRequestId();
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);

    try {
      const { token, barangay, similarity } = req.body;
      const sanitizedToken = sanitizeToken(token);
      const sanitizedBarangay = barangay && typeof barangay === 'string' ? barangay.trim() : undefined;

      const result = await householdTokenService.recordDuplicateBlockAttempt(
        sanitizedToken,
        ipAddress,
        userAgent,
        requestId,
        sanitizedBarangay,
        typeof similarity === 'number' ? similarity : undefined
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Unable to record duplicate attempt.',
          errorCode: 'SYSTEM_ERROR',
        });
      }

      if (!result.recorded) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Unable to record duplicate attempt.',
          errorCode: result.errorCode || 'VALIDATION_ERROR',
        });
      }

      const maxAttempts = result.maxAttempts || 3;
      const attempts = result.attempts || 1;
      const blocked = !!result.blockedUntil;

      return res.status(200).json({
        success: true,
        blocked,
        attempts,
        maxAttempts,
        blockedUntil: result.blockedUntil || null,
        message: blocked
          ? 'Token is temporarily blocked for review due to repeated duplicate detections.'
          : `Duplicate attempt recorded (${attempts}/${maxAttempts}).`,
      });
    } catch (error) {
      console.error('[HouseholdRoutes] Record duplicate block error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to record duplicate attempt.',
        errorCode: 'SYSTEM_ERROR',
      });
    }
  }
);

/**
 * Resident Announcements Endpoint
 *
 * GET /api/household/announcements
 *
 * Reserved endpoint for resident-facing announcements.
 * Pending residents are explicitly blocked until admin approval.
 */
router.get('/announcements', mobileLookupRateLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Resident') {
      return res.status(403).json({
        success: false,
        message: 'Only resident accounts can access announcements.',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const resident = await Resident.findById(userId).select('status');
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    if (resident.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message:
          resident.status === 'Pending'
            ? 'Your account is still pending approval. Announcements are unavailable.'
            : 'Resident account is not approved.',
        code: resident.status === 'Pending' ? 'PENDING_APPROVAL' : 'REGISTRATION_NOT_APPROVED',
      });
    }

    return res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Resident /announcements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch announcements.',
    });
  }
});

/**
 * Resident QR Generator Endpoint
 *
 * GET /api/household/qr/me
 *
 * Returns compact QR payload and resident metadata for display.
 */
router.get('/qr/me', mobileLookupRateLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Resident') {
      return res.status(403).json({
        success: false,
        message: 'Only resident accounts can generate resident QR.',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let resident = await Resident.findById(userId).select(
      'residentCode firstName lastName fullName barangay city streetAddress status createdAt qrVersion qrIssuedAt qrStatus'
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    if (resident.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message:
          resident.status === 'Pending'
            ? 'Your account is still pending approval. QR generation is disabled.'
            : 'Resident account is not approved for QR use.',
        code: resident.status === 'Pending' ? 'PENDING_APPROVAL' : 'QR_NOT_ALLOWED',
      });
    }

    if (resident.qrStatus === 'REVOKED') {
      return res.status(403).json({
        success: false,
        message: 'Resident QR is currently revoked. Please contact barangay office.',
        code: 'QR_REVOKED',
      });
    }

    if (!resident.residentCode || !resident.qrIssuedAt) {
      const fullResident = await Resident.findById(userId);
      if (!fullResident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found',
        });
      }

      let changed = false;
      if (!fullResident.residentCode) {
        changed = true;
      }
      if (!fullResident.qrIssuedAt) {
        fullResident.qrIssuedAt = new Date();
        changed = true;
      }

      if (changed) {
        await fullResident.save();
      }

      resident = await Resident.findById(userId).select(
        'residentCode firstName lastName fullName barangay city streetAddress status createdAt qrVersion qrIssuedAt qrStatus'
      );
      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found',
        });
      }
    }

    const residentDisplayName = getResidentDisplayName({
      firstName: (resident as any).firstName,
      lastName: (resident as any).lastName,
      fullName: (resident as any).fullName,
    });

    const qrData = getResidentQrPayload(resident.residentCode as string);

    return res.json({
      success: true,
      data: {
        residentId: resident._id.toString(),
        residentCode: resident.residentCode,
        qrData,
        qrVersion: resident.qrVersion || 1,
        issuedAt: (resident.qrIssuedAt || resident.createdAt).toISOString(),
        resident: {
          fullName: residentDisplayName,
          barangay: resident.barangay,
          city: resident.city || '',
          streetAddress: resident.streetAddress,
          status: resident.status,
          createdAt: resident.createdAt,
          qrStatus: resident.qrStatus,
        },
      },
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Resident QR generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to generate QR data.',
    });
  }
});

/**
 * Volunteer/Staff QR Resolve Endpoint
 *
 * POST /api/household/qr/resolve
 *
 * Resolves scanned resident QR data to resident profile fields used on-site.
 */
router.post('/qr/resolve', mobileLookupRateLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    const scannerRole = req.user?.role || 'Unknown';
    const scannerId = req.user?.userId || null;
    const { qrData, distributionId } = req.body;

    if (!isAllowedScannerRole(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only authorized scanner accounts can resolve resident QR.',
        code: 'SCANNER_FORBIDDEN',
      });
    }

    if (!qrData || typeof qrData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'qrData is required',
        code: 'INVALID_QR',
      });
    }
    if (distributionId !== undefined && typeof distributionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'distributionId must be a string',
        code: 'INVALID_DISTRIBUTION_ID',
      });
    }

    if (qrData.length > 512) {
      return res.status(400).json({
        success: false,
        message: 'QR payload too large',
        code: 'INVALID_QR',
      });
    }

    const residentCode = parseResidentCodeFromQr(qrData);
    if (!residentCode) {
      ResidentQrScanLog.create({
        residentId: null,
        residentCode: null,
        scannerId,
        scannerRole,
        result: 'INVALID',
        ipAddress,
        userAgent,
      }).catch(() => undefined);

      return res.status(400).json({
        success: false,
        message: 'Invalid QR payload',
        code: 'INVALID_QR',
      });
    }

    const cacheKey = residentCode;
    const cached = getCachedScanResult(cacheKey);
    let alreadyClaimed = false;
    if (cached) {
      if (distributionId && typeof distributionId === 'string') {
        alreadyClaimed = Boolean(
          await Claim.findOne({
            residentId: cached.residentId,
            distributionId: distributionId.trim(),
            status: mongoose.trusted({ $in: [...CLAIMED_STATUSES] }),
          }).select('_id')
        );
      }
      return res.json({
        success: true,
        data: {
          residentId: cached.residentId,
          maskedName: cached.maskedName,
          alreadyClaimed,
          fromCache: true,
        },
      });
    }

    const resident = await Resident.findOne({ residentCode })
      .select('residentCode firstName lastName fullName barangay city status qrStatus')
      .lean();

    if (!resident) {
      ResidentQrScanLog.create({
        residentId: null,
        residentCode,
        scannerId,
        scannerRole,
        result: 'NOT_FOUND',
        ipAddress,
        userAgent,
      }).catch(() => undefined);

      return res.status(404).json({
        success: false,
        message: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND',
      });
    }

    const residentDisplayName = getResidentDisplayName({
      firstName: (resident as any).firstName,
      lastName: (resident as any).lastName,
      fullName: (resident as any).fullName,
    });

    if (resident.status !== 'Approved' || resident.qrStatus === 'REVOKED') {
      return res.status(403).json({
        success: false,
        message: 'Resident QR is not active',
        code: 'QR_INACTIVE',
      });
    }

    if (distributionId && typeof distributionId === 'string') {
      alreadyClaimed = Boolean(
        await Claim.findOne({
          residentId: resident._id.toString(),
          distributionId: distributionId.trim(),
          status: mongoose.trusted({ $in: [...CLAIMED_STATUSES] }),
        }).select('_id')
      );
    }

    cacheScanResult(cacheKey, {
      residentId: resident._id.toString(),
      residentCode: resident.residentCode,
      maskedName: getMaskedName(residentDisplayName),
      barangay: resident.barangay,
      city: resident.city || '',
      status: resident.status,
    });

    ResidentQrScanLog.create({
      residentId: resident._id,
      residentCode: resident.residentCode,
      scannerId,
      scannerRole,
      result: 'VALID',
      ipAddress,
      userAgent,
    }).catch(() => undefined);

    return res.json({
      success: true,
      data: {
        residentId: resident._id.toString(),
        maskedName: getMaskedName(residentDisplayName),
        alreadyClaimed,
        fromCache: false,
      },
    });
  } catch (error) {
    console.error('[HouseholdRoutes] QR resolve error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to resolve QR.',
    });
  }
});

/**
 * Volunteer/Staff QR Auto-Claim Endpoint
 *
 * POST /api/household/qr/claim
 *
 * Finalizes a claim after a valid resident QR scan.
 */
router.post('/qr/claim', mobileLookupRateLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAllowedScannerRole(req.user?.role) || req.user?.role === 'Resident') {
      return res.status(403).json({
        success: false,
        message: 'Only authorized scanner accounts can record resident claims.',
        code: 'SCANNER_FORBIDDEN',
      });
    }

    const residentId = typeof req.body?.residentId === 'string' ? req.body.residentId.trim() : '';
    const distributionId = typeof req.body?.distributionId === 'string' ? req.body.distributionId.trim() : '';

    if (!residentId || !distributionId) {
      return res.status(400).json({
        success: false,
        message: 'residentId and distributionId are required',
      });
    }

    const resident = await Resident.findById(residentId)
      .select('_id residentCode fullName barangay status')
      .lean();
    if (!resident || resident.status !== 'Approved') {
      return res.status(404).json({
        success: false,
        message: 'Approved resident not found',
      });
    }

    const distribution = await Distribution.findById(distributionId)
      .select('_id barangay assignedBarangays')
      .lean();
    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found',
      });
    }

    const coverage = new Set<string>([
      distribution.barangay,
      ...(Array.isArray(distribution.assignedBarangays) ? distribution.assignedBarangays : []),
    ]);
    if (!coverage.has(resident.barangay)) {
      return res.status(403).json({
        success: false,
        message: 'Resident barangay is not covered by this distribution',
      });
    }

    // Optional scanner scope check for Volunteer/LGU_STAFF accounts.
    const scannerScope = Array.isArray(req.user?.assignedBarangays) ? req.user!.assignedBarangays : [];
    if (
      req.user?.role !== 'SUPERADMIN' &&
      scannerScope.length > 0 &&
      !scannerScope.some((b) => coverage.has(b))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Scanner account is out of scope for this distribution',
      });
    }

    const householdId = residentId;

    // Idempotency guard for scanner retries and race conditions.
    // Unique index is (householdId, distributionId), so check exactly that pair.
    const existingClaim = await Claim.findOne({
      householdId,
      distributionId,
    })
      .setOptions({ sanitizeFilter: false })
      .lean();
    if (existingClaim) {
      return res.json({
        success: true,
        message:
          existingClaim.status === 'CHAIN_FAILED'
            ? 'Claim already recorded but blockchain submission failed. Please retry claim sync.'
            : 'Resident already claimed for this distribution',
        alreadyClaimed: true,
        claimId: existingClaim.claimId,
        claimStatus: existingClaim.status,
      });
    }

    const householdCode =
      String(resident.residentCode || '').trim() ||
      `HH-${resident.barangay.slice(0, 2).toUpperCase()}-${residentId.slice(-4).toUpperCase()}`;
    const householdHash = computeHouseholdHash(householdId);
    const eventHash = computeEventHash(distributionId);

    try {
      const alreadyClaimedOnChain = await isClaimedOnChain(householdHash, eventHash);
      if (alreadyClaimedOnChain) {
        return res.status(409).json({
          success: false,
          message: 'Resident already has an on-chain claim record',
        });
      }
    } catch {
      // Keep endpoint responsive even if chain read fails.
    }

    const claimId = `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    const staffUserId = req.user?.userId || req.user?.id || 'unknown';
    const staffName = req.user?.email || req.user?.userId || 'Mobile Scanner';
    const distributionSite = `${distribution.barangay} Barangay Hall`;

    const upsertResult = await Claim.updateOne(
      { householdId, distributionId },
      {
        $setOnInsert: {
          claimId,
          householdId,
          residentId,
          householdCode,
          barangay: resident.barangay,
          distributionId,
          distributionSite,
          staffUserId,
          staffName,
          status: 'PENDING_CHAIN',
          blockchain: {
            householdHash,
            eventHash,
          },
          errorMessage: '',
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    const inserted = upsertResult.upsertedCount === 1;
    const claim = await Claim.findOne({ householdId, distributionId });
    if (!claim) {
      return res.status(500).json({
        success: false,
        message: 'Unable to load claim after upsert.',
      });
    }

    if (!inserted) {
      return res.json({
        success: true,
        message:
          claim.status === 'CHAIN_FAILED'
            ? 'Claim already recorded but blockchain submission failed. Please retry claim sync.'
            : 'Resident already claimed for this distribution',
        alreadyClaimed: true,
        claimId: claim.claimId,
        claimStatus: claim.status,
      });
    }

    try {
      const submitted = await submitClaimOnChain(householdHash, eventHash);
      claim.status = 'CHAIN_SUBMITTED';
      claim.blockchain.txHash = submitted.txHash;
      claim.blockchain.chainId = submitted.chainId;
      claim.blockchain.contractAddress = submitted.contractAddress;
      claim.blockchain.staffSigner = submitted.staffSigner;
      claim.errorMessage = '';
      await claim.save();
    } catch (chainErr: any) {
      claim.status = 'CHAIN_FAILED';
      claim.errorMessage = chainErr?.message || 'On-chain submission failed';
      await claim.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Claim recorded successfully',
      alreadyClaimed: false,
      claimId: claim.claimId,
      claimStatus: claim.status,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const residentId = typeof req.body?.residentId === 'string' ? req.body.residentId.trim() : '';
      const distributionId = typeof req.body?.distributionId === 'string' ? req.body.distributionId.trim() : '';

      const existingClaim = residentId && distributionId
        ? await Claim.findOne({ householdId: residentId, distributionId }).lean()
        : null;

      return res.json({
        success: true,
        message: 'Resident already claimed for this distribution',
        alreadyClaimed: true,
        claimId: existingClaim?.claimId,
        claimStatus: existingClaim?.status,
      });
    }

    console.error('[HouseholdRoutes] QR claim error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to record claim.',
    });
  }
});

/**
 * Check Mobile Number Endpoint
 *
 * POST /api/household/check-mobile
 *
 * Performs a privacy-preserving mobile number pre-check.
 *
 * Request body:
 * {
 *   mobileNumber: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */
router.post('/check-mobile', mobileLookupRateLimiter, validateRequest({ body: checkMobileBody }), async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || typeof mobileNumber !== 'string') {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Mobile number is required.',
      });
    }

    const normalizedMobile = normalizePhilippineMobileNumber(mobileNumber.trim());
    if (!isValidPhilippineMobileNumber(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Please enter a valid Philippine mobile number.',
      });
    }

    const resident = await Resident.findOne({ mobileNumber: normalizedMobile });

    if (resident) {
      return res.status(409).json({
        success: false,
        available: false,
        message: 'This account already exists. Please sign in instead.',
        errorCode: 'DUPLICATE_MOBILE',
      });
    }

    return res.json({
      success: true,
      available: true,
      message: 'Mobile number is available.',
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Check mobile error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process request.',
    });
  }
});

/**
 * Dev-only Registration Reset Endpoint
 *
 * POST /api/household/testing/reset-registration
 *
 * Deletes an existing resident registration and resets the linked household token
 * back to UNUSED so the same household can re-test registration.
 */
router.post('/testing/reset-registration', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is disabled in production',
      });
    }

    const { mobileNumber } = req.body;
    if (!mobileNumber || typeof mobileNumber !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'mobileNumber is required',
      });
    }

    const normalizedMobile = normalizePhilippineMobileNumber(mobileNumber.trim());
    const resident = await Resident.findOne({ mobileNumber: normalizedMobile });

    if (!resident) {
      return res.json({
        success: true,
        message: 'No registration found for this mobile number',
        data: {
          residentDeleted: false,
          tokenReset: false,
        },
      });
    }

    const token = await HouseholdToken.findOne({
      'usedBy.residentId': resident._id,
      status: 'USED',
    }).sort({ usedAt: -1 });

    await Resident.deleteOne({ _id: resident._id });

    let tokenReset = false;
    if (token) {
      const now = new Date();
      token.status = 'UNUSED';
      token.usedAt = null;
      token.usedBy = {
        residentId: null,
        ipAddress: null,
        userAgent: null,
      };
      token.lockedAt = null;
      token.lockedBy = null;
      token.lockExpiresAt = null;

      // Keep token usable for local test retries when it already expired.
      if (token.expiresAt <= now) {
        token.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      await token.save();
      tokenReset = true;
    }

    return res.json({
      success: true,
      message: 'Registration reset complete',
      data: {
        residentDeleted: true,
        tokenReset,
      },
    });
  } catch (error) {
    console.error('[HouseholdRoutes] Reset registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to reset registration.',
    });
  }
});

/**
 * Health check for household registration service
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'household-registration',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
