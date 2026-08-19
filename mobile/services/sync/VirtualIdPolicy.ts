const VIRTUAL_ID_INVALIDATION_CODES = new Set([
  'INVALID_TOKEN',
  'PENDING_APPROVAL',
  'QR_NOT_ALLOWED',
  'QR_REVOKED',
  'REGISTRATION_NOT_APPROVED',
  'TOKEN_REVOKED',
]);

export function shouldInvalidateVirtualId(status?: number, code?: string): boolean {
  return status === 403 || Boolean(code && VIRTUAL_ID_INVALIDATION_CODES.has(code));
}
