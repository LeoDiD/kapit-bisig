/**
 * Resident Registration Routes
 * 
 * Handles mobile app registration with AI verification data.
 * Stores verification confidence scores for admin review.
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Resident from '../models/Resident';
import HouseholdToken from '../models/HouseholdToken';
import { requireAuth, requireSuperadmin, requireStaffOrSuperadmin, scopeBarangayGuard, AuthRequest } from '../middleware/unifiedAuth';
import { householdTokenService } from '../services/householdTokenService';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  generateCodeBatchBody,
  registerResidentBody,
  listResidentsQuery,
  residentIdParams,
  residentStatusUpdateBody,
} from '../validation/resident.schema';
import {
  isValidPhilippineMobileNumber,
  normalizePhilippineMobileNumber,
} from '../utils/mobileNumber';
import { validateBase64Image } from '../validation/imageValidation';
import { normalizeIdNumber, validateIdNumberFormat, validateIdType } from '../utils/idVerification';
import { persistVerificationImage } from '../utils/imageStorage';

const router = Router();
const REGISTER_PAYLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Calculate AI verification status based on confidence score
 */
function getAIVerificationStatus(confidence: number): 'High Match' | 'Medium Match' | 'Low Match' {
  if (confidence >= 80) return 'High Match';
  if (confidence >= 50) return 'Medium Match';
  return 'Low Match';
}

/**
 * POST /api/residents/register
 * Register a new resident from mobile app
 */
router.post('/register', validateRequest({ body: registerResidentBody }), async (req: Request, res: Response) => {
  try {
    const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (payloadBytes > REGISTER_PAYLOAD_MAX_BYTES) {
      return res.status(413).json({
        success: false,
        message: 'Request payload too large.',
      });
    }

    const {
      // Personal Info
      firstName,
      lastName,
      fullName,
      dateOfBirth,
      gender,
      mobileNumber,
      password,
      
      // Household Info
      city,
      barangay,
      streetAddress,
      householdSize,
      vulnerableMembers,
      vulnerableCounts,
      
      // Identity Verification
      idType,
      idNumber,
      frontIdImage,
      backIdImage,
      
      // Face Scan
      faceImage,
      
      // AI Verification Results from mobile
      verificationResult,
    } = req.body;

    const normalizedMobileNumber = normalizePhilippineMobileNumber(mobileNumber || '');
    const normalizedIdNumber = normalizeIdNumber(idType || '', idNumber || '');

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Personal information is required',
        error: {
          code: 'VALIDATION_ERROR',
          field: 'mobileNumber',
        },
      });
    }

    if (!isValidPhilippineMobileNumber(normalizedMobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Philippine mobile number.',
        error: {
          code: 'INVALID_MOBILE_FORMAT',
          field: 'mobileNumber',
          details: 'Mobile number must be 09XXXXXXXXX or +639XXXXXXXXX.',
        },
      });
    }

    if (!barangay || !streetAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address information is required',
      });
    }

    if (!idType || !idNumber || !frontIdImage || !backIdImage) {
      return res.status(400).json({
        success: false,
        message: 'ID verification is required',
      });
    }

    if (!validateIdType(idType)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported ID type selected.',
        error: {
          code: 'ID_TYPE_UNSUPPORTED',
          field: 'idType',
        },
      });
    }

    if (!validateIdNumberFormat(idType, normalizedIdNumber)) {
      return res.status(400).json({
        success: false,
        message: 'ID number format does not match the selected ID type.',
        error: {
          code: 'ID_NUMBER_INVALID_FORMAT',
          field: 'idNumber',
        },
      });
    }

    if (!faceImage) {
      return res.status(400).json({
        success: false,
        message: 'Face scan is required',
      });
    }

    const [frontValidation, backValidation, faceValidation] = await Promise.all([
      validateBase64Image(frontIdImage, {
        fieldName: 'Front ID image',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
      validateBase64Image(backIdImage, {
        fieldName: 'Back ID image',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
      validateBase64Image(faceImage, {
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
      return res.status(400).json({
        success: false,
        message: failedValidation.message,
      });
    }

    // Check if resident already exists
    const existingResident = await Resident.findOne({
      $or: [
        { mobileNumber: normalizedMobileNumber },
        { idNumber: normalizedIdNumber },
      ],
    });

    if (existingResident) {
      const isDuplicateMobile = existingResident.mobileNumber === normalizedMobileNumber;
      return res.status(409).json({
        success: false,
        message: isDuplicateMobile
          ? 'This account already exists. Please sign in instead.'
          : 'ID number is already registered',
        error: {
          code: isDuplicateMobile ? 'DUPLICATE_MOBILE' : 'DUPLICATE_ID',
          field: isDuplicateMobile ? 'mobileNumber' : 'idNumber',
        },
      });
    }

    // Keep client AI output as advisory metadata only; approval stays admin-driven.
    const overallConfidence = verificationResult?.overallConfidence 
      ? Math.round(verificationResult.overallConfidence * 100) 
      : 0;
    
    const verification = {
      overallConfidence,
      idConfidence: Math.round((verificationResult?.idVerification?.confidence || 0) * 100),
      faceMatchConfidence: Math.round((verificationResult?.faceVerification?.matchConfidence || 0) * 100),
      livenessConfidence: Math.round((verificationResult?.faceVerification?.livenessConfidence || 0) * 100),
      dataMatchScore: Math.round((verificationResult?.dataMatchVerification?.matchScore || 0) * 100),
      riskScore: Math.round((verificationResult?.riskScore || 0) * 100),
      isVerified: verificationResult?.isVerified || false,
      aiVerificationStatus: getAIVerificationStatus(overallConfidence),
      warnings: verificationResult?.idVerification?.warnings || [],
      riskFactors: verificationResult?.riskFactors || [],
    };

    const initialStatus: 'Pending' = 'Pending';

    // Create new resident
    const frontIdImageRef = persistVerificationImage(frontIdImage, 'front-id');
    const backIdImageRef = persistVerificationImage(backIdImage, 'back-id');
    const faceImageRef = persistVerificationImage(faceImage, 'face');

    const resident = new Resident({
      firstName,
      lastName,
      fullName: fullName || `${firstName} ${lastName}`.trim(),
      dateOfBirth,
      gender,
      mobileNumber: normalizedMobileNumber,
      password,
      city: city || '',
      barangay,
      streetAddress,
      householdSize: householdSize || 1,
      vulnerableMembers: vulnerableMembers || [],
      vulnerableCounts: vulnerableCounts || {},
      idType,
      idNumber: normalizedIdNumber,
      frontIdImage: frontIdImageRef,
      backIdImage: backIdImageRef,
      faceImage: faceImageRef,
      verification,
      status: initialStatus,
    });

    await resident.save();

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully - Pending admin review',
      data: {
        id: resident._id,
        firstName: resident.firstName,
        lastName: resident.lastName,
        fullName: resident.fullName,
        verification: {
          overallConfidence: verification.overallConfidence,
          aiVerificationStatus: verification.aiVerificationStatus,
          isVerified: verification.isVerified,
        },
        status: resident.status,
        autoApproved: false,
      },
    });
  } catch (error) {
    console.error('[ResidentRoutes] Registration error:', error);

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      const duplicateKey =
        typeof (error as any).keyPattern === 'object' && (error as any).keyPattern
          ? Object.keys((error as any).keyPattern)[0]
          : 'mobileNumber';
      const isDuplicateId = duplicateKey === 'idNumber';
      return res.status(409).json({
        success: false,
        message: isDuplicateId
          ? 'ID number is already registered'
          : 'This account already exists. Please sign in instead.',
        error: {
          code: isDuplicateId ? 'DUPLICATE_ID' : 'DUPLICATE_MOBILE',
          field: isDuplicateId ? 'idNumber' : 'mobileNumber',
        },
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: {
        code: 'SERVER_ERROR',
      },
    });
  }
});

/**
 * GET /api/residents
 * Get all residents (for admin dashboard)
 */
router.get('/', requireAuth, requireStaffOrSuperadmin, validateRequest({ query: listResidentsQuery }), async (req: AuthRequest, res: Response) => {
  try {
    const { status, barangay, search } = req.query;
    
    const query: Record<string, unknown> = {};

    // RBAC: LGU_STAFF can only see residents in their assigned barangays
    if (req.authUser?.role === 'LGU_STAFF') {
      const assigned = req.authUser.assignedBarangays ?? [];
      query.barangay = mongoose.trusted({ $in: assigned });
    }
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (barangay && barangay !== 'All') {
      // If staff, verify the requested barangay is within scope
      if (req.authUser?.role === 'LGU_STAFF') {
        const assigned = req.authUser.assignedBarangays ?? [];
        if (!assigned.includes(barangay as string)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to the requested barangay',
          });
        }
      }
      query.barangay = barangay;
    }
    
    if (search) {
      const escaped = escapeRegex(search as string);
      query.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { mobileNumber: { $regex: escaped, $options: 'i' } },
        { idNumber: { $regex: escaped, $options: 'i' } },
      ];
    }
    
    // ── Pagination ──────────────────────────────────────────────
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const rawLimit = parseInt(req.query.limit as string, 10) || 50;
    const limit = Math.min(rawLimit, 50);   // hard cap
    const skip = (page - 1) * limit;

    const residents = await Resident.find(query)
      .select('-password -frontIdImage -backIdImage -faceImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      data: residents,
    });
  } catch (error) {
    console.error('[ResidentRoutes] Get residents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * PATCH /api/residents/:id/status
 * Approve or reject a pending resident registration.
 */
router.patch(
  '/:id/status',
  requireAuth,
  requireSuperadmin,
  validateRequest({ params: residentIdParams, body: residentStatusUpdateBody }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, rejectionReason } = req.body as {
        status: 'Approved' | 'Rejected';
        rejectionReason?: string;
      };

      const resident = await Resident.findById(req.params.id).select('-password');
      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found',
        });
      }

      if (req.authUser?.role === 'LGU_STAFF') {
        const assigned = req.authUser.assignedBarangays ?? [];
        if (!assigned.includes(resident.barangay)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to modify this resident',
          });
        }
      }

      resident.status = status;
      resident.rejectionReason = status === 'Rejected' ? rejectionReason?.trim() : undefined;
      resident.verifiedAt = new Date();
      resident.verifiedBy = req.authUser?.userId || req.authUser?.sub || 'system';
      await resident.save();

      return res.json({
        success: true,
        message:
          status === 'Approved'
            ? 'Registration approved successfully'
            : 'Registration rejected successfully',
        data: {
          id: resident._id,
          status: resident.status,
          rejectionReason: resident.rejectionReason,
          verifiedAt: resident.verifiedAt,
          verifiedBy: resident.verifiedBy,
        },
      });
    } catch (error) {
      console.error('[ResidentRoutes] Update resident status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

/**
 * POST /api/residents/codes/generate-batch
 * Generate household registration codes by barangay.
 */
router.post(
  '/codes/generate-batch',
  requireAuth,
  requireSuperadmin,
  validateRequest({ body: generateCodeBatchBody }),
  scopeBarangayGuard('body'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { barangay, quantity } = req.body as { barangay: string; quantity: number };

      const issuedBy = req.authUser?.userId || req.authUser?.sub || 'system';
      const generatedAt = new Date();
      const expiresAt = new Date(generatedAt);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const tokens: Array<{
        code: string;
        barangay: string;
        expiresAt: Date;
        generatedAt: Date;
      }> = [];

      for (let i = 0; i < quantity; i++) {
        const sequence = String(i + 1).padStart(3, '0');
        const result = await householdTokenService.generateToken({
          headOfHousehold: `Unassigned Household ${sequence}`,
          address: barangay,
          barangay,
          expectedMembers: 1,
          notes: `Bulk generated via Code Generation page (${quantity} token${quantity > 1 ? 's' : ''})`,
          validityDays: 30,
          issuedBy,
        });

        if (!result.success || !result.token) {
          return res.status(500).json({
            success: false,
            message: `Failed to generate code at item ${i + 1}`,
          });
        }

        tokens.push({
          code: result.token,
          barangay,
          expiresAt: result.expiresAt || expiresAt,
          generatedAt,
        });
      }

      return res.status(201).json({
        success: true,
        message: `Generated ${tokens.length} code${tokens.length > 1 ? 's' : ''}`,
        data: {
          barangay,
          quantity: tokens.length,
          generatedAt,
          tokens,
        },
      });
    } catch (error) {
      console.error('[ResidentRoutes] Batch code generation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate codes',
      });
    }
  }
);

/**
 * GET /api/residents/:id
 * Get resident by ID with all details
 */
router.get('/:id', requireAuth, requireStaffOrSuperadmin, validateRequest({ params: residentIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const resident = await Resident.findById(req.params.id).select('-password');
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }
    
    res.json({
      success: true,
      data: resident,
    });
  } catch (error) {
    console.error('[ResidentRoutes] Get resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * GET /api/residents/codes/active
 * Returns active household token codes from MongoDB.
 */
router.get('/codes/active', requireAuth, requireStaffOrSuperadmin, async (req: AuthRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = {
      status: 'UNUSED',
    };

    if (req.authUser?.role === 'LGU_STAFF') {
      const assigned = req.authUser.assignedBarangays ?? [];
      query['householdInfo.barangay'] = mongoose.trusted({ $in: assigned });
    }

    const tokens = await HouseholdToken.find(query)
      .select('tokenPrefix status expiresAt issuedAt createdAt householdInfo')
      .sort({ createdAt: -1 })
      .lean();

    const data = tokens.map((token) => ({
      id: token._id.toString(),
      code: token.tokenPrefix,
      status: token.status,
      barangay: token.householdInfo?.barangay || '',
      headOfHousehold: token.householdInfo?.headOfHousehold || '',
      address: token.householdInfo?.address || '',
      expiresAt: token.expiresAt,
      issuedAt: token.issuedAt,
      createdAt: token.createdAt,
    }));

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('[ResidentRoutes] Active codes fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active codes',
    });
  }
});

/**
 * POST /api/residents/:id/generate-code
 * Generate a unique resident code for an approved resident.
 */
router.post('/:id/generate-code', requireAuth, requireStaffOrSuperadmin, validateRequest({ params: residentIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const resident = await Resident.findById(req.params.id).select('-password');

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    if (resident.residentCode) {
      return res.json({
        success: true,
        message: 'Code already generated',
        data: {
          id: resident._id,
          residentCode: resident.residentCode,
          alreadyGenerated: true,
        },
      });
    }

    if (resident.status !== 'Approved') {
      return res.status(409).json({
        success: false,
        message: 'Only approved records can generate a code',
      });
    }

    await resident.save();

    if (!resident.residentCode) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate resident code',
      });
    }

    res.json({
      success: true,
      message: 'Code generated successfully',
      data: {
        id: resident._id,
        residentCode: resident.residentCode,
        alreadyGenerated: false,
      },
    });
  } catch (error) {
    console.error('[ResidentRoutes] Generate resident code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * GET /api/residents/stats/summary
 * Get summary statistics for dashboard
 */
router.get('/stats/summary', requireAuth, requireStaffOrSuperadmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Resident.countDocuments(),
      Resident.countDocuments({ status: 'Pending' }),
      Resident.countDocuments({ status: 'Approved' }),
      Resident.countDocuments({ status: 'Rejected' }),
    ]);
    
    const highMatch = await Resident.countDocuments({
      'verification.aiVerificationStatus': 'High Match',
    });
    
    const mediumMatch = await Resident.countDocuments({
      'verification.aiVerificationStatus': 'Medium Match',
    });
    
    const lowMatch = await Resident.countDocuments({
      'verification.aiVerificationStatus': 'Low Match',
    });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        aiStats: {
          highMatch,
          mediumMatch,
          lowMatch,
        },
      },
    });
  } catch (error) {
    console.error('[ResidentRoutes] Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;
