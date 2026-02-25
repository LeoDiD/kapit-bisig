/**
 * Forgot Password Routes (OTP-based — Option A)
 *
 * [SECURITY CHECKLIST §1.1] Strong Password Hashing (bcrypt OTP hash + password reset hash)
 * [SECURITY CHECKLIST §1.3] Generic Login Errors (anti-enumeration responses)
 * [SECURITY CHECKLIST §1.4] Rate Limiting (passwordResetRateLimiter)
 * [SECURITY CHECKLIST §1.6] Strong Password Policy (validatePasswordStrength on reset)
 * [SECURITY CHECKLIST §3.3] Audit Logging (all forgot-password events)
 *
 * POST /api/auth/forgot-password/send-otp   – request a password-reset OTP
 * POST /api/auth/forgot-password/verify-otp – verify OTP and get reset token
 * POST /api/auth/forgot-password/reset      – reset password with reset token
 *
 * SECURITY:
 *  - OTP is 6 digits, hashed with bcrypt before storage.
 *  - OTP expires in 10 minutes (TTL index).
 *  - Max 5 verification attempts per OTP issuance.
 *  - Rate limited: 3 send-otp requests per 15 min per IP.
 *  - All responses are GENERIC to prevent user enumeration.
 *  - Audit logging for all events (no secrets logged).
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { passwordResetRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../validation/validateRequest';
import {
  sendOtpBody,
  verifyOtpBody,
  forgotResetPasswordBody,
} from '../validation/auth.schema';
import StaffUser from '../models/StaffUser';
import PasswordResetOtp from '../models/PasswordResetOtp';
import { sendResetOtpEmail } from '../utils/mailer';
import { validatePasswordStrength } from '../utils/passwordValidator';
import { logAudit } from '../utils/audit';

const router = Router();
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY = '10m';

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

/**
 * Generate a cryptographically random 6-digit OTP.
 */
function generateOtp(): string {
  // crypto.randomInt produces a uniform random integer
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/forgot-password/send-otp                           */
/* ------------------------------------------------------------------ */
router.post(
  '/send-otp',
  passwordResetRateLimiter,
  validateRequest({ body: sendOtpBody }),
  async (req: Request, res: Response) => {
    try {
      const emailLower: string = req.body.email.trim().toLowerCase();

      // Look up the user — but ALWAYS return the same generic response
      const staffUser = await StaffUser.findOne({
        emailLower,
        isActive: true,
      });

      if (staffUser) {
        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

        // Upsert: one active OTP per email at a time
        await PasswordResetOtp.findOneAndUpdate(
          { emailLower },
          {
            userId: staffUser._id,
            emailLower,
            otpHash,
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
            attemptsLeft: OTP_MAX_ATTEMPTS,
            lastSentAt: new Date(),
            createdAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        // Send email (best-effort; do NOT reveal failures)
        try {
          await sendResetOtpEmail(staffUser.email, otp);
        } catch (mailErr) {
          console.error('[MAILER] Failed to send OTP email:', (mailErr as Error).message);
          // Do NOT expose mail-send errors to the client
        }

        await logAudit(req, 'FORGOT_PASSWORD_OTP_REQUESTED', 'Auth', staffUser._id.toString(), {
          emailLower,
        });
      }

      // Always 200 with generic message — prevents enumeration
      res.json({
        success: true,
        message: 'If the email exists, an OTP was sent.',
      });
    } catch (err) {
      console.error('[FORGOT_PASSWORD_SEND_OTP]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /api/auth/forgot-password/verify-otp                        */
/* ------------------------------------------------------------------ */
router.post(
  '/verify-otp',
  passwordResetRateLimiter,
  validateRequest({ body: verifyOtpBody }),
  async (req: Request, res: Response) => {
    try {
      const emailLower: string = req.body.email.trim().toLowerCase();
      const otp: string = req.body.otp;

      const record = await PasswordResetOtp.findOne({ emailLower });

      // Missing, expired, or no attempts left
      if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
        await logAudit(req, 'FORGOT_PASSWORD_OTP_VERIFIED_FAILED', 'Auth', '', {
          emailLower,
          reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
        });
        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      // Compare OTP
      const match = await bcrypt.compare(otp, record.otpHash);

      if (!match) {
        // Decrement attempts
        record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
        await record.save();

        await logAudit(req, 'FORGOT_PASSWORD_OTP_VERIFIED_FAILED', 'Auth', record.userId.toString(), {
          emailLower,
          reason: 'wrong_otp',
          attemptsLeft: record.attemptsLeft,
        });

        res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        return;
      }

      // OTP is valid — issue a short-lived reset token
      const secret: Secret = getJWTSecret();
      const options: SignOptions = { expiresIn: RESET_TOKEN_EXPIRY, algorithm: 'HS256' };
      const resetToken = jwt.sign(
        { sub: record.userId.toString(), purpose: 'password_reset' },
        secret,
        options,
      );

      // Delete OTP record (one-time use)
      await PasswordResetOtp.deleteOne({ _id: record._id });

      await logAudit(req, 'FORGOT_PASSWORD_OTP_VERIFIED_SUCCESS', 'Auth', record.userId.toString(), {
        emailLower,
      });

      res.json({ success: true, resetToken });
    } catch (err) {
      console.error('[FORGOT_PASSWORD_VERIFY_OTP]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /api/auth/forgot-password/reset                              */
/* ------------------------------------------------------------------ */
router.post(
  '/reset',
  passwordResetRateLimiter,
  validateRequest({ body: forgotResetPasswordBody }),
  async (req: Request, res: Response) => {
    try {
      const { resetToken, newPassword } = req.body;

      // Verify JWT
      let payload: { sub?: string; purpose?: string };
      try {
        payload = jwt.verify(resetToken, getJWTSecret()) as { sub?: string; purpose?: string };
      } catch {
        res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        return;
      }

      if (payload.purpose !== 'password_reset' || !payload.sub) {
        res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        return;
      }

      // Enforce strong password
      const pwCheck = validatePasswordStrength(newPassword);
      if (!pwCheck.ok) {
        res.status(400).json({
          success: false,
          message: 'Password is too weak.',
          errors: pwCheck.reason ? pwCheck.reason.split('; ') : ['Password is too weak'],
        });
        return;
      }

      // Find user
      const staffUser = await StaffUser.findById(payload.sub);
      if (!staffUser) {
        res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        return;
      }

      // Hash and update password
      staffUser.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await staffUser.save();

      // Clean up any remaining OTP records for this user
      await PasswordResetOtp.deleteMany({
        $or: [{ userId: staffUser._id }, { emailLower: staffUser.emailLower }],
      });

      await logAudit(req, 'FORGOT_PASSWORD_RESET_SUCCESS', 'Auth', staffUser._id.toString(), {
        username: staffUser.username,
      });

      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err) {
      console.error('[FORGOT_PASSWORD_RESET]', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },
);

export default router;
