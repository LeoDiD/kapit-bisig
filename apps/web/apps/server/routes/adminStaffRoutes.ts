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
 * PATCH  /api/admin/users/:id             – update firstName/lastName/isActive
 * DELETE /api/admin/users/:id             – delete staff account
 * PATCH  /api/admin/users/:id/reset-password – reset password
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import StaffUser from '../models/StaffUser';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import PasswordResetOtp from '../models/PasswordResetOtp';
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
import { sendFirstLoginOtpEmail, sendResetOtpEmail } from '../utils/mailer';
import { clearLoginAttempts, getLoginLockout } from '../services/loginAttemptService';

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
    const { firstName, lastName, email, assignedBarangays } = req.body;

    // --- validation ---
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1) {
      res.status(400).json({ success: false, message: 'First name is required.' });
      return;
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1) {
      res.status(400).json({ success: false, message: 'Last name is required.' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      res.status(400).json({ success: false, message: 'A valid email is required.' });
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
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      forcePasswordReset: true,
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
      newUser: user.emailLower,
      ip: req.ip,
    });
    await logAudit(req, 'STAFF_CREATED', 'StaffUser', user._id.toString(), {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      assignedBarangays: user.assignedBarangays,
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created. OTP sent to email.',
      data: user.toJSON(),
    });
  } catch (err) {
    console.error('[ADMIN_CREATE_STAFF]', err);
    const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoErr?.code === 11000) {
      if (mongoErr.keyPattern?.email || mongoErr.keyPattern?.emailLower || mongoErr.keyPattern?.username) {
        res.status(400).json({ success: false, message: 'Email is already in use.' });
        return;
      }
      res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint.' });
      return;
    }
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
      filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
    }
    if (barangay && typeof barangay === 'string') {
      filter.assignedBarangays = barangay;
    }
    const users = await StaffUser.find(filter).sort({ createdAt: -1 }).limit(200).lean();

    const data = users.map((u) => {
      const lockout = getLoginLockout(u.emailLower);
      const accountState = !u.isActive
        ? 'Inactive'
        : u.forcePasswordReset && !u.lastLoginAt
          ? 'Pending Activation'
          : lockout.locked
            ? 'Temporarily Locked'
            : 'Active';

      return {
        ...u,
        id: u._id.toString(),
        accountState,
        lockedUntil: lockout.lockedUntil?.toISOString() ?? null,
        lockoutRemainingSeconds: lockout.remainingSeconds,
      };
    }).filter((u) => {
      if (!status) return true;
      if (status === 'active') return u.accountState === 'Active';
      if (status === 'pending') return u.accountState === 'Pending Activation';
      if (status === 'locked') return u.accountState === 'Temporarily Locked';
      return u.accountState === 'Inactive';
    });

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
    const { firstName, lastName, isActive } = req.body;

    const user = await StaffUser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Staff user not found.' });
      return;
    }

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length < 1) {
        res.status(400).json({ success: false, message: 'First name is required.' });
        return;
      }
      user.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || lastName.trim().length < 1) {
        res.status(400).json({ success: false, message: 'Last name is required.' });
        return;
      }
      user.lastName = lastName.trim();
    }

    if (isActive !== undefined) {
      user.isActive = !!isActive;
    }

    await user.save();

    logSecurity('ADMIN_UPDATE_STAFF', {
      admin: req.authUser?.sub,
      target: user.emailLower,
      ip: req.ip,
    });
    const auditAction = isActive === false ? 'STAFF_DISABLED' : 'STAFF_UPDATED';
    await logAudit(req, auditAction as any, 'StaffUser', user._id.toString(), {
      email: user.email,
      changes: { firstName, lastName, isActive },
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
    clearLoginAttempts(user.emailLower);
    await LoginVerifyOtp.deleteMany({
      $or: [{ userId: user._id }, { emailLower: user.emailLower }],
      purpose: 'FIRST_LOGIN',
    });

    logSecurity('ADMIN_RESET_PASSWORD', {
      admin: req.authUser?.sub,
      target: user.emailLower,
      ip: req.ip,
    });
    await logAudit(req, 'STAFF_PASSWORD_RESET', 'StaffUser', user._id.toString(), {
      email: user.email,
    });

    res.json({ success: true, message: 'Password has been reset.' });
  } catch (err) {
    console.error('[ADMIN_RESET_PW]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users/:id/send-reset-otp                          */
/* ------------------------------------------------------------------ */
router.post('/:id/send-reset-otp', validateRequest({ params: staffIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const user = await StaffUser.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Staff user not found.' });
      return;
    }
    if (!user.isActive) {
      res.status(400).json({ success: false, code: 'ACCOUNT_INACTIVE', message: 'Activate this account before sending a reset OTP.' });
      return;
    }
    if (user.forcePasswordReset && !user.lastLoginAt) {
      res.status(409).json({ success: false, code: 'PENDING_ACTIVATION', message: 'This account is awaiting first login. Resend its activation OTP instead.' });
      return;
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    await PasswordResetOtp.findOneAndUpdate(
      { emailLower: user.emailLower },
      { userId: user._id, emailLower: user.emailLower, otpHash, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000), attemptsLeft: OTP_MAX_ATTEMPTS, lastSentAt: new Date(), createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
      await sendResetOtpEmail(user.email, otp);
    } catch (mailErr) {
      console.error('[ADMIN_SEND_RESET_OTP]', mailErr);
      res.status(502).json({ success: false, code: 'OTP_DELIVERY_FAILED', message: 'The reset OTP was created but the email provider could not deliver it. Please retry after checking email configuration.' });
      return;
    }

    await logAudit(req, 'STAFF_PASSWORD_RESET_OTP_SENT', 'StaffUser', user._id.toString(), { email: user.email });
    res.json({ success: true, message: 'Password reset OTP sent.' });
  } catch (err) {
    console.error('[ADMIN_SEND_RESET_OTP]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users/:id/resend-activation                       */
/* ------------------------------------------------------------------ */
router.post('/:id/resend-activation', validateRequest({ params: staffIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const user = await StaffUser.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Staff user not found.' });
      return;
    }
    if (!user.isActive) {
      res.status(400).json({ success: false, code: 'ACCOUNT_INACTIVE', message: 'Activate this account before resending its activation OTP.' });
      return;
    }
    if (!user.forcePasswordReset || user.lastLoginAt) {
      res.status(409).json({ success: false, code: 'ALREADY_ACTIVATED', message: 'This account is already established. Send a password reset OTP instead.' });
      return;
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    await LoginVerifyOtp.findOneAndUpdate(
      { emailLower: user.emailLower, purpose: 'FIRST_LOGIN' },
      { userId: user._id, emailLower: user.emailLower, purpose: 'FIRST_LOGIN', otpHash, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000), usedAt: null, attemptsLeft: OTP_MAX_ATTEMPTS, lastSentAt: new Date(), createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
      await sendFirstLoginOtpEmail(user.email, otp);
    } catch (mailErr) {
      console.error('[ADMIN_RESEND_ACTIVATION]', mailErr);
      res.status(502).json({ success: false, code: 'OTP_DELIVERY_FAILED', message: 'The activation OTP was created but the email provider could not deliver it. Please retry after checking email configuration.' });
      return;
    }

    await logAudit(req, 'STAFF_ACTIVATION_OTP_RESENT', 'StaffUser', user._id.toString(), { email: user.email });
    res.json({ success: true, message: 'Activation OTP resent.' });
  } catch (err) {
    console.error('[ADMIN_RESEND_ACTIVATION]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/users/:id                                       */
/* ------------------------------------------------------------------ */
router.delete('/:id', validateRequest({ params: staffIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await StaffUser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Staff user not found.' });
      return;
    }

    await LoginVerifyOtp.deleteMany({
      $or: [{ userId: user._id }, { emailLower: user.emailLower }],
    });
    await StaffUser.deleteOne({ _id: user._id });

    logSecurity('ADMIN_DELETE_STAFF', {
      admin: req.authUser?.sub,
      target: user.emailLower,
      ip: req.ip,
    });
    await logAudit(req, 'STAFF_DELETED', 'StaffUser', user._id.toString(), {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.json({ success: true, message: 'Staff user deleted.' });
  } catch (err) {
    console.error('[ADMIN_DELETE_STAFF]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;
