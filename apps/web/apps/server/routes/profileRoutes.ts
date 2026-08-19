/**
 * Profile Routes (self-service)
 *
 * GET    /api/users/me                              – get current user profile
 * PATCH  /api/users/me                              – update own profile (firstName, lastName, phone, organization)
 * POST   /api/users/me/change-password/request-otp  – validate password, send OTP
 * POST   /api/users/me/change-password/confirm       – verify OTP, change password
 * PATCH  /api/users/me/preferences                   – update UI preferences (theme)
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import StaffUser from '../models/StaffUser';
import Distribution from '../models/Distribution';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import { AuthRequest, requireAuth, requireStaffOrSuperadmin } from '../middleware/unifiedAuth';
import { validatePassword } from '../utils/passwordValidator';
import { validateRequest } from '../validation/validateRequest';
import { scanEligibleUsersQuery } from '../validation/scanEligible.schema';
import { escapeRegex } from '../validation/mongoSanitize';
import { sendPasswordChangeOtpEmail } from '../utils/mailer';

const router = Router();

// All routes require authentication
router.use(requireAuth);

function hasCoverage(scopes: string[], targets: string[]): boolean {
  return targets.every((target) => scopes.includes(target));
}

function hasAnyCoverage(scopes: string[], targets: string[]): boolean {
  return scopes.some((scope) => targets.includes(scope));
}

function normalizeScope(targets: Array<string | undefined | null>): string[] {
  return Array.from(new Set(targets.filter((t): t is string => Boolean(t))));
}

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                       */
/* ------------------------------------------------------------------ */

const asciiText = (v: string) => /^[\x20-\x7E]*$/.test(v);
const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(64).refine(asciiText, 'Only standard characters are allowed').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(64).refine(asciiText, 'Only standard characters are allowed').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

const changePasswordConfirmSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/* ------------------------------------------------------------------ */
/*  GET /api/users/me                                                 */
/* ------------------------------------------------------------------ */

router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const { role, sub, userId } = req.authUser!;

    if (role === 'SUPERADMIN') {
      // SUPERADMIN profile is env-based — return minimal info
      return res.json({
        success: true,
        data: {
          username: sub,
          role,
          firstName: 'Super',
          lastName: 'Admin',
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
        username: staff.emailLower,
        role: staff.role,
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: `${staff.firstName} ${staff.lastName}`.trim(),
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

    const { firstName, lastName } = parsed.data;

    const staff = await StaffUser.findById(userId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName !== undefined) {
      staff.firstName = firstName;
    }

    if (lastName !== undefined) {
      staff.lastName = lastName;
    }

    await staff.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: `${staff.firstName} ${staff.lastName}`.trim(),
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
/*  POST /api/users/me/change-password/request-otp                     */
/*  Step 1: Validate current password, send OTP to email               */
/* ------------------------------------------------------------------ */

router.post('/me/change-password/request-otp', async (req: AuthRequest, res: Response) => {
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

    if (/\s/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must not contain spaces or whitespace',
        errors: ['Password must not contain spaces or whitespace'],
      });
    }

    const pwResult = validatePassword(newPassword);
    if (!pwResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: pwResult.errors,
      });
    }

    const staff = await StaffUser.findById(userId).select('+passwordHash');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await staff.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Generate and store OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const emailLower = staff.email.toLowerCase();

    await LoginVerifyOtp.findOneAndUpdate(
      { emailLower, purpose: 'PASSWORD_CHANGE_2FA' },
      {
        $set: {
          userId: staff._id,
          emailLower,
          purpose: 'PASSWORD_CHANGE_2FA',
          otpHash,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
          usedAt: null,
          attemptsLeft: OTP_MAX_ATTEMPTS,
          lastSentAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Send OTP email
    try {
      await sendPasswordChangeOtpEmail(staff.email, otp);
    } catch (emailErr) {
      console.error('[Profile] Failed to send password change OTP email:', emailErr);
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification code. Please try again later.',
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (err) {
    console.error('[Profile] change-password request-otp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/users/me/change-password/confirm                         */
/*  Step 2: Verify OTP and change password                             */
/* ------------------------------------------------------------------ */

router.post('/me/change-password/confirm', async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.authUser!;

    if (role === 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        message: 'SUPERADMIN password is managed via environment configuration',
      });
    }

    const parsed = changePasswordConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e: any) => e.message),
      });
    }

    const { currentPassword, newPassword, otp } = parsed.data;

    if (/\s/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must not contain spaces or whitespace',
        errors: ['Password must not contain spaces or whitespace'],
      });
    }

    const pwResult = validatePassword(newPassword);
    if (!pwResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: pwResult.errors,
      });
    }

    const staff = await StaffUser.findById(userId).select('+passwordHash');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Re-verify current password (TOCTOU protection)
    const isMatch = await staff.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Look up OTP record
    const emailLower = staff.email.toLowerCase();
    const record = await LoginVerifyOtp.findOne({
      emailLower,
      purpose: 'PASSWORD_CHANGE_2FA',
      usedAt: null,
    }).sort({ lastSentAt: -1, createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.',
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    if (record.attemptsLeft <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
      });
    }

    // Verify OTP
    const otpMatch = await bcrypt.compare(otp, record.otpHash);
    if (!otpMatch) {
      record.attemptsLeft -= 1;
      await record.save();
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${record.attemptsLeft} attempt(s) remaining.`,
      });
    }

    // OTP matched — mark as used and change password
    record.usedAt = new Date();
    record.attemptsLeft = 0;
    await record.save();

    staff.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await staff.save();

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    console.error('[Profile] change-password confirm error:', err);
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

/* ------------------------------------------------------------------ */
/*  GET /api/users/scan-eligible                                      */
/* ------------------------------------------------------------------ */

router.get(
  '/scan-eligible',
  requireStaffOrSuperadmin,
  validateRequest({ query: scanEligibleUsersQuery }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        barangay,
        hostBarangayId,
        assignedBarangayIds,
        scheduled,
        q,
        limit,
        cursor,
      } = req.query as unknown as {
        barangay?: string;
        hostBarangayId?: string;
        assignedBarangayIds?: string[];
        scheduled?: string;
        q: string;
        limit: number;
        cursor: number;
      };

      const targetBarangay = barangay || hostBarangayId;
      const requestedScope = normalizeScope([targetBarangay, ...(assignedBarangayIds ?? [])]);
      const requesterScope = normalizeScope(req.authUser?.assignedBarangays ?? []);

      if (req.authUser?.role === 'LGU_STAFF') {
        const outOfScope = requestedScope.find((barangay) => !requesterScope.includes(barangay));
        if (outOfScope) {
          return res.status(403).json({
            success: false,
            code: 'OUT_OF_SCOPE_STAFF',
            message: `You do not have access to ${outOfScope}.`,
          });
        }
      }

      // Check same-day distribution conflicts for staff if scheduled date is provided
      const conflictMap = new Map<string, { distributionId: string; barangay: string; scheduled: string }>();

      if (scheduled) {
        const targetDate = new Date(scheduled);
        if (!isNaN(targetDate.getTime())) {
          const targetYMD = targetDate.toISOString().slice(0, 10);
          const allDists = await Distribution.find({}).lean();
          const activeDists = allDists.filter((d) => d.status !== 'Claimed');

          for (const dist of activeDists) {
            if (!dist.scheduled) continue;
            const distDate = new Date(dist.scheduled);
            if (isNaN(distDate.getTime())) continue;
            const distYMD = distDate.toISOString().slice(0, 10);
            if (distYMD === targetYMD) {
              for (const staffId of (dist.assignedStaffIds || [])) {
                conflictMap.set(staffId.toString(), {
                  distributionId: dist._id.toString(),
                  barangay: dist.barangay,
                  scheduled: dist.scheduled,
                });
              }
            }
          }
        }
      }

      const search = q?.trim() || '';
      const filter: Record<string, unknown> = { isActive: true };

      if (search) {
        const safe = escapeRegex(search);
        const searchRegex = new RegExp(safe, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ];
      }

      const candidates = await StaffUser.find(filter)
        .setOptions({ sanitizeFilter: false })
        .select('_id firstName lastName role assignedBarangays')
        .sort({ firstName: 1, lastName: 1, _id: 1 })
        .limit(200)
        .lean();

      const items = candidates
        .map((candidate) => {
          const scopes = normalizeScope(Array.isArray(candidate.assignedBarangays)
            ? candidate.assignedBarangays
            : []);
          const coveredBarangays = requestedScope.filter((barangay) => scopes.includes(barangay));
          const inScope = hasAnyCoverage(scopes, requestedScope);
          const conflict = conflictMap.get(candidate._id.toString());
          const isAvailable = !conflict;

          return {
            id: candidate._id.toString(),
            fullName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
            role: candidate.role,
            scopesSummary: scopes,
            coveredBarangays,
            inScope,
            isAvailable,
            conflict: conflict || null,
          };
        })
        .filter((candidate) =>
          req.authUser?.role === 'LGU_STAFF'
            ? candidate.inScope && hasCoverage(requesterScope, candidate.scopesSummary)
            : candidate.inScope
        );

      const paged = items.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < items.length ? cursor + limit : null;

      return res.json({
        success: true,
        data: {
          items: paged,
          nextCursor,
        },
      });
    } catch (err) {
      console.error('[Profile] GET /scan-eligible error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch eligible staff' });
    }
  },
);

export default router;
