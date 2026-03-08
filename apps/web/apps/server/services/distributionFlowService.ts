import mongoose from 'mongoose';
import Distribution, { DistributionStatus, IDistribution } from '../models/Distribution';
import DistributionClaim from '../models/DistributionClaim';
import Resident from '../models/Resident';

export function getTargetBarangays(
  hostBarangay: string,
  assignedBarangays: string[] = [],
): string[] {
  const cleaned = [hostBarangay, ...assignedBarangays].filter(Boolean);
  return Array.from(new Set(cleaned));
}

export function isResidentEligibleForDistribution(
  residentBarangay: string,
  distribution: Pick<IDistribution, 'barangay' | 'assignedBarangays'>,
): boolean {
  const targetBarangays = getTargetBarangays(distribution.barangay, distribution.assignedBarangays);
  return targetBarangays.includes(residentBarangay);
}

export function deriveDistributionStatus(
  registeredHouseholds: number,
  claimedHouseholds: number,
): DistributionStatus {
  if (registeredHouseholds <= 0 || claimedHouseholds <= 0) {
    return 'Unclaimed';
  }
  if (claimedHouseholds >= registeredHouseholds) {
    return 'Claimed';
  }
  return 'Partially Claimed';
}

export async function syncDistributionStatus(distributionId: string): Promise<{
  status: DistributionStatus;
  registeredHouseholds: number;
  claimedHouseholds: number;
}> {
  if (!mongoose.Types.ObjectId.isValid(distributionId)) {
    throw new Error('Invalid distribution id');
  }

  const distribution = await Distribution.findById(distributionId);
  if (!distribution) {
    throw new Error('Distribution not found');
  }

  const targetBarangays = getTargetBarangays(distribution.barangay, distribution.assignedBarangays);

  const [registeredHouseholds, claimedHouseholds] = await Promise.all([
    Resident.countDocuments({
      barangay: mongoose.trusted({ $in: targetBarangays }),
      status: 'Approved',
    }),
    DistributionClaim.countDocuments({ distributionId: distribution._id }),
  ]);

  const nextStatus = deriveDistributionStatus(registeredHouseholds, claimedHouseholds);
  distribution.households = registeredHouseholds;
  distribution.status = nextStatus;
  distribution.claimedAt = nextStatus === 'Claimed' ? new Date() : null;
  await distribution.save();

  return {
    status: nextStatus,
    registeredHouseholds,
    claimedHouseholds,
  };
}

export async function upsertDistributionClaimFromClaim(claim: any): Promise<void> {
  if (!claim?.residentId || !claim?.distributionId) return;

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

  await syncDistributionStatus(String(claim.distributionId));
}
