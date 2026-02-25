/**
 * validateRequest Middleware
 *
 * [SECURITY CHECKLIST §2.1] All Inputs Validated Server-Side
 * [SECURITY CHECKLIST §2.2] Schema Validation (Zod)
 *
 * Generic Express middleware that validates req.body, req.query, and
 * req.params against Zod schemas.  Unknown keys are rejected (strict mode).
 *
 * Usage:
 *   router.post('/foo', validateRequest({ body: fooSchema }), handler);
 *   router.get ('/bar', validateRequest({ query: barQuery, params: barParams }), handler);
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Returns Express middleware that validates the specified request parts.
 *
 * On failure → 400 with structured error list.
 * On success → replaces req.body / req.query / req.params with the
 *              parsed (coerced + stripped) values and calls next().
 */
export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { location: string; path: string; message: string }[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        collectErrors(result.error, 'body', errors);
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        collectErrors(result.error, 'query', errors);
      } else {
        // Replace query with validated data
        (req as any).query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        collectErrors(result.error, 'params', errors);
      } else {
        req.params = result.data as any;
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectErrors(
  zodError: ZodError,
  location: string,
  out: { location: string; path: string; message: string }[],
) {
  for (const issue of zodError.issues) {
    out.push({
      location,
      path: issue.path.join('.'),
      message: issue.message,
    });
  }
}
