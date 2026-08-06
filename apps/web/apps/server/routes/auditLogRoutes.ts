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
    
    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (actorRole) query.actorRole = actorRole;

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
