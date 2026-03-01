// [SECURITY CHECKLIST §1.7] Logout Invalidates Session — revoked token storage
import mongoose, { Document, Schema } from 'mongoose';

export interface IRevokedToken extends Document {
  jti: string;
  tokenType: 'access' | 'session';
  expiresAt: Date;
  revokedAt: Date;
}

const RevokedTokenSchema = new Schema<IRevokedToken>(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenType: {
      type: String,
      enum: ['access', 'session'],
      default: 'access',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false }
);

// [SECURITY CHECKLIST §1.7] TTL index: auto-clean expired revoked tokens
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRevokedToken>('RevokedToken', RevokedTokenSchema);

