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
import jwt, { SignOptions } from 'jsonwebtoken';
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
import { sendFirstLoginOtpEmail, sendLoginVerifyOtpEmail } from '../utils/mailer';
import { setCsrfCookie, generateCsrfToken } from '../middleware/csrf';
import { validatePasswordStrength } from '../utils/passwordValidator';
import { revokeJWTByValue } from '../services/tokenRevocationService';

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
  purpose?: 'otp_pending_first_login' | 'otp_pending_login_2fa' | 'otp_pending_superadmin_login_2fa';
  rememberMe?: boolean;
};

type LoginOtpPurpose = 'FIRST_LOGIN' | 'LOGIN_2FA' | 'SUPERADMIN_LOGIN_2FA';
type OtpRecordTarget = {
  emailLower: string;
  userId?: string;
};
type SuperadminAccount = {
  email: string;
  emailLower: string;
  passwordHash: string;
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

function issuePendingOtpToken(
  subject: string,
  purpose: OtpPendingPayload['purpose'],
  rememberMe: boolean,
): string {
  return jwt.sign(
    { sub: subject, purpose, rememberMe },
    getJWTSecret(),
    { expiresIn: OTP_PENDING_TOKEN_EXPIRY, algorithm: 'HS256' } as SignOptions,
  );
}

function getSessionSignOptions(rememberMe: boolean): SignOptions {
  return {
    expiresIn: rememberMe
      ? `${REMEMBER_ME_EXPIRY_DAYS}d`
      : `${TOKEN_EXPIRY_HOURS}h`,
    algorithm: 'HS256',
  };
}

function buildSessionToken(staffUser: InstanceType<typeof StaffUser>, rememberMe: boolean): string {
  const payload: AuthPayload = {
    sub: staffUser.emailLower,
    role: 'LGU_STAFF',
    userId: staffUser._id.toString(),
    assignedBarangays: staffUser.assignedBarangays,
    jti: randomUUID(),
  };

  return jwt.sign(payload, getJWTSecret(), {
    ...getSessionSignOptions(rememberMe),
  } as SignOptions);
}

function buildSuperadminSessionToken(account: SuperadminAccount, rememberMe: boolean): string {
  const payload: AuthPayload = {
    sub: account.emailLower,
    role: 'SUPERADMIN',
    jti: randomUUID(),
  };
  return jwt.sign(payload, getJWTSecret(), getSessionSignOptions(rememberMe));
}

function getSuperadminAccount(): SuperadminAccount | null {
  const email = process.env.SUPERADMIN_EMAIL?.trim();
  const passwordHash = process.env.SUPERADMIN_PASSWORD_HASH?.trim();
  if (!email || !passwordHash) return null;

  return {
    email,
    emailLower: email.toLowerCase(),
    passwordHash,
  };
}

async function saveLoginOtpRecord(
  target: OtpRecordTarget,
  purpose: LoginOtpPurpose,
  otp: string,
): Promise<void> {
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

  const saved = await LoginVerifyOtp.findOneAndUpdate(
    { emailLower: target.emailLower, purpose },
    {
      ...(target.userId ? { userId: target.userId } : {}),
      emailLower: target.emailLower,
      purpose,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      usedAt: null,
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastSentAt: new Date(),
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Defensive cleanup: keep only the newest OTP record for a given email+purpose.
  // Without a DB unique constraint, historical duplicates can cause findOne() to
  // read a stale hash and reject a freshly sent code.
  if (saved?._id) {
    try {
      await LoginVerifyOtp.deleteMany({
        emailLower: target.emailLower,
        purpose,
        _id: { $ne: saved._id },
      });
    } catch (cleanupErr) {
      console.warn(
        '[AUTH_LOGIN_OTP_CLEANUP_WARN]',
        target.emailLower,
        purpose,
        (cleanupErr as Error).message,
      );
    }
  }
}

async function sendOtpEmail(
  email: string,
  purpose: LoginOtpPurpose,
  otp: string,
): Promise<void> {
  if (purpose === 'FIRST_LOGIN') {
    await sendFirstLoginOtpEmail(email, otp);
    return;
  }

  await sendLoginVerifyOtpEmail(email, otp);
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
      const { email, password, otp, rememberMe } = req.body;

      if (!email || typeof email !== 'string') {
        logSecurity('LOGIN_FAIL', { reason: 'bad_input', ip: req.ip });
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const remember = !!rememberMe;
      const candidatePassword = typeof password === 'string' ? password : 'invalid-password';

      /* ---------- SUPERADMIN ---------- */
      const superadminAccount = getSuperadminAccount();
      if (superadminAccount && trimmedEmail === superadminAccount.emailLower) {
        const match = await bcrypt.compare(candidatePassword, superadminAccount.passwordHash);
        if (!match || typeof password !== 'string') {
          logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'SUPERADMIN' });
          logAudit(req, 'LOGIN_FAILURE', 'Auth', '', {
            username: superadminAccount.emailLower,
            reason: 'bad_password',
          }).catch(() => {});
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        const loginOtp = generateOtp();
        await saveLoginOtpRecord(
          { emailLower: superadminAccount.emailLower },
          'SUPERADMIN_LOGIN_2FA',
          loginOtp,
        );
        try {
          await sendLoginVerifyOtpEmail(superadminAccount.email, loginOtp);
        } catch (mailErr) {
          console.error('[MAILER] Failed to send superadmin OTP:', (mailErr as Error).message);
          res.status(500).json({ success: false, message: 'Unable to send verification code.' });
          return;
        }
        logAudit(req, 'LOGIN_OTP_SENT', 'Auth', superadminAccount.emailLower, {
          username: superadminAccount.emailLower,
          emailLower: superadminAccount.emailLower,
          role: 'SUPERADMIN',
          flow: 'SUPERADMIN_LOGIN_2FA',
        }).catch(() => {});
        res.json({
          success: true,
          otpRequired: true,
          otpToken: issuePendingOtpToken(
            superadminAccount.emailLower,
            'otp_pending_superadmin_login_2fa',
            remember,
          ),
          message: 'A verification code has been sent to your registered email.',
        });
        return;
      }

      /* ---------- LGU_STAFF ---------- */
      const staffUser = await StaffUser.findOne({ emailLower: trimmedEmail }).select('+passwordHash');

      const isFirstLoginOtpFlow =
        !!staffUser &&
        staffUser.isActive &&
        staffUser.forcePasswordReset === true &&
        !staffUser.passwordHash;

      // First-time staff login uses the OTP sent on account creation.
      if (isFirstLoginOtpFlow) {
        if (typeof otp !== 'string') {
          logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'LGU_STAFF', username: trimmedEmail, reason: 'first_login_otp_required' });
          logAudit(req, 'LOGIN_FAILURE', 'Auth', '', {
            username: trimmedEmail,
            reason: 'invalid_credentials',
          }).catch(() => {});
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        const record = await LoginVerifyOtp.findOne({
          emailLower: staffUser.emailLower,
          purpose: 'FIRST_LOGIN',
          usedAt: null,
        }).sort({ lastSentAt: -1, createdAt: -1 });

        if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
          logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', staffUser._id.toString(), {
            emailLower: staffUser.emailLower,
            reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
            flow: 'FIRST_LOGIN',
          }).catch(() => {});
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
          return;
        }

        const otpMatch = await bcrypt.compare(otp, record.otpHash);
        if (!otpMatch) {
          record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
          await record.save();

          logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', staffUser._id.toString(), {
            emailLower: staffUser.emailLower,
            reason: 'wrong_otp',
            attemptsLeft: record.attemptsLeft,
            flow: 'FIRST_LOGIN',
          }).catch(() => {});

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
          sub: staffUser.emailLower,
          role: 'LGU_STAFF',
          userId: staffUser._id.toString(),
          assignedBarangays: staffUser.assignedBarangays,
          jti: randomUUID(),
        };
        const firstLoginToken = jwt.sign(firstLoginPayload, getJWTSecret(), getSessionSignOptions(remember));
        setCookie(res, firstLoginToken, remember);
        setCsrfCookie(res, generateCsrfToken());

        logSecurity('LOGIN_SUCCESS', {
          username: staffUser.emailLower,
          role: 'LGU_STAFF',
          ip: req.ip,
          otpVerified: true,
          flow: 'FIRST_LOGIN',
        });
        logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', staffUser._id.toString(), {
          username: staffUser.emailLower,
          flow: 'FIRST_LOGIN',
        }).catch(() => {});

        res.json({
          success: true,
          data: {
            user: {
              id: staffUser._id.toString(),
              username: staffUser.emailLower,
              email: staffUser.email,
              firstName: staffUser.firstName,
              lastName: staffUser.lastName,
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
        logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'LGU_STAFF', username: trimmedEmail });
        logAudit(req, 'LOGIN_FAILURE', 'Auth', '', {
          username: trimmedEmail,
          reason: 'invalid_credentials',
        }).catch(() => {});
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      staffUser.lastLoginAt = new Date();
      await staffUser.save();

      const sessionToken = buildSessionToken(staffUser, remember);
      setCookie(res, sessionToken, remember);
      setCsrfCookie(res, generateCsrfToken());

      logSecurity('LOGIN_SUCCESS', {
        username: staffUser.emailLower,
        role: 'LGU_STAFF',
        ip: req.ip,
        flow: 'PASSWORD_ONLY',
      });
      logAudit(req, 'LOGIN_SUCCESS', 'Auth', staffUser._id.toString(), {
        username: staffUser.emailLower,
        emailLower: staffUser.emailLower,
        flow: 'PASSWORD_ONLY',
      }).catch(() => {});

      res.json({
        success: true,
        data: {
          user: {
            id: staffUser._id.toString(),
            username: staffUser.emailLower,
            email: staffUser.email,
            firstName: staffUser.firstName,
            lastName: staffUser.lastName,
            role: 'LGU_STAFF',
            assignedBarangays: staffUser.assignedBarangays,
            forcePasswordReset: staffUser.forcePasswordReset,
          },
        },
      });
    } catch (err) {
      console.error('[AUTH_LOGIN_ERROR]', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
        ...(process.env.NODE_ENV !== 'production'
          ? { debug: err instanceof Error ? err.message : String(err) }
          : {}),
      });
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

      if (
        (pending.purpose !== 'otp_pending_first_login' &&
          pending.purpose !== 'otp_pending_login_2fa' &&
          pending.purpose !== 'otp_pending_superadmin_login_2fa') ||
        !pending.sub
      ) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      const remember = !!pending.rememberMe;
      if (pending.purpose === 'otp_pending_superadmin_login_2fa') {
        const superadminAccount = getSuperadminAccount();
        if (!superadminAccount || pending.sub !== superadminAccount.emailLower) {
          res.status(400).json({ success: false, message: 'Invalid or expired code.' });
          return;
        }

        const record = await LoginVerifyOtp.findOne({
          emailLower: superadminAccount.emailLower,
          purpose: 'SUPERADMIN_LOGIN_2FA',
          usedAt: null,
        }).sort({ lastSentAt: -1, createdAt: -1 });

        if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
          await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', superadminAccount.emailLower, {
            emailLower: superadminAccount.emailLower,
            reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
            role: 'SUPERADMIN',
            flow: 'SUPERADMIN_LOGIN_2FA',
          });
          res.status(400).json({ success: false, message: 'Invalid or expired code.' });
          return;
        }

        const match = await bcrypt.compare(otp, record.otpHash);
        if (!match) {
          record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
          await record.save();

          await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', superadminAccount.emailLower, {
            emailLower: superadminAccount.emailLower,
            reason: 'wrong_otp',
            attemptsLeft: record.attemptsLeft,
            role: 'SUPERADMIN',
            flow: 'SUPERADMIN_LOGIN_2FA',
          });

          res.status(400).json({ success: false, message: 'Invalid or expired code.' });
          return;
        }

        record.usedAt = new Date();
        record.attemptsLeft = 0;
        await record.save();

        const sessionToken = buildSuperadminSessionToken(superadminAccount, remember);
        setCookie(res, sessionToken, remember);
        setCsrfCookie(res, generateCsrfToken());

        logSecurity('LOGIN_SUCCESS', {
          username: superadminAccount.emailLower,
          role: 'SUPERADMIN',
          ip: req.ip,
          otpVerified: true,
          flow: 'SUPERADMIN_LOGIN_2FA',
        });
        await logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', superadminAccount.emailLower, {
          username: superadminAccount.emailLower,
          role: 'SUPERADMIN',
          flow: 'SUPERADMIN_LOGIN_2FA',
        });

        res.json({
          success: true,
          data: {
            user: {
              username: superadminAccount.email,
              role: 'SUPERADMIN',
              assignedBarangays: [],
              forcePasswordReset: false,
            },
          },
        });
        return;
      }

      const userId = pending.sub;
      const staffUser = await StaffUser.findById(userId);
      const isFirstLogin = pending.purpose === 'otp_pending_first_login';
      const expectedPurpose: LoginOtpPurpose = isFirstLogin ? 'FIRST_LOGIN' : 'LOGIN_2FA';
      const flowName = isFirstLogin ? 'FIRST_LOGIN' : 'LOGIN_2FA';

      if (!staffUser || !staffUser.isActive) {
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      if (isFirstLogin) {
        if (!staffUser.forcePasswordReset || !!staffUser.passwordHash) {
          res.status(400).json({ success: false, message: 'Invalid or expired code.' });
          return;
        }
      } else if (!staffUser.passwordHash) {
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      const record = await LoginVerifyOtp.findOne({
        emailLower: staffUser.emailLower,
        purpose: expectedPurpose,
        usedAt: null,
      }).sort({ lastSentAt: -1, createdAt: -1 });

      if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
        await logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', userId, {
          emailLower: staffUser.emailLower,
          reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
          flow: flowName,
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
          flow: flowName,
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

      const sessionToken = buildSessionToken(staffUser, remember);
      setCookie(res, sessionToken, remember);
      setCsrfCookie(res, generateCsrfToken());

      logSecurity('LOGIN_SUCCESS', {
        username: staffUser.emailLower,
        role: 'LGU_STAFF',
        ip: req.ip,
        otpVerified: true,
        flow: flowName,
      });
      await logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', userId, {
        username: staffUser.emailLower,
        flow: flowName,
      });

      res.json({
        success: true,
        data: {
            user: {
              id: staffUser._id.toString(),
              username: staffUser.emailLower,
              email: staffUser.email,
              firstName: staffUser.firstName,
              lastName: staffUser.lastName,
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

      if (
        (pending.purpose !== 'otp_pending_first_login' &&
          pending.purpose !== 'otp_pending_login_2fa' &&
          pending.purpose !== 'otp_pending_superadmin_login_2fa') ||
        !pending.sub
      ) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
        return;
      }

      if (pending.purpose === 'otp_pending_superadmin_login_2fa') {
        const superadminAccount = getSuperadminAccount();
        if (!superadminAccount || pending.sub !== superadminAccount.emailLower) {
          res.json({ success: true, message: 'If valid, a new OTP was sent.' });
          return;
        }

        const newOtp = generateOtp();
        await saveLoginOtpRecord(
          { emailLower: superadminAccount.emailLower },
          'SUPERADMIN_LOGIN_2FA',
          newOtp,
        );

        try {
          await sendLoginVerifyOtpEmail(superadminAccount.email, newOtp);
        } catch (mailErr) {
          console.error('[MAILER] Failed to resend superadmin OTP:', (mailErr as Error).message);
        }

        await logAudit(req, 'LOGIN_OTP_RESEND', 'Auth', superadminAccount.emailLower, {
          username: superadminAccount.emailLower,
          emailLower: superadminAccount.emailLower,
          role: 'SUPERADMIN',
          flow: 'SUPERADMIN_LOGIN_2FA',
        });
        res.json({ success: true, message: 'A new OTP has been sent.' });
        return;
      }

      const staffUser = await StaffUser.findById(pending.sub);
      const isFirstLogin = pending.purpose === 'otp_pending_first_login';
      const purpose: LoginOtpPurpose = isFirstLogin ? 'FIRST_LOGIN' : 'LOGIN_2FA';
      const flowName = isFirstLogin ? 'FIRST_LOGIN' : 'LOGIN_2FA';

      if (!staffUser || !staffUser.isActive) {
        res.json({ success: true, message: 'If valid, a new OTP was sent.' });
        return;
      }

      if (isFirstLogin) {
        if (!staffUser.forcePasswordReset || !!staffUser.passwordHash) {
          res.json({ success: true, message: 'If valid, a new OTP was sent.' });
          return;
        }
      } else if (!staffUser.passwordHash) {
        res.json({ success: true, message: 'If valid, a new OTP was sent.' });
        return;
      }

      const newOtp = generateOtp();
      await saveLoginOtpRecord(
        { userId: staffUser._id.toString(), emailLower: staffUser.emailLower },
        purpose,
        newOtp,
      );

      try {
        await sendOtpEmail(staffUser.email, purpose, newOtp);
      } catch (mailErr) {
        console.error('[MAILER] Failed to resend login OTP:', (mailErr as Error).message);
      }

      await logAudit(req, 'LOGIN_OTP_RESEND', 'Auth', staffUser._id.toString(), {
        username: staffUser.emailLower,
        emailLower: staffUser.emailLower,
        flow: flowName,
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
        username: staff.emailLower,
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
  const cookieToken = _req.cookies?.[COOKIE_NAME] as string | undefined;
  const authHeader = _req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const tokenToRevoke = cookieToken || bearerToken;

  if (tokenToRevoke) {
    revokeJWTByValue(tokenToRevoke, 'session').catch(() => {});
  }

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
        username: staff.emailLower,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
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
