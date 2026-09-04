import mongoose, { Document, Schema } from 'mongoose';

export interface IResidentPushDevice extends Document {
  residentId: mongoose.Types.ObjectId;
  expoPushToken: string;
  platform: 'android' | 'ios';
  active: boolean;
  lastSeenAt: Date;
  disabledReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const residentPushDeviceSchema = new Schema<IResidentPushDevice>({
  residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
  expoPushToken: { type: String, required: true, trim: true, unique: true },
  platform: { type: String, enum: ['android', 'ios'], required: true },
  active: { type: Boolean, default: true, index: true },
  lastSeenAt: { type: Date, default: Date.now },
  disabledReason: { type: String, default: null },
}, { timestamps: true });

residentPushDeviceSchema.index({ residentId: 1, active: 1 });

export default mongoose.model<IResidentPushDevice>('ResidentPushDevice', residentPushDeviceSchema);