/**
 * StaffUser Model
 *
 * MongoDB schema for LGU Staff accounts that can log in via the web app.
 * SUPERADMIN is NOT stored in the DB; it lives in env vars.
 *
 * Fields:
 *   username        – unique login name
 *   passwordHash    – bcrypt hash
 *   fullName        – display name
 *   role            – always "LGU_STAFF"
 *   assignedBarangays – string[] from the canonical list
 *   isActive        – soft-disable flag (default true)
 *   lastLoginAt     – optional
 *   createdAt / updatedAt – timestamps
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { BARANGAY_OPTIONS } from './Distribution';

const SALT_ROUNDS = 12;

export interface IStaffUser extends Document {
  username: string;
  email: string;
  emailLower: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  role: 'LGU_STAFF';
  assignedBarangays: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastOtpVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const staffUserSchema = new Schema<IStaffUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [60, 'Username cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      maxlength: [255, 'Email cannot exceed 255 characters'],
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    emailLower: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never include by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['LGU_STAFF'],
      default: 'LGU_STAFF',
      required: true,
    },
    assignedBarangays: {
      type: [String],
      required: [true, 'At least one assigned barangay is required'],
      validate: {
        validator: function (arr: string[]) {
          if (!arr || arr.length === 0) return false;
          return arr.every((b) =>
            (BARANGAY_OPTIONS as readonly string[]).includes(b),
          );
        },
        message:
          'Each assigned barangay must be one of: ' +
          (BARANGAY_OPTIONS as readonly string[]).join(', '),
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastOtpVerifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

/**
 * Instance method: compare candidate password against stored hash.
 */
staffUserSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * Pre-save hook: normalise email → emailLower.
 */
staffUserSchema.pre('save', function (next) {
  if (this.isModified('email') || !this.emailLower) {
    this.emailLower = this.email.trim().toLowerCase();
  }
  next();
});

/**
 * Static helper: hash a password (used when creating / resetting).
 */
staffUserSchema.statics.hashPassword = async function (
  plaintext: string,
): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

/**
 * JSON transform – strip sensitive / internal fields.
 */
staffUserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.passwordHash;
    delete ret.__v;
    delete ret.emailLower; // emailLower is internal; expose email only
    return ret;
  },
});

const StaffUser = mongoose.model<IStaffUser>('StaffUser', staffUserSchema);

export default StaffUser;
