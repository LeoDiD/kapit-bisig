/**
 * Household List Routes
 *
 * GET /api/households – returns registered households (from the `residents`
 * collection) with optional search, barangay, and status filters.
 *
 * Each row is a "registered household" represented by a Resident document.
 * The claim status is derived by cross-referencing the Claims collection.
 */

import { Router, Request, Response } from 'express';
import Resident from '../models/Resident';
import Claim from '../models/Claim';
import { AuthRequest } from '../middleware/unifiedAuth';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import { listHouseholdsQuery } from '../validation/householdList.schema';

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/households                                                */
/* ------------------------------------------------------------------ */

router.get('/', validateRequest({ query: listHouseholdsQuery }), async (req: AuthRequest, res: Response) => {
  try {
    const { search, barangay, status } = req.query as {
      search?: string;
      barangay?: string;
      status?: string; // "Claimed" | "Not Claimed"
    };

    // Build MongoDB filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // RBAC: LGU_STAFF can only see their assigned barangays
    if (req.authUser?.role === 'LGU_STAFF') {
      const assigned = req.authUser.assignedBarangays ?? [];
      filter.barangay = { $in: assigned };
    }

    if (barangay && barangay !== 'All Barangays') {
      // If staff, ensure the requested barangay is within their scope
      if (req.authUser?.role === 'LGU_STAFF') {
        const assigned = req.authUser.assignedBarangays ?? [];
        if (!assigned.includes(barangay)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to the requested barangay',
          });
        }
      }
      filter.barangay = barangay;
    }

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { fullName: re },
        { firstName: re },
        { lastName: re },
        { barangay: re },
        { streetAddress: re },
        { mobileNumber: re },
      ];
    }

    // ── Pagination ──────────────────────────────────────────────
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const rawLimit = parseInt(req.query.limit as string, 10) || 50;
    const limit = Math.min(rawLimit, 50);   // hard cap
    const skip = (page - 1) * limit;

    // Fetch residents (exclude heavy fields like images)
    const total = await Resident.countDocuments(filter);
    const residents = await Resident.find(filter)
      .select(
        'firstName lastName fullName barangay streetAddress city householdSize ' +
        'mobileNumber status verification.overallConfidence verification.isVerified ' +
        'verification.aiVerificationStatus createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Build a Set of resident IDs that have at least one CONFIRMED claim
    const residentIds = residents.map((r) => r._id.toString());
    const confirmedClaims = await Claim.find({
      residentId: { $in: residentIds },
      status: 'CONFIRMED',
    })
      .select('residentId createdAt updatedAt')
      .lean();

    const claimedMap = new Map<string, number>();
    for (const c of confirmedClaims) {
      const ridRaw = (c as any).residentId;
      const rid =
        typeof ridRaw === 'string'
          ? ridRaw
          : ridRaw && typeof ridRaw.toString === 'function'
            ? ridRaw.toString()
            : null;
      if (!rid) continue;

      const rawDate = c.createdAt || c.updatedAt;
      if (!rawDate) {
        if (!claimedMap.has(rid)) claimedMap.set(rid, 0);
        continue;
      }

      const cDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
      const cTime = cDate.getTime();
      if (Number.isNaN(cTime)) {
        if (!claimedMap.has(rid)) claimedMap.set(rid, 0);
        continue;
      }

      const existing = claimedMap.get(rid);
      if (existing === undefined || cTime > existing) {
        claimedMap.set(rid, cTime);
      }
    }

    // Build response rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let households = residents.map((r: any) => {
      const id = r._id.toString();
      const claimTime = claimedMap.get(id);
      const hasClaim = claimTime !== undefined;
      return {
        id,
        householdCode: `HH-${r.barangay?.substring(0, 2).toUpperCase() || 'XX'}-${id.slice(-4).toUpperCase()}`,
        familyHeadName: r.fullName || `${r.firstName} ${r.lastName}`,
        barangay: r.barangay || '—',
        address: r.streetAddress || '—',
        familyMembersCount: r.householdSize || 1,
        contact: r.mobileNumber || '—',
        verificationStatus: r.verification?.aiVerificationStatus || '—',
        verificationScore: r.verification?.overallConfidence ?? null,
        claimStatus: hasClaim ? 'Claimed' as const : 'Not Claimed' as const,
        lastClaimedAt: typeof claimTime === 'number' && claimTime > 0 ? new Date(claimTime).toISOString() : null,
        registeredAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      };
    });

    // Client-requested status filter
    if (status === 'Claimed') {
      households = households.filter((h) => h.claimStatus === 'Claimed');
    } else if (status === 'Not Claimed') {
      households = households.filter((h) => h.claimStatus === 'Not Claimed');
    }

    return res.json({
      success: true,
      data: households,
      total: households.length,
      pagination: {
        page,
        limit,
        totalDocs: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/households error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch households',
    });
  }
});

export default router;
