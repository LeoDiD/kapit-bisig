/**
 * Notification Model
 *
 * Stores per-user notifications (dispatch updates, status changes,
 * volunteer activity, system maintenance, security alerts, etc.).
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'dispatch'
  | 'status_update'
  | 'volunteer'
  | 'system'
  | 'security'
  | 'info';

export interface INotification extends Document {
  userId: Types.ObjectId | null; // null = global / broadcast
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'StaffUser',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['dispatch', 'status_update', 'volunteer', 'system', 'security', 'info'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true },
);

// Compound index – newest first per user
notificationSchema.index({ userId: 1, createdAt: -1 });

// TTL – auto-delete after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

notificationSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
