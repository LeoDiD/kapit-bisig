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
import Resident from '../models/Resident';
import DistributionClaim from '../models/DistributionClaim';
import { AuthRequest } from '../middleware/unifiedAuth';
import { validateRequest } from '../validation/validateRequest';
import {
  createDistributionBody,
  distributionIdParams,
} from '../validation/distribution.schema';
import { logAudit } from '../utils/audit';

const router = Router();

/**
 * POST /api/distributions
 *
 * Create a new distribution for a barangay.
 * LGU_STAFF can only create for their assigned barangays.
 */
router.post(
  '/',
  validateRequest({ body: createDistributionBody }),
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

      await logAudit(req, 'DISTRIBUTION_CREATED', 'Distribution', distribution._id.toString(), {
        barangay,
        scheduled,
        households: householdsNum,
      });

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

      // Aggregate registered (approved) household counts per barangay
      const barangays = [...new Set(distributions.map((d) => d.barangay))];
      const counts = await Resident.aggregate([
        { $match: { barangay: { $in: barangays }, status: 'Approved' } },
        { $group: { _id: '$barangay', count: { $sum: 1 } } },
      ]);
      const countMap: Record<string, number> = {};
      for (const c of counts) {
        countMap[c._id] = c.count;
      }

      // Aggregate claimed household counts per distribution from DistributionClaim
      const distIds = distributions.map((d) => d._id);
      const claimedCounts = await DistributionClaim.aggregate([
        { $match: { distributionId: { $in: distIds } } },
        { $group: { _id: '$distributionId', count: { $sum: 1 } } },
      ]);
      const claimedCountMap: Record<string, number> = {};
      for (const c of claimedCounts) {
        claimedCountMap[c._id.toString()] = c.count;
      }

      const data = distributions.map((d) => {
        const claimed = claimedCountMap[d._id.toString()] ?? 0;
        const registered = countMap[d.barangay] ?? 0;

        // Derive status from actual claims vs registered households
        let derivedStatus = d.status;
        if (claimed > 0 && registered > 0 && claimed >= registered) {
          derivedStatus = 'Claimed';           // all households claimed
        } else if (claimed > 0) {
          derivedStatus = 'Partially Claimed';  // some households claimed
        }

        return {
          ...d,
          id: d._id.toString(),
          registeredHouseholds: registered,
          claimedHouseholds: claimed,
          status: derivedStatus,
          claimedAt: claimed > 0 ? (d.claimedAt || new Date().toISOString()) : d.claimedAt,
        };
      });

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
  validateRequest({ params: distributionIdParams }),
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

      await logAudit(req, 'DISTRIBUTION_CLAIMED', 'Distribution', distribution._id.toString(), {
        barangay: distribution.barangay,
      });

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

/**
 * GET /api/distributions/:id/households
 *
 * Returns households for the distribution's barangay split into
 * Claimed (for this distribution) and Not Yet Claimed.
 *
 * RBAC:
 * - SUPERADMIN: all
 * - LGU_STAFF: only if distribution.barangay ∈ assignedBarangays
 */
router.get(
  '/:id/households',
  validateRequest({ params: distributionIdParams }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // 1) Find the distribution
      const distribution = await Distribution.findById(id);
      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Distribution not found',
        });
      }

      // 2) RBAC scope check
      if (
        req.authUser?.role === 'LGU_STAFF' &&
        !(req.authUser.assignedBarangays ?? []).includes(distribution.barangay)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this distribution',
        });
      }

      const targetBarangay = distribution.barangay;

      // 3) Get all approved residents (registered households) in this barangay
      const registeredHouseholds = await Resident.find({
        barangay: targetBarangay,
        status: 'Approved',
      })
        .select('_id fullName firstName lastName streetAddress barangay')
        .lean();

      // 4) If zero registered households, return early
      if (registeredHouseholds.length === 0) {
        return res.json({
          success: true,
          data: {
            distributionId: id,
            barangay: targetBarangay,
            totals: { registered: 0, claimed: 0, notYetClaimed: 0 },
            claimed: [],
            notYetClaimed: [],
          },
        });
      }

      // 5) Find claims for THIS distribution
      const claims = await DistributionClaim.find({
        distributionId: distribution._id,
      }).lean();

      const claimedHouseholdIds = new Set(
        claims.map((c) => c.householdId.toString())
      );

      // 6) Build claimed and notYetClaimed lists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const claimedList: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notYetClaimedList: any[] = [];

      for (const hh of registeredHouseholds) {
        const hhId = (hh._id as any).toString();
        const householdName =
          hh.fullName || `${hh.firstName} ${hh.lastName}`;
        const address = hh.streetAddress
          ? `${hh.streetAddress}, ${hh.barangay}`
          : hh.barangay;

        if (claimedHouseholdIds.has(hhId)) {
          const claim = claims.find(
            (c) => c.householdId.toString() === hhId
          );
          claimedList.push({
            householdId: hhId,
            householdName,
            address,
            claimedAt: claim?.claimedAt?.toISOString() ?? null,
            claimedBy: claim?.claimedBy ?? null,
            proofMethod: claim?.proofMethod ?? null,
          });
        } else {
          notYetClaimedList.push({
            householdId: hhId,
            householdName,
            address,
          });
        }
      }

      // 7) Return response
      res.json({
        success: true,
        data: {
          distributionId: id,
          barangay: targetBarangay,
          totals: {
            registered: registeredHouseholds.length,
            claimed: claimedList.length,
            notYetClaimed: notYetClaimedList.length,
          },
          claimed: claimedList,
          notYetClaimed: notYetClaimedList,
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching distribution households:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch distribution households';
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
