/**
 * RegistrationOtp Model
 *
 * Stores hashed OTP codes for the mobile number verification flow
 * during household registration.
 *
 * Records auto-expire via a MongoDB TTL index on `expiresAt`.
 *
 * Separate from LoginVerifyOtp to keep concerns isolated and avoid
 * accidental cross-purpose OTP acceptance.
 *
 * SECURITY:
 *  - OTP is NEVER stored in plaintext; only a bcrypt hash is persisted.
 *  - attemptsLeft prevents brute-force guessing of a single OTP.
 *  - TTL index ensures documents are automatically removed after expiry.
 *  - resendCooldownUntil prevents SMS flooding.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistrationOtp extends Document {
  mobileNumber: string;
  otpHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attemptsLeft: number;
  resendCooldownUntil: Date;
  createdAt: Date;
  lastSentAt: Date;
}

const RegistrationOtpSchema = new Schema<IRegistrationOtp>(
  {
    mobileNumber: {
      type: String,
      required: true,
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
    usedAt: {
      type: Date,
      default: null,
    },
    resendCooldownUntil: {
      type: Date,
      default: () => new Date(0),
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
  {
    timestamps: false,
  },
);

/* ------------------------------------------------------------------ */
/*  Indexes                                                            */
/* ------------------------------------------------------------------ */

// TTL — auto-delete when expiresAt is reached
RegistrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

const RegistrationOtp = mongoose.model<IRegistrationOtp>(
  'RegistrationOtp',
  RegistrationOtpSchema,
);

export default RegistrationOtp;
