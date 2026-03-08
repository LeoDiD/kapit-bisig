import mongoose from 'mongoose';
import Claim from '../models/Claim';
import {
  getConfirmationsRequired,
  getProvider,
  getTransactionReceipt,
  isClaimedOnChain,
} from './blockchainService';
import { upsertDistributionClaimFromClaim } from './distributionFlowService';
import { runClaimOpsAlerts } from './claimOpsAlertService';

const PENDING_STATUSES = ['PENDING_CHAIN', 'CHAIN_SUBMITTED'] as const;
const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_BATCH_SIZE = 100;

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

let workerTimer: NodeJS.Timeout | null = null;
let isRunning = false;

async function syncDistributionClaim(claim: any): Promise<void> {
  if (!claim?.residentId) return;
  await upsertDistributionClaimFromClaim(claim);
}

async function confirmOrFailClaim(claim: any, latestBlock: number): Promise<void> {
  const txHash = claim?.blockchain?.txHash;
  const householdHash = claim?.blockchain?.householdHash;
  if (!txHash || !householdHash) return;

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

  const onChainClaimed = await isClaimedOnChain(householdHash);
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
        console.error(
          `[claim-confirmation-worker] claimId=${claim.claimId} txHash=${claim?.blockchain?.txHash || '(none)'} error=${err?.message || 'unknown'}`,
        );
      }
    }
  } catch (err: any) {
    console.error(`[claim-confirmation-worker] poll error: ${err?.message || 'unknown'}`);
  } finally {
    try {
      await runClaimOpsAlerts();
    } catch (alertErr: any) {
      console.error(`[claim-confirmation-worker] alert error: ${alertErr?.message || 'unknown'}`);
    }
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
