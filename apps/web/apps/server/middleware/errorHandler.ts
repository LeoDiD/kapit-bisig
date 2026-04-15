import { Request, Response, NextFunction } from 'express';

// [SECURITY CHECKLIST §1.3] Generic error messages — no path leakage on 404
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
}

// [SECURITY CHECKLIST §1.3] Generic error messages — no stack traces leaked to client
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON body.',
    });
    return;
  }

  console.error('[UNHANDLED_ERROR]', err);

  if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: string }).name === 'ValidationError'
  ) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
    });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: 'Conflict: duplicate value',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

