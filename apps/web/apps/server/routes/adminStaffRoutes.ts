/**
 * Admin Staff-User Management Routes  (SUPERADMIN only)
 *
 * [SECURITY CHECKLIST §1.1] Strong Password Hashing (bcrypt on OTP/reset flows)
 * [SECURITY CHECKLIST §1.6] Strong Password Policy (validatePasswordStrength)
 * [SECURITY CHECKLIST §3.2] RBAC — all routes require SUPERADMIN
 * [SECURITY CHECKLIST §3.3] Audit Logging (logAudit on all staff events)
 *
 * POST   /api/admin/users                 – create LGU_STAFF account
 * GET    /api/admin/users                 – list staff users (search, barangay, status)
 * GET    /api/admin/users/stats           – aggregate counts
 * PATCH  /api/admin/users/:id             – update fullName, isActive
 * PATCH  /api/admin/users/:id/reset-password – reset password
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import StaffUser from '../models/StaffUser';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import {
  requireAuth,
  requireSuperadmin,
  AuthRequest,
  logSecurity,
} from '../middleware/unifiedAuth';
import { validatePasswordStrength } from '../utils/passwordValidator';
import { validateRequest } from '../validation/validateRequest';
import { escapeRegex } from '../validation/mongoSanitize';
import {
  createStaffBody,
  listStaffQuery,
  updateStaffBody,
  staffIdParams,
  resetPasswordBody,
} from '../validation/adminStaff.schema';
import { logAudit } from '../utils/audit';
import { sendFirstLoginOtpEmail } from '../utils/mailer';

const router = Router();
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

/* ------------------------------------------------------------------ */
/*  Password strength validator – delegates to shared utility         */
/* ------------------------------------------------------------------ */
function validateStrongPassword(pw: string): { ok: boolean; errors: string[] } {
  const result = validatePasswordStrength(pw);
  if (result.ok) return { ok: true, errors: [] };
  return { ok: false, errors: result.reason ? result.reason.split('; ') : ['Password is too weak'] };
}

function generateOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

/* ------------------------------------------------------------------ */
/*  All routes require SUPERADMIN                                     */
/* ------------------------------------------------------------------ */
router.use(requireAuth, requireSuperadmin);

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users                                             */
/* ------------------------------------------------------------------ */
router.post('/', validateRequest({ body: createStaffBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { username, fullName, email, assignedBarangays } = req.body;

    // --- validation ---
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
      return;
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      res.status(400).json({ success: false, message: 'A valid email is required.' });
      return;
    }

    // Duplicate username check
    const exists = await StaffUser.findOne({
      username: username.trim().toLowerCase(),
    });
    if (exists) {
      res.status(409).json({ success: false, message: 'Username already exists.' });
      return;
    }

    // Duplicate email check
    const emailLower = email.trim().toLowerCase();
    const emailExists = await StaffUser.findOne({ emailLower });
    if (emailExists) {
      res.status(400).json({ success: false, message: 'Email is already in use.' });
      return;
    }

    const user = new StaffUser({
      username: username.trim().toLowerCase(),
      email: email.trim(),
      forcePasswordReset: true,
      fullName: fullName.trim(),
      assignedBarangays,
    });

    await user.save();

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

    await LoginVerifyOtp.findOneAndUpdate(
      { emailLower: user.emailLower, purpose: 'FIRST_LOGIN' },
      {
        userId: user._id,
        emailLower: user.emailLower,
        purpose: 'FIRST_LOGIN',
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        usedAt: null,
        attemptsLeft: OTP_MAX_ATTEMPTS,
        lastSentAt: new Date(),
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
      await sendFirstLoginOtpEmail(user.email, otp);
    } catch (mailErr) {
      console.error('[MAILER] Failed to send first-login OTP email:', (mailErr as Error).message);
    }

    logSecurity('ADMIN_CREATE_STAFF', {
      admin: req.authUser?.sub,
      newUser: user.username,
      ip: req.ip,
    });
    await logAudit(req, 'STAFF_CREATED', 'StaffUser', user._id.toString(), {
      username: user.username,
      assignedBarangays: user.assignedBarangays,
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created. OTP sent to email.',
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
router.get('/', validateRequest({ query: listStaffQuery }), async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, barangay } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (search && typeof search === 'string') {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ username: re }, { fullName: re }, { email: re }];
    }
    if (barangay && typeof barangay === 'string') {
      filter.assignedBarangays = barangay;
    }
    // "Active" means account is enabled and has logged in at least once.
    if (status === 'active') {
      filter.isActive = true;
      filter.lastLoginAt = { $ne: null };
    } else if (status === 'inactive') {
      // Inactive includes disabled accounts and never-logged-in accounts.
      filter.$and = [
        ...(filter.$and ?? []),
        { $or: [{ isActive: false }, { lastLoginAt: null }] },
      ];
    }

    const users = await StaffUser.find(filter).sort({ createdAt: -1 }).limit(50).lean();

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
    // Match list/status semantics: active only after first successful login.
    const active = await StaffUser.countDocuments({
      isActive: true,
      lastLoginAt: { $ne: null },
    });
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
router.patch('/:id', validateRequest({ params: staffIdParams, body: updateStaffBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, isActive } = req.body;

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

    if (isActive !== undefined) {
      user.isActive = !!isActive;
    }

    await user.save();

    logSecurity('ADMIN_UPDATE_STAFF', {
      admin: req.authUser?.sub,
      target: user.username,
      ip: req.ip,
    });
    const auditAction = isActive === false ? 'STAFF_DISABLED' : 'STAFF_UPDATED';
    await logAudit(req, auditAction as any, 'StaffUser', user._id.toString(), {
      username: user.username,
      changes: { fullName, isActive },
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
router.patch('/:id/reset-password', validateRequest({ params: staffIdParams, body: resetPasswordBody }), async (req: AuthRequest, res: Response) => {
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
    user.forcePasswordReset = false;
    await user.save();
    await LoginVerifyOtp.deleteMany({
      $or: [{ userId: user._id }, { emailLower: user.emailLower }],
      purpose: 'FIRST_LOGIN',
    });

    logSecurity('ADMIN_RESET_PASSWORD', {
      admin: req.authUser?.sub,
      target: user.username,
      ip: req.ip,
    });
    await logAudit(req, 'STAFF_PASSWORD_RESET', 'StaffUser', user._id.toString(), {
      username: user.username,
    });

    res.json({ success: true, message: 'Password has been reset.' });
  } catch (err) {
    console.error('[ADMIN_RESET_PW]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;
