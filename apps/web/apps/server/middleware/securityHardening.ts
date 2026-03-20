import { Request, Response, NextFunction } from 'express';

// [SECURITY CHECKLIST §2.3] NoSQL Injection Protection — recursive key inspection
const hasUnsafeKey = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some(hasUnsafeKey);
  if (typeof value !== 'object') return false;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (hasUnsafeKey(nested)) {
      return true;
    }
  }
  return false;
};

// [SECURITY CHECKLIST §2.3] NoSQL Injection Protection — first-pass rejection middleware
export function rejectNoSQLInjection(req: Request, res: Response, next: NextFunction): void {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    res.status(400).json({
      success: false,
      message: 'Invalid request payload',
      code: 'INVALID_PAYLOAD',
    });
    return;
  }
  next();
}

// [SECURITY CHECKLIST §3.4] HTTPS enforcement in production
export function enforceHTTPSInProduction(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const isSecure = req.secure || proto === 'https';

  if (!isSecure) {
    res.status(403).json({
      success: false,
      message: 'HTTPS is required',
      code: 'HTTPS_REQUIRED',
    });
    return;
  }

  next();
}

export function getAllowedCorsOrigins(): string[] {
  const envValue = process.env.CORS_ORIGIN;
  if (!envValue) return ['http://localhost:3000'];

  return envValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isPrivateDevOrigin(origin: string): boolean {
  const privateDevOriginRegex =
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i;
  return privateDevOriginRegex.test(origin);
}



