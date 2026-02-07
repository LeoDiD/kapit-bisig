/**
 * Registration Audit Log Model
 * 
 * Comprehensive audit trail for all registration token activities.
 * 
 * Security Features:
 * 1. Immutable records - no updates or deletes allowed
 * 2. Captures IP address, user agent, and timestamps
 * 3. Tracks all token lifecycle events
 * 4. Enables security forensics and compliance
 * 
 * Events Tracked:
 * - TOKEN_GENERATED: Admin creates new token
 * - TOKEN_VALIDATED: User submits valid token
 * - TOKEN_INVALID: User submits invalid/expired token
 * - TOKEN_LOCKED: Token locked for registration
 * - TOKEN_LOCK_FAILED: Concurrent lock attempt blocked
 * - TOKEN_UNLOCKED: Lock released (registration failed)
 * - TOKEN_USED: Registration completed successfully
 * - TOKEN_EXPIRED: Token expired
 * - RATE_LIMITED: Request blocked by rate limiter
 * - BRUTE_FORCE_DETECTED: Suspicious activity detected
 */

import mongoose, { Document, Schema } from 'mongoose';

export type AuditEventType = 
  | 'TOKEN_GENERATED'
  | 'TOKEN_VALIDATED'
  | 'TOKEN_INVALID'
  | 'TOKEN_LOCKED'
  | 'TOKEN_LOCK_FAILED'
  | 'TOKEN_UNLOCKED'
  | 'TOKEN_USED'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMITED'
  | 'BRUTE_FORCE_DETECTED'
  | 'REGISTRATION_STARTED'
  | 'REGISTRATION_COMPLETED'
  | 'REGISTRATION_FAILED';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface IRegistrationAuditLog extends Document {
  // Event identification
  eventType: AuditEventType;
  severity: AuditSeverity;
  
  // Token reference (prefix only for security)
  tokenPrefix: string | null;
  tokenId: mongoose.Types.ObjectId | null;
  
  // Request context
  ipAddress: string;
  userAgent: string;
  requestId: string; // Unique request identifier
  
  // Geographic info (if available)
  geoLocation?: {
    country: string;
    region: string;
    city: string;
  };
  
  // Event details
  details: {
    message: string;
    metadata?: Record<string, unknown>;
  };
  
  // Outcome
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Related entities
  residentId?: mongoose.Types.ObjectId;
  adminId?: string;
  
  // Processing time
  processingTimeMs?: number;
  
  // Timestamp (immutable)
  timestamp: Date;
}

const RegistrationAuditLogSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      enum: [
        'TOKEN_GENERATED',
        'TOKEN_VALIDATED',
        'TOKEN_INVALID',
        'TOKEN_LOCKED',
        'TOKEN_LOCK_FAILED',
        'TOKEN_UNLOCKED',
        'TOKEN_USED',
        'TOKEN_EXPIRED',
        'RATE_LIMITED',
        'BRUTE_FORCE_DETECTED',
        'REGISTRATION_STARTED',
        'REGISTRATION_COMPLETED',
        'REGISTRATION_FAILED',
      ],
      required: [true, 'Event type is required'],
      index: true,
    },
    
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
      default: 'INFO',
      index: true,
    },
    
    tokenPrefix: {
      type: String,
      default: null,
      index: true,
    },
    
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HouseholdToken',
      default: null,
      index: true,
    },
    
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      index: true,
    },
    
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
    },
    
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      index: true,
    },
    
    geoLocation: {
      country: String,
      region: String,
      city: String,
    },
    
    details: {
      message: {
        type: String,
        required: [true, 'Message is required'],
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    
    errorCode: {
      type: String,
      default: null,
    },
    
    errorMessage: {
      type: String,
      default: null,
    },
    
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
      index: true,
    },
    
    adminId: {
      type: String,
      default: null,
      index: true,
    },
    
    processingTimeMs: {
      type: Number,
      default: null,
    },
    
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true, // Cannot be modified after creation
      index: true,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
    // Prevent updates and deletes for audit integrity
    strict: true,
  }
);

// Compound indexes for common queries
RegistrationAuditLogSchema.index({ ipAddress: 1, timestamp: -1 });
RegistrationAuditLogSchema.index({ eventType: 1, timestamp: -1 });
RegistrationAuditLogSchema.index({ tokenPrefix: 1, timestamp: -1 });
RegistrationAuditLogSchema.index({ severity: 1, timestamp: -1 });

// TTL index - keep audit logs for 2 years (compliance requirement)
RegistrationAuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 } // 2 years
);

/**
 * Static method to create audit log entry
 * Ensures consistent logging format
 */
RegistrationAuditLogSchema.statics.log = async function(params: {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  tokenPrefix?: string | null;
  tokenId?: mongoose.Types.ObjectId | null;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  message: string;
  metadata?: Record<string, unknown>;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  residentId?: mongoose.Types.ObjectId;
  adminId?: string;
  processingTimeMs?: number;
  geoLocation?: { country: string; region: string; city: string };
}): Promise<IRegistrationAuditLog> {
  const log = new this({
    eventType: params.eventType,
    severity: params.severity || 'INFO',
    tokenPrefix: params.tokenPrefix || null,
    tokenId: params.tokenId || null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    requestId: params.requestId,
    details: {
      message: params.message,
      metadata: params.metadata || {},
    },
    success: params.success,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    residentId: params.residentId,
    adminId: params.adminId,
    processingTimeMs: params.processingTimeMs,
    geoLocation: params.geoLocation,
    timestamp: new Date(),
  });
  
  return log.save();
};

/**
 * Static method to detect brute force attempts
 * Returns true if suspicious activity detected
 */
RegistrationAuditLogSchema.statics.detectBruteForce = async function(
  ipAddress: string,
  windowMinutes: number = 15,
  maxAttempts: number = 10
): Promise<{ detected: boolean; attemptCount: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const attemptCount = await this.countDocuments({
    ipAddress,
    eventType: { $in: ['TOKEN_INVALID', 'TOKEN_LOCK_FAILED', 'RATE_LIMITED'] },
    timestamp: { $gte: windowStart },
  });
  
  return {
    detected: attemptCount >= maxAttempts,
    attemptCount,
  };
};

/**
 * Static method to get recent activity for an IP
 */
RegistrationAuditLogSchema.statics.getRecentActivity = async function(
  ipAddress: string,
  limit: number = 50
): Promise<IRegistrationAuditLog[]> {
  return this.find({ ipAddress })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Static method to get token usage history
 */
RegistrationAuditLogSchema.statics.getTokenHistory = async function(
  tokenPrefix: string,
  limit: number = 100
): Promise<IRegistrationAuditLog[]> {
  return this.find({ tokenPrefix })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Interface for static methods
export interface IRegistrationAuditLogModel extends mongoose.Model<IRegistrationAuditLog> {
  log(params: {
    eventType: AuditEventType;
    severity?: AuditSeverity;
    tokenPrefix?: string | null;
    tokenId?: mongoose.Types.ObjectId | null;
    ipAddress: string;
    userAgent: string;
    requestId: string;
    message: string;
    metadata?: Record<string, unknown>;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    residentId?: mongoose.Types.ObjectId;
    adminId?: string;
    processingTimeMs?: number;
    geoLocation?: { country: string; region: string; city: string };
  }): Promise<IRegistrationAuditLog>;
  
  detectBruteForce(
    ipAddress: string,
    windowMinutes?: number,
    maxAttempts?: number
  ): Promise<{ detected: boolean; attemptCount: number }>;
  
  getRecentActivity(
    ipAddress: string,
    limit?: number
  ): Promise<IRegistrationAuditLog[]>;
  
  getTokenHistory(
    tokenPrefix: string,
    limit?: number
  ): Promise<IRegistrationAuditLog[]>;
}

// Prevent modifications to audit logs
RegistrationAuditLogSchema.pre('updateOne', function() {
  throw new Error('Audit logs cannot be modified');
});

RegistrationAuditLogSchema.pre('updateMany', function() {
  throw new Error('Audit logs cannot be modified');
});

RegistrationAuditLogSchema.pre('findOneAndUpdate', function() {
  throw new Error('Audit logs cannot be modified');
});

RegistrationAuditLogSchema.pre('findOneAndDelete', function() {
  throw new Error('Audit logs cannot be deleted');
});

RegistrationAuditLogSchema.pre('deleteOne', function() {
  throw new Error('Audit logs cannot be deleted');
});

RegistrationAuditLogSchema.pre('deleteMany', function() {
  throw new Error('Audit logs cannot be deleted');
});

export default mongoose.model<IRegistrationAuditLog, IRegistrationAuditLogModel>(
  'RegistrationAuditLog',
  RegistrationAuditLogSchema
);
