import mongoose, { Document, Schema } from 'mongoose';

export interface IResidentPasswordResetOtp extends Document {
  residentId: mongoose.Types.ObjectId;
  emailLower: string;
  otpHash: string;
  expiresAt: Date;
  attemptsLeft: number;
  createdAt: Date;
  lastSentAt: Date;
}

const ResidentPasswordResetOtpSchema = new Schema<IResidentPasswordResetOtp>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    emailLower: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attemptsLeft: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

ResidentPasswordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ResidentPasswordResetOtp = mongoose.model<IResidentPasswordResetOtp>(
  'ResidentPasswordResetOtp',
  ResidentPasswordResetOtpSchema,
);

export default ResidentPasswordResetOtp;
