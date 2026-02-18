/**
 * Profile Routes (self-service)
 *
 * GET    /api/users/me                  – get current user profile
 * PATCH  /api/users/me                  – update own profile (firstName, lastName, phone, organization)
 * POST   /api/users/me/change-password  – change own password
 * PATCH  /api/users/me/preferences      – update UI preferences (theme)
 */

import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import StaffUser from '../models/StaffUser';
import { AuthRequest, requireAuth } from '../middleware/unifiedAuth';
import { validatePassword } from '../utils/passwordValidator';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                       */
/* ------------------------------------------------------------------ */

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100).optional(),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

/* ------------------------------------------------------------------ */
/*  GET /api/users/me                                                 */
/* ------------------------------------------------------------------ */

router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const { role, sub: username, userId } = req.authUser!;

    if (role === 'SUPERADMIN') {
      // SUPERADMIN profile is env-based — return minimal info
      return res.json({
        success: true,
        data: {
          username,
          role,
          fullName: 'Super Admin',
          email: '',
          avatarUrl: null,
        },
      });
    }

    // LGU_STAFF — fetch from DB
    const staff = await StaffUser.findById(userId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        id: staff._id.toString(),
        username: staff.username,
        role: staff.role,
        fullName: staff.fullName,
        email: staff.email,
        avatarUrl: staff.avatarUrl || null,
        assignedBarangays: staff.assignedBarangays,
      },
    });
  } catch (err) {
    console.error('[Profile] GET /me error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/users/me                                               */
/* ------------------------------------------------------------------ */

router.patch('/me', async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.authUser!;

    if (role === 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        message: 'SUPERADMIN profile cannot be modified via API',
      });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e: any) => e.message),
      });
    }

    const { fullName, username } = parsed.data;

    const staff = await StaffUser.findById(userId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName !== undefined) {
      staff.fullName = fullName;
    }

    if (username !== undefined) {
      const normalizedUsername = username.toLowerCase();
      // Check uniqueness (case-insensitive), excluding current user
      const duplicate = await StaffUser.findOne({
        username: normalizedUsername,
        _id: { $ne: userId },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
      staff.username = normalizedUsername;
    }

    await staff.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        fullName: staff.fullName,
        username: staff.username,
      },
    });
  } catch (err) {
    console.error('[Profile] PATCH /me error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/users/me/avatar  — upload profile picture               */
/* ------------------------------------------------------------------ */

const uploadsDir = path.resolve(__dirname, '../../public/uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req: any, file, cb) => {
    const userId = req.authUser?.userId || req.authUser?.sub || 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${userId}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.post('/me/avatar', avatarUpload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.authUser!;

    // SUPERADMIN is env-based, not in DB — cannot store avatar
    if (role === 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Avatar upload not available for Superadmin.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await StaffUser.findByIdAndUpdate(userId, { avatarUrl });

    return res.json({ success: true, data: { avatarUrl } });
  } catch (err) {
    console.error('[Profile] avatar upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/users/me/change-password                                */
/* ------------------------------------------------------------------ */

router.post('/me/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.authUser!;

    if (role === 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        message: 'SUPERADMIN password is managed via environment configuration',
      });
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e: any) => e.message),
      });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Reject whitespace explicitly (also checked by validatePassword)
    if (/\s/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must not contain spaces or whitespace',
        errors: ['Password must not contain spaces or whitespace'],
      });
    }

    // Validate new password strength
    const pwResult = validatePassword(newPassword);
    if (!pwResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: pwResult.errors,
      });
    }

    // Fetch user with password hash
    const staff = await StaffUser.findById(userId).select('+passwordHash');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await staff.comparePassword(currentPassword);
    if (!isMatch) {
      // Generic error to prevent account enumeration
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash and save new password
    const SALT_ROUNDS = 12;
    staff.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await staff.save();

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    console.error('[Profile] change-password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/users/me/preferences                                   */
/* ------------------------------------------------------------------ */

router.patch('/me/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences',
      });
    }

    // For now, accept the preferences and echo back.
    // In production, this would persist to a UserPreferences collection.
    return res.json({
      success: true,
      message: 'Preferences saved',
      data: parsed.data,
    });
  } catch (err) {
    console.error('[Profile] preferences error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save preferences' });
  }
});

export default router;
