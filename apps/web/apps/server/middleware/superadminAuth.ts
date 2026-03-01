/**
 * SuperAdmin Authentication Middleware
 *
 * [SECURITY CHECKLIST §1.5] Validated Tokens (JWT) - HS256 + revocation check
 * [SECURITY CHECKLIST §3.2] RBAC - superadmin role guard
 *
 * Provides JWT-based auth guards for the single SUPERADMIN account.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isJWTRevoked } from '../services/tokenRevocationService';
import { sanitizeForLogs } from '../utils/logSanitizer';

const COOKIE_NAME = 'sa_token';

/** Shape of the JWT payload we issue. */
export interface SuperadminPayload {
  sub: string; // username
  role: 'superadmin';
  jti?: string;
  iat?: number;
  exp?: number;
}

/** Extends Express Request to carry the verified user info. */
export interface SARequest extends Request {
  saUser?: SuperadminPayload;
}

/** Security event logger (sanitized + production-safe). */
export function logSecurity(event: string, meta?: Record<string, unknown>) {
  // [RISK-2 MITIGATION] In production, disable console security logs unless explicitly enabled.
  const shouldConsoleLog =
    process.env.NODE_ENV !== 'production' ||
    process.env.ALLOW_SECURITY_CONSOLE_LOGS === 'true';

  if (!shouldConsoleLog) return;

  const ts = new Date().toISOString();
  const safeMeta = meta ? sanitizeForLogs(meta) : undefined;
  console.log(`[SECURITY ${ts}] ${event}`, safeMeta ? JSON.stringify(safeMeta) : '');
}

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not defined');
  if (s.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
  return s;
}

/**
 * Extract token: cookie first, then Authorization header.
 */
function extractToken(req: Request): string | null {
  // 1. httpOnly cookie
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;

  // 2. Bearer header fallback
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * requireAuth - verifies a valid JWT is present.
 * Attaches `req.saUser` on success.
 */
export const requireAuth = async (
  req: SARequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extractToken(req);

  if (!token || token === 'null' || token === 'undefined') {
    logSecurity('ACCESS_DENIED', { reason: 'no_token', ip: req.ip, path: req.path });
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret(), { algorithms: ['HS256'] }) as SuperadminPayload;
    if (await isJWTRevoked(decoded.jti)) {
      logSecurity('ACCESS_DENIED', { reason: 'token_revoked', ip: req.ip });
      res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }
    req.saUser = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logSecurity('ACCESS_DENIED', { reason: 'token_expired', ip: req.ip });
      res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }
    logSecurity('ACCESS_DENIED', { reason: 'invalid_token', ip: req.ip });
    res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

/**
 * requireSuperadmin - must be placed AFTER requireAuth.
 * Ensures role is "superadmin".
 */
export const requireSuperadmin = (
  req: SARequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.saUser?.role !== 'superadmin') {
    logSecurity('ACCESS_DENIED', { reason: 'insufficient_role', ip: req.ip, role: req.saUser?.role });
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  next();
};

