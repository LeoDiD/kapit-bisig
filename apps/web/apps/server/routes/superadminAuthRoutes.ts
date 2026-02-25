/**
 * SuperAdmin Auth Routes
 *
 * [SECURITY CHECKLIST §1.1] Strong Password Hashing (bcrypt compare against env hash)
 * [SECURITY CHECKLIST §1.2] Secure Sessions with Expiry (httpOnly cookie)
 * [SECURITY CHECKLIST §1.3] Generic Login Errors ("Invalid credentials.")
 * [SECURITY CHECKLIST §1.4] Rate Limiting (loginRateLimiter)
 * [SECURITY CHECKLIST §1.7] Logout Invalidates Session (revokeJWTByValue)
 * [SECURITY CHECKLIST §3.1] Secure Credential Storage (env-based superadmin)
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
import { randomUUID } from 'crypto';
import { loginRateLimiter } from '../middleware/rateLimiter';
import {
  requireAuth,
  SARequest,
  SuperadminPayload,
  logSecurity,
} from '../middleware/superadminAuth';
import { validateRequest } from '../validation/validateRequest';
import { saLoginBody } from '../validation/auth.schema';
import { revokeJWTByValue } from '../services/tokenRevocationService';

const router = Router();

const COOKIE_NAME = 'sa_token';
const TOKEN_EXPIRY_HOURS = Number(process.env.AUTH_TOKEN_EXPIRY_HOURS || 10);
const REMEMBER_ME_EXPIRY_DAYS = Number(process.env.AUTH_REMEMBER_ME_DAYS || 30);

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  if (s.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
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
router.post('/login', loginRateLimiter, validateRequest({ body: saLoginBody }), async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Basic input validation
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      logSecurity('LOGIN_FAIL', { reason: 'bad_input', ip: req.ip });
      // GENERIC error — do not reveal which field is missing
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
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
    const expiry = (remember ? `${REMEMBER_ME_EXPIRY_DAYS}d` : `${TOKEN_EXPIRY_HOURS}h`) as SignOptions['expiresIn'];
    const payload: SuperadminPayload = { sub: expectedUser, role: 'superadmin', jti: randomUUID() };
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
router.post('/logout', async (_req: Request, res: Response) => {
  const cookieToken = _req.cookies?.[COOKIE_NAME] as string | undefined;
  const authHeader = _req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = cookieToken || headerToken;

  if (token) {
    await revokeJWTByValue(token, 'session');
  }

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
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
