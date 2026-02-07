/**
 * Admin Token Management Routes
 * 
 * Protected endpoints for barangay administrators to manage household tokens.
 * 
 * Security Features:
 * 1. Authentication required (JWT)
 * 2. Admin role verification
 * 3. Rate limiting
 * 4. Comprehensive audit logging
 * 
 * Endpoints:
 * - POST /generate: Generate new household token
 * - GET /list: List tokens for barangay
 * - GET /:id: Get token details
 * - GET /:id/history: Get token audit history
 * - POST /bulk-generate: Generate multiple tokens
 * - DELETE /:id: Revoke/expire a token
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { householdTokenService } from '../services/householdTokenService';
import HouseholdToken from '../models/HouseholdToken';
import RegistrationAuditLog from '../models/RegistrationAuditLog';
import { generateRequestId } from '../services/householdTokenService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tokenGenerationRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Use authMiddleware as authenticateToken
const authenticateToken = authMiddleware;

// Extended request type with user info
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role?: string;
    iat?: number;
    exp?: number;
  };
}

/**
 * Get client IP address
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
 * Verify admin role middleware
 */
function requireAdmin(req: AuthenticatedRequest, res: Response, next: () => void) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
}

/**
 * Generate Single Token
 * 
 * POST /api/admin/tokens/generate
 * 
 * Creates a new household registration token.
 * Returns the plain token ONCE (it cannot be retrieved again).
 * 
 * Request body:
 * {
 *   headOfHousehold: string,
 *   address: string,
 *   barangay: string,
 *   expectedMembers?: number,
 *   notes?: string,
 *   validityDays?: number  // Default: 30
 * }
 */
router.post(
  '/generate',
  authenticateToken,
  requireAdmin,
  tokenGenerationRateLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const requestId = generateRequestId();
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    try {
      const {
        headOfHousehold,
        address,
        barangay,
        expectedMembers,
        notes,
        validityDays,
      } = req.body;
      
      // Validate required fields
      if (!headOfHousehold || !address || !barangay) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: headOfHousehold, address, barangay',
        });
      }
      
      // Generate token
      const result = await householdTokenService.generateToken({
        headOfHousehold,
        address,
        barangay,
        expectedMembers,
        notes,
        validityDays,
        issuedBy: req.user!.id,
      });
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error || 'Failed to generate token',
        });
      }
      
      // Log token generation
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_GENERATED',
        severity: 'INFO',
        tokenPrefix: result.token!.replace(/-/g, '').slice(0, 4),
        tokenId: result.tokenId,
        ipAddress,
        userAgent,
        requestId,
        adminId: req.user!.id,
        message: `Token generated for ${headOfHousehold}`,
        metadata: { barangay, expiresAt: result.expiresAt },
        success: true,
      });
      
      return res.status(201).json({
        success: true,
        message: 'Token generated successfully',
        token: result.token, // Plain token - shown once only!
        tokenId: result.tokenId?.toString(),
        expiresAt: result.expiresAt,
        householdInfo: {
          headOfHousehold,
          address,
          barangay,
          expectedMembers: expectedMembers || 1,
        },
        warning: 'IMPORTANT: Save this token now. It cannot be retrieved again!',
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] Generate error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate token',
      });
    }
  }
);

/**
 * Bulk Generate Tokens
 * 
 * POST /api/admin/tokens/bulk-generate
 * 
 * Generate multiple tokens at once.
 * Returns array of generated tokens.
 */
router.post(
  '/bulk-generate',
  authenticateToken,
  requireAdmin,
  strictRateLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const requestId = generateRequestId();
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    try {
      const { households, validityDays } = req.body;
      
      if (!Array.isArray(households) || households.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'households array is required',
        });
      }
      
      if (households.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 tokens can be generated at once',
        });
      }
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < households.length; i++) {
        const household = households[i];
        
        if (!household.headOfHousehold || !household.address || !household.barangay) {
          errors.push({
            index: i,
            error: 'Missing required fields',
          });
          continue;
        }
        
        const result = await householdTokenService.generateToken({
          headOfHousehold: household.headOfHousehold,
          address: household.address,
          barangay: household.barangay,
          expectedMembers: household.expectedMembers,
          notes: household.notes,
          validityDays,
          issuedBy: req.user!.id,
        });
        
        if (result.success) {
          results.push({
            index: i,
            token: result.token,
            tokenId: result.tokenId?.toString(),
            expiresAt: result.expiresAt,
            householdInfo: {
              headOfHousehold: household.headOfHousehold,
              address: household.address,
              barangay: household.barangay,
            },
          });
        } else {
          errors.push({
            index: i,
            error: result.error,
          });
        }
      }
      
      // Log bulk generation
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_GENERATED',
        severity: 'INFO',
        ipAddress,
        userAgent,
        requestId,
        adminId: req.user!.id,
        message: `Bulk generated ${results.length} tokens`,
        metadata: { requested: households.length, successful: results.length, failed: errors.length },
        success: true,
      });
      
      return res.status(201).json({
        success: true,
        message: `Generated ${results.length} of ${households.length} tokens`,
        tokens: results,
        errors: errors.length > 0 ? errors : undefined,
        warning: 'IMPORTANT: Save these tokens now. They cannot be retrieved again!',
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] Bulk generate error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate tokens',
      });
    }
  }
);

/**
 * List Tokens
 * 
 * GET /api/admin/tokens/list
 * 
 * List all tokens for a barangay with optional filtering.
 * 
 * Query params:
 * - barangay: string (required)
 * - status: 'UNUSED' | 'LOCKED' | 'USED' | 'EXPIRED'
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
router.get(
  '/list',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        barangay,
        status,
        page = '1',
        limit = '20',
      } = req.query;
      
      if (!barangay || typeof barangay !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'barangay query parameter is required',
        });
      }
      
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
      
      const result = await householdTokenService.listTokensByBarangay(
        barangay,
        status as any,
        pageNum,
        limitNum
      );
      
      return res.json({
        success: true,
        tokens: result.tokens.map(token => ({
          id: token._id,
          tokenPrefix: token.tokenPrefix,
          status: token.status,
          householdInfo: token.householdInfo,
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
          issuedAt: token.issuedAt,
          createdAt: token.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] List error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list tokens',
      });
    }
  }
);

/**
 * Get Token Details
 * 
 * GET /api/admin/tokens/:id
 * 
 * Get detailed information about a specific token.
 */
router.get(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token ID',
        });
      }
      
      const token = await HouseholdToken.findById(id);
      
      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found',
        });
      }
      
      return res.json({
        success: true,
        token: {
          id: token._id,
          tokenPrefix: token.tokenPrefix,
          status: token.status,
          householdInfo: token.householdInfo,
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
          usedBy: token.status === 'USED' ? {
            residentId: token.usedBy.residentId,
            usedAt: token.usedAt,
          } : undefined,
          issuedBy: token.issuedBy,
          issuedAt: token.issuedAt,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
        },
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] Get token error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get token',
      });
    }
  }
);

/**
 * Get Token Audit History
 * 
 * GET /api/admin/tokens/:id/history
 * 
 * Get audit log history for a specific token.
 */
router.get(
  '/:id/history',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = '50' } = req.query;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token ID',
        });
      }
      
      const token = await HouseholdToken.findById(id);
      
      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found',
        });
      }
      
      const history = await RegistrationAuditLog.getTokenHistory(
        token.tokenPrefix,
        Math.min(100, parseInt(limit as string) || 50)
      );
      
      return res.json({
        success: true,
        tokenId: id,
        tokenPrefix: token.tokenPrefix,
        history: history.map(log => ({
          eventType: log.eventType,
          severity: log.severity,
          message: log.details.message,
          ipAddress: log.ipAddress,
          success: log.success,
          errorCode: log.errorCode,
          timestamp: log.timestamp,
        })),
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] Get history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get token history',
      });
    }
  }
);

/**
 * Revoke Token
 * 
 * DELETE /api/admin/tokens/:id
 * 
 * Expire/revoke a token so it can no longer be used.
 * Only UNUSED tokens can be revoked.
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const requestId = generateRequestId();
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token ID',
        });
      }
      
      const token = await HouseholdToken.findById(id);
      
      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found',
        });
      }
      
      if (token.status === 'USED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot revoke a token that has already been used',
        });
      }
      
      token.status = 'EXPIRED';
      await token.save();
      
      // Log revocation
      await RegistrationAuditLog.log({
        eventType: 'TOKEN_EXPIRED',
        severity: 'INFO',
        tokenPrefix: token.tokenPrefix,
        tokenId: token._id as mongoose.Types.ObjectId,
        ipAddress,
        userAgent,
        requestId,
        adminId: req.user!.id,
        message: 'Token manually revoked by admin',
        success: true,
      });
      
      return res.json({
        success: true,
        message: 'Token revoked successfully',
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] Revoke error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to revoke token',
      });
    }
  }
);

/**
 * Get Token Statistics
 * 
 * GET /api/admin/tokens/stats
 * 
 * Get statistics for tokens in a barangay.
 */
router.get(
  '/stats/summary',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { barangay } = req.query;
      
      if (!barangay || typeof barangay !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'barangay query parameter is required',
        });
      }
      
      const [unused, locked, used, expired] = await Promise.all([
        HouseholdToken.countDocuments({ 'householdInfo.barangay': barangay, status: 'UNUSED' }),
        HouseholdToken.countDocuments({ 'householdInfo.barangay': barangay, status: 'LOCKED' }),
        HouseholdToken.countDocuments({ 'householdInfo.barangay': barangay, status: 'USED' }),
        HouseholdToken.countDocuments({ 'householdInfo.barangay': barangay, status: 'EXPIRED' }),
      ]);
      
      return res.json({
        success: true,
        barangay,
        stats: {
          unused,
          locked,
          used,
          expired,
          total: unused + locked + used + expired,
          activeRate: used > 0 ? ((used / (used + unused + expired)) * 100).toFixed(1) + '%' : '0%',
        },
      });
      
    } catch (error) {
      console.error('[AdminTokenRoutes] Stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
      });
    }
  }
);

export default router;
