import mongoose from 'mongoose';
import Claim from '../models/Claim';

const ALERT_WINDOW_MS = Number(process.env.CLAIM_ALERT_WINDOW_MS || 10 * 60 * 1000);
const CHAIN_FAILED_THRESHOLD = Number(process.env.CHAIN_FAILED_ALERT_THRESHOLD || 5);
const CONFIRM_LAG_THRESHOLD_MS = Number(process.env.CLAIM_CONFIRM_LAG_ALERT_MS || 15 * 60 * 1000);

let lastFailedAlertAt = 0;
let lastLagAlertAt = 0;
const ALERT_COOLDOWN_MS = 60 * 1000;

function canAlert(lastAt: number): boolean {
  return Date.now() - lastAt >= ALERT_COOLDOWN_MS;
}

export async function runClaimOpsAlerts(): Promise<void> {
  const windowStart = new Date(Date.now() - ALERT_WINDOW_MS);

  const failedCount = await Claim.countDocuments({
    status: 'CHAIN_FAILED',
    updatedAt: mongoose.trusted({ $gte: windowStart }),
  }).setOptions({ sanitizeFilter: false });

  if (failedCount >= CHAIN_FAILED_THRESHOLD && canAlert(lastFailedAlertAt)) {
    lastFailedAlertAt = Date.now();
    console.error(
      `[ALERT] High CHAIN_FAILED volume: ${failedCount} failed claims in last ${Math.round(ALERT_WINDOW_MS / 60000)} minutes`,
    );
  }

  const oldestPending = await Claim.findOne({
    status: mongoose.trusted({ $in: ['PENDING_CHAIN', 'CHAIN_SUBMITTED'] }),
  })
    .setOptions({ sanitizeFilter: false })
    .sort({ createdAt: 1 })
    .select('claimId createdAt status')
    .lean();

  if (oldestPending?.createdAt) {
    const lagMs = Date.now() - new Date(oldestPending.createdAt).getTime();
    if (lagMs >= CONFIRM_LAG_THRESHOLD_MS && canAlert(lastLagAlertAt)) {
      lastLagAlertAt = Date.now();
      console.error(
        `[ALERT] Confirmation lag high: claimId=${oldestPending.claimId} pending for ${Math.round(lagMs / 1000)}s (status=${oldestPending.status})`,
      );
    }
  }
}
