/**
 * MongoDB / NoSQL Injection Sanitizer Middleware
 *
 * [SECURITY CHECKLIST §2.3] NoSQL Injection Protection — Layer 2 (strip)
 *
 * Recursively strips keys that start with `$` or contain `.` from
 * req.body, req.query, and req.params.  This blocks common NoSQL
 * injection vectors such as `{ "$gt": "" }` or `{ "field.nested": ... }`.
 *
 * Also escapes user-supplied strings before they are used in RegExp
 * (via the exported `escapeRegex` helper).
 *
 * Apply as an early middleware in the Express pipeline, BEFORE route
 * handlers and BEFORE body-schema validation.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware — sanitizes req.body, req.query, and req.params.
 */
export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    (req as any).query = sanitize(req.query as Record<string, unknown>);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params) as Record<string, string>;
  }
  next();
}

/**
 * Recursively remove dangerous keys (`$`-prefixed or containing `.`)
 * and sanitize string values that contain `$` at the start.
 */
function sanitize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Drop keys starting with `$` or containing `.`
      if (key.startsWith('$') || key.includes('.')) {
        continue; // silently strip
      }
      clean[key] = sanitize(value);
    }
    return clean as T;
  }

  // For string values, strip leading `$` to prevent operator injection
  // when strings are used as values (e.g. in query params)
  if (typeof obj === 'string' && obj.startsWith('$')) {
    return obj.replace(/^\$+/, '') as unknown as T;
  }

  return obj;
}

/**
 * Escape special regex characters in user input so it can be safely
 * passed to `new RegExp(...)`.  Prevents ReDoS and unintended patterns.
 *
 * Usage:
 *   const re = new RegExp(escapeRegex(userInput), 'i');
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
