import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import StaffUser from '../models/StaffUser';
import LoginVerifyOtp from '../models/LoginVerifyOtp';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../validation/validateRequest';
import { loginVerifyOtpBody, loginResendOtpBody } from '../validation/auth.schema';
import { generateToken } from '../middleware/authMiddleware';
import { logAudit } from '../utils/audit';
import { sendLoginVerifyOtpEmail } from '../utils/mailer';
import crypto from 'crypto';

const router = Router();

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return secret;
}

function generateOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

async function saveMobileLoginOtp(staffUser: any, otp: string): Promise<void> {
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

  await LoginVerifyOtp.findOneAndUpdate(
    { emailLower: staffUser.emailLower, purpose: 'LOGIN_2FA' },
    {
      userId: staffUser._id,
      emailLower: staffUser.emailLower,
      purpose: 'LOGIN_2FA',
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      usedAt: null,
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastSentAt: new Date(),
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'LGU', lastName: 'Staff' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

type MobileOtpPendingPayload = {
  sub?: string;
  purpose?: 'otp_pending_login_2fa';
};

router.post('/login/verify-otp', loginRateLimiter, validateRequest({ body: loginVerifyOtpBody }), async (req: Request, res: Response) => {
  try {
    const { otpToken, otp } = req.body;

    let pending: MobileOtpPendingPayload;
    try {
      pending = jwt.verify(otpToken, getJWTSecret()) as MobileOtpPendingPayload;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
    }

    if (pending.purpose !== 'otp_pending_login_2fa' || !pending.sub) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
    }

    const staffUser = await StaffUser.findById(pending.sub).select('+passwordHash');
    if (!staffUser || !staffUser.isActive || !staffUser.passwordHash) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
    }

    const record = await LoginVerifyOtp.findOne({
      emailLower: staffUser.emailLower,
      purpose: 'LOGIN_2FA',
      usedAt: null,
    });

    if (!record || record.expiresAt < new Date() || record.attemptsLeft <= 0) {
      logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', staffUser._id.toString(), {
        identifier: staffUser.emailLower,
        reason: !record ? 'no_record' : record.attemptsLeft <= 0 ? 'no_attempts' : 'expired',
        flow: 'MOBILE_LOGIN_2FA',
      }).catch(() => {});
      return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      record.attemptsLeft = Math.max(0, record.attemptsLeft - 1);
      await record.save();

      logAudit(req, 'LOGIN_OTP_VERIFY_FAILED', 'Auth', staffUser._id.toString(), {
        identifier: staffUser.emailLower,
        reason: 'wrong_otp',
        attemptsLeft: record.attemptsLeft,
        flow: 'MOBILE_LOGIN_2FA',
      }).catch(() => {});
      return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
    }

    record.usedAt = new Date();
    record.attemptsLeft = 0;
    await record.save();

    staffUser.lastOtpVerifiedAt = new Date();
    staffUser.lastLoginAt = new Date();
    await staffUser.save();

    const token = generateToken(
      staffUser._id.toString(),
      staffUser.emailLower || staffUser.email.toLowerCase(),
      'LGU_STAFF',
      staffUser.assignedBarangays,
    );
    const names = splitFullName(staffUser.fullName || '');

    logAudit(req, 'LOGIN_OTP_VERIFY_SUCCESS', 'Auth', staffUser._id.toString(), {
      identifier: staffUser.emailLower,
      role: 'LGU_STAFF',
      flow: 'MOBILE_LOGIN_2FA',
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: staffUser._id,
          email: staffUser.email,
          firstName: names.firstName,
          lastName: names.lastName,
          role: 'LGU_STAFF',
          status: staffUser.isActive ? 'Active' : 'Inactive',
          assignedBarangays: staffUser.assignedBarangays,
          barangay: Array.isArray(staffUser.assignedBarangays) && staffUser.assignedBarangays.length > 0
            ? staffUser.assignedBarangays[0]
            : undefined,
        },
        token,
      },
    });
  } catch (error) {
    console.error('[MOBILE LOGIN VERIFY OTP ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during OTP verification',
    });
  }
});

router.post('/login/resend-otp', loginRateLimiter, validateRequest({ body: loginResendOtpBody }), async (req: Request, res: Response) => {
  try {
    const { otpToken } = req.body;

    let pending: MobileOtpPendingPayload;
    try {
      pending = jwt.verify(otpToken, getJWTSecret()) as MobileOtpPendingPayload;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
    }

    if (pending.purpose !== 'otp_pending_login_2fa' || !pending.sub) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
    }

    const staffUser = await StaffUser.findById(pending.sub).select('+passwordHash');
    if (!staffUser || !staffUser.isActive || !staffUser.passwordHash) {
      return res.json({ success: true, message: 'If valid, a new OTP was sent.' });
    }

    const otp = generateOtp();
    await saveMobileLoginOtp(staffUser, otp);

    try {
      await sendLoginVerifyOtpEmail(staffUser.email, otp);
    } catch (mailErr) {
      console.error('[MAILER] Failed to resend mobile login OTP:', (mailErr as Error).message);
    }

    logAudit(req, 'LOGIN_OTP_RESEND', 'Auth', staffUser._id.toString(), {
      identifier: staffUser.emailLower,
      role: 'LGU_STAFF',
      flow: 'MOBILE_LOGIN_2FA',
    }).catch(() => {});

    return res.json({ success: true, message: 'A new verification code has been sent.' });
  } catch (error) {
    console.error('[MOBILE LOGIN RESEND OTP ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resending the OTP',
    });
  }
});


export default router;
