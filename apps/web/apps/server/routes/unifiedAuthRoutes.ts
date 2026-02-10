/**
 * Unified Auth Routes
 *
 * POST /api/auth/login   – authenticate SUPERADMIN (env) OR LGU_STAFF (DB)
 * POST /api/auth/logout  – clear the auth cookie
 * GET  /api/auth/me      – return the currently authenticated user
 *
 * Both account types get a JWT stored in an httpOnly cookie (`sa_token`).
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { loginRateLimiter } from '../middleware/rateLimiter';
import {
  requireAuth,
  AuthRequest,
  AuthPayload,
  logSecurity,
} from '../middleware/unifiedAuth';
import StaffUser from '../models/StaffUser';

const router = Router();

const COOKIE_NAME = 'sa_token';
const TOKEN_EXPIRY_HOURS = 10;
const REMEMBER_ME_EXPIRY_DAYS = 30;

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
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
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (
      !username ||
      !password ||
      typeof username !== 'string' ||
      typeof password !== 'string'
    ) {
      logSecurity('LOGIN_FAIL', { reason: 'bad_input', ip: req.ip });
      res
        .status(400)
        .json({ success: false, message: 'Username and password are required.' });
      return;
    }

    const trimmedUser = username.trim().toLowerCase();
    const remember = !!rememberMe;
    const expiry = remember
      ? `${REMEMBER_ME_EXPIRY_DAYS}d`
      : `${TOKEN_EXPIRY_HOURS}h`;
    const secret: Secret = getJWTSecret();
    const options: SignOptions = { expiresIn: expiry, algorithm: 'HS256' };

    /* ---------- Try SUPERADMIN first ---------- */
    const saUser = process.env.SUPERADMIN_USERNAME?.toLowerCase();
    const saHash = process.env.SUPERADMIN_PASSWORD_HASH;

    if (saUser && saHash && trimmedUser === saUser) {
      const match = await bcrypt.compare(password, saHash);
      if (!match) {
        logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'SUPERADMIN' });
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const payload: AuthPayload = {
        sub: saUser,
        role: 'SUPERADMIN',
      };
      const token = jwt.sign(payload, secret, options);
      setCookie(res, token, remember);

      logSecurity('LOGIN_SUCCESS', { username: saUser, role: 'SUPERADMIN', ip: req.ip });

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
    const staffUser = await StaffUser.findOne({ username: trimmedUser }).select(
      '+passwordHash',
    );

    if (!staffUser) {
      logSecurity('LOGIN_FAIL', { ip: req.ip, reason: 'user_not_found' });
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    if (!staffUser.isActive) {
      logSecurity('LOGIN_FAIL', { ip: req.ip, reason: 'account_inactive', username: trimmedUser });
      res
        .status(401)
        .json({ success: false, message: 'Your account has been deactivated. Contact an administrator.' });
      return;
    }

    const pwMatch = await bcrypt.compare(password, staffUser.passwordHash);
    if (!pwMatch) {
      logSecurity('LOGIN_FAIL', { ip: req.ip, account: 'LGU_STAFF', username: trimmedUser });
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
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
    };
    const token = jwt.sign(payload, secret, options);
    setCookie(res, token, remember);

    logSecurity('LOGIN_SUCCESS', {
      username: staffUser.username,
      role: 'LGU_STAFF',
      ip: req.ip,
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
    console.error('[AUTH_LOGIN_ERROR]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/logout                                             */
/* ------------------------------------------------------------------ */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  logSecurity('LOGOUT', { ip: _req.ip });
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
