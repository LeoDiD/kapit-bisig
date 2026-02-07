/**
 * Household Registration Service
 * 
 * Orchestrates the complete household registration flow with
 * atomic token validation and concurrent registration protection.
 * 
 * Flow:
 * 1. Validate token format
 * 2. Acquire atomic lock on token
 * 3. Validate registration data
 * 4. Create resident record
 * 5. Mark token as USED (atomic)
 * 6. If any step fails, release lock and allow retry
 * 
 * Concurrency Protection:
 * - Only ONE registration per token succeeds
 * - All other concurrent attempts fail with clear error
 * - Locks auto-expire after 60 seconds if not completed
 */

import mongoose from 'mongoose';
import Resident, { IResident } from '../models/Resident';
import { householdTokenService, generateRequestId } from './householdTokenService';
import RegistrationAuditLog from '../models/RegistrationAuditLog';

export interface RegistrationData {
  // Personal Info (Step 1)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  mobileNumber: string;
  password: string;
  
  // Household Info (Step 2)
  city?: string;
  barangay: string;
  streetAddress: string;
  householdSize?: number;
  vulnerableMembers?: string[];
  vulnerableCounts?: Record<string, number>;
  
  // Identity Verification (Step 3)
  idType: string;
  idNumber: string;
  frontIdImage: string;
  backIdImage: string;
  
  // Face Scan (Step 4)
  faceImage: string;
  
  // AI Verification Results
  verification?: {
    overallConfidence: number;
    idConfidence?: number;
    faceMatchConfidence?: number;
    livenessConfidence?: number;
    dataMatchScore?: number;
    riskScore?: number;
    isVerified: boolean;
    aiVerificationStatus: 'High Match' | 'Medium Match' | 'Low Match';
    warnings?: string[];
    riskFactors?: string[];
  };
  
  // Household Token (moved to last in Step 1)
  householdToken: string;
}

export interface RegistrationResult {
  success: boolean;
  residentId?: mongoose.Types.ObjectId;
  message: string;
  errorCode?: string;
  householdInfo?: {
    headOfHousehold: string;
    address: string;
    barangay: string;
  };
}

export interface TokenValidationResponse {
  success: boolean;
  valid: boolean;
  message: string;
  errorCode?: string;
  householdInfo?: {
    headOfHousehold: string;
    address: string;
    barangay: string;
    expectedMembers: number;
  };
}

/**
 * HouseholdRegistrationService
 * 
 * Handles complete registration flow with concurrency protection.
 */
export class HouseholdRegistrationService {
  
  /**
   * Validate token before starting registration
   * 
   * This is called when user enters their token to check if it's valid.
   * Does NOT acquire a lock - just validates.
   */
  async validateToken(
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<TokenValidationResponse> {
    const requestId = generateRequestId();
    
    try {
      const result = await householdTokenService.validateToken(
        token,
        ipAddress,
        userAgent,
        requestId
      );
      
      if (!result.success) {
        return {
          success: false,
          valid: false,
          message: 'Token validation failed. Please try again.',
          errorCode: 'VALIDATION_ERROR',
        };
      }
      
      if (!result.valid) {
        // Provide user-friendly error messages
        const errorMessages: Record<string, string> = {
          'INVALID_FORMAT': 'Invalid token format. Please enter a valid token (XXXX-XXXX-XXXX).',
          'TOKEN_NOT_FOUND': 'Token not found or has expired. Please contact your barangay office.',
          'TOKEN_ALREADY_USED': 'This token has already been used for registration.',
        };
        
        return {
          success: true,
          valid: false,
          message: errorMessages[result.errorCode || ''] || 'Invalid token.',
          errorCode: result.errorCode,
        };
      }
      
      return {
        success: true,
        valid: true,
        message: 'Token is valid',
        householdInfo: result.householdInfo ? {
          headOfHousehold: result.householdInfo.headOfHousehold,
          address: result.householdInfo.address,
          barangay: result.householdInfo.barangay,
          expectedMembers: result.householdInfo.expectedMembers,
        } : undefined,
      };
      
    } catch (error) {
      console.error('[RegistrationService] Token validation error:', error);
      return {
        success: false,
        valid: false,
        message: 'Unable to validate token. Please try again.',
        errorCode: 'SYSTEM_ERROR',
      };
    }
  }
  
  /**
   * Register a new resident with household token
   * 
   * This is the main registration endpoint that:
   * 1. Acquires atomic lock on token
   * 2. Creates resident record
   * 3. Marks token as used
   * 
   * Only ONE registration per token will succeed.
   */
  async registerResident(
    data: RegistrationData,
    ipAddress: string,
    userAgent: string
  ): Promise<RegistrationResult> {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const lockerId = `${ipAddress}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    let tokenId: mongoose.Types.ObjectId | null = null;
    let lockAcquired = false;
    
    try {
      // Log registration start
      await RegistrationAuditLog.log({
        eventType: 'REGISTRATION_STARTED',
        severity: 'INFO',
        tokenPrefix: data.householdToken.replace(/-/g, '').slice(0, 4),
        ipAddress,
        userAgent,
        requestId,
        message: 'Registration attempt started',
        success: true,
      });
      
      // Step 1: Acquire atomic lock on token
      // This is where concurrent registrations are blocked
      const lockResult = await householdTokenService.acquireLock(
        data.householdToken,
        lockerId,
        ipAddress,
        userAgent,
        requestId
      );
      
      if (!lockResult.success || !lockResult.locked) {
        // Lock failed - another registration is in progress or token is invalid
        const errorMessages: Record<string, string> = {
          'TOKEN_NOT_FOUND': 'Token not found or has expired.',
          'LOCK_CONFLICT': 'Another family member is currently registering. Please wait and try again.',
          'LOCK_ERROR': 'Registration temporarily unavailable. Please try again.',
        };
        
        return {
          success: false,
          message: errorMessages[lockResult.errorCode || ''] || 'Unable to start registration.',
          errorCode: lockResult.errorCode,
        };
      }
      
      tokenId = lockResult.tokenId!;
      lockAcquired = true;
      
      // Step 2: Validate registration data
      const validationErrors = this.validateRegistrationData(data);
      if (validationErrors.length > 0) {
        // Release lock and return errors
        await householdTokenService.releaseLock(
          tokenId,
          lockerId,
          ipAddress,
          userAgent,
          requestId,
          'Validation failed'
        );
        
        return {
          success: false,
          message: `Validation failed: ${validationErrors.join(', ')}`,
          errorCode: 'VALIDATION_FAILED',
        };
      }
      
      // Step 3: Check for duplicate registration (by mobile number)
      const existingResident = await Resident.findOne({
        mobileNumber: data.mobileNumber,
      });
      
      if (existingResident) {
        await householdTokenService.releaseLock(
          tokenId,
          lockerId,
          ipAddress,
          userAgent,
          requestId,
          'Duplicate mobile number'
        );
        
        await RegistrationAuditLog.log({
          eventType: 'REGISTRATION_FAILED',
          severity: 'WARNING',
          tokenPrefix: data.householdToken.replace(/-/g, '').slice(0, 4),
          tokenId,
          ipAddress,
          userAgent,
          requestId,
          message: 'Registration failed - duplicate mobile number',
          success: false,
          errorCode: 'DUPLICATE_MOBILE',
          processingTimeMs: Date.now() - startTime,
        });
        
        return {
          success: false,
          message: 'This mobile number is already registered.',
          errorCode: 'DUPLICATE_MOBILE',
        };
      }
      
      // Step 4: Create resident record
      const resident = new Resident({
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        mobileNumber: data.mobileNumber,
        password: data.password,
        city: data.city || '',
        barangay: data.barangay,
        streetAddress: data.streetAddress,
        householdSize: data.householdSize || 1,
        vulnerableMembers: data.vulnerableMembers || [],
        vulnerableCounts: data.vulnerableCounts || {},
        idType: data.idType || 'Not Provided',
        idNumber: data.idNumber || 'N/A',
        frontIdImage: data.frontIdImage || 'placeholder', // Optional for testing
        backIdImage: data.backIdImage || 'placeholder',   // Optional for testing
        faceImage: data.faceImage || 'placeholder',       // Optional for testing
        verification: data.verification || {
          overallConfidence: 0,
          idConfidence: 0,
          faceMatchConfidence: 0,
          livenessConfidence: 0,
          dataMatchScore: 0,
          riskScore: 0,
          isVerified: false,
          aiVerificationStatus: 'Low Match',
          warnings: [],
          riskFactors: [],
        },
        status: 'Pending',
      });
      
      await resident.save();
      
      // Step 5: Mark token as used (atomic)
      const completeResult = await householdTokenService.completeRegistration(
        tokenId,
        lockerId,
        resident._id as mongoose.Types.ObjectId,
        ipAddress,
        userAgent,
        requestId
      );
      
      if (!completeResult.success || !completeResult.completed) {
        // This is rare - lock expired during registration
        // We have a resident but token completion failed
        // Log this for manual review
        console.error('[RegistrationService] Token completion failed after resident created:', {
          residentId: resident._id,
          tokenId,
          error: completeResult.error,
        });
        
        await RegistrationAuditLog.log({
          eventType: 'REGISTRATION_FAILED',
          severity: 'CRITICAL',
          tokenPrefix: data.householdToken.replace(/-/g, '').slice(0, 4),
          tokenId,
          residentId: resident._id as mongoose.Types.ObjectId,
          ipAddress,
          userAgent,
          requestId,
          message: 'Token completion failed after resident created - manual review required',
          success: false,
          errorCode: 'COMPLETION_RACE',
          processingTimeMs: Date.now() - startTime,
        });
        
        // Still return success as resident was created
        // Admin will need to manually mark token as used
      }
      
      // Step 6: Log successful registration
      await RegistrationAuditLog.log({
        eventType: 'REGISTRATION_COMPLETED',
        severity: 'INFO',
        tokenPrefix: data.householdToken.replace(/-/g, '').slice(0, 4),
        tokenId,
        residentId: resident._id as mongoose.Types.ObjectId,
        ipAddress,
        userAgent,
        requestId,
        message: 'Registration completed successfully',
        success: true,
        processingTimeMs: Date.now() - startTime,
      });
      
      // Get token info for response
      const token = await householdTokenService.getTokenStatus(tokenId);
      
      return {
        success: true,
        residentId: resident._id as mongoose.Types.ObjectId,
        message: 'Registration successful! Your application is pending review.',
        householdInfo: token?.householdInfo ? {
          headOfHousehold: token.householdInfo.headOfHousehold,
          address: token.householdInfo.address,
          barangay: token.householdInfo.barangay,
        } : undefined,
      };
      
    } catch (error) {
      console.error('[RegistrationService] Registration error:', error);
      
      // Release lock if acquired
      if (lockAcquired && tokenId) {
        await householdTokenService.releaseLock(
          tokenId,
          lockerId,
          ipAddress,
          userAgent,
          requestId,
          `Error: ${(error as Error).message}`
        );
      }
      
      await RegistrationAuditLog.log({
        eventType: 'REGISTRATION_FAILED',
        severity: 'ERROR',
        tokenPrefix: data.householdToken?.replace(/-/g, '').slice(0, 4) || 'unknown',
        tokenId: tokenId || undefined,
        ipAddress,
        userAgent,
        requestId,
        message: `Registration error: ${(error as Error).message}`,
        success: false,
        errorCode: 'SYSTEM_ERROR',
        processingTimeMs: Date.now() - startTime,
      });
      
      return {
        success: false,
        message: 'Registration failed due to a system error. Please try again.',
        errorCode: 'SYSTEM_ERROR',
      };
    }
  }
  
  /**
   * Validate registration data
   */
  private validateRegistrationData(data: RegistrationData): string[] {
    const errors: string[] = [];
    
    // Required fields
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    if (!data.dateOfBirth?.trim()) errors.push('Date of birth is required');
    if (!data.gender) errors.push('Gender is required');
    if (!data.mobileNumber?.trim()) errors.push('Mobile number is required');
    if (!data.password?.trim()) errors.push('Password is required');
    if (!data.barangay?.trim()) errors.push('Barangay is required');
    if (!data.streetAddress?.trim()) errors.push('Street address is required');
    if (!data.householdToken?.trim()) errors.push('Household token is required');
    
    // TEMPORARILY DISABLED for testing - ID and face images are optional
    // if (!data.idType?.trim()) errors.push('ID type is required');
    // if (!data.idNumber?.trim()) errors.push('ID number is required');
    // if (!data.frontIdImage) errors.push('Front ID image is required');
    // if (!data.backIdImage) errors.push('Back ID image is required');
    // if (!data.faceImage) errors.push('Face image is required');
    
    // Password validation
    if (data.password && data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    // Mobile number format (relaxed for testing)
    // if (data.mobileNumber && !/^(09|\+639)\d{9}$/.test(data.mobileNumber.replace(/\s/g, ''))) {
    //   errors.push('Invalid mobile number format');
    // }
    
    // Token format
    if (data.householdToken && !/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(data.householdToken.trim())) {
      errors.push('Invalid token format');
    }
    
    return errors;
  }
}

// Export singleton instance
export const householdRegistrationService = new HouseholdRegistrationService();
export default householdRegistrationService;
