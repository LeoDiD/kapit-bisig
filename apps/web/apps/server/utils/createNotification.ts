/**
 * createNotification utility
 *
 * Inserts one or more Notification documents for system events
 * (claims, distributions, security, etc.).
 */

import Notification, { NotificationType } from '../models/Notification';
import StaffUser from '../models/StaffUser';

interface NotificationPayload {
  /** null = broadcast to everyone (SUPERADMIN + all staff) */
  userId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  meta?: Record<string, unknown>;
}

/**
 * Create a single notification document.
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    await Notification.create({
      userId: payload.userId ?? null,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      meta: payload.meta,
    });
  } catch (err: any) {
    console.warn('[createNotification] Failed:', err.message);
  }
}

/**
 * Broadcast a notification to ALL active staff users (userId = null means
 * it appears for everyone via the query `{ userId: { $in: [userId, null] } }`).
 */
export async function broadcastNotification(
  payload: Omit<NotificationPayload, 'userId'>,
): Promise<void> {
  await createNotification({ ...payload, userId: null });
}
