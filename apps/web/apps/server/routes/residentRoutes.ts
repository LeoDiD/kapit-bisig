/**
 * Resident Registration Routes
 * 
 * Handles mobile app registration with AI verification data.
 * Stores verification confidence scores for admin review.
 */

import { Router, Request, Response } from 'express';
import Resident from '../models/Resident';
import { requireAuth, requireStaffOrSuperadmin, AuthRequest } from '../middleware/unifiedAuth';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  registerResidentBody,
  listResidentsQuery,
  residentIdParams,
  verifyResidentBody,
} from '../validation/resident.schema';
import { logAudit } from '../utils/audit';

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

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Personal information is required',
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
        { mobileNumber },
        { idNumber },
      ],
    });

    if (existingResident) {
      return res.status(400).json({
        success: false,
        message: 'A resident with this mobile number or ID already exists',
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
      mobileNumber,
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
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error instanceof Error ? error.message : 'Unknown error',
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
      query.barangay = { $in: assigned };
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
 * PATCH /api/residents/:id/verify
 * Approve or reject a resident application
 */
router.patch('/:id/verify', requireAuth, requireStaffOrSuperadmin, validateRequest({ params: residentIdParams, body: verifyResidentBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason, verifiedBy } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    if (status === 'Rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }
    
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      {
        status,
        rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
        verifiedBy,
        verifiedAt: new Date(),
      },
      { new: true }
    ).select('-password');
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found',
      });
    }

    await logAudit(req, 'RESIDENT_VERIFIED', 'Resident', req.params.id, {
      status,
      rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
    });
    
    res.json({
      success: true,
      message: `Application ${status.toLowerCase()}`,
      data: resident,
    });
  } catch (error) {
    console.error('[ResidentRoutes] Verify resident error:', error);
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
