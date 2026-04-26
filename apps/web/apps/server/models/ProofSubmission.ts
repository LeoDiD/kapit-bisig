import mongoose, { Document, Schema } from 'mongoose';

export const DAMAGE_TYPE_OPTIONS = [
  'Flood',
  'House Damage',
  'Storm Surge',
  'Landslide',
  'Livelihood Loss',
  'Other',
] as const;

export type DamageType = typeof DAMAGE_TYPE_OPTIONS[number];
export type ProofSubmissionStatus =
  | 'Pending Sync'
  | 'Pending Verification'
  | 'Approved'
  | 'Rejected';
export type ProofSubmissionSource = 'ONLINE' | 'OFFLINE_SYNC';

export interface IProofSubmission extends Document {
  residentId: mongoose.Types.ObjectId;
  disasterEventId?: mongoose.Types.ObjectId | null;
  distributionId?: mongoose.Types.ObjectId | null;
  damageType: DamageType;
  description: string;
  supportingInfo: string;
  dateSubmitted: Date;
  photoProofUrl: string;
  photoProofUrls: string[];
  status: ProofSubmissionStatus;
  syncSource: ProofSubmissionSource;
  submissionVersion: number;
  clientGeneratedId: string;
  submittedViaDeviceId: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProofSubmissionSchema = new Schema<IProofSubmission>(
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
      default: null,
      index: true,
    },
    distributionId: {
      type: Schema.Types.ObjectId,
      ref: 'Distribution',
      default: null,
      index: true,
    },
    damageType: {
      type: String,
      enum: DAMAGE_TYPE_OPTIONS,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    supportingInfo: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    dateSubmitted: {
      type: Date,
      required: true,
    },
    photoProofUrl: {
      type: String,
      required: true,
    },
    photoProofUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length >= 1 && value.length <= 5,
        message: 'Proof submissions must include between 1 and 5 photo URLs.',
      },
    },
    status: {
      type: String,
      enum: ['Pending Sync', 'Pending Verification', 'Approved', 'Rejected'],
      default: 'Pending Verification',
      index: true,
    },
    syncSource: {
      type: String,
      enum: ['ONLINE', 'OFFLINE_SYNC'],
      default: 'ONLINE',
    },
    submissionVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    clientGeneratedId: {
      type: String,
      default: '',
      index: true,
    },
    submittedViaDeviceId: {
      type: String,
      default: '',
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
  },
  {
    timestamps: true,
  },
);

ProofSubmissionSchema.pre('validate', function(next) {
  const currentUrls = Array.isArray(this.photoProofUrls) ? this.photoProofUrls.filter(Boolean) : [];
  const firstUrl = String(this.photoProofUrl || '').trim();

  if (currentUrls.length === 0 && firstUrl) {
    this.photoProofUrls = [firstUrl];
  } else if (!firstUrl && currentUrls.length > 0) {
    this.photoProofUrl = currentUrls[0];
  } else if (firstUrl && currentUrls.length > 0 && currentUrls[0] !== firstUrl) {
    this.photoProofUrls = [firstUrl, ...currentUrls.filter((url) => url !== firstUrl)].slice(0, 5);
  }

  if (!this.disasterEventId && !this.distributionId) {
    this.invalidate('distributionId', 'Proof submissions must be linked to a distribution or disaster event.');
  }

  next();
});

ProofSubmissionSchema.index(
  { residentId: 1, distributionId: 1 },
  {
    unique: true,
    partialFilterExpression: { distributionId: { $exists: true, $type: 'objectId' } },
  },
);
ProofSubmissionSchema.index(
  { residentId: 1, disasterEventId: 1 },
  {
    unique: true,
    partialFilterExpression: { disasterEventId: { $exists: true, $type: 'objectId' } },
  },
);
ProofSubmissionSchema.index({ distributionId: 1, status: 1, createdAt: -1 });
ProofSubmissionSchema.index({ disasterEventId: 1, status: 1, createdAt: -1 });

ProofSubmissionSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    delete ret.__v;
    return ret;
  },
});

const ProofSubmission = mongoose.model<IProofSubmission>('ProofSubmission', ProofSubmissionSchema);

export default ProofSubmission;
