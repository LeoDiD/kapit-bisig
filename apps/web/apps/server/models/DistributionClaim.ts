/**
 * Distribution Claim Model
 *
 * Tracks per-household claims for a specific distribution.
 * Each document = one household claiming one distribution.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IDistributionClaim extends Document {
  distributionId: mongoose.Types.ObjectId;
  householdId: mongoose.Types.ObjectId;       // Resident._id
  claimedAt: Date;
  claimedBy: {
    id: string;
    name: string;
  } | null;
  proofMethod: 'QR' | 'FACE' | null;
  createdAt: Date;
  updatedAt: Date;
}

const distributionClaimSchema = new Schema<IDistributionClaim>(
  {
    distributionId: {
      type: Schema.Types.ObjectId,
      ref: 'Distribution',
      required: true,
      index: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    claimedAt: {
      type: Date,
      default: () => new Date(),
    },
    claimedBy: {
      id: { type: String, default: null },
      name: { type: String, default: null },
    },
    proofMethod: {
      type: String,
      enum: ['QR', 'FACE', null],
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate claims: one household can claim a distribution only once
distributionClaimSchema.index(
  { distributionId: 1, householdId: 1 },
  { unique: true }
);

distributionClaimSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const DistributionClaim = mongoose.model<IDistributionClaim>(
  'DistributionClaim',
  distributionClaimSchema
);

export default DistributionClaim;
