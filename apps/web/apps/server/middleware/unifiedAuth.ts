/**
 * Unified Authentication & RBAC Middleware
 *
 * [SECURITY CHECKLIST §1.5] Validated Tokens (JWT) - cookie-first verification
 * [SECURITY CHECKLIST §1.2] Secure Sessions with Expiry
 * [SECURITY CHECKLIST §3.2] Role-Based Access Control (RBAC)
 *
 * Supports two account types via a single JWT cookie (`sa_token`):
 *   1. SUPERADMIN - fixed env-based account   (role = "SUPERADMIN")
 *   2. LGU_STAFF  - DB-backed staff accounts  (role = "LGU_STAFF")
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isJWTRevoked } from '../services/tokenRevocationService';
import { sanitizeForLogs } from '../utils/logSanitizer';

/* ------------------------------------------------------------------ */
/*  Constants & types                                                 */
/* ------------------------------------------------------------------ */

const COOKIE_NAME = 'sa_token';

export type AppRole = 'SUPERADMIN' | 'LGU_STAFF' | 'Volunteer';

/** Shape stored inside every JWT we issue. */
export interface AuthPayload {
  sub: string; // username
  role: AppRole;
  userId?: string; // DB _id for staff users
  assignedBarangays?: string[];
  jti?: string;
  iat?: number;
  exp?: number;
}

/** Extends Express Request to carry the verified user info. */
export interface AuthRequest extends Request {
  authUser?: AuthPayload;
}

// Keep backward-compat aliases so existing imports still compile.
export type SuperadminPayload = AuthPayload;
export type SARequest = AuthRequest;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Security-event logger (sanitized + production-safe). */
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

/** Extract token: cookie first, then Authorization header. */
function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Middleware                                                        */
/* ------------------------------------------------------------------ */

/**
 * requireAuth - verifies a valid JWT is present.
 * [SECURITY CHECKLIST §1.5] JWT verification (HS256 + revocation check)
 * Attaches `req.authUser` (and legacy `req.saUser`).
 */
export const requireAuth = async (
  req: AuthRequest,
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
    const decoded = jwt.verify(token, getJWTSecret(), { algorithms: ['HS256'] }) as AuthPayload;
    if (await isJWTRevoked(decoded.jti)) {
      logSecurity('ACCESS_DENIED', { reason: 'token_revoked', ip: req.ip });
      res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }
    req.authUser = decoded;
    // Backward compat (used in superadminAuthRoutes /me)
    (req as any).saUser = decoded;
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
 * requireSuperadmin - role must be "SUPERADMIN".
 * [SECURITY CHECKLIST §3.2] RBAC - superadmin-only guard
 * Place AFTER requireAuth.
 */
export const requireSuperadmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.authUser?.role !== 'SUPERADMIN') {
    logSecurity('ACCESS_DENIED', { reason: 'insufficient_role', ip: req.ip, role: req.authUser?.role });
    res.status(403).json({ success: false, message: 'Forbidden - superadmin only' });
    return;
  }
  next();
};

/**
 * requireStaffOrSuperadmin - role must be "SUPERADMIN" or "LGU_STAFF".
 * [SECURITY CHECKLIST §3.2] RBAC - staff/superadmin guard
 */
export const requireStaffOrSuperadmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const role = req.authUser?.role;
  if (role !== 'SUPERADMIN' && role !== 'LGU_STAFF' && role !== 'Volunteer') {
    logSecurity('ACCESS_DENIED', { reason: 'insufficient_role', ip: req.ip, role });
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  next();
};

/**
 * scopeBarangayGuard - ensures the barangay in the request is within
 * the user's assigned scope. SUPERADMIN is always exempt.
 * [SECURITY CHECKLIST §3.2] RBAC - barangay-level data scoping
 *
 * @param field  Where to read the barangay value from:
 *               'body'   -> req.body.barangay
 *               'params' -> req.params.barangay
 *               'query'  -> req.query.barangay
 */
export function scopeBarangayGuard(field: 'body' | 'params' | 'query' = 'body') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.authUser?.role === 'SUPERADMIN') {
      next();
      return;
    }

    const assigned = req.authUser?.assignedBarangays ?? [];

    let target: string | undefined;
    if (field === 'body') target = req.body?.barangay;
    else if (field === 'params') target = req.params?.barangay;
    else target = req.query?.barangay as string | undefined;

    // If no target barangay specified in the request, route logic can inject scope filter.
    if (!target) {
      next();
      return;
    }

    if (!assigned.includes(target)) {
      logSecurity('SCOPE_DENIED', {
        ip: req.ip,
        user: req.authUser?.sub,
        target,
        assigned,
      });
      res.status(403).json({
        success: false,
        message: 'You do not have access to the requested barangay',
      });
      return;
    }

    next();
  };
}

