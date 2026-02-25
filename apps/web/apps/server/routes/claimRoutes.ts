/**
 * Claim Routes (/api/claims)
 *
 * Endpoints:
 * - POST /api/claims/record-claim
 * - GET  /api/claims/ledger
 * - POST /api/claims/:claimId/retry-chain
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Claim from '../models/Claim';
import HouseholdToken from '../models/HouseholdToken';
import Resident from '../models/Resident';
import DistributionClaim from '../models/DistributionClaim';
import { AuthRequest } from '../middleware/unifiedAuth';
import { computeHouseholdHash, computeEventHash } from '../utils/hashHelpers';
import { submitClaimOnChain, isClaimedOnChain } from '../services/blockchainService';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  recordClaimBody,
  ledgerQuery,
  retryChainParams,
} from '../validation/claim.schema';
import { logAudit } from '../utils/audit';
import { broadcastNotification } from '../utils/createNotification';

const router = Router();

function generateClaimId(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomInt(0, 99999).toString().padStart(5, '0');
  return `CLM-${year}-${rand}`;
}

function maskToken(token: string): string {
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function shortHex(hex: string): string {
  if (!hex) return '(none)';
  if (hex.length <= 16) return hex;
  return `${hex.slice(0, 8)}...${hex.slice(-6)}`;
}

function isSupportedClaimTokenFormat(token: string): boolean {
  // [RISK-5 MITIGATION] Support both seeded claim tokens and generated household tokens.
  return (
    /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token) ||
    /^CLM-[A-Z]{2}-\d{4}-\d{4}$/.test(token)
  );
}

function tokenPrefixFromValue(token: string): string {
  return token.replace(/-/g, '').slice(0, 4).toUpperCase();
}

function logHeader(title: string): void {
  const line = '='.repeat(10);
  console.log(`\n${line} ${title} ${line}`);
}

async function upsertDistributionClaim(claim: any): Promise<void> {
  if (!claim?.residentId) return;

  await DistributionClaim.findOneAndUpdate(
    { distributionId: claim.distributionId, householdId: claim.residentId },
    {
      distributionId: claim.distributionId,
      householdId: claim.residentId,
      claimedAt: claim.createdAt || new Date(),
      claimedBy: { id: claim.staffUserId, name: claim.staffName },
      proofMethod: 'QR',
    },
    { upsert: true, new: true },
  );
}

router.post(
  '/record-claim',
  validateRequest({ body: recordClaimBody }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { claimToken, distributionId, distributionSite } = req.body;

      if (!claimToken || typeof claimToken !== 'string') {
        return res.status(400).json({ success: false, message: 'claimToken is required' });
      }
      if (!distributionId || typeof distributionId !== 'string') {
        return res.status(400).json({ success: false, message: 'distributionId is required' });
      }
      if (!distributionSite || typeof distributionSite !== 'string') {
        return res.status(400).json({ success: false, message: 'distributionSite is required' });
      }

      const normalizedToken = claimToken.trim().toUpperCase();
      logHeader('RECORD CLAIM START');
      console.log(`[1] Token received: ${maskToken(normalizedToken)}`);

      if (!isSupportedClaimTokenFormat(normalizedToken)) {
        logHeader('RECORD CLAIM END');
        return res.status(400).json({
          success: false,
          message: 'Invalid claim token format',
        });
      }

      const tokenPrefix = tokenPrefixFromValue(normalizedToken);

      const candidates = await HouseholdToken.find({
        // [RISK-5 MITIGATION] Accept active claim tokens, then enforce approved household mapping below.
        status: mongoose.trusted({ $in: ['USED', 'UNUSED'] }),
        tokenPrefix,
        expiresAt: mongoose.trusted({ $gt: new Date() }),
      }).setOptions({ sanitizeFilter: false });

      let matchedToken: any = null;
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
      const barangay = householdInfo.barangay;
      const residentRefId = matchedToken?.usedBy?.residentId
        ? String(matchedToken.usedBy.residentId)
        : '';
      const residentQuery: Record<string, any> = {
        status: 'Approved',
      };

      if (residentRefId) {
        // [RISK-5 MITIGATION] Preferred path: token already linked to approved resident at registration.
        residentQuery._id = residentRefId;
      } else if (matchedToken.householdCode) {
        // [RISK-5 MITIGATION] Backward-compatible path for seeded CLM tokens with household mapping.
        residentQuery.householdCode = matchedToken.householdCode;
        residentQuery.barangay = barangay;
      } else {
        logHeader('RECORD CLAIM END');
        return res.status(403).json({
          success: false,
          message: 'Claim token is not linked to a verified household record',
        });
      }

      const resident = await Resident.findOne(residentQuery)
        .setOptions({ sanitizeFilter: false })
        .select('_id barangay residentCode fullName')
        .lean();

      if (!resident) {
        logHeader('RECORD CLAIM END');
        return res.status(403).json({
          success: false,
          message: 'No approved household record found for this claim token',
        });
      }

      const residentId = String((resident as any)._id);
      if ((resident as any).barangay !== barangay) {
        logHeader('RECORD CLAIM END');
        return res.status(403).json({
          success: false,
          message: 'Claim token and resident barangay do not match',
        });
      }

      const householdCode =
        matchedToken.householdCode ||
        String((resident as any).residentCode || '') ||
        `HH-${barangay.slice(0, 2).toUpperCase()}-${residentId.slice(-4).toUpperCase()}`;
      // [RISK-5 MITIGATION] Household identity for hashing must be stable per resident, not per token doc.
      const householdId = residentId;

      console.log(`[2] Household found: ${householdCode} | ${barangay}`);

      const existingClaim = await Claim.findOne({ householdId, distributionId });
      if (existingClaim) {
        console.error(
          `[ERROR] Duplicate claim blocked (DB): householdCode=${householdCode} barangay=${barangay}`,
        );
        logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household has already claimed for this distribution',
          claim: existingClaim,
        });
      }

      const householdHash = computeHouseholdHash(householdId);
      const eventHash = computeEventHash(distributionId);
      console.log(
        `[3] Hashes computed: householdHash=${shortHex(householdHash)} eventHash=${shortHex(eventHash)}`,
      );

      const existingHouseholdHashClaim = await Claim.findOne({
        'blockchain.householdHash': householdHash,
      });
      if (existingHouseholdHashClaim) {
        // [RISK-5 MITIGATION] Off-chain guard mirrors one-claim-per-householdHash policy.
        logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household already has a claim record',
        });
      }

      try {
        const alreadyClaimed = await isClaimedOnChain(householdHash);
        if (alreadyClaimed) {
          console.error(
            `[ERROR] Duplicate claim blocked (on-chain): householdCode=${householdCode} barangay=${barangay}`,
          );
          logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household already has an on-chain claim record',
        });
      }
      } catch (chainErr: any) {
        // Keep behavior: don't block claim creation if chain read is temporarily unavailable.
        console.warn('[record-claim] On-chain duplicate check failed:', chainErr.message);
      }

      const claimId = generateClaimId();
      const staffUserId = req.authUser?.userId || req.authUser?.sub || 'unknown';
      const staffName = req.authUser?.sub || 'Unknown Staff';

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

      if (matchedToken.status === 'UNUSED') {
        // [RISK-5 MITIGATION] Consume seeded/legacy claim token after first valid use.
        matchedToken.status = 'USED';
        matchedToken.usedAt = new Date();
        matchedToken.usedBy = {
          residentId: new mongoose.Types.ObjectId(residentId),
          ipAddress: matchedToken?.usedBy?.ipAddress || null,
          userAgent: matchedToken?.usedBy?.userAgent || null,
        };
        await matchedToken.save();
      }

      await logAudit(req, 'CLAIM_RECORDED', 'Claim', claimId, {
        householdCode,
        barangay,
        distributionId,
      });

      console.log(`[4] DB: claimId=${claimId} status=PENDING_CHAIN`);
      console.log('[5] CHAIN: submitting tx recordClaim...');

      try {
        const submitted = await submitClaimOnChain(householdHash, eventHash);
        claim.status = 'CHAIN_SUBMITTED';
        claim.blockchain.txHash = submitted.txHash;
        claim.blockchain.chainId = submitted.chainId;
        claim.blockchain.contractAddress = submitted.contractAddress;
        claim.blockchain.staffSigner = submitted.staffSigner;
        claim.errorMessage = '';
        await claim.save();

        console.log(
          `[6] DB: updated claim -> CHAIN_SUBMITTED | txHash=${shortHex(submitted.txHash)}`,
        );
        logHeader('RECORD CLAIM END');

        broadcastNotification({
          title: 'Claim Submitted',
          message: `Relief claim submitted on-chain for household ${householdCode} in ${barangay}.`,
          type: 'dispatch',
          meta: { claimId, householdCode, barangay, distributionId, txHash: submitted.txHash },
        });

        return res.status(202).json({
          success: true,
          message: 'Claim submitted. Awaiting confirmations.',
          claimId,
          txHash: submitted.txHash,
          chainId: submitted.chainId,
          contractAddress: submitted.contractAddress,
          claim,
        });
      } catch (chainErr: any) {
        console.error(`[ERROR] Blockchain submission failed: ${chainErr.message}`);

        claim.status = 'CHAIN_FAILED';
        claim.errorMessage = chainErr.message || 'On-chain transaction submission failed';
        await claim.save();

        console.log(`[INFO] Claim saved as CHAIN_FAILED - claimId=${claimId}`);
        logHeader('RECORD CLAIM END');

        return res.status(502).json({
          success: false,
          message: 'On-chain submission failed',
          claimId,
          claim,
        });
      }
    } catch (err: any) {
      console.error('[record-claim] Error:', err?.message || 'unknown');
      logHeader('RECORD CLAIM END');
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

router.get(
  '/ledger',
  validateRequest({ query: ledgerQuery }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { barangay, status, search } = req.query;
      const filter: Record<string, any> = {};

      if (req.authUser?.role === 'LGU_STAFF') {
        const assigned = req.authUser.assignedBarangays ?? [];
        filter.barangay = mongoose.trusted({ $in: assigned });
      }

      if (barangay && barangay !== 'All Barangays') {
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

      if (status && status !== 'All Status') {
        const statusMap: Record<string, string | string[]> = {
          Confirmed: 'CONFIRMED',
          Pending: ['PENDING_CHAIN', 'CHAIN_SUBMITTED'],
          'Pending/Confirming': ['PENDING_CHAIN', 'CHAIN_SUBMITTED'],
          Failed: 'CHAIN_FAILED',
          'Chain Failed': 'CHAIN_FAILED',
        };
        const mapped = statusMap[status as string] || status;
        filter.status = Array.isArray(mapped)
          ? mongoose.trusted({ $in: mapped })
          : mapped;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = escapeRegex(search.trim());
        filter.$or = mongoose.trusted([
          { barangay: { $regex: q, $options: 'i' } },
          { householdCode: { $regex: q, $options: 'i' } },
          { 'blockchain.householdHash': { $regex: q, $options: 'i' } },
          { 'blockchain.txHash': { $regex: q, $options: 'i' } },
        ]);
      }

      const claims = await Claim.find(filter)
        .setOptions({ sanitizeFilter: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const statusLabel = (s: string) => {
        switch (s) {
          case 'CONFIRMED':
            return 'Confirmed';
          case 'PENDING_CHAIN':
          case 'CHAIN_SUBMITTED':
            return 'Pending/Confirming';
          case 'CHAIN_FAILED':
            return 'Chain Failed';
          default:
            return s;
        }
      };

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
        chainId: c.blockchain?.chainId || 0,
        contractAddress: c.blockchain?.contractAddress || '',
        status: statusLabel(c.status),
        offChainMatch:
          c.status === 'CONFIRMED'
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
      console.error('[ledger] Error:', err?.message || 'unknown');
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

router.post(
  '/:claimId/retry-chain',
  validateRequest({ params: retryChainParams }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { claimId } = req.params;
      logHeader('RETRY CHAIN START');
      console.log(`[1] Retrying claimId=${claimId}`);

      const claim = await Claim.findOne({ claimId });
      if (!claim) {
        logHeader('RETRY CHAIN END');
        return res.status(404).json({ success: false, message: 'Claim not found' });
      }

      if (claim.status !== 'CHAIN_FAILED') {
        logHeader('RETRY CHAIN END');
        return res.status(400).json({
          success: false,
          message: `Cannot retry - claim status is ${claim.status}, expected CHAIN_FAILED`,
        });
      }

      const householdHash = claim.blockchain.householdHash;
      const eventHash = claim.blockchain.eventHash;
      console.log(
        `[2] Hashes: householdHash=${shortHex(householdHash)} eventHash=${shortHex(eventHash)}`,
      );

      try {
        const alreadyClaimed = await isClaimedOnChain(householdHash);
        if (alreadyClaimed) {
          claim.status = 'CONFIRMED';
          claim.errorMessage = '';
          await claim.save();

          try {
            await upsertDistributionClaim(claim);
          } catch (syncErr: any) {
            console.warn('[retry-chain] DistributionClaim sync failed:', syncErr.message);
          }

          logHeader('RETRY CHAIN END');
          return res.json({
            success: true,
            message: 'Claim was already confirmed on-chain. DB updated.',
            claim,
          });
        }
      } catch {
        // Keep retry flow robust: if duplicate-check read fails, still attempt submit.
      }

      try {
        const submitted = await submitClaimOnChain(householdHash, eventHash);

        claim.status = 'CHAIN_SUBMITTED';
        claim.blockchain.txHash = submitted.txHash;
        claim.blockchain.chainId = submitted.chainId;
        claim.blockchain.contractAddress = submitted.contractAddress;
        claim.blockchain.staffSigner = submitted.staffSigner;
        claim.errorMessage = '';
        await claim.save();

        logHeader('RETRY CHAIN END');
        return res.status(202).json({
          success: true,
          message: 'Claim retry submitted. Awaiting confirmations.',
          claimId,
          txHash: submitted.txHash,
          chainId: submitted.chainId,
          contractAddress: submitted.contractAddress,
          claim,
        });
      } catch (chainErr: any) {
        claim.errorMessage = chainErr.message || 'Retry failed';
        await claim.save();

        logHeader('RETRY CHAIN END');
        return res.status(502).json({
          success: false,
          message: 'On-chain retry failed',
          error: chainErr.message,
        });
      }
    } catch (err: any) {
      console.error('[retry-chain] Error:', err?.message || 'unknown');
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
