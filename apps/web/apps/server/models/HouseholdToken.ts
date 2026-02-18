/**
 * Household Token Model
 * 
 * Secure one-time use registration tokens for households.
 * 
 * Security Features:
 * 1. Tokens are stored hashed (bcrypt) - even DB compromise won't reveal tokens
 * 2. Unique index on tokenHash prevents duplicate registrations
 * 3. Status flow: UNUSED → LOCKED → USED (atomic transitions)
 * 4. Built-in expiration dates
 * 5. Optimistic locking with version field for concurrency control
 * 
 * Concurrency Protection:
 * - MongoDB unique index on tokenHash
 * - findOneAndUpdate with atomic conditions
 * - Lock timeout mechanism (30-60 seconds)
 * - Version field for optimistic locking
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

// Token status flow: UNUSED → LOCKED → USED
export type TokenStatus = 'UNUSED' | 'LOCKED' | 'USED' | 'EXPIRED';

export interface IHouseholdToken extends Document {
  // Token identifier (hashed) - the actual token is never stored
  tokenHash: string;
  
  // Token prefix for admin identification (first 4 chars, not secret)
  tokenPrefix: string;
  
  // Status management
  status: TokenStatus;
  
  // Lock information for concurrent registration protection
  lockedAt: Date | null;
  lockedBy: string | null; // IP or session ID
  lockExpiresAt: Date | null;
  
  // Expiration
  expiresAt: Date;
  
  // Usage tracking
  usedAt: Date | null;
  usedBy: {
    residentId: mongoose.Types.ObjectId | null;
    ipAddress: string | null;
    userAgent: string | null;
  };
  
  // Household information (set by barangay admin)
  householdInfo: {
    headOfHousehold: string;
    address: string;
    barangay: string;
    expectedMembers: number;
    notes: string;
  };
  
  // Admin tracking
  issuedBy: string; // Admin user ID
  issuedAt: Date;
  
  // Version for optimistic locking
  version: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  verifyToken(plainToken: string): Promise<boolean>;
}

// Static methods interface
export interface IHouseholdTokenModel extends mongoose.Model<IHouseholdToken> {
  generateToken(): { token: string; hash: string; prefix: string };
  findByTokenHash(tokenHash: string): Promise<IHouseholdToken | null>;
  atomicLock(tokenHash: string, lockerId: string, lockDurationSeconds?: number): Promise<IHouseholdToken | null>;
  atomicComplete(tokenHash: string, lockerId: string, residentId: mongoose.Types.ObjectId, ipAddress: string, userAgent: string): Promise<IHouseholdToken | null>;
  atomicUnlock(tokenHash: string, lockerId: string): Promise<IHouseholdToken | null>;
}

const HouseholdTokenSchema: Schema = new Schema(
  {
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true, // CRITICAL: Prevents race conditions at DB level
      index: true,
    },
    
    tokenPrefix: {
      type: String,
      required: true,
      index: true, // For admin lookup
    },
    
    status: {
      type: String,
      enum: ['UNUSED', 'LOCKED', 'USED', 'EXPIRED'],
      default: 'UNUSED',
      index: true,
    },
    
    // Lock fields for concurrent registration protection
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
    
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    
    usedAt: {
      type: Date,
      default: null,
    },
    usedBy: {
      residentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        default: null,
      },
      ipAddress: {
        type: String,
        default: null,
      },
      userAgent: {
        type: String,
        default: null,
      },
    },
    
    householdInfo: {
      headOfHousehold: {
        type: String,
        required: [true, 'Head of household name is required'],
        trim: true,
      },
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
      },
      barangay: {
        type: String,
        required: [true, 'Barangay is required'],
        trim: true,
      },
      expectedMembers: {
        type: Number,
        default: 1,
        min: 1,
      },
      notes: {
        type: String,
        trim: true,
        default: '',
      },
    },
    
    issuedBy: {
      type: String,
      required: [true, 'Issuer ID is required'],
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
HouseholdTokenSchema.index({ status: 1, expiresAt: 1 });
HouseholdTokenSchema.index({ 'householdInfo.barangay': 1, status: 1 });
HouseholdTokenSchema.index({ lockedAt: 1, lockExpiresAt: 1 }); // For lock cleanup

// TTL Index: Automatically delete expired tokens after 7 days past expiration
// MongoDB will run a background job every 60 seconds to remove expired documents
HouseholdTokenSchema.index(
  { expiresAt: 1 }, 
  { 
    expireAfterSeconds: 60 * 60 * 24 * 7, // 7 days after expiresAt
    partialFilterExpression: { status: { $in: ['EXPIRED', 'USED'] } } // Only delete EXPIRED or USED tokens
  }
);

/**
 * Generate a secure random token
 * 
 * Token format: XXXX-XXXX-XXXX (12 alphanumeric characters)
 * - Uses crypto.randomBytes for cryptographic security
 * - Returns both plain token (for user) and hash (for storage)
 */
HouseholdTokenSchema.statics.generateToken = function(): { token: string; hash: string; prefix: string } {
  // Generate 12 random bytes and convert to base36 (alphanumeric)
  const randomBytes = crypto.randomBytes(12);
  const token = randomBytes.toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 12)
    .toUpperCase();
  
  // Format as XXXX-XXXX-XXXX for readability
  const formattedToken = `${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
  
  // Hash the token for storage
  const hash = bcrypt.hashSync(formattedToken, SALT_ROUNDS);
  
  // Prefix for admin identification (not secret)
  const prefix = token.slice(0, 4);
  
  return { token: formattedToken, hash, prefix };
};

/**
 * Verify a plain token against the stored hash
 */
HouseholdTokenSchema.methods.verifyToken = async function(plainToken: string): Promise<boolean> {
  const token = this as IHouseholdToken;
  return bcrypt.compare(plainToken, token.tokenHash);
};

/**
 * Atomic lock acquisition
 * 
 * Uses MongoDB's findOneAndUpdate with conditions to atomically:
 * 1. Check token exists and is UNUSED (or lock expired)
 * 2. Check token hasn't expired
 * 3. Acquire lock by setting status to LOCKED
 * 
 * Returns null if:
 * - Token not found
 * - Token already used
 * - Token expired
 * - Token locked by another process (and lock not expired)
 */
HouseholdTokenSchema.statics.atomicLock = async function(
  tokenHash: string,
  lockerId: string,
  lockDurationSeconds: number = 60
): Promise<IHouseholdToken | null> {
  const now = new Date();
  const lockExpires = new Date(now.getTime() + lockDurationSeconds * 1000);
  
  // First, try to find and verify the token exists
  const existingToken = await this.findOne({ tokenHash });
  
  if (!existingToken) {
    return null;
  }
  
  // Atomic update with conditions
  // Only succeeds if:
  // - Status is UNUSED, OR
  // - Status is LOCKED but lock has expired (stale lock cleanup)
  const result = await this.findOneAndUpdate(
    {
      tokenHash,
      expiresAt: mongoose.trusted({ $gt: now }), // Token not expired
      $or: mongoose.trusted([
        { status: 'UNUSED' },
        { 
          status: 'LOCKED',
          lockExpiresAt: mongoose.trusted({ $lt: now }) // Lock expired, can be reclaimed
        }
      ])
    },
    {
      $set: {
        status: 'LOCKED',
        lockedAt: now,
        lockedBy: lockerId,
        lockExpiresAt: lockExpires,
      },
      $inc: { version: 1 }
    },
    {
      new: true,
      runValidators: true,
      sanitizeFilter: false,
    }
  );
  
  return result;
};

/**
 * Atomic completion - mark token as USED
 * 
 * Only succeeds if:
 * - Token is currently LOCKED
 * - Lock is held by the same lockerId
 * - Lock hasn't expired
 */
HouseholdTokenSchema.statics.atomicComplete = async function(
  tokenHash: string,
  lockerId: string,
  residentId: mongoose.Types.ObjectId,
  ipAddress: string,
  userAgent: string
): Promise<IHouseholdToken | null> {
  const now = new Date();
  
  const result = await this.findOneAndUpdate(
    {
      tokenHash,
      status: 'LOCKED',
      lockedBy: lockerId,
      lockExpiresAt: mongoose.trusted({ $gt: now }) // Lock still valid
    },
    {
      $set: {
        status: 'USED',
        usedAt: now,
        'usedBy.residentId': residentId,
        'usedBy.ipAddress': ipAddress,
        'usedBy.userAgent': userAgent,
        lockedAt: null,
        lockedBy: null,
        lockExpiresAt: null,
      },
      $inc: { version: 1 }
    },
    {
      new: true,
      runValidators: true,
      sanitizeFilter: false,
    }
  );
  
  return result;
};

/**
 * Atomic unlock - release lock without completing
 * 
 * Used when registration fails after locking
 */
HouseholdTokenSchema.statics.atomicUnlock = async function(
  tokenHash: string,
  lockerId: string
): Promise<IHouseholdToken | null> {
  const result = await this.findOneAndUpdate(
    {
      tokenHash,
      status: 'LOCKED',
      lockedBy: lockerId,
    },
    {
      $set: {
        status: 'UNUSED',
        lockedAt: null,
        lockedBy: null,
        lockExpiresAt: null,
      },
      $inc: { version: 1 }
    },
    {
      new: true,
      runValidators: true,
      sanitizeFilter: false,
    }
  );
  
  return result;
};

// Auto-expire tokens check (can be called periodically)
HouseholdTokenSchema.statics.expireStaleTokens = async function(): Promise<number> {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      status: mongoose.trusted({ $in: ['UNUSED', 'LOCKED'] }),
      expiresAt: mongoose.trusted({ $lt: now })
    },
    {
      $set: { status: 'EXPIRED' }
    }
  ).setOptions({ sanitizeFilter: false });
  
  return result.modifiedCount;
};

// Remove sensitive data from JSON
HouseholdTokenSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.__v;
    // Never expose the hash
    delete ret.tokenHash;
    return ret;
  },
});

export default mongoose.model<IHouseholdToken, IHouseholdTokenModel>('HouseholdToken', HouseholdTokenSchema);
