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
import { requireAuth, requireStaffOrSuperadmin, scopeBarangayGuard, AuthRequest } from '../middleware/unifiedAuth';
import { householdTokenService } from '../services/householdTokenService';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  generateCodeBatchBody,
  registerResidentBody,
  listResidentsQuery,
  residentIdParams,
} from '../validation/resident.schema';
import {
  isValidPhilippineMobileNumber,
  normalizePhilippineMobileNumber,
} from '../utils/mobileNumber';

const router = Router();

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
        message: 'Invalid mobile number format. Use 09XXXXXXXXX.',
        error: {
          code: 'INVALID_MOBILE_FORMAT',
          field: 'mobileNumber',
          details: 'Mobile number must be exactly 11 digits and start with 09.',
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

    if (!faceImage) {
      return res.status(400).json({
        success: false,
        message: 'Face scan is required',
      });
    }

    // Check if resident already exists
    const existingResident = await Resident.findOne({
      $or: [
        { mobileNumber: normalizedMobileNumber },
        { idNumber },
      ],
    });

    if (existingResident) {
      const isDuplicateMobile = existingResident.mobileNumber === normalizedMobileNumber;
      return res.status(409).json({
        success: false,
        message: isDuplicateMobile
          ? 'Mobile number is already registered'
          : 'ID number is already registered',
        error: {
          code: isDuplicateMobile ? 'DUPLICATE_MOBILE' : 'DUPLICATE_ID',
          field: isDuplicateMobile ? 'mobileNumber' : 'idNumber',
        },
      });
    }

    // Process verification result from mobile AI
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

    // Determine if we should auto-approve based on high match confidence (>=80%)
    const shouldAutoApprove = overallConfidence >= 80;
    const initialStatus = shouldAutoApprove ? 'Approved' : 'Pending';

    // Create new resident
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
      idNumber,
      frontIdImage,
      backIdImage,
      faceImage,
      verification,
      status: initialStatus,
      ...(shouldAutoApprove && {
        verifiedBy: 'System (High Match Auto-Approved)',
        verifiedAt: new Date(),
      }),
    });

    await resident.save();

    res.status(201).json({
      success: true,
      message: shouldAutoApprove 
        ? 'Registration approved automatically - High confidence match!' 
        : 'Registration submitted successfully - Pending admin review',
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
        autoApproved: shouldAutoApprove,
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
      return res.status(409).json({
        success: false,
        message: 'Mobile number is already registered',
        error: {
          code: 'DUPLICATE_MOBILE',
          field: 'mobileNumber',
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
 * POST /api/residents/codes/generate-batch
 * Generate household registration codes by barangay.
 */
router.post(
  '/codes/generate-batch',
  requireAuth,
  requireStaffOrSuperadmin,
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
