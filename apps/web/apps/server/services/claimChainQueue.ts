import Claim from '../models/Claim';
import { env } from '../config/env';
import { submitClaimOnChain } from './blockchainService';
import { upsertDistributionClaimFromClaim } from './distributionFlowService';

type QueueItem = {
  claimId: string;
  attempt: number;
  nextRunAt: number;
};

const queue: QueueItem[] = [];
const MAX_ATTEMPTS = Number(process.env.CHAIN_SUBMIT_MAX_ATTEMPTS || 5);
const BASE_BACKOFF_MS = Number(process.env.CHAIN_SUBMIT_BASE_BACKOFF_MS || 1500);
let started = false;
let running = false;
let timer: NodeJS.Timeout | null = null;

function computeBackoffMs(attempt: number): number {
  const exp = Math.max(0, attempt - 1);
  return BASE_BACKOFF_MS * 2 ** exp;
}

function scheduleNextTick(delayMs = 300): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void processQueue();
  }, delayMs);
}

export function enqueueClaimForChainSubmission(claimId: string, attempt = 1): void {
  queue.push({
    claimId,
    attempt,
    nextRunAt: Date.now(),
  });
  scheduleNextTick(0);
}

async function processQueue(): Promise<void> {
  if (running) return;
  running = true;

  try {
    queue.sort((a, b) => a.nextRunAt - b.nextRunAt);
    const item = queue[0];
    if (!item) return;

    if (item.nextRunAt > Date.now()) {
      scheduleNextTick(Math.min(item.nextRunAt - Date.now(), 1000));
      return;
    }

    queue.shift();
    await processItem(item);
  } finally {
    running = false;
    if (queue.length > 0) {
      scheduleNextTick(100);
    }
  }
}

async function processItem(item: QueueItem): Promise<void> {
  const claim = await Claim.findOne({ claimId: item.claimId });
  if (!claim) return;
  if (!['PENDING_CHAIN', 'CHAIN_FAILED'].includes(claim.status)) return;

  if (!env.BLOCKCHAIN_ENABLED) {
    claim.status = 'CONFIRMED';
    claim.errorMessage = '';
    await claim.save();
    await upsertDistributionClaimFromClaim(claim);
    return;
  }

  try {
    const submitted = await submitClaimOnChain(
      claim.blockchain.householdHash,
      claim.blockchain.eventHash,
    );
    claim.status = 'CHAIN_SUBMITTED';
    claim.blockchain.txHash = submitted.txHash;
    claim.blockchain.chainId = submitted.chainId;
    claim.blockchain.contractAddress = submitted.contractAddress;
    claim.blockchain.staffSigner = submitted.staffSigner;
    claim.errorMessage = '';
    await claim.save();
  } catch (err: any) {
    if (item.attempt < MAX_ATTEMPTS) {
      queue.push({
        claimId: item.claimId,
        attempt: item.attempt + 1,
        nextRunAt: Date.now() + computeBackoffMs(item.attempt + 1),
      });
      claim.status = 'PENDING_CHAIN';
      claim.errorMessage = `Chain submit retry ${item.attempt}/${MAX_ATTEMPTS}: ${err?.message || 'unknown error'}`;
      await claim.save();
      return;
    }

    claim.status = 'CHAIN_FAILED';
    claim.errorMessage = err?.message || 'On-chain transaction submission failed';
    await claim.save();
  }
}

export function startClaimChainQueue(): void {
  if (started) return;
  started = true;
  scheduleNextTick(0);
}

export function stopClaimChainQueue(): void {
  if (!started) return;
  started = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  queue.length = 0;
}
