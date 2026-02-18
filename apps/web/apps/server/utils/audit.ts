/**
 * Audit Logging Utility
 *
 * Provides a single `logAudit()` helper that creates an AuditLog entry.
 * Never throws — audit writes are best-effort so they do not break the
 * primary request flow.
 *
 * Usage:
 *   import { logAudit } from '../utils/audit';
 *   await logAudit(req, 'LOGIN_SUCCESS', 'Auth', userId, { username });
 */

import { Request } from 'express';
import AuditLog, { AuditAction } from '../models/AuditLog';
import { AuthRequest } from '../middleware/unifiedAuth';

/* ------------------------------------------------------------------ */
/*  Sanitise metadata — strip anything that looks like a secret        */
/* ------------------------------------------------------------------ */

const SECRET_KEYS = new Set([
  'password',
  'passwordHash',
  'newPassword',
  'token',
  'secret',
  'authorization',
  'cookie',
  'jwt',
  'hash',
  'claimToken',
]);

function sanitise(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SECRET_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitise(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/* ------------------------------------------------------------------ */
/*  Public helper                                                      */
/* ------------------------------------------------------------------ */

/**
 * Append an audit entry. Never throws.
 *
 * @param req         Express request (used for IP / user-agent / auth context)
 * @param action      Audit action constant
 * @param entityType  E.g. "Auth", "StaffUser", "Distribution", "Claim"
 * @param entityId    DB _id or other identifier of the affected entity
 * @param metadata    Extra context (secrets are auto-stripped)
 */
export async function logAudit(
  req: Request | AuthRequest,
  action: AuditAction,
  entityType: string,
  entityId: string = '',
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const actorId = authReq.authUser?.userId ?? authReq.authUser?.sub ?? null;
    const actorRole = authReq.authUser?.role ?? 'ANONYMOUS';
    const actorName = authReq.authUser?.sub ?? '';

    await AuditLog.create({
      actorId,
      actorRole,
      actorName,
      action,
      entityType,
      entityId,
      metadata: sanitise(metadata),
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: (req.headers['user-agent'] ?? '').substring(0, 512),
    });
  } catch (err) {
    // Best-effort — never let audit failure break the main flow
    console.error('[AuditLog] write failed:', (err as Error).message);
  }
}
