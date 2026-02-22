import type { Request, Response, NextFunction } from 'express';

// Express requires exactly 4 parameters to recognise error middleware.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function apiErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const msg = err?.message ?? String(err);
  console.error(`[gateway] ${req.method} ${req.path} — ${msg}`);

  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    res.status(429).json({
      error: 'AI service rate limited — please try again shortly',
      code: 'UPSTREAM_RATE_LIMIT',
    });
    return;
  }

  if (msg.includes('API_KEY') || msg.includes('not set')) {
    res.status(500).json({
      error: 'Service configuration error',
      code: 'CONFIG_ERROR',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
