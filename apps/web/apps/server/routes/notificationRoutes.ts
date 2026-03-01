/**
 * Notification Routes
 *
 * GET    /api/notifications            – list notifications for current user (newest first)
 * PATCH  /api/notifications/mark-all-read – mark all unread as read
 * PATCH  /api/notifications/:id/read   – mark single notification as read
 */

import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest, requireAuth } from '../middleware/unifiedAuth';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/notifications
 * Returns the current user's notifications + global (userId=null) ones.
 * Query params: limit (default 20), offset (default 0), unreadOnly (boolean)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';

    const userId = req.authUser?.userId || null;
    const [userNotifications, globalNotifications] = await Promise.all([
      userId
        ? Notification.find({ userId }).sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      Notification.find({ userId: null }).sort({ createdAt: -1 }).lean(),
    ]);

    const scoped = [...userNotifications, ...globalNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const userId = req.authUser?.userId || null;

    await Promise.all([
      userId
        ? Notification.updateMany(
          { userId, isRead: false },
          { $set: { isRead: true } },
        )
        : Promise.resolve(),
      Notification.updateMany(
        { userId: null, isRead: false },
        { $set: { isRead: true } },
      ),
    ]);

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

    // Verify ownership (user's own or global)
    const userId = req.authUser?.userId || null;
    if (notification.userId && notification.userId.toString() !== userId) {
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

export default router;
