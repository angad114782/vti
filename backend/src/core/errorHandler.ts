import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from './AppError';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;
  const isProd = process.env.NODE_ENV === 'production';

  if (isAppError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, requestId },
    });
    return;
  }

  // Unknown error — log full details, return generic message in prod
  console.error('[ErrorHandler]', { requestId, err });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Internal server error' : String(err instanceof Error ? err.message : err),
      requestId,
    },
  });
}
