/**
 * LoginVerifyOtp Model
 *
 * Stores hashed OTP codes for the login-verification flow.
 * Records auto-expire via a MongoDB TTL index on `expiresAt`.
 *
 * Separate from PasswordResetOtp to keep concerns isolated and avoid
 * accidental cross-purpose OTP acceptance.
 *
 * SECURITY:
 *  - OTP is NEVER stored in plaintext; only a bcrypt hash is persisted.
 *  - attemptsLeft prevents brute-force guessing of a single OTP.
 *  - TTL index ensures documents are automatically removed after expiry.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginVerifyOtp extends Document {
  userId?: mongoose.Types.ObjectId;
  emailLower: string;
  purpose: 'FIRST_LOGIN' | 'LOGIN_2FA' | 'SUPERADMIN_LOGIN_2FA' | 'PASSWORD_CHANGE_2FA';
  otpHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attemptsLeft: number;
  createdAt: Date;
  lastSentAt: Date;
}

const LoginVerifyOtpSchema = new Schema<ILoginVerifyOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'StaffUser',
      required: false,
    },
    emailLower: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['FIRST_LOGIN', 'LOGIN_2FA', 'SUPERADMIN_LOGIN_2FA', 'PASSWORD_CHANGE_2FA'],
      default: 'FIRST_LOGIN',
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
LoginVerifyOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup by email (one active OTP per email)
LoginVerifyOtpSchema.index({ emailLower: 1, purpose: 1 });

// Fast lookup by userId
LoginVerifyOtpSchema.index({ userId: 1, purpose: 1 });

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

const LoginVerifyOtp = mongoose.model<ILoginVerifyOtp>(
  'LoginVerifyOtp',
  LoginVerifyOtpSchema,
);

export default LoginVerifyOtp;
