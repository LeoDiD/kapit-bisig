/**
 * Claim Routes (/api/claims)
 *
 * Endpoints:
 * - POST /api/claims/record-claim
 * - POST /api/claims/record-claim-batch
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Claim from '../models/Claim';
import HouseholdToken from '../models/HouseholdToken';
import Resident from '../models/Resident';
import Distribution from '../models/Distribution';
import { AuthRequest } from '../middleware/unifiedAuth';

import {
  isResidentEligibleForDistribution,
  isResidentApprovedBeneficiaryForDistribution,
  requiresBeneficiaryApproval,
  upsertDistributionClaimFromClaim,
} from '../services/distributionFlowService';
import { validateRequest } from '../validation/validateRequest';
import {
  recordClaimBody,
  recordClaimBatchBody,
} from '../validation/claim.schema';
import { logAudit } from '../utils/audit';
import { broadcastScopedNotification } from '../utils/createNotification';
import { isDistributionClaimable } from '../utils/distributionLifecycle';

const router = Router();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
const claimIdempotencyStore = new Map<string, { expiresAt: number; response: Record<string, unknown> }>();

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

function cleanClaimIdempotencyStore(): void {
  const now = Date.now();
  for (const [key, value] of claimIdempotencyStore.entries()) {
    if (value.expiresAt <= now) {
      claimIdempotencyStore.delete(key);
    }
  }
}

function claimIdempotencyCacheKey(userKey: string, key: string): string {
  return `${userKey}::${key}`;
}

function isRetryableTransactionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = (err as { message?: string }).message || '';
  return message.includes('Transaction numbers are only allowed on a replica set member');
}

async function runWithOptionalTransaction<T>(fn: (session: mongoose.ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    if (isRetryableTransactionError(err)) {
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

interface PreparedClaimDraft {
  normalizedToken: string;
  matchedToken: any;
  residentId: string;
  householdId: string;
  householdCode: string;
  barangay: string;

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

  const distribution = await Distribution.findById(distributionId)
    .select('_id barangay assignedBarangays status requiresBeneficiaryApproval scheduled endsAt archivedAt')
    .lean();
  if (!distribution) {
    return {
      ok: false,
      status: 404,
      message: 'Distribution not found',
    };
  }

  if (!isDistributionClaimable(distribution)) {
    return {
      ok: false,
      status: 409,
      message: 'Claims can only be recorded while the distribution is active',
    };
  }

  if (!isResidentEligibleForDistribution(residentBarangay, distribution as any)) {
    return {
      ok: false,
      status: 403,
      message: 'Resident barangay is not covered by this distribution',
    };
  }

  if (distribution.status === 'Claimed') {
    return {
      ok: false,
      status: 409,
      message: 'Distribution is already completed',
    };
  }

  const tokenBoundDistributionId = String(matchedToken?.householdInfo?.distributionId || '').trim();
  if (tokenBoundDistributionId && tokenBoundDistributionId !== distributionId) {
    return {
      ok: false,
      status: 409,
      message: 'Claim token is bound to a different distribution',
    };
  }

  if (requiresBeneficiaryApproval(distribution as any)) {
    const isApprovedTargetBeneficiary = await isResidentApprovedBeneficiaryForDistribution(
      distributionId,
      residentId,
    );
    if (!isApprovedTargetBeneficiary) {
      return {
        ok: false,
        status: 403,
        message: 'Resident is not an approved target beneficiary for this distribution',
      };
    }
  }

  const householdCode =
    tokenHouseholdCode ||
    String(residentAny.residentCode || '') ||
    `HH-${barangay.slice(0, 2).toUpperCase()}-${residentId.slice(-4).toUpperCase()}`;
  // [RISK-5 MITIGATION] Household identity for hashing must be stable per resident, not per token doc.
  const householdId = residentId;

  const existingClaim = await Claim.findOne({ householdId, distributionId, claimCategory: 'DISTRIBUTION' });
  if (existingClaim) {
    return {
      ok: false,
      status: 409,
      message: 'This household has already claimed for this distribution',
      claim: existingClaim,
    };
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

    },
  };
}

router.post(
  '/record-claim',
  validateRequest({ body: recordClaimBody }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { claimToken, distributionId, distributionSite } = req.body;
      cleanClaimIdempotencyStore();

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
      const idempotencyKeyHeader = req.header('Idempotency-Key')?.trim();
      if (idempotencyKeyHeader) {
        const actorId = req.authUser?.userId ?? req.authUser?.sub ?? 'anonymous';
        const key = claimIdempotencyCacheKey(actorId, idempotencyKeyHeader);
        const existing = claimIdempotencyStore.get(key);
        if (existing && existing.expiresAt > Date.now()) {
          return res.status(200).json(existing.response);
        }
      }

      if (!isSupportedClaimTokenFormat(normalizedToken)) {
        logHeader('RECORD CLAIM END');
        return res.status(400).json({
          success: false,
          message: 'Invalid claim token format',
        });
      }
      const prepared = await prepareClaimDraft(normalizedToken, distributionId);
      if (!prepared.ok) {
        if (prepared.status === 404) {
          console.error(`[ERROR] Invalid or expired token: ${maskToken(normalizedToken)}`);
        } else if (prepared.status === 409) {
          console.error(`[ERROR] Duplicate or blocked claim: ${prepared.message}`);
        }
        logHeader('RECORD CLAIM END');
        return res.status(prepared.status).json({
          success: false,
          message: prepared.message,
          claim: prepared.claim,
        });
      }

      const {
        matchedToken,
        residentId,
        householdId,
        householdCode,
        barangay,

      } = prepared.data;

      console.log(`[2] Household found: ${householdCode} | ${barangay}`);


      const claimId = generateClaimId();
      const staffUserId = req.authUser?.userId || req.authUser?.sub || 'unknown';
      const staffName = req.authUser?.sub || 'Unknown Staff';

      const claim = await runWithOptionalTransaction(async (session) => {
        const existingInTxn = await Claim.findOne({ householdId, distributionId, claimCategory: 'DISTRIBUTION' }).session(session || null);
        if (existingInTxn) {
          throw new Error('DUPLICATE_CLAIM_IN_TXN');
        }

        const claimPayload = {
          claimId,
          householdId,
          residentId,
          householdCode,
          barangay,
          distributionId,
          distributionSite,
          staffUserId,
          staffName,
          claimCategory: 'DISTRIBUTION' as const,
          claimStatus: 'Claimed' as const,
          scannedBy: staffUserId,
          scannedAt: new Date(),
          source: 'ONLINE' as const,
          status: 'CONFIRMED' as const,
        };
        let createdClaim;
        if (session) {
          const created = await Claim.create([claimPayload], { session });
          createdClaim = created[0];
        } else {
          createdClaim = new Claim(claimPayload);
          await createdClaim.save();
        }

        const tokenUpdateBase: Record<string, unknown> = {
          'householdInfo.distributionId': distributionId,
        };

        if (matchedToken.status === 'UNUSED') {
          Object.assign(tokenUpdateBase, {
            status: 'USED',
            usedAt: new Date(),
            usedBy: {
              residentId: new mongoose.Types.ObjectId(residentId),
              ipAddress: matchedToken?.usedBy?.ipAddress || null,
              userAgent: matchedToken?.usedBy?.userAgent || null,
            },
          });
        }

        await HouseholdToken.updateOne(
          { _id: matchedToken._id },
          { $set: tokenUpdateBase },
          session ? { session } : undefined,
        );

        return createdClaim;
      });

      await logAudit(req, 'CLAIM_RECORDED', 'Claim', claimId, {
        householdCode,
        barangay,
        distributionId,
      });

      claim.status = 'CONFIRMED';
      claim.errorMessage = '';
      await claim.save();
      await upsertDistributionClaimFromClaim(claim);
      console.log(`[4] DB: claimId=${claimId} status=CONFIRMED (off-chain mode)`);
      logHeader('RECORD CLAIM END');

      broadcastScopedNotification({
        title: 'Claim Recorded',
        message: `Relief claim recorded for household ${householdCode} in ${barangay}.`,
        type: 'dispatch',
        meta: { claimId, householdCode, barangay, distributionId },
        targetBarangays: [barangay],
      });

      const responseBody = {
        success: true,
        message: 'Claim recorded successfully.',
        claimId,
        claim,
      };

      if (idempotencyKeyHeader) {
        const actorId = req.authUser?.userId ?? req.authUser?.sub ?? 'anonymous';
        claimIdempotencyStore.set(claimIdempotencyCacheKey(actorId, idempotencyKeyHeader), {
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
          response: responseBody,
        });
      }

      return res.status(201).json(responseBody);
    } catch (err: any) {
      if (err?.message === 'DUPLICATE_CLAIM_IN_TXN') {
        logHeader('RECORD CLAIM END');
        return res.status(409).json({
          success: false,
          message: 'This household has already claimed for this distribution',
        });
      }
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
        .select('_id barangay scheduled endsAt archivedAt')
        .lean();
      if (!distributionDoc) {
        logHeader('RECORD CLAIM BATCH END');
        return res.status(404).json({ success: false, message: 'Distribution not found' });
      }
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
        );
        if (!prepared.ok) {
          failures.push({
            token: maskToken(token),
            status: 'FAILED',
            message: prepared.message,
          });
          continue;
        }


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
          claimCategory: 'DISTRIBUTION',
          claimStatus: 'Claimed',
          scannedBy: staffUserId,
          scannedAt: new Date(),
          source: 'ONLINE',
          status: 'CONFIRMED',
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
          message: 'No valid claims to record',
          summary: {
            requested: normalizedTokens.length,
            saved: 0,
            submitted: 0,
            failed: failures.length,
          },
          results: failures,
        });
      }
      if (!isDistributionClaimable(distributionDoc)) {
        logHeader('RECORD CLAIM BATCH END');
        return res.status(409).json({
          success: false,
          code: 'DISTRIBUTION_NOT_ACTIVE',
          message: 'Claims can only be recorded while the distribution is active',
        });
      }

      const successItems: BatchClaimResultItem[] = [];
      for (const entry of createdEntries) {
        entry.claim.status = 'CONFIRMED';
        entry.claim.errorMessage = '';
        await entry.claim.save();
        await upsertDistributionClaimFromClaim(entry.claim);
        successItems.push({
          token: maskToken(entry.draft.normalizedToken),
          claimId: entry.claim.claimId,
          status: 'SUBMITTED',
          message: 'Recorded successfully.',
        });
      }

      const targetBarangays = Array.from(
        new Set(createdEntries.map((entry) => entry.draft.barangay)),
      );
      const claimIds = createdEntries.map((entry) => entry.claim.claimId);

      broadcastScopedNotification({
        title: 'Batch Claims Recorded',
        message: `${createdEntries.length} claim(s) recorded.`,
        type: 'dispatch',
        meta: {
          claimIds,
          distributionId,
          count: createdEntries.length,
        },
        targetBarangays,
      });

      logHeader('RECORD CLAIM BATCH END');
      return res.status(201).json({
        success: true,
        message: `${createdEntries.length} claim(s) recorded successfully.`,
        summary: {
          requested: normalizedTokens.length,
          saved: createdEntries.length,
          submitted: createdEntries.length,
          failed: failures.length,
        },
        results: [...successItems, ...failures],
      });
    } catch (err: any) {
      console.error('[record-claim-batch] Error:', err?.message || 'unknown');
      logHeader('RECORD CLAIM BATCH END');
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
