import { Router, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/unifiedAuth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is SUPERADMIN
    if (req.authUser?.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only SUPERADMIN can access audit logs.',
      });
    }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const skip = (page - 1) * limit;
    
    // Optional filters
    const action = req.query.action as string;
    const actorRole = req.query.actorRole as string;
    const actor = req.query.actor as string;
    const target = req.query.target as string;
    const ip = req.query.ip as string;
    const date = req.query.date as string;

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const andConditions: Record<string, unknown>[] = [];

    if (action) andConditions.push({ action });
    if (actorRole) andConditions.push({ actorRole });
    if (actor) {
      const escaped = escapeRegex(actor.trim());
      andConditions.push({
        $or: [
          { actorName: { $regex: escaped, $options: 'i' } },
          { actorId: { $regex: escaped, $options: 'i' } },
          { actorRole: { $regex: escaped, $options: 'i' } },
        ],
      });
    }
    if (target) {
      const escaped = escapeRegex(target.trim());
      andConditions.push({
        $or: [
          { entityType: { $regex: escaped, $options: 'i' } },
          { entityId: { $regex: escaped, $options: 'i' } },
        ],
      });
    }
    if (ip) {
      const escaped = escapeRegex(ip.trim());
      andConditions.push({
        $or: [
          { ip: { $regex: escaped, $options: 'i' } },
          { userAgent: { $regex: escaped, $options: 'i' } },
        ],
      });
    }
    if (date) {
      const start = new Date(date);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        andConditions.push({
          createdAt: { $gte: start, $lt: end },
        });
      }
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalDocs: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AuditLogRoutes] Fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

export default router;
