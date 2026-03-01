/**
 * Centralized log-data sanitization helpers.
 *
 * Security intent:
 * - Remove or mask sensitive fields before writing logs.
 * - Keep logs useful for debugging without exposing secrets/biometrics/PII.
 */

const REDACTED = '[REDACTED]';

const REDACT_KEY_EXACT = new Set([
  'password',
  'passwordhash',
  'newpassword',
  'token',
  'claimtoken',
  'secret',
  'authorization',
  'cookie',
  'jwt',
  'otp',
  'hash',
  'image',
  'faceimage',
  'frontidimage',
  'backidimage',
  'descriptor',
  'facedescriptor',
  'biometric',
  'idnumber',
  'query',
  'search',
]);

const REDACT_KEY_PARTIAL = [
  'password',
  'token',
  'secret',
  'auth',
  'cookie',
  'jwt',
  'otp',
  'biometric',
  'face',
  'descriptor',
  'image',
  'idnumber',
  'query',
  'search',
];

const MASK_KEY_EXACT = new Set([
  'ip',
  'ipaddress',
  'username',
  'email',
  'mobilenumber',
  'phonenumber',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function shouldRedact(key: string): boolean {
  const normalized = normalizeKey(key);
  if (REDACT_KEY_EXACT.has(normalized)) return true;
  return REDACT_KEY_PARTIAL.some((fragment) => normalized.includes(fragment));
}

function shouldMask(key: string): boolean {
  return MASK_KEY_EXACT.has(normalizeKey(key));
}

function maskString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '[MASKED]';
  if (trimmed.length <= 4) return '****';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}

export function maskIpAddress(ip: string): string {
  const trimmed = (ip || '').trim();
  if (!trimmed) return '[MASKED]';

  // IPv4
  const v4 = trimmed.split('.');
  if (v4.length === 4 && v4.every((part) => /^\d+$/.test(part))) {
    return `${v4[0]}.${v4[1]}.***.***`;
  }

  // IPv6 or unknown format
  if (trimmed.includes(':')) {
    const chunks = trimmed.split(':').filter(Boolean);
    if (chunks.length >= 2) {
      return `${chunks[0]}:****:${chunks[chunks.length - 1]}`;
    }
  }

  return maskString(trimmed);
}

function sanitizeValue(value: unknown, parentKey?: string): unknown {
  if (parentKey && shouldRedact(parentKey)) {
    return REDACTED;
  }

  if (parentKey && shouldMask(parentKey)) {
    if (typeof value === 'string') {
      return normalizeKey(parentKey).includes('ip')
        ? maskIpAddress(value)
        : maskString(value);
    }
    return '[MASKED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      clean[key] = sanitizeValue(nested, key);
    }
    return clean;
  }

  return value;
}

export function sanitizeForLogs<T = unknown>(value: T): T {
  return sanitizeValue(value) as T;
}

