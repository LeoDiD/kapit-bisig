/**
 * SuperAdmin Auth Routes
 *
 * POST /api/sa/login   – authenticate the fixed SUPERADMIN account
 * POST /api/sa/logout  – clear the auth cookie
 * GET  /api/sa/me      – return the currently authenticated user
 *
 * Credentials are read from env vars:
 *   SUPERADMIN_USERNAME
 *   SUPERADMIN_PASSWORD_HASH  (bcrypt)
 *
 * JWT is stored in an httpOnly, Secure, SameSite cookie named `sa_token`.
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { loginRateLimiter } from '../middleware/rateLimiter';
import {
  requireAuth,
  SARequest,
  SuperadminPayload,
  logSecurity,
} from '../middleware/superadminAuth';

const router = Router();

const COOKIE_NAME = 'sa_token';
const TOKEN_EXPIRY_HOURS = 10;            // default session: 10 hours
const REMEMBER_ME_EXPIRY_DAYS = 30;       // remember-me: 30 days

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

function setCookie(res: Response, token: string, rememberMe: boolean) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = rememberMe
    ? REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60 * 1000   // 30 days
    : TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;             // 10 hours

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

/**
 * POST /api/sa/login
 */
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Basic input validation
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      logSecurity('LOGIN_FAIL', { reason: 'bad_input', ip: req.ip });
      res.status(400).json({ success: false, message: 'Username and password are required.' });
      return;
    }

    // Trim but don't over-sanitise (bcrypt handles arbitrary bytes)
    const trimmedUser = username.trim();

    const expectedUser = process.env.SUPERADMIN_USERNAME;
    const expectedHash = process.env.SUPERADMIN_PASSWORD_HASH;

    if (!expectedUser || !expectedHash) {
      console.error('[CRITICAL] SUPERADMIN env vars not set');
      res.status(500).json({ success: false, message: 'Server configuration error.' });
      return;
    }

    // Constant-time-ish comparison: always run bcrypt even if username wrong
    // to avoid timing side-channels.
    const usernameMatch = trimmedUser === expectedUser;
    const passwordMatch = await bcrypt.compare(password, expectedHash);

    if (!usernameMatch || !passwordMatch) {
      logSecurity('LOGIN_FAIL', { ip: req.ip });
      // Generic message — don't reveal whether username or password was wrong
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    // Issue JWT — longer expiry if "remember me" is checked
    const remember = !!rememberMe;
    const expiry = remember ? `${REMEMBER_ME_EXPIRY_DAYS}d` : `${TOKEN_EXPIRY_HOURS}h`;
    const payload: SuperadminPayload = { sub: expectedUser, role: 'superadmin' };
    const secret: Secret = getJWTSecret();
    const options: SignOptions = { expiresIn: expiry, algorithm: 'HS256' };
    const token = jwt.sign(payload, secret, options);

    setCookie(res, token, remember);

    logSecurity('LOGIN_SUCCESS', { username: expectedUser, ip: req.ip });

    res.json({
      success: true,
      data: { user: { username: expectedUser, role: 'superadmin' } },
    });
  } catch (err) {
    console.error('[SA_LOGIN_ERROR]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/sa/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  logSecurity('LOGOUT', { ip: _req.ip });
  res.json({ success: true, message: 'Logged out.' });
});

/**
 * GET /api/sa/me
 */
router.get('/me', requireAuth, (req: SARequest, res: Response) => {
  if (!req.saUser) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  res.json({
    success: true,
    data: { username: req.saUser.sub, role: req.saUser.role },
  });
});

export default router;
