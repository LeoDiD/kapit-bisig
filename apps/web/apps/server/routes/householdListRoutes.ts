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

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/households                                                */
/* ------------------------------------------------------------------ */

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, barangay, status } = req.query as {
      search?: string;
      barangay?: string;
      status?: string; // "Claimed" | "Not Claimed"
    };

    // Build MongoDB filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (barangay && barangay !== 'All Barangays') {
      filter.barangay = barangay;
    }

    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [
        { fullName: re },
        { firstName: re },
        { lastName: re },
        { barangay: re },
        { streetAddress: re },
        { mobileNumber: re },
      ];
    }

    // Fetch residents (exclude heavy fields like images)
    const residents = await Resident.find(filter)
      .select(
        'firstName lastName fullName barangay streetAddress city householdSize ' +
        'mobileNumber status verification.overallConfidence verification.isVerified ' +
        'verification.aiVerificationStatus createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .lean();

    // Build a Set of resident IDs that have at least one CONFIRMED claim
    const residentIds = residents.map((r) => r._id.toString());
    const confirmedClaims = await Claim.find({
      residentId: { $in: residentIds },
      status: 'CONFIRMED',
    })
      .select('residentId createdAt updatedAt')
      .lean();

    const claimedMap = new Map<string, Date>();
    for (const c of confirmedClaims) {
      const rid = (c as any).residentId;
      if (!rid) continue;
      const cDate = (c.createdAt || c.updatedAt) as Date;
      const existing = claimedMap.get(rid);
      if (!existing || cDate > existing) {
        claimedMap.set(rid, cDate);
      }
    }

    // Build response rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let households = residents.map((r: any) => {
      const id = r._id.toString();
      const hasClaim = claimedMap.has(id);
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
        lastClaimedAt: hasClaim ? claimedMap.get(id)!.toISOString() : null,
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
