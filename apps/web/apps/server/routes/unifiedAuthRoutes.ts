/**
 * Unified Auth Routes
 *
 * POST /api/auth/login            - authenticate SUPERADMIN or LGU_STAFF
 * POST /api/auth/login/verify-otp - verify first-login OTP and complete auth
 * POST /api/auth/login/resend-otp - resend first-login OTP
 * POST /api/auth/set-password     - first-time password setup
 * POST /api/auth/logout           - clear auth cookie
 * GET  /api/auth/me               - return current authenticated user
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import {
  loginRateLimiter,
  loginOtpRateLimiter,
  strictRateLimiter,
} from '../middleware/rateLimiter';
import {
  requireAuth,
  AuthRequest,
  AuthPayload,
  logSecurity,
} from '../middleware/unifiedAuth';
import StaffUser from '../models/StaffUser';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import { validateRequest } from '../validation/validateRequest';
import {
  loginBody,
  loginVerifyOtpBody,
  loginResendOtpBody,
  setPasswordBody,
} from '../validation/auth.schema';
import { logAudit } from '../utils/audit';
import { sendFirstLoginOtpEmail } from '../utils/mailer';
import { setCsrfCookie, generateCsrfToken } from '../middleware/csrf';
import { validatePasswordStrength } from '../utils/passwordValidator';

const router = Router();

const COOKIE_NAME = 'sa_token';
const TOKEN_EXPIRY_HOURS = 10;
const REMEMBER_ME_EXPIRY_DAYS = 30;
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_PENDING_TOKEN_EXPIRY = '10m';

type OtpPendingPayload = {
  sub?: string;
  purpose?: 'otp_pending_first_login';
  rememberMe?: boolean;
};

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  if (s.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
  return s;
}

function generateOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

function setCookie(res: Response, token: string, rememberMe: boolean) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = rememberMe
    ? REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    : TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                              */
/* ------------------------------------------------------------------ */
router.post(
  '/login',
  loginRateLimiter,
  validateRequest({ body: loginBody }),
  async (req: Request, res: Response) => {
    try {
      const { username, password, otp, rememberMe } = req.body;

      if (!username || typeof username !== 'string') {
        logSecurity('LOGIN_FAIL', { reason: 'bad_input', ip: req.ip });
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const trimmedUser = username.trim().toLowerCase();
      const isEmail = trimmedUser.includes('@');
      const remember = !!rememberMe;
      const expiry = (remember
        ? `${REMEMBER_ME_EXPIRY_DAYS}d`
        : `${TOKEN_EXPIRY_HOURS}h`) as SignOptions['expiresIn'];
      const secret: Secret = getJWTSecret();
      const options: SignOptions = { expiresIn: expiry, algorithm: 'HS256' };
      const candidatePassword = typeof password === 'string' ? password : 'invalid-password';

      /* ---------- SUPERADMIN ---------- */
      const saUser = process.env.SUPERADMIN_USERNAME?.toLowerCase();
      const saHash = process.env.SUPERADMIN_PASSWORD_HASH;
      if (saUser && saHash && trimmedUser === saUser) {
        const match = await bcrypt.compare(candidatePassword, saHash);
        if (!match || typeof password !== 'string') {
          logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'SUPERADMIN' });
          await logAudit(req, 'LOGIN_FAILURE', 'Auth', '', {
            username: trimmedUser,
            reason: 'bad_password',
          });
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        const payload: AuthPayload = {
          sub: saUser,
          role: 'SUPERADMIN',
          jti: randomUUID(),
        };
        const token = jwt.sign(payload, secret, options);
        setCookie(res, token, remember);
        setCsrfCookie(res, generateCsrfToken());

        logSecurity('LOGIN_SUCCESS', { username: saUser, role: 'SUPERADMIN', ip: req.ip });
        await logAudit(req, 'LOGIN_SUCCESS', 'Auth', saUser, { role: 'SUPERADMIN' });

        res.json({
          success: true,
          data: {
            user: {
              username: saUser,
              role: 'SUPERADMIN',
              assignedBarangays: [],
              forcePasswordReset: false,
            },
          },
        });
        return;
      }

      /* ---------- LGU_STAFF ---------- */
      const staffQuery = isEmail
        ? { emailLower: trimmedUser }
        : { username: trimmedUser };
      const staffUser = await StaffUser.findOne(staffQuery).select('+passwordHash');

      const isFirstLoginOtpFlow =
        !!staffUser &&
        staffUser.isActive &&
        staffUser.forcePasswordReset === true &&
        !staffUser.passwordHash;

      // First-time staff login uses the OTP sent on account creation.
      if (isFirstLoginOtpFlow) {
        if (!isEmail || typeof otp !== 'string') {
          logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'LGU_STAFF', username: trimmedUser, reason: 'first_login_otp_required' });
          await logAudit(req, 'LOGIN_FAILURE', 'Auth', '', {
            username: trimmedUser,
            reason: 'invalid_credentials',
          });
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        const record = await LoginVerifyOtp.findOne({
          emailLower: staffUser.emailLower,
          purpose: 'FIRST_LOGIN',
          usedAt: null,
        });

        if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
          await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', staffUser._id.toString(), {
            emailLower: staffUser.emailLower,
            reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
            flow: 'FIRST_LOGIN',
          });
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        const otpMatch = await bcrypt.compare(otp, record.otpHash);
        if (!otpMatch) {
          record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
          await record.save();

          await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', staffUser._id.toString(), {
            emailLower: staffUser.emailLower,
            reason: 'wrong_otp',
            attemptsLeft: record.attemptsLeft,
            flow: 'FIRST_LOGIN',
          });

          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        record.usedAt = new Date();
        record.attemptsLeft = 0;
        await record.save();

        staffUser.lastOtpVerifiedAt = new Date();
        staffUser.lastLoginAt = new Date();
        await staffUser.save();

        const firstLoginPayload: AuthPayload = {
          sub: staffUser.username,
          role: 'LGU_STAFF',
          userId: staffUser._id.toString(),
          assignedBarangays: staffUser.assignedBarangays,
          jti: randomUUID(),
        };
        const firstLoginToken = jwt.sign(firstLoginPayload, secret, options);
        setCookie(res, firstLoginToken, remember);
        setCsrfCookie(res, generateCsrfToken());

        logSecurity('LOGIN_SUCCESS', {
          username: staffUser.username,
          role: 'LGU_STAFF',
          ip: req.ip,
          otpVerified: true,
          flow: 'FIRST_LOGIN',
        });
        await logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', staffUser._id.toString(), {
          username: staffUser.username,
          flow: 'FIRST_LOGIN',
        });

        res.json({
          success: true,
          data: {
            user: {
              id: staffUser._id.toString(),
              username: staffUser.username,
              fullName: staffUser.fullName,
              role: 'LGU_STAFF',
              assignedBarangays: staffUser.assignedBarangays,
              forcePasswordReset: staffUser.forcePasswordReset,
            },
          },
        });
        return;
      }

      // Password-based login for accounts with password set
      const dummyHash = '$2b$12$KIXTOzaOGBy05XHs9hLKyuBP7dsQVG4x5vjXPMNGSBKLVoKJGxbW6';
      const hashToCompare = staffUser?.passwordHash || dummyHash;
      const pwMatch = await bcrypt.compare(candidatePassword, hashToCompare);

      if (
        !staffUser ||
        !staffUser.isActive ||
        !staffUser.passwordHash ||
        typeof password !== 'string' ||
        !pwMatch
      ) {
        logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'LGU_STAFF', username: trimmedUser });
        await logAudit(req, 'LOGIN_FAILURE', 'Auth', '', {
          username: trimmedUser,
          reason: 'invalid_credentials',
        });
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      staffUser.lastLoginAt = new Date();
      await staffUser.save();

      const payload: AuthPayload = {
        sub: staffUser.username,
        role: 'LGU_STAFF',
        userId: staffUser._id.toString(),
        assignedBarangays: staffUser.assignedBarangays,
        jti: randomUUID(),
      };
      const token = jwt.sign(payload, secret, options);
      setCookie(res, token, remember);
      setCsrfCookie(res, generateCsrfToken());

      logSecurity('LOGIN_SUCCESS', {
        username: staffUser.username,
        role: 'LGU_STAFF',
        ip: req.ip,
      });
      await logAudit(req, 'LOGIN_SUCCESS', 'Auth', staffUser._id.toString(), {
        username: staffUser.username,
        role: 'LGU_STAFF',
      });

      res.json({
        success: true,
        data: {
          user: {
            id: staffUser._id.toString(),
            username: staffUser.username,
            fullName: staffUser.fullName,
            role: 'LGU_STAFF',
            assignedBarangays: staffUser.assignedBarangays,
            forcePasswordReset: staffUser.forcePasswordReset,
          },
        },
      });
    } catch (err) {
      console.error('[AUTH_LOGIN_ERROR]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login/verify-otp                                   */
/* ------------------------------------------------------------------ */
router.post(
  '/login/verify-otp',
  loginRateLimiter,
  validateRequest({ body: loginVerifyOtpBody }),
  async (req: Request, res: Response) => {
    try {
      const { otpToken, otp } = req.body;

      let pending: OtpPendingPayload;
      try {
        pending = jwt.verify(otpToken, getJWTSecret()) as OtpPendingPayload;
      } catch {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      if (pending.purpose !== 'otp_pending_first_login' || !pending.sub) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      const userId = pending.sub;
      const staffUser = await StaffUser.findById(userId);
      if (
        !staffUser ||
        !staffUser.isActive ||
        !staffUser.forcePasswordReset ||
        !!staffUser.passwordHash
      ) {
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      const record = await LoginVerifyOtp.findOne({
        emailLower: staffUser.emailLower,
        purpose: 'FIRST_LOGIN',
        usedAt: null,
      });

      if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
        await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', userId, {
          emailLower: staffUser.emailLower,
          reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
          flow: 'FIRST_LOGIN',
        });
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      const match = await bcrypt.compare(otp, record.otpHash);
      if (!match) {
        record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
        await record.save();

        await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', userId, {
          emailLower: staffUser.emailLower,
          reason: 'wrong_otp',
          attemptsLeft: record.attemptsLeft,
          flow: 'FIRST_LOGIN',
        });

        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      record.usedAt = new Date();
      record.attemptsLeft = 0;
      await record.save();

      staffUser.lastOtpVerifiedAt = new Date();
      staffUser.lastLoginAt = new Date();
      await staffUser.save();

      const remember = !!pending.rememberMe;
      const expiry = remember
        ? `${REMEMBER_ME_EXPIRY_DAYS}d`
        : `${TOKEN_EXPIRY_HOURS}h`;
      const payload: AuthPayload = {
        sub: staffUser.username,
        role: 'LGU_STAFF',
        userId: staffUser._id.toString(),
        assignedBarangays: staffUser.assignedBarangays,
        jti: randomUUID(),
      };
      const sessionToken = jwt.sign(payload, getJWTSecret(), {
        expiresIn: expiry,
        algorithm: 'HS256',
      } as SignOptions);
      setCookie(res, sessionToken, remember);
      setCsrfCookie(res, generateCsrfToken());

      logSecurity('LOGIN_SUCCESS', {
        username: staffUser.username,
        role: 'LGU_STAFF',
        ip: req.ip,
        otpVerified: true,
        flow: 'FIRST_LOGIN',
      });
      await logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', userId, {
        username: staffUser.username,
        flow: 'FIRST_LOGIN',
      });

      res.json({
        success: true,
        data: {
          user: {
            id: staffUser._id.toString(),
            username: staffUser.username,
            fullName: staffUser.fullName,
            role: 'LGU_STAFF',
            assignedBarangays: staffUser.assignedBarangays,
            forcePasswordReset: staffUser.forcePasswordReset,
          },
        },
      });
    } catch (err) {
      console.error('[AUTH_VERIFY_OTP_ERROR]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login/resend-otp                                   */
/* ------------------------------------------------------------------ */
router.post(
  '/login/resend-otp',
  loginOtpRateLimiter,
  validateRequest({ body: loginResendOtpBody }),
  async (req: Request, res: Response) => {
    try {
      const { otpToken } = req.body;

      let pending: OtpPendingPayload;
      try {
        pending = jwt.verify(otpToken, getJWTSecret()) as OtpPendingPayload;
      } catch {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      if (pending.purpose !== 'otp_pending_first_login' || !pending.sub) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      const staffUser = await StaffUser.findById(pending.sub);
      if (
        !staffUser ||
        !staffUser.isActive ||
        !staffUser.forcePasswordReset ||
        !!staffUser.passwordHash
      ) {
        res.json({ success: true, message: 'If valid, a new OTP was sent.' });
        return;
      }

      const newOtp = generateOtp();
      const otpHash = await bcrypt.hash(newOtp, SALT_ROUNDS);

      await LoginVerifyOtp.findOneAndUpdate(
        { emailLower: staffUser.emailLower, purpose: 'FIRST_LOGIN' },
        {
          userId: staffUser._id,
          emailLower: staffUser.emailLower,
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
        await sendFirstLoginOtpEmail(staffUser.email, newOtp);
      } catch (mailErr) {
        console.error('[MAILER] Failed to resend first-login OTP:', (mailErr as Error).message);
      }

      await logAudit(req, 'LOGIN_OTP_RESEND', 'Auth', staffUser._id.toString(), {
        username: staffUser.username,
        emailLower: staffUser.emailLower,
        flow: 'FIRST_LOGIN',
      });

      res.json({ success: true, message: 'A new OTP has been sent.' });
    } catch (err) {
      console.error('[AUTH_RESEND_OTP_ERROR]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /api/auth/set-password                                       */
/* ------------------------------------------------------------------ */
router.post(
  '/set-password',
  requireAuth,
  strictRateLimiter,
  validateRequest({ body: setPasswordBody }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role, userId } = req.authUser ?? {};
      const { newPassword } = req.body;

      if (role !== 'LGU_STAFF' || !userId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const staff = await StaffUser.findById(userId).select('+passwordHash');
      if (!staff || !staff.isActive) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!staff.forcePasswordReset) {
        res.status(400).json({
          success: false,
          message: 'Password setup is not required.',
        });
        return;
      }

      const pwCheck = validatePasswordStrength(newPassword);
      if (!pwCheck.ok) {
        res.status(400).json({
          success: false,
          message: 'Password is too weak.',
          errors: pwCheck.reason ? pwCheck.reason.split('; ') : ['Password is too weak'],
        });
        return;
      }

      staff.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      staff.forcePasswordReset = false;
      await staff.save();

      await LoginVerifyOtp.deleteMany({
        $or: [{ userId: staff._id }, { emailLower: staff.emailLower }],
        purpose: 'FIRST_LOGIN',
      });

      await logAudit(req, 'STAFF_PASSWORD_RESET', 'StaffUser', staff._id.toString(), {
        username: staff.username,
        flow: 'FIRST_LOGIN_SETUP',
      });

      res.json({ success: true, message: 'Password set successfully.' });
    } catch (err) {
      console.error('[AUTH_SET_PASSWORD_ERROR]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /api/auth/logout                                             */
/* ------------------------------------------------------------------ */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie('XSRF-TOKEN', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  logSecurity('LOGOUT', { ip: _req.ip });
  logAudit(_req, 'LOGOUT', 'Auth', '').catch(() => {});
  res.json({ success: true, message: 'Logged out.' });
});

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me                                                  */
/* ------------------------------------------------------------------ */
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const { sub, role, assignedBarangays, userId } = req.authUser;

  if (role === 'LGU_STAFF' && userId) {
    const staff = await StaffUser.findById(userId);
    if (!staff || !staff.isActive) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.status(401).json({ success: false, message: 'Account deactivated.' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: staff._id.toString(),
        username: staff.username,
        fullName: staff.fullName,
        role: 'LGU_STAFF',
        assignedBarangays: staff.assignedBarangays,
        forcePasswordReset: staff.forcePasswordReset,
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      username: sub,
      role: role,
      assignedBarangays: assignedBarangays ?? [],
      forcePasswordReset: false,
    },
  });
});

export default router;
