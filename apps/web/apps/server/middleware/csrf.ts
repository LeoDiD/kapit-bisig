/**
 * CSRF Protection Middleware (Double-Submit Cookie)
 *
 * [SECURITY CHECKLIST §2.4] CSRF Tokens Enabled
 *
 * How it works:
 *   1. On successful login, the server sets a non-httpOnly cookie `XSRF-TOKEN`
 *      containing a random token. This cookie IS readable by JavaScript.
 *   2. The frontend reads this cookie and sends the same value in the
 *      `X-CSRF-Token` request header for every state-changing request.
 *   3. This middleware compares the cookie value with the header value.
 *      A mismatch (or missing value) → 403.
 *
 * Exemptions:
 *   - GET / HEAD / OPTIONS requests (safe methods)
 *   - Paths listed in CSRF_EXEMPT_PATHS (login, forgot-password, etc.)
 *   - Requests where no auth cookie exists yet (nothing to protect)
 *
 * IMPORTANT: The XSRF-TOKEN cookie must NOT be httpOnly so the
 * browser JS can read it. It must use sameSite=lax to prevent
 * cross-site cookie sending.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/* ------------------------------------------------------------------ */
/*  Token generation                                                   */
/* ------------------------------------------------------------------ */

/** Generate a cryptographically random CSRF token. */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/* ------------------------------------------------------------------ */
/*  Cookie helper                                                      */
/* ------------------------------------------------------------------ */

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'x-csrf-token'; // Express lowercases incoming headers
const AUTH_COOKIE = 'sa_token';

/** Set the XSRF-TOKEN cookie (called after successful login). */
export function setCsrfCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // JS must be able to read it
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days — matches longest session
  });
}

/* ------------------------------------------------------------------ */
/*  Exempt paths                                                       */
/* ------------------------------------------------------------------ */

/**
 * Paths that are exempt from CSRF validation.
 * These are endpoints that must work before a session / CSRF cookie exists.
 */
const CSRF_EXEMPT_PATHS: string[] = [
  '/api/auth/login',
  '/api/auth/login/verify-otp',
  '/api/auth/login/resend-otp',
  '/api/mobile-auth/login',
  '/api/auth/forgot-password/send-otp',
  '/api/auth/forgot-password/verify-otp',
  '/api/auth/forgot-password/reset',
  '/api/sa/login',
  '/api/health',
];

function isExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */

/**
 * CSRF protection middleware.
 * Apply AFTER cookieParser and AFTER body-parsing middleware.
 */
export function csrfProtect(req: Request, res: Response, next: NextFunction): void {
  // BYPASS CSRF IN TEST ENVIRONMENT TO ALLOW POSTMAN TESTS TO RUN WITHOUT CSRF HEADERS
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  // Safe methods — no CSRF check needed
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  // Exempt paths (pre-auth endpoints)
  if (isExempt(req.path)) {
    next();
    return;
  }

  // If there's no auth cookie, there's nothing to protect yet
  const authCookie = req.cookies?.[AUTH_COOKIE];
  if (!authCookie) {
    next();
    return;
  }

  // Double-submit comparison
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      success: false,
      message: 'CSRF validation failed.',
    });
    return;
  }

  next();
}
