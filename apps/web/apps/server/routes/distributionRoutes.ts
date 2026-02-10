/**
 * Distribution Routes
 * 
 * CRUD operations for barangay relief distributions.
 * 
 * Endpoints:
 * - POST   /api/distributions         - Create a distribution (Admin, Staff)
 * - GET    /api/distributions         - List all distributions (Admin, Staff, Volunteer)
 * - PATCH  /api/distributions/:id/claim - Mark distribution as claimed (Admin, Staff)
 */

import { Router, Request, Response } from 'express';
import Distribution, { BARANGAY_OPTIONS } from '../models/Distribution';
import { AuthRequest } from '../middleware/unifiedAuth';

const router = Router();

/**
 * POST /api/distributions
 *
 * Create a new distribution for a barangay.
 * LGU_STAFF can only create for their assigned barangays.
 */
router.post(
  '/',
  async (req: AuthRequest, res: Response) => {
    try {
      const { barangay, scheduled, households, notes } = req.body;

      // Validate barangay
      if (!barangay || typeof barangay !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Barangay is required',
        });
      }

      if (!(BARANGAY_OPTIONS as readonly string[]).includes(barangay)) {
        return res.status(400).json({
          success: false,
          message: `Invalid barangay. Must be one of: ${BARANGAY_OPTIONS.join(', ')}`,
        });
      }

      // Scope check: staff can only create within assigned barangays
      if (
        req.authUser?.role === 'LGU_STAFF' &&
        !(req.authUser.assignedBarangays ?? []).includes(barangay)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to create distributions for this barangay',
        });
      }

      // Validate scheduled
      if (!scheduled || typeof scheduled !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date is required',
        });
      }

      // Validate households
      const householdsNum = Number(households);
      if (!households || isNaN(householdsNum) || householdsNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Households must be a number >= 1',
        });
      }

      const distribution = new Distribution({
        barangay,
        scheduled,
        households: householdsNum,
        notes: notes || '',
        status: 'Unclaimed',
        claimedAt: null,
      });

      await distribution.save();

      res.status(201).json({
        success: true,
        message: 'Distribution created successfully',
        data: distribution.toJSON(),
      });
    } catch (error: unknown) {
      console.error('Error creating distribution:', error);
      const message = error instanceof Error ? error.message : 'Failed to create distribution';
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/distributions
 *
 * List distributions. LGU_STAFF only sees their assigned barangays.
 */
router.get(
  '/',
  async (req: AuthRequest, res: Response) => {
    try {
      // Build filter: scope to assigned barangays for staff
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: any = {};

      if (req.authUser?.role === 'LGU_STAFF') {
        const assigned = req.authUser.assignedBarangays ?? [];
        filter.barangay = { $in: assigned };
      }

      const distributions = await Distribution.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      const data = distributions.map((d) => ({
        ...d,
        id: d._id.toString(),
      }));

      res.json({ success: true, data });
    } catch (error: unknown) {
      console.error('Error fetching distributions:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch distributions';
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PATCH /api/distributions/:id/claim
 *
 * Mark a distribution as claimed. Staff can only claim within scope.
 */
router.patch(
  '/:id/claim',
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const distribution = await Distribution.findById(id);

      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Distribution not found',
        });
      }

      // Scope check
      if (
        req.authUser?.role === 'LGU_STAFF' &&
        !(req.authUser.assignedBarangays ?? []).includes(distribution.barangay)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this distribution',
        });
      }

      if (distribution.status === 'Claimed') {
        return res.status(400).json({
          success: false,
          message: 'Distribution is already claimed',
        });
      }

      distribution.status = 'Claimed';
      distribution.claimedAt = new Date();
      await distribution.save();

      res.json({
        success: true,
        message: 'Distribution marked as claimed',
        data: distribution.toJSON(),
      });
    } catch (error: unknown) {
      console.error('Error claiming distribution:', error);
      const message = error instanceof Error ? error.message : 'Failed to claim distribution';
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
