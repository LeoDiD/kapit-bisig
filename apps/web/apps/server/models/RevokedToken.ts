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

// TTL index: MongoDB automatically removes expired revoked-token entries.
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRevokedToken>('RevokedToken', RevokedTokenSchema);

