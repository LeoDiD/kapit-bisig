/**
 * Notification Routes
 *
 * GET    /api/notifications            - list notifications for current actor
 * PATCH  /api/notifications/mark-all-read - mark all visible notifications as read
 * PATCH  /api/notifications/:id/read   - mark single notification as read
 * DELETE /api/notifications            - delete all visible notifications
 * DELETE /api/notifications/:id        - delete a single notification
 */

import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest, requireAuth } from '../middleware/unifiedAuth';

const router = Router();

function canAccessNotification(req: AuthRequest, notification: { userId?: any | null }): boolean {
  const role = req.authUser?.role;
  const actorId = req.authUser?.userId || null;
  const ownerId = notification.userId ? notification.userId.toString() : null;

  // Superadmin can access global notifications and personal notifications with matching userId.
  if (role === 'SUPERADMIN') {
    if (ownerId === null) return true;
    return !!actorId && ownerId === actorId;
  }

  // Staff/other roles only access notifications directly addressed to their account.
  if (!actorId || ownerId === null) return false;
  return ownerId === actorId;
}

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/notifications
 * Query params: limit (default 20), offset (default 0), unreadOnly (boolean)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';

    const role = req.authUser?.role;
    const userId = req.authUser?.userId || null;

    let scoped: any[] = [];
    if (role === 'SUPERADMIN') {
      const [personal, global] = await Promise.all([
        userId ? Notification.find({ userId }).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
        Notification.find({ userId: null }).sort({ createdAt: -1 }).lean(),
      ]);
      scoped = [...personal, ...global]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (userId) {
      scoped = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
    }

    const unreadCount = scoped.filter((n) => !n.isRead).length;
    const filtered = unreadOnly ? scoped.filter((n) => !n.isRead) : scoped;
    const total = filtered.length;
    const notifications = filtered.slice(offset, offset + limit);

    return res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    });
  } catch (err) {
    console.error('[Notifications] GET error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 */
router.patch('/mark-all-read', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.authUser?.role;
    const userId = req.authUser?.userId || null;

    if (role === 'SUPERADMIN') {
      if (userId) {
        await Notification.updateMany(
          { $or: [{ userId }, { userId: null }], isRead: false },
          { $set: { isRead: true } },
        );
      } else {
        await Notification.updateMany(
          { userId: null, isRead: false },
          { $set: { isRead: true } },
        );
      }
    } else if (userId) {
      await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } },
      );
    }

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Notifications] mark-all-read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all read' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!canAccessNotification(req, notification)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ success: true, data: notification });
  } catch (err) {
    console.error('[Notifications] mark-read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

/**
 * DELETE /api/notifications
 */
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.authUser?.role;
    const userId = req.authUser?.userId || null;

    let deletedCount = 0;
    if (role === 'SUPERADMIN') {
      if (userId) {
        const result = await Notification.deleteMany({ $or: [{ userId }, { userId: null }] });
        deletedCount = result.deletedCount || 0;
      } else {
        const result = await Notification.deleteMany({ userId: null });
        deletedCount = result.deletedCount || 0;
      }
    } else if (userId) {
      const result = await Notification.deleteMany({ userId });
      deletedCount = result.deletedCount || 0;
    }

    return res.json({
      success: true,
      data: { deletedCount },
      message: 'All notifications deleted',
    });
  } catch (err) {
    console.error('[Notifications] delete-all error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete notifications' });
  }
});

/**
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!canAccessNotification(req, notification)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await notification.deleteOne();
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('[Notifications] delete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

export default router;
