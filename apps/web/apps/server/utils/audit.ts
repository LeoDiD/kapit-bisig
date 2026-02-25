/**
 * Audit Logging Utility
 *
 * [SECURITY CHECKLIST §3.3] Audit Logging Enabled
 *
 * Provides a single `logAudit()` helper that creates an AuditLog entry.
 * Never throws - audit writes are best-effort so they do not break the
 * primary request flow.
 */

import { Request } from 'express';
import AuditLog, { AuditAction } from '../models/AuditLog';
import { AuthRequest } from '../middleware/unifiedAuth';
import { sanitizeForLogs } from './logSanitizer';

/**
 * Append an audit entry. Never throws.
 *
 * @param req         Express request (used for IP / user-agent / auth context)
 * @param action      Audit action constant
 * @param entityType  E.g. "Auth", "StaffUser", "Distribution", "Claim"
 * @param entityId    DB _id or other identifier of the affected entity
 * @param metadata    Extra context (sensitive fields are auto-sanitized)
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
      // [RISK-2 MITIGATION] Sanitize metadata before persistence.
      metadata: sanitizeForLogs<Record<string, unknown>>(metadata),
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: (req.headers['user-agent'] ?? '').substring(0, 512),
    });
  } catch (err) {
    // Best-effort - never let audit failure break the main flow.
    console.error('[AuditLog] write failed:', (err as Error).message);
  }
}

