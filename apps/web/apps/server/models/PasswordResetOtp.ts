/**
 * PasswordResetOtp Model (Option A — separate OTP collection)
 *
 * Stores hashed OTP codes for the forgot-password flow.
 * Records auto-expire via a MongoDB TTL index on `expiresAt`.
 *
 * SECURITY:
 *  - OTP is NEVER stored in plaintext; only a bcrypt hash is persisted.
 *  - attemptsLeft prevents brute-force guessing of a single OTP.
 *  - TTL index ensures documents are automatically removed after expiry.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordResetOtp extends Document {
  userId: mongoose.Types.ObjectId;
  emailLower: string;
  otpHash: string;
  expiresAt: Date;
  attemptsLeft: number;
  createdAt: Date;
  lastSentAt: Date;
}

const PasswordResetOtpSchema = new Schema<IPasswordResetOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'StaffUser',
      required: true,
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
  {
    timestamps: false, // we manage our own createdAt / lastSentAt
  },
);

/* ------------------------------------------------------------------ */
/*  Indexes                                                            */
/* ------------------------------------------------------------------ */

// TTL — auto-delete when expiresAt is reached
PasswordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup by user / email
PasswordResetOtpSchema.index({ userId: 1 });

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

const PasswordResetOtp = mongoose.model<IPasswordResetOtp>(
  'PasswordResetOtp',
  PasswordResetOtpSchema,
);

export default PasswordResetOtp;
