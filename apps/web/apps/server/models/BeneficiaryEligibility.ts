import mongoose, { Document, Schema } from 'mongoose';
import { ProofSubmissionStatus } from './ProofSubmission';

export type EligibilityStatus = 'Eligible' | 'Not Eligible';
export type RegistrationSnapshotStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IBeneficiaryEligibility extends Document {
  residentId: mongoose.Types.ObjectId;
  disasterEventId: mongoose.Types.ObjectId;
  proofSubmissionId?: mongoose.Types.ObjectId | null;
  status: EligibilityStatus;
  registrationStatus: RegistrationSnapshotStatus;
  proofStatus: ProofSubmissionStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date | null;
  lastQualifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BeneficiaryEligibilitySchema = new Schema<IBeneficiaryEligibility>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    disasterEventId: {
      type: Schema.Types.ObjectId,
      ref: 'DisasterEvent',
      required: true,
      index: true,
    },
    proofSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProofSubmission',
      default: null,
    },
    status: {
      type: String,
      enum: ['Eligible', 'Not Eligible'],
      default: 'Not Eligible',
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      required: true,
    },
    proofStatus: {
      type: String,
      enum: ['Pending Sync', 'Pending Verification', 'Approved', 'Rejected'],
      required: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    reviewedBy: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    lastQualifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

BeneficiaryEligibilitySchema.index({ residentId: 1, disasterEventId: 1 }, { unique: true });
BeneficiaryEligibilitySchema.index({ disasterEventId: 1, status: 1 });

BeneficiaryEligibilitySchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    delete ret.__v;
    return ret;
  },
});

const BeneficiaryEligibility = mongoose.model<IBeneficiaryEligibility>(
  'BeneficiaryEligibility',
  BeneficiaryEligibilitySchema,
);

export default BeneficiaryEligibility;
