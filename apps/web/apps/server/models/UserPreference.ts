import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreference extends Document {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  textSize: 'small' | 'medium' | 'large';
  defaultBarangay: string;
  timeFormat: '12h' | '24h';
  notifications: {
    emailNotifications: boolean;
    distributionAlerts: boolean;
    securityAlerts: boolean;
  };
  sessionsRevokedBefore: Date | null;
  currentActiveJti: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    textSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    defaultBarangay: {
      type: String,
      default: 'All',
      trim: true,
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h',
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      distributionAlerts: {
        type: Boolean,
        default: true,
      },
      securityAlerts: {
        type: Boolean,
        default: true,
      },
    },
    sessionsRevokedBefore: {
      type: Date,
      default: null,
    },
    currentActiveJti: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const UserPreference = mongoose.model<IUserPreference>('UserPreference', userPreferenceSchema);

export default UserPreference;
