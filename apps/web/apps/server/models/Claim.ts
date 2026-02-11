/**
 * Claim Model
 *
 * Stores the full off-chain record of every relief-pack claim.
 * The `blockchain` sub-document mirrors what is stored on-chain
 * so the UI can cross-reference on-chain proof with local data.
 *
 * Status flow:
 *   PENDING_CHAIN → CONFIRMED   (happy path)
 *   PENDING_CHAIN → CHAIN_FAILED (tx reverted or timed out)
 *   CHAIN_FAILED  → CONFIRMED   (manual retry succeeds)
 */

import mongoose, { Document, Schema } from 'mongoose';

export type ClaimStatus = 'PENDING_CHAIN' | 'CONFIRMED' | 'CHAIN_FAILED';

export interface IClaim extends Document {
  claimId: string;
  householdId: string;
  residentId: string;
  householdCode: string;
  barangay: string;
  distributionId: string;
  distributionSite: string;
  staffUserId: string;
  staffName: string;
  status: ClaimStatus;
  blockchain: {
    txHash?: string;
    blockNumber?: number;
    householdHash: string;
    eventHash: string;
    staffSigner?: string;
  };
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    householdId: {
      type: String,
      required: true,
      index: true,
    },
    residentId: {
      type: String,
      default: '',
      index: true,
    },
    householdCode: {
      type: String,
      required: true,
    },
    barangay: {
      type: String,
      required: true,
      index: true,
    },
    distributionId: {
      type: String,
      required: true,
    },
    distributionSite: {
      type: String,
      required: true,
    },
    staffUserId: {
      type: String,
      required: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING_CHAIN', 'CONFIRMED', 'CHAIN_FAILED'],
      default: 'PENDING_CHAIN',
      index: true,
    },
    blockchain: {
      txHash: { type: String, default: '' },
      blockNumber: { type: Number, default: 0 },
      householdHash: { type: String, required: true },
      eventHash: { type: String, required: true },
      staffSigner: { type: String, default: '' },
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// Compound index: one claim per household per distribution
ClaimSchema.index({ householdId: 1, distributionId: 1 }, { unique: true });

/**
 * Transform output to include id field
 */
ClaimSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);

export default Claim;
