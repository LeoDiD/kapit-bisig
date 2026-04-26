import mongoose, { Document, Schema } from 'mongoose';

export type OfflineSyncQueueType = 'PROOF_SUBMISSION' | 'CLAIM';
export type OfflineSyncStatus = 'Pending' | 'Processing' | 'Synced' | 'Failed';
export type OfflineActorRole = 'Resident' | 'Volunteer' | 'LGU_STAFF' | 'Admin' | 'Staff' | 'SUPERADMIN';

export interface IOfflineSyncQueue extends Document {
  queueType: OfflineSyncQueueType;
  syncStatus: OfflineSyncStatus;
  actorId: string;
  actorRole: OfflineActorRole;
  residentId?: mongoose.Types.ObjectId | null;
  disasterEventId?: mongoose.Types.ObjectId | null;
  distributionId?: mongoose.Types.ObjectId | null;
  proofSubmissionId?: mongoose.Types.ObjectId | null;
  claimMongoId?: mongoose.Types.ObjectId | null;
  claimId?: string;
  clientGeneratedId: string;
  deviceId: string;
  payload: Record<string, unknown>;
  errorMessage?: string;
  syncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OfflineSyncQueueSchema = new Schema<IOfflineSyncQueue>(
  {
    queueType: {
      type: String,
      enum: ['PROOF_SUBMISSION', 'CLAIM'],
      required: true,
      index: true,
    },
    syncStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Synced', 'Failed'],
      default: 'Pending',
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['Resident', 'Volunteer', 'LGU_STAFF', 'Admin', 'Staff', 'SUPERADMIN'],
      required: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
    },
    disasterEventId: {
      type: Schema.Types.ObjectId,
      ref: 'DisasterEvent',
      default: null,
    },
    distributionId: {
      type: Schema.Types.ObjectId,
      ref: 'Distribution',
      default: null,
    },
    proofSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProofSubmission',
      default: null,
    },
    claimMongoId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },
    claimId: {
      type: String,
      default: '',
    },
    clientGeneratedId: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      default: '',
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      default: '',
    },
    syncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

OfflineSyncQueueSchema.index({ actorId: 1, queueType: 1, clientGeneratedId: 1 }, { unique: true });
OfflineSyncQueueSchema.index({ disasterEventId: 1, queueType: 1, syncStatus: 1 });
OfflineSyncQueueSchema.index({ distributionId: 1, queueType: 1, syncStatus: 1 });

OfflineSyncQueueSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    delete ret.__v;
    return ret;
  },
});

const OfflineSyncQueue = mongoose.model<IOfflineSyncQueue>('OfflineSyncQueue', OfflineSyncQueueSchema);

export default OfflineSyncQueue;
