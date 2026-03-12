/**
 * Claim Routes (/api/claims)
 *
 * Endpoints:
 * - POST /api/claims/record-claim
 * - POST /api/claims/record-claim-batch
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
import Distribution from '../models/Distribution';
import { AuthRequest } from '../middleware/unifiedAuth';
import { computeHouseholdHash, computeEventHash } from '../utils/hashHelpers';
import {
  submitClaimOnChain,
  submitClaimsBatchOnChain,
  isClaimedOnChain,
} from '../services/blockchainService';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  recordClaimBody,
  recordClaimBatchBody,
  ledgerQuery,
  retryChainParams,
} from '../validation/claim.schema';
import { logAudit } from '../utils/audit';
import { broadcastScopedNotification } from '../utils/createNotification';

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

function tokenLinkageScore(token: any): number {
  let score = 0;
  if (token?.usedBy?.residentId) score += 4;
  if (String(token?.householdCode || '').trim()) score += 3;
  if (String(token?.householdInfo?.barangay || '').trim()) score += 2;
  if (token?.status === 'UNUSED') score += 1;
  if (token?.seeded) score += 1;
  return score;
}

function selectBestMatchedToken(matches: any[]): any | null {
  if (!Array.isArray(matches) || matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const ranked = [...matches].sort((a, b) => {
    const scoreDiff = tokenLinkageScore(b) - tokenLinkageScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const aTs = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const bTs = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return bTs - aTs;
  });

  return ranked[0];
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

interface PreparedClaimDraft {
  normalizedToken: string;
  matchedToken: any;
  residentId: string;
  householdId: string;
  householdCode: string;
  barangay: string;
  householdHash: string;
  eventHash: string;
}

type ClaimPreparationResult =
  | { ok: true; data: PreparedClaimDraft }
  | { ok: false; status: number; message: string; claim?: any };

type BatchResultStatus = 'SUBMITTED' | 'FAILED';

interface BatchClaimResultItem {
  token: string;
  status: BatchResultStatus;
  message: string;
  claimId?: string;
}

let _bcryptModulePromise: Promise<typeof import('bcrypt')> | null = null;

async function getBcryptModule(): Promise<typeof import('bcrypt')> {
  if (!_bcryptModulePromise) {
    _bcryptModulePromise = import('bcrypt');
  }
  return _bcryptModulePromise;
}

async function consumeMatchedToken(matchedToken: any, residentId: string): Promise<void> {
  if (matchedToken.status !== 'UNUSED') return;

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

async function prepareClaimDraft(
  normalizedToken: string,
  distributionId: string,
  expectedDistributionBarangay?: string,
): Promise<ClaimPreparationResult> {
  if (!isSupportedClaimTokenFormat(normalizedToken)) {
    return {
      ok: false,
      status: 400,
      message: 'Invalid claim token format',
    };
  }

  const tokenPrefix = tokenPrefixFromValue(normalizedToken);
  const candidates = await HouseholdToken.find({
    // [RISK-5 MITIGATION] Accept active claim tokens, then enforce approved household mapping below.
    status: mongoose.trusted({ $in: ['USED', 'UNUSED'] }),
    tokenPrefix,
    expiresAt: mongoose.trusted({ $gt: new Date() }),
  }).setOptions({ sanitizeFilter: false });

  const bcrypt = await getBcryptModule();
  const matchedCandidates: any[] = [];
  for (const token of candidates) {
    const isMatch = await bcrypt.compare(normalizedToken, token.tokenHash);
    if (isMatch) {
      matchedCandidates.push(token);
    }
  }
  const matchedToken = selectBestMatchedToken(matchedCandidates);

  if (!matchedToken) {
    return {
      ok: false,
      status: 404,
      message: 'Invalid or expired claim token',
    };
  }

  const householdInfo = matchedToken.householdInfo || {};
  const tokenBarangay = String(householdInfo.barangay || '').trim();
  const tokenHouseholdCode = String(matchedToken.householdCode || '').trim();

  const residentRefId = matchedToken?.usedBy?.residentId
    ? String(matchedToken.usedBy.residentId)
    : '';
  if (!residentRefId && !tokenHouseholdCode) {
    return {
      ok: false,
      status: 403,
      message: 'Claim token is not linked to a verified household record',
    };
  }

  const residentQuery: Record<string, any> = { status: 'Approved' };

  if (residentRefId) {
    // [RISK-5 MITIGATION] Preferred path: token already linked to approved resident at registration.
    residentQuery._id = residentRefId;
  } else if (tokenHouseholdCode) {
    // [RISK-5 MITIGATION] Backward-compatible path for seeded CLM tokens with household mapping.
    residentQuery.householdCode = tokenHouseholdCode;
    // Legacy-safe fallback: allow lookup by householdCode even if token barangay metadata is missing.
    if (tokenBarangay) {
      residentQuery.barangay = tokenBarangay;
    }
  } else {
    return {
      ok: false,
      status: 403,
      message: 'Claim token is not linked to a verified household record',
    };
  }

  const resident = await Resident.findOne(residentQuery)
    .setOptions({ sanitizeFilter: false })
    .select('_id barangay residentCode fullName')
    .lean();

  if (!resident) {
    return {
      ok: false,
      status: 403,
      message: 'No approved household record found for this claim token',
    };
  }

  const residentAny = resident as any;
  const residentId = String(residentAny._id);
  const residentBarangay = String(residentAny.barangay || '').trim();
  const barangay = tokenBarangay || residentBarangay;
  if (!barangay) {
    return {
      ok: false,
      status: 403,
      message: 'Claim token is not linked to a verified household record',
    };
  }
  if (tokenBarangay && residentBarangay && residentBarangay !== tokenBarangay) {
    return {
      ok: false,
      status: 403,
      message: 'Claim token and resident barangay do not match',
    };
  }

  if (
    expectedDistributionBarangay &&
    String(expectedDistributionBarangay).trim().toLowerCase() !== barangay.trim().toLowerCase()
  ) {
    return {
      ok: false,
      status: 409,
      message: `Token barangay (${barangay}) does not match selected distribution (${expectedDistributionBarangay})`,
    };
  }

  const householdCode =
    tokenHouseholdCode ||
    String(residentAny.residentCode || '') ||
    `HH-${barangay.slice(0, 2).toUpperCase()}-${residentId.slice(-4).toUpperCase()}`;
  // [RISK-5 MITIGATION] Household identity for hashing must be stable per resident, not per token doc.
  const householdId = residentId;

  const existingClaim = await Claim.findOne({ householdId, distributionId });
  if (existingClaim) {
    return {
      ok: false,
      status: 409,
      message: 'This household has already claimed for this distribution',
      claim: existingClaim,
    };
  }

  const householdHash = computeHouseholdHash(householdId);
  const eventHash = computeEventHash(distributionId);

  const existingHouseholdHashClaim = await Claim.findOne({
    distributionId,
    'blockchain.householdHash': householdHash,
  });
  if (existingHouseholdHashClaim) {
    // [RISK-5 MITIGATION] Off-chain guard mirrors one-claim-per-household-per-distribution policy.
    return {
      ok: false,
      status: 409,
      message: 'This household has already claimed for this distribution',
    };
  }

  try {
    const alreadyClaimed = await isClaimedOnChain(householdHash, eventHash);
    if (alreadyClaimed) {
      return {
        ok: false,
        status: 409,
        message: 'This household already has an on-chain claim for this distribution',
      };
    }
  } catch (chainErr: any) {
    // Keep behavior: don't block claim creation if chain read is temporarily unavailable.
    console.warn('[prepare-claim-draft] On-chain duplicate check failed:', chainErr.message);
  }

  return {
    ok: true,
    data: {
      normalizedToken,
      matchedToken,
      residentId,
      householdId,
      householdCode,
      barangay,
      householdHash,
      eventHash,
    },
  };
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

      const distributionDoc = await Distribution.findById(distributionId)
        .setOptions({ sanitizeFilter: false })
        .select('_id barangay')
        .lean();
      if (!distributionDoc) {
        return res.status(404).json({ success: false, message: 'Distribution not found' });
      }
      const selectedDistributionBarangay = String((distributionDoc as any).barangay || '').trim();

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

      const matchedCandidates: any[] = [];
      const bcrypt = await import('bcrypt');
      for (const token of candidates) {
        const isMatch = await bcrypt.compare(normalizedToken, token.tokenHash);
        if (isMatch) {
          matchedCandidates.push(token);
        }
      }
      const matchedToken = selectBestMatchedToken(matchedCandidates);

      if (!matchedToken) {
        console.error(`[ERROR] Invalid or expired token: ${maskToken(normalizedToken)}`);
        logHeader('RECORD CLAIM END');
        return res.status(404).json({ success: false, message: 'Invalid or expired claim token' });
      }

      const householdInfo = matchedToken.householdInfo || {};
      const tokenBarangay = String(householdInfo.barangay || '').trim();
      const tokenHouseholdCode = String(matchedToken.householdCode || '').trim();
      const residentRefId = matchedToken?.usedBy?.residentId
        ? String(matchedToken.usedBy.residentId)
        : '';
      if (!residentRefId && !tokenHouseholdCode) {
        logHeader('RECORD CLAIM END');
        return res.status(403).json({
          success: false,
          message: 'Claim token is not linked to a verified household record',
        });
      }

      const residentQuery: Record<string, any> = {
        status: 'Approved',
      };

      if (residentRefId) {
        // [RISK-5 MITIGATION] Preferred path: token already linked to approved resident at registration.
        residentQuery._id = residentRefId;
      } else if (tokenHouseholdCode) {
        // [RISK-5 MITIGATION] Backward-compatible path for seeded CLM tokens with household mapping.
        residentQuery.householdCode = tokenHouseholdCode;
        // Legacy-safe fallback: allow lookup by householdCode even if token barangay metadata is missing.
        if (tokenBarangay) {
          residentQuery.barangay = tokenBarangay;
        }
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
      const residentBarangay = String((resident as any).barangay || '').trim();
      const barangay = tokenBarangay || residentBarangay;
      if (!barangay) {
        logHeader('RECORD CLAIM END');
        return res.status(403).json({
          success: false,
          message: 'Claim token is not linked to a verified household record',
        });
      }
      if (tokenBarangay && residentBarangay && residentBarangay !== tokenBarangay) {
        logHeader('RECORD CLAIM END');
        return res.status(403).json({
          success: false,
          message: 'Claim token and resident barangay do not match',
        });
      }
      if (
        selectedDistributionBarangay &&
        selectedDistributionBarangay.toLowerCase() !== String(barangay).trim().toLowerCase()
      ) {
        logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: `Token barangay (${barangay}) does not match selected distribution (${selectedDistributionBarangay})`,
        });
      }

      const householdCode =
        tokenHouseholdCode ||
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
        distributionId,
        'blockchain.householdHash': householdHash,
      });
      if (existingHouseholdHashClaim) {
        // [RISK-5 MITIGATION] Off-chain guard mirrors one-claim-per-household-per-distribution policy.
        logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household has already claimed for this distribution',
        });
      }

      try {
        const alreadyClaimed = await isClaimedOnChain(householdHash, eventHash);
        if (alreadyClaimed) {
          console.error(
            `[ERROR] Duplicate claim blocked (on-chain): householdCode=${householdCode} barangay=${barangay}`,
          );
          logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household already has an on-chain claim for this distribution',
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

      await consumeMatchedToken(matchedToken, residentId);

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

        broadcastScopedNotification({
          title: 'Claim Submitted',
          message: `Relief claim submitted on-chain for household ${householdCode} in ${barangay}.`,
          type: 'dispatch',
          meta: { claimId, householdCode, barangay, distributionId, txHash: submitted.txHash },
          targetBarangays: [barangay],
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

router.post(
  '/record-claim-batch',
  validateRequest({ body: recordClaimBatchBody }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { claimTokens, distributionId, distributionSite } = req.body as {
        claimTokens: string[];
        distributionId: string;
        distributionSite: string;
      };

      const distributionDoc = await Distribution.findById(distributionId)
        .setOptions({ sanitizeFilter: false })
        .select('_id barangay')
        .lean();
      if (!distributionDoc) {
        logHeader('RECORD CLAIM BATCH END');
        return res.status(404).json({ success: false, message: 'Distribution not found' });
      }
      const selectedDistributionBarangay = String((distributionDoc as any).barangay || '').trim();

      const normalizedTokens = claimTokens
        .map((token) => token.trim().toUpperCase())
        .filter((token) => token.length > 0);

      logHeader('RECORD CLAIM BATCH START');
      console.log(
        `[batch] received ${normalizedTokens.length} token(s) for distributionId=${distributionId}`,
      );

      if (normalizedTokens.length === 0) {
        logHeader('RECORD CLAIM BATCH END');
        return res.status(400).json({
          success: false,
          message: 'At least one claim token is required',
        });
      }

      const seenTokens = new Set<string>();
      const seenHouseholdHashes = new Set<string>();
      const failures: BatchClaimResultItem[] = [];
      const preparedDrafts: PreparedClaimDraft[] = [];

      for (const token of normalizedTokens) {
        if (seenTokens.has(token)) {
          failures.push({
            token: maskToken(token),
            status: 'FAILED',
            message: 'Duplicate token in the same request payload',
          });
          continue;
        }
        seenTokens.add(token);

        const prepared = await prepareClaimDraft(
          token,
          distributionId,
          selectedDistributionBarangay,
        );
        if (!prepared.ok) {
          failures.push({
            token: maskToken(token),
            status: 'FAILED',
            message: prepared.message,
          });
          continue;
        }

        if (seenHouseholdHashes.has(prepared.data.householdHash)) {
          failures.push({
            token: maskToken(token),
            status: 'FAILED',
            message: 'Duplicate household detected in this batch payload',
          });
          continue;
        }

        seenHouseholdHashes.add(prepared.data.householdHash);
        preparedDrafts.push(prepared.data);
      }

      const staffUserId = req.authUser?.userId || req.authUser?.sub || 'unknown';
      const staffName = req.authUser?.sub || 'Unknown Staff';
      const createdEntries: Array<{ claim: any; draft: PreparedClaimDraft }> = [];

      for (const draft of preparedDrafts) {
        const claimId = generateClaimId();
        const claim = new Claim({
          claimId,
          householdId: draft.householdId,
          residentId: draft.residentId,
          householdCode: draft.householdCode,
          barangay: draft.barangay,
          distributionId,
          distributionSite,
          staffUserId,
          staffName,
          status: 'PENDING_CHAIN',
          blockchain: {
            householdHash: draft.householdHash,
            eventHash: draft.eventHash,
          },
        });

        try {
          await claim.save();
        } catch (saveErr: any) {
          const saveMessage = String(saveErr?.message || '').toLowerCase();
          const message = saveMessage.includes('duplicate')
            ? 'Duplicate claim detected while saving. Refresh and retry.'
            : 'Failed to save claim before chain submission';
          failures.push({
            token: maskToken(draft.normalizedToken),
            status: 'FAILED',
            message,
          });
          continue;
        }

        try {
          await consumeMatchedToken(draft.matchedToken, draft.residentId);
        } catch (tokenErr: any) {
          console.warn(
            `[record-claim-batch] token consume failed token=${maskToken(draft.normalizedToken)} error=${tokenErr?.message || 'unknown'}`,
          );
        }

        await logAudit(req, 'CLAIM_RECORDED', 'Claim', claimId, {
          householdCode: draft.householdCode,
          barangay: draft.barangay,
          distributionId,
        });

        createdEntries.push({ claim, draft });
      }

      if (createdEntries.length === 0) {
        logHeader('RECORD CLAIM BATCH END');
        return res.status(409).json({
          success: false,
          message: 'No valid claims to submit on-chain',
          summary: {
            requested: normalizedTokens.length,
            saved: 0,
            submitted: 0,
            failed: failures.length,
          },
          results: failures,
        });
      }

      const householdHashes = createdEntries.map((entry) => entry.draft.householdHash);
      const eventHash = createdEntries[0].draft.eventHash;

      try {
        const submitted = await submitClaimsBatchOnChain(householdHashes, eventHash);
        const successItems: BatchClaimResultItem[] = [];

        for (const entry of createdEntries) {
          entry.claim.status = 'CHAIN_SUBMITTED';
          entry.claim.blockchain.txHash = submitted.txHash;
          entry.claim.blockchain.chainId = submitted.chainId;
          entry.claim.blockchain.contractAddress = submitted.contractAddress;
          entry.claim.blockchain.staffSigner = submitted.staffSigner;
          entry.claim.errorMessage = '';
          await entry.claim.save();

          successItems.push({
            token: maskToken(entry.draft.normalizedToken),
            claimId: entry.claim.claimId,
            status: 'SUBMITTED',
            message: 'Submitted. Awaiting confirmations.',
          });
        }

        const targetBarangays = Array.from(
          new Set(createdEntries.map((entry) => entry.draft.barangay)),
        );
        const claimIds = createdEntries.map((entry) => entry.claim.claimId);

        broadcastScopedNotification({
          title: 'Batch Claims Submitted',
          message: `${createdEntries.length} claim(s) submitted on-chain.`,
          type: 'dispatch',
          meta: {
            claimIds,
            distributionId,
            count: createdEntries.length,
            txHash: submitted.txHash,
          },
          targetBarangays,
        });

        logHeader('RECORD CLAIM BATCH END');
        return res.status(202).json({
          success: true,
          message: `${createdEntries.length} claim(s) submitted. Awaiting confirmations.`,
          txHash: submitted.txHash,
          chainId: submitted.chainId,
          contractAddress: submitted.contractAddress,
          summary: {
            requested: normalizedTokens.length,
            saved: createdEntries.length,
            submitted: createdEntries.length,
            failed: failures.length,
          },
          results: [...successItems, ...failures],
        });
      } catch (chainErr: any) {
        const batchErrorMessage =
          chainErr?.message || 'On-chain batch transaction submission failed';
        console.error(
          `[record-claim-batch] batch tx failed: ${batchErrorMessage}. Attempting single-claim fallback...`,
        );

        const fallbackSuccessItems: BatchClaimResultItem[] = [];
        const fallbackFailures: BatchClaimResultItem[] = [...failures];
        let firstTxHash = '';
        let firstChainId = 0;
        let firstContractAddress = '';

        for (const entry of createdEntries) {
          try {
            const submittedSingle = await submitClaimOnChain(
              entry.draft.householdHash,
              entry.draft.eventHash,
            );

            entry.claim.status = 'CHAIN_SUBMITTED';
            entry.claim.blockchain.txHash = submittedSingle.txHash;
            entry.claim.blockchain.chainId = submittedSingle.chainId;
            entry.claim.blockchain.contractAddress = submittedSingle.contractAddress;
            entry.claim.blockchain.staffSigner = submittedSingle.staffSigner;
            entry.claim.errorMessage = '';
            await entry.claim.save();

            if (!firstTxHash) {
              firstTxHash = submittedSingle.txHash;
              firstChainId = submittedSingle.chainId;
              firstContractAddress = submittedSingle.contractAddress;
            }

            fallbackSuccessItems.push({
              token: maskToken(entry.draft.normalizedToken),
              claimId: entry.claim.claimId,
              status: 'SUBMITTED',
              message: 'Submitted individually after batch fallback.',
            });
          } catch (singleErr: any) {
            const singleMessage =
              singleErr?.message || 'Single-claim fallback submission failed';
            entry.claim.status = 'CHAIN_FAILED';
            entry.claim.errorMessage = singleMessage;
            await entry.claim.save();

            fallbackFailures.push({
              token: maskToken(entry.draft.normalizedToken),
              claimId: entry.claim.claimId,
              status: 'FAILED',
              message: singleMessage,
            });
          }
        }

        if (fallbackSuccessItems.length > 0) {
          const successfulClaimIds = fallbackSuccessItems
            .map((item) => item.claimId)
            .filter(Boolean);
          const successfulBarangays = Array.from(
            new Set(
              createdEntries
                .filter((entry) =>
                  fallbackSuccessItems.some((item) => item.claimId === entry.claim.claimId),
                )
                .map((entry) => entry.draft.barangay),
            ),
          );

          broadcastScopedNotification({
            title: 'Claims Submitted (Fallback)',
            message: `${fallbackSuccessItems.length} claim(s) submitted via single-write fallback.`,
            type: 'dispatch',
            meta: {
              claimIds: successfulClaimIds,
              distributionId,
              count: fallbackSuccessItems.length,
              fallback: true,
              batchError: batchErrorMessage,
              txHash: firstTxHash,
            },
            targetBarangays: successfulBarangays,
          });

          logHeader('RECORD CLAIM BATCH END');
          return res.status(202).json({
            success: true,
            message:
              fallbackFailures.length > 0
                ? `${fallbackSuccessItems.length} claim(s) submitted via fallback. ${fallbackFailures.length} failed.`
                : `${fallbackSuccessItems.length} claim(s) submitted via fallback.`,
            txHash: firstTxHash,
            chainId: firstChainId,
            contractAddress: firstContractAddress,
            summary: {
              requested: normalizedTokens.length,
              saved: createdEntries.length,
              submitted: fallbackSuccessItems.length,
              failed: fallbackFailures.length,
              batchError: batchErrorMessage,
              fallbackUsed: true,
            },
            results: [...fallbackSuccessItems, ...fallbackFailures],
          });
        }

        logHeader('RECORD CLAIM BATCH END');
        return res.status(502).json({
          success: false,
          message: 'On-chain batch submission failed',
          summary: {
            requested: normalizedTokens.length,
            saved: createdEntries.length,
            submitted: 0,
            failed: fallbackFailures.length,
            batchError: batchErrorMessage,
            fallbackUsed: true,
          },
          results: fallbackFailures,
        });
      }
    } catch (err: any) {
      console.error('[record-claim-batch] Error:', err?.message || 'unknown');
      logHeader('RECORD CLAIM BATCH END');
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
        const alreadyClaimed = await isClaimedOnChain(householdHash, eventHash);
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
