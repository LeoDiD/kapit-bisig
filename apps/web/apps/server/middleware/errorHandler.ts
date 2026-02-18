import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
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

