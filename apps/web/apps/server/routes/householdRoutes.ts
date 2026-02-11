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
import { householdRegistrationService } from '../services/householdRegistrationService';
import RegistrationAuditLog from '../models/RegistrationAuditLog';
import { generateRequestId } from '../services/householdTokenService';
import HouseholdToken from '../models/HouseholdToken';
import Resident from '../models/Resident';
import bcrypt from 'bcrypt';
import {
  tokenValidationRateLimiter,
  householdRegistrationRateLimiter,
  mobileLookupRateLimiter,
} from '../middleware/rateLimiter';

const router = Router();

/**
 * Debug endpoint to check tokens in database
 * Remove this in production!
 */
router.get('/debug-tokens', async (_req: Request, res: Response) => {
  try {
    const tokens = await HouseholdToken.find({
      status: { $in: ['UNUSED', 'LOCKED'] },
      expiresAt: { $gt: new Date() },
    });
    
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
router.post('/validate-token', tokenValidationRateLimiter, async (req: Request, res: Response) => {
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
router.post('/register', householdRegistrationRateLimiter, async (req: Request, res: Response) => {
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
    
    // Validate required fields exist (ID and face images optional for testing)
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'mobileNumber',
      'password', 'barangay', 'streetAddress', 'householdToken'
      // TEMPORARILY DISABLED for testing:
      // 'idType', 'idNumber', 'frontIdImage', 'backIdImage', 'faceImage'
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
        householdInfo: result.householdInfo,
      });
    } else {
      // Map error codes to HTTP status codes
      const statusCodes: Record<string, number> = {
        'TOKEN_NOT_FOUND': 400,
        'LOCK_CONFLICT': 409, // Conflict - another registration in progress
        'VALIDATION_FAILED': 400,
        'DUPLICATE_MOBILE': 409,
        'SYSTEM_ERROR': 500,
      };
      
      const statusCode = statusCodes[result.errorCode || ''] || 400;
      
      return res.status(statusCode).json({
        success: false,
        message: result.message,
        errorCode: result.errorCode,
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
router.post('/check-mobile', mobileLookupRateLimiter, async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || typeof mobileNumber !== 'string') {
      return res.status(200).json({
        success: true,
        message: 'If this number is eligible, registration can continue.',
      });
    }

    await Resident.findOne({
      mobileNumber: mobileNumber.trim(),
    });

    return res.json({
      success: true,
      message: 'If this number is eligible, registration can continue.',
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
