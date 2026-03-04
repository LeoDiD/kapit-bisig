/**
 * createNotification utility
 *
 * Inserts one or more Notification documents for system events
 * (claims, distributions, security, etc.).
 */

import Notification, { NotificationType } from '../models/Notification';
import StaffUser from '../models/StaffUser';

interface NotificationPayload {
  /** null = superadmin/global notification */
  userId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  meta?: Record<string, unknown>;
}

interface ScopedBroadcastPayload extends Omit<NotificationPayload, 'userId'> {
  /**
   * Optional scope filter for staff recipients.
   * When provided, only staff with overlapping assignedBarangays receive the notification.
   */
  targetBarangays?: string[];
  /** Whether to also deliver a superadmin copy (stored as userId=null). Default true. */
  includeSuperadmin?: boolean;
}

function normalizeBarangays(values?: string[]): string[] {
  if (!values || values.length === 0) return [];
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
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
 * Broadcast a notification to staff users (optionally scoped by barangay)
 * and also create a superadmin copy.
 */
export async function broadcastScopedNotification(
  payload: ScopedBroadcastPayload,
): Promise<void> {
  try {
    const targetBarangays = normalizeBarangays(payload.targetBarangays);
    const filter: Record<string, unknown> = { isActive: true };
    if (targetBarangays.length > 0) {
      filter.assignedBarangays = { $in: targetBarangays };
    }

    const staffRecipients = await StaffUser.find(filter).select('_id').lean();
    const docs: Array<{
      userId: any | null;
      title: string;
      message: string;
      type: NotificationType;
      meta?: Record<string, unknown>;
    }> = staffRecipients.map((staff) => ({
      userId: staff._id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      meta: payload.meta,
    }));

    if (payload.includeSuperadmin !== false) {
      docs.push({
        userId: null,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        meta: payload.meta,
      });
    }

    if (docs.length === 0) return;
    await Notification.insertMany(docs, { ordered: false });
  } catch (err: any) {
    console.warn('[broadcastScopedNotification] Failed:', err.message);
  }
}

/**
 * Broadcast a notification to all active staff users + superadmin.
 */
export async function broadcastNotification(
  payload: Omit<NotificationPayload, 'userId'>,
): Promise<void> {
  await broadcastScopedNotification(payload);
}
