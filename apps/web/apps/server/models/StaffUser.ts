/**
 * StaffUser Model
 *
 * [SECURITY CHECKLIST §1.1] Strong Password Hashing (bcrypt 12 rounds)
 * [SECURITY CHECKLIST §3.2] RBAC - LGU_STAFF role + assignedBarangays
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export interface IStaffUser extends Document {
  username?: string;
  email: string;
  emailLower: string;
  passwordHash?: string;
  forcePasswordReset: boolean;
  firstName: string;
  lastName: string;
  fullName?: string;
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
      required: false,
      select: false,
    },
    forcePasswordReset: {
      type: Boolean,
      default: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [60, 'First name cannot exceed 60 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [60, 'Last name cannot exceed 60 characters'],
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
      default: [],
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

staffUserSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

staffUserSchema.pre('save', function (next) {
  if (!this.firstName || !this.lastName) {
    const legacyFullName = String((this as any).fullName || '').trim();
    if (legacyFullName) {
      const parts = legacyFullName.split(/\s+/).filter(Boolean);
      if (!this.firstName) this.firstName = parts[0] || 'Staff';
      if (!this.lastName) this.lastName = parts.slice(1).join(' ') || 'User';
    } else {
      const local = String(this.email || '').split('@')[0] || 'staff';
      if (!this.firstName) this.firstName = local;
      if (!this.lastName) this.lastName = 'User';
    }
  }

  if (this.isModified('email') || !this.emailLower) {
    this.emailLower = this.email.trim().toLowerCase();
  }
  next();
});

staffUserSchema.virtual('fullName').get(function (this: IStaffUser) {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

staffUserSchema.virtual('username').get(function (this: IStaffUser) {
  return this.emailLower;
});

staffUserSchema.statics.hashPassword = async function (
  plaintext: string,
): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

staffUserSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    ret.fullName = `${ret.firstName || ''} ${ret.lastName || ''}`.trim();
    ret.username = ret.emailLower || ret.email;
    delete ret.passwordHash;
    delete ret.__v;
    delete ret.emailLower;
    return ret;
  },
  virtuals: true,
});

staffUserSchema.index({ role: 1, isActive: 1 });
staffUserSchema.index({ assignedBarangays: 1, isActive: 1 });
staffUserSchema.index({ firstName: 1, lastName: 1 });

const StaffUser = mongoose.model<IStaffUser>('StaffUser', staffUserSchema);

export default StaffUser;
