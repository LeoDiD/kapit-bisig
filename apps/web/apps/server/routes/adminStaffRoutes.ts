/**
 * Admin Staff-User Management Routes  (SUPERADMIN only)
 *
 * POST   /api/admin/users                 – create LGU_STAFF account
 * GET    /api/admin/users                 – list staff users (search, barangay, status)
 * GET    /api/admin/users/stats           – aggregate counts
 * PATCH  /api/admin/users/:id             – update fullName, assignedBarangays, isActive
 * PATCH  /api/admin/users/:id/reset-password – reset password
 */

import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import StaffUser from '../models/StaffUser';
import { BARANGAY_OPTIONS } from '../models/Distribution';
import {
  requireAuth,
  requireSuperadmin,
  AuthRequest,
  logSecurity,
} from '../middleware/unifiedAuth';

const router = Router();
const SALT_ROUNDS = 12;

/* ------------------------------------------------------------------ */
/*  Password strength validator (same rules as hashPassword.js)       */
/* ------------------------------------------------------------------ */
function validateStrongPassword(pw: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pw.length < 16) errors.push('Must be at least 16 characters');
  if (!/[A-Z]/.test(pw)) errors.push('Must contain an uppercase letter');
  if (!/[a-z]/.test(pw)) errors.push('Must contain a lowercase letter');
  if (!/[0-9]/.test(pw)) errors.push('Must contain a digit');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Must contain a symbol');

  const common = ['password', '12345678', 'qwerty', 'letmein', 'admin'];
  if (common.some((c) => pw.toLowerCase().includes(c)))
    errors.push('Contains a common pattern');

  return { ok: errors.length === 0, errors };
}

/* ------------------------------------------------------------------ */
/*  All routes require SUPERADMIN                                     */
/* ------------------------------------------------------------------ */
router.use(requireAuth, requireSuperadmin);

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users                                             */
/* ------------------------------------------------------------------ */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { username, fullName, password, assignedBarangays } = req.body;

    // --- validation ---
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
      return;
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Password is required.' });
      return;
    }

    const pwCheck = validateStrongPassword(password);
    if (!pwCheck.ok) {
      res.status(400).json({
        success: false,
        message: 'Password is too weak.',
        errors: pwCheck.errors,
      });
      return;
    }

    if (
      !Array.isArray(assignedBarangays) ||
      assignedBarangays.length === 0 ||
      !assignedBarangays.every((b: string) =>
        (BARANGAY_OPTIONS as readonly string[]).includes(b),
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'assignedBarangays must be a non-empty array from: ' +
          (BARANGAY_OPTIONS as readonly string[]).join(', '),
      });
      return;
    }

    // Duplicate check
    const exists = await StaffUser.findOne({
      username: username.trim().toLowerCase(),
    });
    if (exists) {
      res.status(409).json({ success: false, message: 'Username already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new StaffUser({
      username: username.trim().toLowerCase(),
      passwordHash,
      fullName: fullName.trim(),
      assignedBarangays,
    });

    await user.save();

    logSecurity('ADMIN_CREATE_STAFF', {
      admin: req.authUser?.sub,
      newUser: user.username,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created.',
      data: user.toJSON(),
    });
  } catch (err) {
    console.error('[ADMIN_CREATE_STAFF]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/admin/users                                              */
/* ------------------------------------------------------------------ */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, barangay, status } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (search && typeof search === 'string') {
      const re = new RegExp(search, 'i');
      filter.$or = [{ username: re }, { fullName: re }];
    }
    if (barangay && typeof barangay === 'string') {
      filter.assignedBarangays = barangay;
    }
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    const users = await StaffUser.find(filter).sort({ createdAt: -1 }).lean();

    // Remap _id → id
    const data = users.map((u) => ({
      ...u,
      id: u._id.toString(),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('[ADMIN_LIST_STAFF]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/admin/users/stats                                        */
/* ------------------------------------------------------------------ */
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const total = await StaffUser.countDocuments();
    const active = await StaffUser.countDocuments({ isActive: true });
    const inactive = total - active;

    res.json({
      success: true,
      data: { total, active, inactive },
    });
  } catch (err) {
    console.error('[ADMIN_STAFF_STATS]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/users/:id                                        */
/* ------------------------------------------------------------------ */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, assignedBarangays, isActive } = req.body;

    const user = await StaffUser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Staff user not found.' });
      return;
    }

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length < 2) {
        res.status(400).json({ success: false, message: 'Full name is required.' });
        return;
      }
      user.fullName = fullName.trim();
    }

    if (assignedBarangays !== undefined) {
      if (
        !Array.isArray(assignedBarangays) ||
        assignedBarangays.length === 0 ||
        !assignedBarangays.every((b: string) =>
          (BARANGAY_OPTIONS as readonly string[]).includes(b),
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'assignedBarangays must be a non-empty array from: ' +
            (BARANGAY_OPTIONS as readonly string[]).join(', '),
        });
        return;
      }
      user.assignedBarangays = assignedBarangays;
    }

    if (isActive !== undefined) {
      user.isActive = !!isActive;
    }

    await user.save();

    logSecurity('ADMIN_UPDATE_STAFF', {
      admin: req.authUser?.sub,
      target: user.username,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Staff user updated.', data: user.toJSON() });
  } catch (err) {
    console.error('[ADMIN_UPDATE_STAFF]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/users/:id/reset-password                         */
/* ------------------------------------------------------------------ */
router.patch('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ success: false, message: 'newPassword is required.' });
      return;
    }

    const pwCheck = validateStrongPassword(newPassword);
    if (!pwCheck.ok) {
      res.status(400).json({
        success: false,
        message: 'Password is too weak.',
        errors: pwCheck.errors,
      });
      return;
    }

    const user = await StaffUser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Staff user not found.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    logSecurity('ADMIN_RESET_PASSWORD', {
      admin: req.authUser?.sub,
      target: user.username,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Password has been reset.' });
  } catch (err) {
    console.error('[ADMIN_RESET_PW]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;
