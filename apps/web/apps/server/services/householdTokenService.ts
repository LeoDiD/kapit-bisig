/**
 * Household Token Service
 * 
 * Business logic for secure household token management.
 * Handles token generation, validation, and lifecycle management.
 * 
 * Security Features:
 * 1. Tokens are generated with cryptographic randomness
 * 2. Tokens are stored hashed (bcrypt)
 * 3. Atomic operations for concurrent registration protection
 * 4. Comprehensive audit logging
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import HouseholdToken, { IHouseholdToken, TokenStatus } from '../models/HouseholdToken';
import RegistrationAuditLog from '../models/RegistrationAuditLog';

const SALT_ROUNDS = 12;
const DEFAULT_TOKEN_VALIDITY_DAYS = 30;
const LOCK_DURATION_SECONDS = 60; // 60-second lock for registration

// Token format: XXXX-XXXX-XXXX (12 alphanumeric characters)
const TOKEN_LENGTH = 12;

export interface TokenGenerationParams {
  headOfHousehold: string;
  address: string;
  barangay: string;
  expectedMembers?: number;
  notes?: string;
  validityDays?: number;
  issuedBy: string;
}

export interface TokenGenerationResult {
  success: boolean;
  token?: string; // Plain token (shown once, then never again)
  tokenId?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  error?: string;
}

export interface TokenValidationResult {
  success: boolean;
  valid: boolean;
  tokenId?: mongoose.Types.ObjectId;
  status?: TokenStatus;
  householdInfo?: IHouseholdToken['householdInfo'];
  error?: string;
  errorCode?: string;
}

export interface TokenLockResult {
  success: boolean;
  locked: boolean;
  tokenId?: mongoose.Types.ObjectId;
  lockExpiresAt?: Date;
  error?: string;
  errorCode?: string;
}

export interface TokenCompleteResult {
  success: boolean;
  completed: boolean;
  tokenId?: mongoose.Types.ObjectId;
  error?: string;
  errorCode?: string;
}

/**
 * Generate a secure random token
 * 
 * Uses crypto.randomBytes for cryptographic security.
 * Returns formatted token: XXXX-XXXX-XXXX
 */
function generateSecureToken(): string {
  // Generate enough random bytes
  const randomBytes = crypto.randomBytes(16);
  
  // Convert to alphanumeric string (A-Z, 0-9)
  // Use base36 and filter to get only alphanumeric
  let token = '';
  for (let i = 0; i < randomBytes.length && token.length < TOKEN_LENGTH; i++) {
    const byte = randomBytes[i];
    // Map byte to alphanumeric character (0-9, A-Z)
    const charCode = byte % 36;
    if (charCode < 10) {
      token += charCode.toString();
    } else {
      token += String.fromCharCode(55 + charCode); // A=65, so 10->A, 11->B, etc.
    }
  }
  
  // Ensure we have enough characters
  while (token.length < TOKEN_LENGTH) {
    const extraBytes = crypto.randomBytes(4);
    for (let i = 0; i < extraBytes.length && token.length < TOKEN_LENGTH; i++) {
      const byte = extraBytes[i];
      const charCode = byte % 36;
      if (charCode < 10) {
        token += charCode.toString();
      } else {
        token += String.fromCharCode(55 + charCode);
      }
    }
  }
  
  // Format as XXXX-XXXX-XXXX
  return `${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

/**
 * Generate a unique request ID for audit logging
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `REQ-${timestamp}-${random}`;
}

/**
 * HouseholdTokenService
 * 
 * Provides secure operations for household registration tokens.
 */
export class HouseholdTokenService {
  
  /**
   * Generate a new household token
   * 
   * Called by barangay admin to create a token for a household.
   * The plain token is returned ONCE and should be given to the household.
   */
  async generateToken(params: TokenGenerationParams): Promise<TokenGenerationResult> {
    try {
      // Generate secure random token
      const plainToken = generateSecureToken();
      
      // Hash the token for storage
      const tokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);
      
      // Extract prefix for admin identification
      const tokenPrefix = plainToken.replace(/-/g, '').slice(0, 4);
      
      // Calculate expiration date
      const validityDays = params.validityDays || DEFAULT_TOKEN_VALIDITY_DAYS;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);
      
      // Create token record
      const token = new HouseholdToken({
        tokenHash,
        tokenPrefix,
        status: 'UNUSED',
        expiresAt,
        householdInfo: {
          headOfHousehold: params.headOfHousehold,
          address: params.address,
          barangay: params.barangay,
          expectedMembers: params.expectedMembers || 1,
          notes: params.notes || '',
        },
        issuedBy: params.issuedBy,
        issuedAt: new Date(),
      });
      
      await token.save();
      
      return {
        success: true,
        token: plainToken, // Plain token - shown once only!
        tokenId: token._id as mongoose.Types.ObjectId,
        expiresAt,
      };
      
    } catch (error) {
      console.error('[TokenService] Error generating token:', error);
      return {
        success: false,
        error: 'Failed to generate token',
      };
    }
  }
  
  /**
   * Validate a token without locking it
   * 
   * Used to check if a token is valid before starting registration.
   * Does NOT acquire a lock - just checks validity.
   */
  async validateToken(
    plainToken: string,
    ipAddress: string,
    userAgent: string,
    requestId: string
  ): Promise<TokenValidationResult> {
    const startTime = Date.now();
    
    try {
      // Normalize token format
      const normalizedToken = plainToken.trim().toUpperCase();
      
      console.log('[TokenService] Validating token:', normalizedToken);
      
      // Basic format validation
      if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedToken)) {
        console.log('[TokenService] Invalid format');
        await RegistrationAuditLog.log({
          eventType: 'TOKEN_INVALID',
          severity: 'WARNING',
          ipAddress,
          userAgent,
          requestId,
          message: 'Invalid token format submitted',
          metadata: { tokenFormat: 'invalid' },
          success: false,
          errorCode: 'INVALID_FORMAT',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: true,
          valid: false,
          errorCode: 'INVALID_FORMAT',
          error: 'Invalid token format',
        };
      }
      
      // Find all tokens and check hash (we can't query by hash directly)
      // This is intentionally slow to prevent timing attacks
      const tokens = await HouseholdToken.find({
        status: { $in: ['UNUSED', 'LOCKED'] },
        expiresAt: { $gt: new Date() },
      });
      
      console.log('[TokenService] Found', tokens.length, 'candidate tokens');
      
      let matchedToken: IHouseholdToken | null = null;
      
      for (const token of tokens) {
        console.log('[TokenService] Checking against:', token.tokenPrefix);
        const isMatch = await bcrypt.compare(normalizedToken, token.tokenHash);
        console.log('[TokenService] Match result:', isMatch);
        if (isMatch) {
          matchedToken = token;
          break;
        }
      }
      
      console.log('[TokenService] Final match:', matchedToken ? matchedToken.tokenPrefix : 'none');
      
      if (!matchedToken) {
        await RegistrationAuditLog.log({
          eventType: 'TOKEN_INVALID',
          severity: 'WARNING',
          tokenPrefix: normalizedToken.replace(/-/g, '').slice(0, 4),
          ipAddress,
          userAgent,
          requestId,
          message: 'Token not found or expired',
          success: false,
          errorCode: 'TOKEN_NOT_FOUND',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: true,
          valid: false,
          errorCode: 'TOKEN_NOT_FOUND',
          error: 'Token not found or has expired',
        };
      }
      
      // Check if token is already used
      if (matchedToken.status === 'USED') {
        await RegistrationAuditLog.log({
          eventType: 'TOKEN_INVALID',
          severity: 'WARNING',
          tokenPrefix: matchedToken.tokenPrefix,
          tokenId: matchedToken._id as mongoose.Types.ObjectId,
          ipAddress,
          userAgent,
          requestId,
          message: 'Attempted to use already used token',
          success: false,
          errorCode: 'TOKEN_ALREADY_USED',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: true,
          valid: false,
          errorCode: 'TOKEN_ALREADY_USED',
          error: 'This token has already been used',
        };
      }
      
      // Token is valid
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_VALIDATED',
        severity: 'INFO',
        tokenPrefix: matchedToken.tokenPrefix,
        tokenId: matchedToken._id as mongoose.Types.ObjectId,
        ipAddress,
        userAgent,
        requestId,
        message: 'Token validated successfully',
        success: true,
        processingTimeMs: Date.now() - startTime,
      });
      
      return {
        success: true,
        valid: true,
        tokenId: matchedToken._id as mongoose.Types.ObjectId,
        status: matchedToken.status,
        householdInfo: matchedToken.householdInfo,
      };
      
    } catch (error) {
      console.error('[TokenService] Error validating token:', error);
      
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_INVALID',
        severity: 'ERROR',
        ipAddress,
        userAgent,
        requestId,
        message: 'Error during token validation',
        metadata: { error: (error as Error).message },
        success: false,
        errorCode: 'VALIDATION_ERROR',
        processingTimeMs: Date.now() - startTime,
      });
      
      return {
        success: false,
        valid: false,
        error: 'Token validation failed',
      };
    }
  }
  
  /**
   * Acquire atomic lock on a token for registration
   * 
   * This is the CRITICAL operation for concurrent registration protection.
   * Only ONE request can successfully lock a token at a time.
   * 
   * Process:
   * 1. Verify token by comparing hash
   * 2. Attempt atomic lock (MongoDB findOneAndUpdate with conditions)
   * 3. If lock fails, another process got there first
   */
  async acquireLock(
    plainToken: string,
    lockerId: string,
    ipAddress: string,
    userAgent: string,
    requestId: string
  ): Promise<TokenLockResult> {
    const startTime = Date.now();
    
    try {
      // Normalize token
      const normalizedToken = plainToken.trim().toUpperCase();
      
      // Find the token by hash comparison
      const tokens = await HouseholdToken.find({
        status: { $in: ['UNUSED', 'LOCKED'] },
        expiresAt: { $gt: new Date() },
      });
      
      let matchedToken: IHouseholdToken | null = null;
      
      for (const token of tokens) {
        const isMatch = await bcrypt.compare(normalizedToken, token.tokenHash);
        if (isMatch) {
          matchedToken = token;
          break;
        }
      }
      
      if (!matchedToken) {
        await RegistrationAuditLog.log({
          eventType: 'TOKEN_LOCK_FAILED',
          severity: 'WARNING',
          tokenPrefix: normalizedToken.replace(/-/g, '').slice(0, 4),
          ipAddress,
          userAgent,
          requestId,
          message: 'Lock failed - token not found',
          success: false,
          errorCode: 'TOKEN_NOT_FOUND',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: true,
          locked: false,
          errorCode: 'TOKEN_NOT_FOUND',
          error: 'Token not found or expired',
        };
      }
      
      // Attempt atomic lock
      const lockedToken = await HouseholdToken.atomicLock(
        matchedToken.tokenHash,
        lockerId,
        LOCK_DURATION_SECONDS
      );
      
      if (!lockedToken) {
        // Lock failed - token is already locked by another process
        await RegistrationAuditLog.log({
          eventType: 'TOKEN_LOCK_FAILED',
          severity: 'WARNING',
          tokenPrefix: matchedToken.tokenPrefix,
          tokenId: matchedToken._id as mongoose.Types.ObjectId,
          ipAddress,
          userAgent,
          requestId,
          message: 'Lock failed - token already locked or used',
          metadata: { currentStatus: matchedToken.status },
          success: false,
          errorCode: 'LOCK_CONFLICT',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: true,
          locked: false,
          errorCode: 'LOCK_CONFLICT',
          error: 'Registration is already in progress for this household',
        };
      }
      
      // Lock acquired successfully
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_LOCKED',
        severity: 'INFO',
        tokenPrefix: lockedToken.tokenPrefix,
        tokenId: lockedToken._id as mongoose.Types.ObjectId,
        ipAddress,
        userAgent,
        requestId,
        message: 'Token locked for registration',
        metadata: { lockExpiresAt: lockedToken.lockExpiresAt },
        success: true,
        processingTimeMs: Date.now() - startTime,
      });
      
      return {
        success: true,
        locked: true,
        tokenId: lockedToken._id as mongoose.Types.ObjectId,
        lockExpiresAt: lockedToken.lockExpiresAt!,
      };
      
    } catch (error) {
      console.error('[TokenService] Error acquiring lock:', error);
      
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_LOCK_FAILED',
        severity: 'ERROR',
        ipAddress,
        userAgent,
        requestId,
        message: 'Error during lock acquisition',
        metadata: { error: (error as Error).message },
        success: false,
        errorCode: 'LOCK_ERROR',
        processingTimeMs: Date.now() - startTime,
      });
      
      return {
        success: false,
        locked: false,
        error: 'Failed to acquire registration lock',
      };
    }
  }
  
  /**
   * Complete registration and mark token as used
   * 
   * Called after successful resident registration.
   * Atomically transitions token from LOCKED to USED.
   */
  async completeRegistration(
    tokenId: mongoose.Types.ObjectId,
    lockerId: string,
    residentId: mongoose.Types.ObjectId,
    ipAddress: string,
    userAgent: string,
    requestId: string
  ): Promise<TokenCompleteResult> {
    const startTime = Date.now();
    
    try {
      // Find the token
      const token = await HouseholdToken.findById(tokenId);
      
      if (!token) {
        return {
          success: false,
          completed: false,
          errorCode: 'TOKEN_NOT_FOUND',
          error: 'Token not found',
        };
      }
      
      // Attempt atomic completion
      const completedToken = await HouseholdToken.atomicComplete(
        token.tokenHash,
        lockerId,
        residentId,
        ipAddress,
        userAgent
      );
      
      if (!completedToken) {
        await RegistrationAuditLog.log({
          eventType: 'REGISTRATION_FAILED',
          severity: 'ERROR',
          tokenPrefix: token.tokenPrefix,
          tokenId,
          ipAddress,
          userAgent,
          requestId,
          message: 'Failed to complete registration - lock expired or invalid',
          success: false,
          errorCode: 'COMPLETION_FAILED',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: true,
          completed: false,
          errorCode: 'COMPLETION_FAILED',
          error: 'Registration lock expired. Please try again.',
        };
      }
      
      // Registration completed successfully
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_USED',
        severity: 'INFO',
        tokenPrefix: completedToken.tokenPrefix,
        tokenId: completedToken._id as mongoose.Types.ObjectId,
        ipAddress,
        userAgent,
        requestId,
        residentId,
        message: 'Token marked as used - registration complete',
        success: true,
        processingTimeMs: Date.now() - startTime,
      });
      
      return {
        success: true,
        completed: true,
        tokenId: completedToken._id as mongoose.Types.ObjectId,
      };
      
    } catch (error) {
      console.error('[TokenService] Error completing registration:', error);
      
      return {
        success: false,
        completed: false,
        error: 'Failed to complete registration',
      };
    }
  }
  
  /**
   * Release lock without completing registration
   * 
   * Called when registration fails after lock is acquired.
   * Returns token to UNUSED status so household can try again.
   */
  async releaseLock(
    tokenId: mongoose.Types.ObjectId,
    lockerId: string,
    ipAddress: string,
    userAgent: string,
    requestId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    
    try {
      const token = await HouseholdToken.findById(tokenId);
      
      if (!token) {
        return { success: false, error: 'Token not found' };
      }
      
      const unlockedToken = await HouseholdToken.atomicUnlock(
        token.tokenHash,
        lockerId
      );
      
      if (unlockedToken) {
        await RegistrationAuditLog.log({
          eventType: 'TOKEN_UNLOCKED',
          severity: 'INFO',
          tokenPrefix: token.tokenPrefix,
          tokenId,
          ipAddress,
          userAgent,
          requestId,
          message: `Lock released: ${reason}`,
          success: true,
          processingTimeMs: Date.now() - startTime,
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('[TokenService] Error releasing lock:', error);
      return { success: false, error: 'Failed to release lock' };
    }
  }
  
  /**
   * Get token status by ID (for admin)
   */
  async getTokenStatus(tokenId: mongoose.Types.ObjectId): Promise<IHouseholdToken | null> {
    return HouseholdToken.findById(tokenId);
  }
  
  /**
   * List tokens for a barangay (for admin)
   */
  async listTokensByBarangay(
    barangay: string,
    status?: TokenStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ tokens: IHouseholdToken[]; total: number }> {
    const query: Record<string, unknown> = { 'householdInfo.barangay': barangay };
    if (status) {
      query.status = status;
    }
    
    const [tokens, total] = await Promise.all([
      HouseholdToken.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      HouseholdToken.countDocuments(query),
    ]);
    
    return { tokens, total };
  }
  
  /**
   * Expire stale tokens (scheduled job)
   */
  async expireStaleTokens(): Promise<number> {
    const now = new Date();
    
    const result = await HouseholdToken.updateMany(
      {
        status: { $in: ['UNUSED', 'LOCKED'] },
        expiresAt: { $lt: now },
      },
      {
        $set: { status: 'EXPIRED' },
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`[TokenService] Expired ${result.modifiedCount} stale tokens`);
    }
    
    return result.modifiedCount;
  }
  
  /**
   * Clean up expired locks (scheduled job)
   * 
   * Finds tokens that are LOCKED but lock has expired,
   * and returns them to UNUSED status.
   */
  async cleanupExpiredLocks(): Promise<number> {
    const now = new Date();
    
    const result = await HouseholdToken.updateMany(
      {
        status: 'LOCKED',
        lockExpiresAt: { $lt: now },
      },
      {
        $set: {
          status: 'UNUSED',
          lockedAt: null,
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`[TokenService] Cleaned up ${result.modifiedCount} expired locks`);
    }
    
    return result.modifiedCount;
  }
}

// Export singleton instance
export const householdTokenService = new HouseholdTokenService();
export default householdTokenService;
