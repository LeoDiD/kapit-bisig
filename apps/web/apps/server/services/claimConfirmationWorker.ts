import mongoose from 'mongoose';
import Claim from '../models/Claim';
import DistributionClaim from '../models/DistributionClaim';
import {
  getConfirmationsRequired,
  getProvider,
  getTransactionReceipt,
  isClaimedOnChain,
} from './blockchainService';

const PENDING_STATUSES = ['PENDING_CHAIN', 'CHAIN_SUBMITTED'] as const;
const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_ERROR_LOG_COOLDOWN_MS = 120000;

function parsePositiveNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
): number {
  const raw = (value || '').trim();
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < minimum) return fallback;

  return Math.floor(parsed);
}

const POLL_INTERVAL_MS = parsePositiveNumber(
  process.env.CHAIN_CONFIRMATION_POLL_MS,
  DEFAULT_POLL_INTERVAL_MS,
  1000,
);
const MAX_BATCH_SIZE = parsePositiveNumber(
  process.env.CHAIN_CONFIRMATION_BATCH_SIZE,
  DEFAULT_BATCH_SIZE,
  1,
);
const ERROR_LOG_COOLDOWN_MS = parsePositiveNumber(
  process.env.CHAIN_CONFIRMATION_ERROR_COOLDOWN_MS,
  DEFAULT_ERROR_LOG_COOLDOWN_MS,
  1000,
);

let workerTimer: NodeJS.Timeout | null = null;
let isRunning = false;
const lastErrorLoggedAt = new Map<string, number>();
let hasWarnedUnsupportedClaimCheck = false;

function shortHash(value: string): string {
  if (!value) return '(none)';
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function summarizeError(err: any): { code: string; message: string } {
  const code = String(err?.code || 'UNKNOWN');
  const raw =
    err?.shortMessage ||
    err?.reason ||
    err?.message ||
    err?.error?.message ||
    'unknown error';

  const message = String(raw).replace(/\s+/g, ' ').trim();
  if (message.length > 180) {
    return { code, message: `${message.slice(0, 177)}...` };
  }
  return { code, message };
}

function shouldLogError(key: string): boolean {
  const now = Date.now();
  const last = lastErrorLoggedAt.get(key) || 0;
  if (now - last < ERROR_LOG_COOLDOWN_MS) {
    return false;
  }
  lastErrorLoggedAt.set(key, now);

  if (lastErrorLoggedAt.size > 200) {
    const cutoff = now - ERROR_LOG_COOLDOWN_MS * 4;
    for (const [k, ts] of lastErrorLoggedAt.entries()) {
      if (ts < cutoff) {
        lastErrorLoggedAt.delete(k);
      }
    }
  }

  return true;
}

async function syncDistributionClaim(claim: any): Promise<void> {
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

async function confirmOrFailClaim(claim: any, latestBlock: number): Promise<void> {
  const txHash = claim?.blockchain?.txHash;
  const householdHash = claim?.blockchain?.householdHash;
  const eventHash = claim?.blockchain?.eventHash;
  if (!txHash || !householdHash || !eventHash) return;

  const receipt = await getTransactionReceipt(txHash);
  if (!receipt) return;

  if (receipt.status === 0) {
    await Claim.findOneAndUpdate(
      {
        _id: claim._id,
        status: mongoose.trusted({ $in: [...PENDING_STATUSES] }),
      },
      {
        status: 'CHAIN_FAILED',
        errorMessage: 'Transaction reverted on-chain',
      },
      { new: true },
    ).setOptions({ sanitizeFilter: false });
    return;
  }

  if (receipt.status !== 1) return;

  let onChainClaimed = false;
  try {
    onChainClaimed = await isClaimedOnChain(householdHash, eventHash);
  } catch (err: any) {
    const msg = String(err?.message || '');
    const isUnsupportedClaimCheck = msg.includes('does not expose isClaimed check functions');
    if (!isUnsupportedClaimCheck) {
      throw err;
    }

    if (!hasWarnedUnsupportedClaimCheck) {
      hasWarnedUnsupportedClaimCheck = true;
      console.warn(
        '[claim-confirmation-worker] Contract does not expose isClaimed check. Falling back to tx receipt confirmations only.',
      );
    }
    onChainClaimed = true;
  }

  if (!onChainClaimed) {
    // Extra safety check: keep pending until contract state is verifiably updated.
    return;
  }

  const blockNumber = Number(receipt.blockNumber || 0);
  const confirmations = blockNumber > 0 ? latestBlock - blockNumber + 1 : 0;
  const required = getConfirmationsRequired();
  if (confirmations < required) {
    return;
  }

  const updated = await Claim.findOneAndUpdate(
    {
      _id: claim._id,
      status: mongoose.trusted({ $in: [...PENDING_STATUSES] }),
    },
    {
      status: 'CONFIRMED',
      errorMessage: '',
      'blockchain.blockNumber': blockNumber,
    },
    { new: true },
  ).setOptions({ sanitizeFilter: false });

  if (updated) {
    await syncDistributionClaim(updated);
  }
}

async function pollPendingClaims(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const pendingClaims = await Claim.find({
      status: mongoose.trusted({ $in: [...PENDING_STATUSES] }),
      'blockchain.txHash': mongoose.trusted({ $exists: true, $ne: '' }),
    })
      .setOptions({ sanitizeFilter: false })
      .sort({ updatedAt: 1 })
      .limit(MAX_BATCH_SIZE)
      .lean();

    if (pendingClaims.length === 0) return;

    const latestBlock = await getProvider().getBlockNumber();

    for (const claim of pendingClaims) {
      try {
        await confirmOrFailClaim(claim, latestBlock);
      } catch (err: any) {
        const { code, message } = summarizeError(err);
        const key = `claim|${code}|${message}`;
        if (shouldLogError(key)) {
          console.error(
            `[claim-confirmation-worker] claimId=${claim.claimId} txHash=${shortHash(claim?.blockchain?.txHash || '')} code=${code} error=${message}`,
          );
        }
      }
    }
  } catch (err: any) {
    const { code, message } = summarizeError(err);
    const key = `poll|${code}|${message}`;
    if (shouldLogError(key)) {
      console.error(`[claim-confirmation-worker] poll error code=${code} message=${message}`);
    }
  } finally {
    isRunning = false;
  }
}

export function startClaimConfirmationWorker(): void {
  if (workerTimer) return;

  console.log(
    `[claim-confirmation-worker] started (interval=${POLL_INTERVAL_MS}ms, confirmations=${getConfirmationsRequired()})`,
  );

  // Run immediately once, then on interval.
  void pollPendingClaims();
  workerTimer = setInterval(() => {
    void pollPendingClaims();
  }, POLL_INTERVAL_MS);
}

export function stopClaimConfirmationWorker(): void {
  if (!workerTimer) return;
  clearInterval(workerTimer);
  workerTimer = null;
}
