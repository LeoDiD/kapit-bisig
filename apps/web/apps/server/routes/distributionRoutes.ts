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

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Distribution from '../models/Distribution';
import Resident from '../models/Resident';
import DistributionClaim from '../models/DistributionClaim';
import StaffUser from '../models/StaffUser';
import User from '../models/User';
import { AuthRequest } from '../middleware/unifiedAuth';
import { validateRequest } from '../validation/validateRequest';
import {
  createDistributionBody,
  distributionIdParams,
} from '../validation/distribution.schema';
import { logAudit } from '../utils/audit';
import { broadcastScopedNotification } from '../utils/createNotification';
import { getTargetBarangays } from '../services/distributionFlowService';

const router = Router();

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
const idempotencyStore = new Map<string, {
  expiresAt: number;
  distributionId: string;
  response: Record<string, unknown>;
}>();

function cleanIdempotencyStore(): void {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore.entries()) {
    if (entry.expiresAt <= now) {
      idempotencyStore.delete(key);
    }
  }
}

function idempotencyCacheKey(userKey: string, key: string): string {
  return `${userKey}::${key}`;
}

function hasCoverage(scopes: string[], targets: string[]): boolean {
  return targets.every((target) => scopes.includes(target));
}

const isScopedRole = (role?: string) => role === 'LGU_STAFF' || role === 'Volunteer';

async function getScopedBarangays(user?: AuthRequest['authUser']): Promise<string[]> {
  if (!user || !isScopedRole(user.role)) return [];

  // Prefer DB source of truth so scope updates apply immediately without requiring re-login.
  if (user.role === 'LGU_STAFF' && user.userId) {
    const staff = await StaffUser.findById(user.userId).select('assignedBarangays').lean();
    if (Array.isArray(staff?.assignedBarangays) && staff.assignedBarangays.length > 0) {
      return Array.from(new Set(staff.assignedBarangays.filter(Boolean)));
    }
  }

  if (user.role === 'Volunteer' && user.userId) {
    const volunteer = await User.findById(user.userId).select('barangay').lean();
    if (volunteer?.barangay) {
      return [volunteer.barangay];
    }
  }

  return Array.from(new Set((user.assignedBarangays ?? []).filter(Boolean)));
}

const hasDistributionAccess = (scopedBarangays: string[], distribution: { barangay: string; assignedBarangays?: string[] }) => {
  if (scopedBarangays.length === 0) return false;
  if (scopedBarangays.includes(distribution.barangay)) return true;
  const targetBarangays = distribution.assignedBarangays ?? [];
  return targetBarangays.some((b) => scopedBarangays.includes(b));
};

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
      const scopedBarangays = await getScopedBarangays(req.authUser);
      let parsed;
      try {
        parsed = createDistributionBody.safeParse(req.body);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: parseError instanceof Error ? parseError.message : 'Validation failed',
        });
      }
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      const { barangay, assignedBarangays, assignedStaffIds, scheduled, notes } = parsed.data;

      cleanIdempotencyStore();
      const idempotencyKeyHeader = req.header('Idempotency-Key')?.trim();
      if (idempotencyKeyHeader) {
        const actorId = req.authUser?.userId ?? req.authUser?.sub ?? 'anonymous';
        const key = idempotencyCacheKey(actorId, idempotencyKeyHeader);
        const existing = idempotencyStore.get(key);
        if (existing && existing.expiresAt > Date.now()) {
          return res.status(200).json(existing.response);
        }
      }

      // Scope check: staff can only create within assigned barangays
      if (req.authUser?.role === 'LGU_STAFF') {
        const allTargets = [barangay, ...assignedBarangays];
        const outOfScope = allTargets.find((b) => !scopedBarangays.includes(b));
        if (outOfScope) {
          return res.status(403).json({
            success: false,
            code: 'OUT_OF_SCOPE_STAFF',
            message: `You do not have access to create distributions for ${outOfScope}`,
          });
        }
      }

      const uniqueStaffIds = [...new Set(assignedStaffIds)];
      const activeStaffDocs = await StaffUser.find({ isActive: true })
        .select('_id role assignedBarangays')
        .lean();

      const requestedIdSet = new Set(uniqueStaffIds);
      const staffDocs = activeStaffDocs.filter((doc) => requestedIdSet.has(doc._id.toString()));

      const foundIds = new Set(staffDocs.map((doc) => doc._id.toString()));
      const missingStaffIds = uniqueStaffIds.filter((id) => !foundIds.has(id));
      if (missingStaffIds.length > 0) {
        return res.status(400).json({
          success: false,
          code: 'STAFF_NOT_FOUND',
          message: 'One or more selected staff members were not found',
          missingStaffIds,
        });
      }

      const invalidRole = staffDocs.find((doc) => !['LGU_STAFF'].includes(doc.role));
      if (invalidRole) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ASSIGNED_STAFF',
          message: 'Only VOLUNTEER, LGU_STAFF, or SUPERADMIN can be assigned',
        });
      }

      if (req.authUser?.role === 'LGU_STAFF') {
        const targetScope = [barangay, ...assignedBarangays];
        const outOfScopeAssignees = staffDocs
          .filter((doc) => !hasCoverage(doc.assignedBarangays ?? [], targetScope))
          .map((doc) => doc._id.toString());

        if (outOfScopeAssignees.length > 0) {
          return res.status(403).json({
            success: false,
            code: 'OUT_OF_SCOPE_STAFF',
            message: 'Some selected staff are out of scope for this distribution.',
            outOfScopeStaffIds: outOfScopeAssignees,
          });
        }
      }

      const targetBarangays = getTargetBarangays(barangay, assignedBarangays);
      const householdsNum = await Resident.countDocuments({
        barangay: mongoose.trusted({ $in: targetBarangays }),
        status: 'Approved',
      });

      const distribution = new Distribution({
        barangay,
        assignedBarangays,
        assignedStaffIds: uniqueStaffIds,
        scheduled,
        households: householdsNum,
        notes: notes || '',
        status: 'Unclaimed',
        claimedAt: null,
      });

      await distribution.save();

      await logAudit(req, 'DISTRIBUTION_CREATED', 'Distribution', distribution._id.toString(), {
        barangay,
        assignedBarangays,
        scheduled,
        householdsDerived: householdsNum,
        assignedStaffCount: uniqueStaffIds.length,
      });

      // Notify all staff about the new distribution
      broadcastScopedNotification({
        title: 'New Distribution',
        message: `A relief distribution for ${barangay} has been scheduled on ${scheduled}.`,
        type: 'dispatch',
        meta: { distributionId: distribution._id.toString(), barangay, assignedBarangays, scheduled },
        targetBarangays: [barangay, ...assignedBarangays],
      });

      res.status(201).json({
        success: true,
        message: 'Distribution created successfully',
        data: distribution.toJSON(),
      });

      if (idempotencyKeyHeader) {
        const actorId = req.authUser?.userId ?? req.authUser?.sub ?? 'anonymous';
        const key = idempotencyCacheKey(actorId, idempotencyKeyHeader);
        idempotencyStore.set(key, {
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
          distributionId: distribution._id.toString(),
          response: {
            success: true,
            message: 'Distribution created successfully',
            data: distribution.toJSON(),
          },
        });
      }
    } catch (error: unknown) {
      console.error('Error creating distribution:', error);
      const message = error instanceof Error ? error.message : 'Failed to create distribution';
      res.status(500).json({ success: false, code: 'VALIDATION_ERROR', message });
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
      let distributions = await Distribution.find({})
        .sort({ createdAt: -1 })
        .lean();

      if (isScopedRole(req.authUser?.role)) {
        const scopedBarangays = await getScopedBarangays(req.authUser);
        const assigned = new Set(scopedBarangays);
        distributions = distributions.filter((d) => {
          if (assigned.has(d.barangay)) return true;
          return (d.assignedBarangays ?? []).some((b) => assigned.has(b));
        });
      }

      // Aggregate registered (approved) household counts per barangay
      const barangays = [...new Set(
        distributions.flatMap((d) =>
          Array.isArray(d.assignedBarangays) && d.assignedBarangays.length > 0
            ? d.assignedBarangays
            : [d.barangay]
        )
      )];
      const counts = await Resident.aggregate([
        { $match: { barangay: mongoose.trusted({ $in: barangays }), status: 'Approved' } },
        { $group: { _id: '$barangay', count: { $sum: 1 } } },
      ]);
      const countMap: Record<string, number> = {};
      for (const c of counts) {
        countMap[c._id] = c.count;
      }

      // Aggregate claimed household counts per distribution from DistributionClaim
      const distIds = distributions.map((d) => d._id);
      const claimedCounts = await DistributionClaim.aggregate([
        { $match: { distributionId: mongoose.trusted({ $in: distIds }) } },
        { $group: { _id: '$distributionId', count: { $sum: 1 } } },
      ]);
      const claimedCountMap: Record<string, number> = {};
      for (const c of claimedCounts) {
        claimedCountMap[c._id.toString()] = c.count;
      }

      const data = distributions.map((d) => {
        const claimed = claimedCountMap[d._id.toString()] ?? 0;
        const targetBarangays = getTargetBarangays(d.barangay, d.assignedBarangays ?? []);
        const registered = targetBarangays.reduce((sum, b) => sum + (countMap[b] ?? 0), 0);

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
      const scopedBarangays = await getScopedBarangays(req.authUser);
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
        isScopedRole(req.authUser?.role) && !hasDistributionAccess(scopedBarangays, distribution)
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
      const scopedBarangays = await getScopedBarangays(req.authUser);
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
        isScopedRole(req.authUser?.role) && !hasDistributionAccess(scopedBarangays, distribution)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this distribution',
        });
      }

      const targetBarangays = getTargetBarangays(
        distribution.barangay,
        distribution.assignedBarangays ?? [],
      );

      // 3) Get all approved residents (registered households) in target barangays
      const registeredHouseholds = await Resident.find({
        barangay: mongoose.trusted({ $in: targetBarangays }),
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
            barangay: distribution.barangay,
            assignedBarangays: targetBarangays,
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
          barangay: distribution.barangay,
          assignedBarangays: targetBarangays,
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
