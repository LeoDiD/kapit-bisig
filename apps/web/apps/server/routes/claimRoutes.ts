/**
 * Claim Routes  (/api/claims)
 *
 * Endpoints:
 *   POST /api/claims/record-claim   – record a relief-pack claim (validates token, writes chain + DB)
 *   GET  /api/claims/ledger         – list / filter claims for the blockchain-ledger UI
 *   POST /api/claims/:claimId/retry-chain – retry a CHAIN_FAILED claim
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import Claim, { IClaim } from '../models/Claim';
import HouseholdToken from '../models/HouseholdToken';
import Resident from '../models/Resident';
import DistributionClaim from '../models/DistributionClaim';
import Distribution from '../models/Distribution';
import { AuthRequest } from '../middleware/unifiedAuth';
import { computeHouseholdHash, computeEventHash } from '../utils/hashHelpers';
import {
  recordClaimOnChain,
  isClaimedOnChain,
} from '../services/blockchainService';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  recordClaimBody,
  ledgerQuery,
  retryChainParams,
} from '../validation/claim.schema';
import { logAudit } from '../utils/audit';

const router = Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Generate a unique claim ID: CLM-<YYYY>-<5-digit seq> */
function generateClaimId(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomInt(0, 99999).toString().padStart(5, '0');
  return `CLM-${year}-${rand}`;
}

/* ------------------------------------------------------------------ */
/*  Logging helpers (safe — no PII, tokens are masked)                  */
/* ------------------------------------------------------------------ */

/** Mask a token string: show first 4 + last 4 chars, e.g. TEST…A1B2 */
function maskToken(token: string): string {
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

/** Shorten a hex string: 0x123456…abcd12 */
function shortHex(hex: string): string {
  if (!hex) return '(none)';
  if (hex.length <= 16) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
}

/** Print a section header/footer line */
function logHeader(title: string): void {
  const line = '='.repeat(10);
  console.log(`\n${line} ${title} ${line}`);
}

/**
 * Terminal log capture:
 *   mac/linux : npm run server:dev 2>&1 | tee blockchain_logs.txt
 *   windows ps: npm run server:dev *>&1 | Tee-Object -FilePath blockchain_logs.txt
 */

/* ------------------------------------------------------------------ */
/*  POST /record-claim                                                 */
/*  Input: { claimToken, distributionId, distributionSite }            */
/* ------------------------------------------------------------------ */

router.post('/record-claim', validateRequest({ body: recordClaimBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { claimToken, distributionId, distributionSite } = req.body;

    // ── 1) Validate inputs ──
    if (!claimToken || typeof claimToken !== 'string') {
      return res.status(400).json({ success: false, message: 'claimToken is required' });
    }
    if (!distributionId || typeof distributionId !== 'string') {
      return res.status(400).json({ success: false, message: 'distributionId is required' });
    }
    if (!distributionSite || typeof distributionSite !== 'string') {
      return res.status(400).json({ success: false, message: 'distributionSite is required' });
    }

    // ── 2) Validate the household token ──
    const normalizedToken = claimToken.trim().toUpperCase();

    logHeader('RECORD CLAIM START');
    console.log(`[1] Token received: ${maskToken(normalizedToken)}`);

    // Find matching token by comparing hashes
    const candidates = await HouseholdToken.find({
      status: { $in: ['UNUSED', 'LOCKED', 'USED'] }, // USED tokens are valid households
      expiresAt: { $gt: new Date() },
    });

    let matchedToken = null;
    const bcrypt = await import('bcrypt');
    for (const token of candidates) {
      const isMatch = await bcrypt.compare(normalizedToken, token.tokenHash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      console.error(`[ERROR] Invalid or expired token: ${maskToken(normalizedToken)}`);
      logHeader('RECORD CLAIM END');
      return res.status(404).json({ success: false, message: 'Invalid or expired claim token' });
    }

    const householdInfo = matchedToken.householdInfo;
    const householdId = matchedToken._id.toString();
    const barangay = householdInfo.barangay;

    // ── 2b) Resolve Resident._id so other modules can cross-reference ──
    let residentId = '';
    try {
      const headName = householdInfo.headOfHousehold;
      const resident = await Resident.findOne({
        barangay,
        $or: [
          { fullName: headName },
          { fullName: { $regex: new RegExp(`^${headName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ],
        status: 'Approved',
      }).select('_id').lean();
      if (resident) {
        residentId = (resident._id as any).toString();
      }
    } catch (lookupErr: any) {
      console.warn('[record-claim] Resident lookup failed:', lookupErr.message);
    }

    const householdCode = residentId
      ? `HH-${barangay.slice(0, 2).toUpperCase()}-${residentId.slice(-4).toUpperCase()}`
      : `HH-${barangay.slice(0, 2).toUpperCase()}-${householdId.slice(-4).toUpperCase()}`;

    console.log(`[2] Household found: ${householdCode} | ${barangay}`);

    // ── 3) Prevent duplicate claims (DB) ──
    const existingClaim = await Claim.findOne({ householdId, distributionId });
    if (existingClaim) {
      console.error(`[ERROR] Duplicate claim blocked (DB): householdCode=${householdCode} barangay=${barangay}`);
      logHeader('RECORD CLAIM END');
      return res.status(409).json({
        success: false,
        message: 'This household has already claimed for this distribution',
        claim: existingClaim,
      });
    }

    // ── 4) Compute hashes ──
    const householdHash = computeHouseholdHash(householdId);
    const eventHash = computeEventHash(distributionId);

    console.log(`[3] Hashes computed: householdHash=${shortHex(householdHash)} eventHash=${shortHex(eventHash)}`);

    // ── 5) Prevent duplicate claims (on-chain) ──
    try {
      const alreadyClaimed = await isClaimedOnChain(householdHash);
      if (alreadyClaimed) {
        console.error(`[ERROR] Duplicate claim blocked (on-chain): householdCode=${householdCode} barangay=${barangay}`);
        logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household already has an on-chain claim record',
        });
      }
    } catch (chainErr: any) {
      // If blockchain is unreachable, log but continue (DB claim still created)
      console.warn('[record-claim] On-chain duplicate check failed:', chainErr.message);
    }

    // ── 6) Create claim in DB as PENDING_CHAIN ──
    const claimId = generateClaimId();
    const staffUserId = req.authUser?.userId || req.authUser?.sub || 'unknown';
    const staffName = req.authUser?.sub || 'Unknown Staff';

    console.log('[4] DB: creating claim…');

    const claim = new Claim({
      claimId,
      householdId,
      residentId,
      householdCode,
      barangay,
      distributionId,
      distributionSite,
      staffUserId,
      staffName,
      status: 'PENDING_CHAIN',
      blockchain: {
        householdHash,
        eventHash,
      },
    });
    await claim.save();

    await logAudit(req, 'CLAIM_RECORDED', 'Claim', claimId, {
      householdCode,
      barangay,
      distributionId,
    });

    console.log(`[4] DB: claimId=${claimId} status=PENDING_CHAIN`);

    // ── 7) Send on-chain transaction ──
    console.log('[5] CHAIN: sending tx recordClaim…');

    try {
      const receipt = await recordClaimOnChain(householdHash, eventHash);

      console.log(`[5] CHAIN: txHash=${shortHex(receipt.txHash)}`);
      console.log(`[6] CHAIN: confirmed | blockNumber=${receipt.blockNumber}`);

      // Update DB to CONFIRMED
      claim.status = 'CONFIRMED';
      claim.blockchain.txHash = receipt.txHash;
      claim.blockchain.blockNumber = receipt.blockNumber;
      claim.blockchain.staffSigner = receipt.staffSigner;
      await claim.save();

      console.log(`[7] DB: updated claim -> CONFIRMED | txHash=${shortHex(receipt.txHash)} | block=${receipt.blockNumber}`);

      // ── Sync: Upsert DistributionClaim so distribution module sees this household as claimed ──
      if (residentId) {
        try {
          await DistributionClaim.findOneAndUpdate(
            { distributionId: claim.distributionId, householdId: residentId },
            {
              distributionId: claim.distributionId,
              householdId: residentId,
              claimedAt: claim.createdAt || new Date(),
              claimedBy: { id: staffUserId, name: staffName },
              proofMethod: 'QR',
            },
            { upsert: true, new: true }
          );
          console.log(`[7] SYNC: DistributionClaim upserted for distribution`);
        } catch (syncErr: any) {
          // Non-fatal: log but don't fail the claim response
          console.warn('[record-claim] DistributionClaim sync failed:', syncErr.message);
        }
      }

      logHeader('RECORD CLAIM END');

      return res.status(201).json({
        success: true,
        message: 'Claim recorded and confirmed on-chain',
        claim,
        chain: {
          txHash: receipt.txHash,
          blockNumber: receipt.blockNumber,
        },
      });
    } catch (chainErr: any) {
      // Transaction failed — mark as CHAIN_FAILED (can retry later)
      console.error(`[ERROR] Blockchain write failed: ${chainErr.message}`);

      claim.status = 'CHAIN_FAILED';
      claim.errorMessage = chainErr.message || 'On-chain transaction failed';
      await claim.save();

      console.log(`[INFO] Claim saved as CHAIN_FAILED — claimId=${claimId} (retryable)`);
      logHeader('RECORD CLAIM END');

      return res.status(202).json({
        success: true,
        message: 'Claim saved but on-chain write failed. You can retry later.',
        claim,
        chain: null,
      });
    }
  } catch (err: any) {
    console.error('[record-claim] Error:', err);
    logHeader('RECORD CLAIM END');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /ledger?barangay=&status=&search=                              */
/*  Returns claims list for the blockchain-ledger UI                   */
/* ------------------------------------------------------------------ */

router.get('/ledger', validateRequest({ query: ledgerQuery }), async (req: AuthRequest, res: Response) => {
  try {
    const { barangay, status, search } = req.query;

    // Build filter
    const filter: Record<string, any> = {};

    // RBAC: LGU_STAFF can only see claims in their assigned barangays
    if (req.authUser?.role === 'LGU_STAFF') {
      const assigned = req.authUser.assignedBarangays ?? [];
      filter.barangay = { $in: assigned };
    }

    if (barangay && barangay !== 'All Barangays') {
      // Verify staff has access to requested barangay
      if (req.authUser?.role === 'LGU_STAFF') {
        const assigned = req.authUser.assignedBarangays ?? [];
        if (!assigned.includes(barangay as string)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to the requested barangay',
          });
        }
      }
      filter.barangay = barangay;
    }

    // Map UI status names to DB enum
    if (status && status !== 'All Status') {
      const statusMap: Record<string, string> = {
        Confirmed: 'CONFIRMED',
        Pending: 'PENDING_CHAIN',
        Failed: 'CHAIN_FAILED',
      };
      filter.status = statusMap[status as string] || status;
    }

    // Text search (barangay, householdCode, hashes, txHash)
    if (search && typeof search === 'string' && search.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { barangay: { $regex: q, $options: 'i' } },
        { householdCode: { $regex: q, $options: 'i' } },
        { 'blockchain.householdHash': { $regex: q, $options: 'i' } },
        { 'blockchain.txHash': { $regex: q, $options: 'i' } },
      ];
    }

    const claims = await Claim.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Map DB status to UI status label
    const statusLabel = (s: string) => {
      switch (s) {
        case 'CONFIRMED':
          return 'Confirmed';
        case 'PENDING_CHAIN':
          return 'Pending';
        case 'CHAIN_FAILED':
          return 'Failed';
        default:
          return s;
      }
    };

    // Transform to the shape the frontend LedgerRow expects
    const rows = claims.map((c: any) => ({
      id: c._id.toString(),
      barangay: c.barangay,
      dateTimeISO: c.createdAt,
      householdCode: c.householdCode,
      householdHash: c.blockchain?.householdHash || '',
      txHash: c.blockchain?.txHash || '',
      eventHash: c.blockchain?.eventHash || '',
      staffSigner: c.blockchain?.staffSigner || '',
      blockNumber: c.blockchain?.blockNumber || 0,
      status: statusLabel(c.status),
      offChainMatch: c.status === 'CONFIRMED'
        ? {
            householdCode: c.householdCode,
            claimId: c.claimId,
            barangay: c.barangay,
            distributionSite: c.distributionSite,
            lguStaff: c.staffName,
            verification: 'Verified' as const,
          }
        : null,
    }));

    return res.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (err: any) {
    console.error('[ledger] Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /:claimId/retry-chain                                        */
/*  Re-send a CHAIN_FAILED claim to the blockchain                     */
/* ------------------------------------------------------------------ */

router.post('/:claimId/retry-chain', validateRequest({ params: retryChainParams }), async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;

    logHeader('RETRY CHAIN START');
    console.log(`[1] Retrying claimId=${claimId}`);

    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      console.error(`[ERROR] Claim not found: ${claimId}`);
      logHeader('RETRY CHAIN END');
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.status !== 'CHAIN_FAILED') {
      console.error(`[ERROR] Cannot retry — status is ${claim.status}, expected CHAIN_FAILED`);
      logHeader('RETRY CHAIN END');
      return res.status(400).json({
        success: false,
        message: `Cannot retry — claim status is ${claim.status}, expected CHAIN_FAILED`,
      });
    }

    console.log(`[2] Claim: ${claim.householdCode} | ${claim.barangay}`);

    // Re-send on-chain transaction
    const householdHash = claim.blockchain.householdHash;
    const eventHash = claim.blockchain.eventHash;

    console.log(`[3] Hashes: householdHash=${shortHex(householdHash)} eventHash=${shortHex(eventHash)}`);

    // Check if it was already written on-chain (e.g. previous tx mined late)
    try {
      const alreadyClaimed = await isClaimedOnChain(householdHash);
      if (alreadyClaimed) {
        console.log('[4] CHAIN: already confirmed on-chain (late mining). Updating DB…');

        // It went through after all — just update DB
        claim.status = 'CONFIRMED';
        claim.errorMessage = '';
        await claim.save();

        console.log(`[5] DB: updated claim -> CONFIRMED`);

        // ── Sync: Upsert DistributionClaim ──
        if (claim.residentId) {
          try {
            await DistributionClaim.findOneAndUpdate(
              { distributionId: claim.distributionId, householdId: claim.residentId },
              {
                distributionId: claim.distributionId,
                householdId: claim.residentId,
                claimedAt: claim.createdAt || new Date(),
                claimedBy: { id: claim.staffUserId, name: claim.staffName },
                proofMethod: 'QR',
              },
              { upsert: true, new: true }
            );
            console.log(`[5] SYNC: DistributionClaim upserted for distribution`);
          } catch (syncErr: any) {
            console.warn('[retry-chain] DistributionClaim sync failed:', syncErr.message);
          }
        }

        logHeader('RETRY CHAIN END');

        return res.json({
          success: true,
          message: 'Claim was already confirmed on-chain. DB updated.',
          claim,
        });
      }
    } catch {
      // Ignore check failure, attempt the write anyway
    }

    console.log('[4] CHAIN: sending tx recordClaim…');

    try {
      const receipt = await recordClaimOnChain(householdHash, eventHash);

      console.log(`[4] CHAIN: txHash=${shortHex(receipt.txHash)}`);
      console.log(`[5] CHAIN: confirmed | blockNumber=${receipt.blockNumber}`);

      claim.status = 'CONFIRMED';
      claim.blockchain.txHash = receipt.txHash;
      claim.blockchain.blockNumber = receipt.blockNumber;
      claim.blockchain.staffSigner = receipt.staffSigner;
      claim.errorMessage = '';
      await claim.save();

      console.log(`[6] DB: updated claim -> CONFIRMED | txHash=${shortHex(receipt.txHash)} | block=${receipt.blockNumber}`);

      // ── Sync: Upsert DistributionClaim so distribution module sees this household as claimed ──
      if (claim.residentId) {
        try {
          await DistributionClaim.findOneAndUpdate(
            { distributionId: claim.distributionId, householdId: claim.residentId },
            {
              distributionId: claim.distributionId,
              householdId: claim.residentId,
              claimedAt: claim.createdAt || new Date(),
              claimedBy: { id: claim.staffUserId, name: claim.staffName },
              proofMethod: 'QR',
            },
            { upsert: true, new: true }
          );
          console.log(`[6] SYNC: DistributionClaim upserted for distribution`);
        } catch (syncErr: any) {
          console.warn('[retry-chain] DistributionClaim sync failed:', syncErr.message);
        }
      }

      logHeader('RETRY CHAIN END');

      return res.json({
        success: true,
        message: 'Claim retried and confirmed on-chain',
        claim,
        chain: {
          txHash: receipt.txHash,
          blockNumber: receipt.blockNumber,
        },
      });
    } catch (chainErr: any) {
      console.error(`[ERROR] Blockchain retry failed: ${chainErr.message}`);

      claim.errorMessage = chainErr.message || 'Retry failed';
      await claim.save();

      console.log(`[INFO] Claim remains CHAIN_FAILED — claimId=${claimId} (retryable)`);
      logHeader('RETRY CHAIN END');

      return res.status(502).json({
        success: false,
        message: 'On-chain retry failed',
        error: chainErr.message,
      });
    }
  } catch (err: any) {
    console.error('[retry-chain] Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
