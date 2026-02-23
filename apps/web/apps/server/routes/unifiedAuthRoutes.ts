/**
 * Unified Auth Routes
 *
 * POST /api/auth/login            – authenticate SUPERADMIN (env) OR LGU_STAFF (DB)
 * POST /api/auth/login/verify-otp – verify login OTP and complete authentication
 * POST /api/auth/login/resend-otp – resend login OTP
 * POST /api/auth/logout           – clear the auth cookie
 * GET  /api/auth/me               – return the currently authenticated user
 *
 * Both account types get a JWT stored in an httpOnly cookie (`sa_token`).
 * LGU_STAFF accounts that have not verified email get OTP challenge on login.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { loginOtpRateLimiter } from '../middleware/rateLimiter';
import {
  requireAuth,
  AuthRequest,
  AuthPayload,
  logSecurity,
} from '../middleware/unifiedAuth';
import StaffUser from '../models/StaffUser';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import { validateRequest } from '../validation/validateRequest';
import { loginBody, loginVerifyOtpBody, loginResendOtpBody } from '../validation/auth.schema';
import { logAudit } from '../utils/audit';
import { sendLoginVerifyOtpEmail } from '../utils/mailer';
import { setCsrfCookie, generateCsrfToken } from '../middleware/csrf';

const router = Router();

const COOKIE_NAME = 'sa_token';
const TOKEN_EXPIRY_HOURS = 10;
const REMEMBER_ME_EXPIRY_DAYS = 30;
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_PENDING_TOKEN_EXPIRY = '10m';

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  if (s.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
  return s;
}

/**
 * Generate a cryptographically random 6-digit OTP.
 */
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
router.post('/login', loginRateLimiter, validateRequest({ body: loginBody }), async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (
      !username ||
      !password ||
      typeof username !== 'string' ||
      typeof password !== 'string'
    ) {
      logSecurity('LOGIN_FAIL', { reason: 'bad_input', ip: req.ip });
      // GENERIC error — do not reveal which field is missing
      res
        .status(401)
        .json({ success: false, message: 'Invalid credentials.' });
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

    /* ---------- Try SUPERADMIN first ---------- */
    const saUser = process.env.SUPERADMIN_USERNAME?.toLowerCase();
    const saHash = process.env.SUPERADMIN_PASSWORD_HASH;

    if (saUser && saHash && trimmedUser === saUser) {
      const match = await bcrypt.compare(password, saHash);
      if (!match) {
        logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'SUPERADMIN' });
        await logAudit(req, 'LOGIN_FAILURE', 'Auth', '', { username: trimmedUser, reason: 'bad_password' });
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
          },
        },
      });
      return;
    }

    /* ---------- Try LGU_STAFF from DB ---------- */
    // If identifier looks like an email, match by emailLower; otherwise by username
    const staffQuery = isEmail
      ? { emailLower: trimmedUser }
      : { username: trimmedUser };
    const staffUser = await StaffUser.findOne(staffQuery).select(
      '+passwordHash',
    );

    // Always run bcrypt.compare even when user not found (timing-attack mitigation)
    const dummyHash = '$2b$12$KIXTOzaOGBy05XHs9hLKyuBP7dsQVG4x5vjXPMNGSBKLVoKJGxbW6';
    const hashToCompare = staffUser?.passwordHash || dummyHash;
    const pwMatch = await bcrypt.compare(password, hashToCompare);

    if (!staffUser || !pwMatch || !staffUser.isActive) {
      logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'LGU_STAFF', username: trimmedUser });
      await logAudit(req, 'LOGIN_FAILURE', 'Auth', '', { username: trimmedUser, reason: 'invalid_credentials' });
      // GENERIC error — never reveal whether user exists, is inactive, or password is wrong
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    /* ---------- OTP challenge for unverified staff ---------- */
    if (!staffUser.emailVerified) {
      // Generate OTP and send via email
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

      // Upsert: one active login-verify OTP per email at a time
      await LoginVerifyOtp.findOneAndUpdate(
        { emailLower: staffUser.emailLower },
        {
          userId: staffUser._id,
          emailLower: staffUser.emailLower,
          otpHash,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
          attemptsLeft: OTP_MAX_ATTEMPTS,
          lastSentAt: new Date(),
          createdAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      // Send OTP email (best-effort)
      try {
        await sendLoginVerifyOtpEmail(staffUser.email, otp);
      } catch (mailErr) {
        console.error('[MAILER] Failed to send login OTP email:', (mailErr as Error).message);
      }

      // Issue a short-lived pre-auth token (NOT the session cookie)
      const otpPendingPayload = {
        sub: staffUser._id.toString(),
        purpose: 'otp_pending_login',
        rememberMe: remember,
      };
      const otpToken = jwt.sign(
        otpPendingPayload,
        getJWTSecret(),
        { expiresIn: OTP_PENDING_TOKEN_EXPIRY, algorithm: 'HS256' } as SignOptions,
      );

      await logAudit(req, 'LOGIN_OTP_SENT', 'Auth', staffUser._id.toString(), {
        username: staffUser.username,
        emailLower: staffUser.emailLower,
      });

      logSecurity('LOGIN_OTP_REQUIRED', {
        username: staffUser.username,
        ip: req.ip,
      });

      res.json({
        success: true,
        otpRequired: true,
        otpToken,
        message: 'OTP sent to your registered email.',
      });
      return;
    }

    // Update lastLoginAt
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
    await logAudit(req, 'LOGIN_SUCCESS', 'Auth', staffUser._id.toString(), { username: staffUser.username, role: 'LGU_STAFF' });

    res.json({
      success: true,
      data: {
        user: {
          id: staffUser._id.toString(),
          username: staffUser.username,
          fullName: staffUser.fullName,
          role: 'LGU_STAFF',
          assignedBarangays: staffUser.assignedBarangays,
        },
      },
    });
  } catch (err) {
    console.error('[AUTH_LOGIN_ERROR]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

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

      // Verify the pre-auth token
      let pending: { sub?: string; purpose?: string; rememberMe?: boolean };
      try {
        pending = jwt.verify(otpToken, getJWTSecret()) as typeof pending;
      } catch {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      if (pending.purpose !== 'otp_pending_login' || !pending.sub) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      const userId = pending.sub;
      const staffUser = await StaffUser.findById(userId);
      if (!staffUser || !staffUser.isActive) {
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      // Find OTP record
      const record = await LoginVerifyOtp.findOne({ emailLower: staffUser.emailLower });

      if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
        await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', userId, {
          emailLower: staffUser.emailLower,
          reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
        });
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      // Compare OTP
      const match = await bcrypt.compare(otp, record.otpHash);

      if (!match) {
        record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
        await record.save();

        await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', userId, {
          emailLower: staffUser.emailLower,
          reason: 'wrong_otp',
          attemptsLeft: record.attemptsLeft,
        });

        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      // OTP valid — mark email as verified
      staffUser.emailVerified = true;
      staffUser.lastOtpVerifiedAt = new Date();
      staffUser.lastLoginAt = new Date();
      await staffUser.save();

      // Delete OTP record
      await LoginVerifyOtp.deleteOne({ _id: record._id });

      // Issue the real session cookie
      const remember = !!pending.rememberMe;
      const expiry = remember
        ? `${REMEMBER_ME_EXPIRY_DAYS}d`
        : `${TOKEN_EXPIRY_HOURS}h`;
      const payload: AuthPayload = {
        sub: staffUser.username,
        role: 'LGU_STAFF',
        userId: staffUser._id.toString(),
        assignedBarangays: staffUser.assignedBarangays,
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
      });
      await logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', userId, {
        username: staffUser.username,
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

      // Verify the pre-auth token
      let pending: { sub?: string; purpose?: string };
      try {
        pending = jwt.verify(otpToken, getJWTSecret()) as typeof pending;
      } catch {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      if (pending.purpose !== 'otp_pending_login' || !pending.sub) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      const staffUser = await StaffUser.findById(pending.sub);
      if (!staffUser || !staffUser.isActive) {
        // Generic response
        res.json({ success: true, message: 'If valid, a new OTP was sent.' });
        return;
      }

      const newOtp = generateOtp();
      const otpHash = await bcrypt.hash(newOtp, SALT_ROUNDS);

      await LoginVerifyOtp.findOneAndUpdate(
        { emailLower: staffUser.emailLower },
        {
          userId: staffUser._id,
          emailLower: staffUser.emailLower,
          otpHash,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
          attemptsLeft: OTP_MAX_ATTEMPTS,
          lastSentAt: new Date(),
          createdAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      try {
        await sendLoginVerifyOtpEmail(staffUser.email, newOtp);
      } catch (mailErr) {
        console.error('[MAILER] Failed to resend login OTP:', (mailErr as Error).message);
      }

      await logAudit(req, 'LOGIN_OTP_RESEND', 'Auth', staffUser._id.toString(), {
        username: staffUser.username,
        emailLower: staffUser.emailLower,
      });

      res.json({ success: true, message: 'A new OTP has been sent.' });
    } catch (err) {
      console.error('[AUTH_RESEND_OTP_ERROR]', err);
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
    // Fetch fresh data from DB (in case barangays were updated)
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
      },
    });
    return;
  }

  // SUPERADMIN
  res.json({
    success: true,
    data: {
      username: sub,
      role: role,
      assignedBarangays: assignedBarangays ?? [],
    },
  });
});

export default router;
