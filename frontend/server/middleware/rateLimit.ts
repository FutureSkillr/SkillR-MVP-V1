import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function rateLimit(maxRequests: number, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      });
      return;
    }

    next();
  };
}

/**
 * Stricter rate limit for anonymous (unauthenticated) requests.
 * Verifies JWT validity instead of just checking for an Authorization header.
 */
export function anonymousRateLimit(anonMax: number, anonWindowMs: number, authMax: number, authWindowMs: number) {
  const anonLimiter = rateLimit(anonMax, anonWindowMs);
  const authLimiter = rateLimit(authMax, authWindowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    // Actually verify the token instead of just checking for the header
    let isAuthenticated = false;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        isAuthenticated = verifyToken(parts[1]) !== null;
      }
    }
    if (isAuthenticated) {
      authLimiter(req, res, next);
    } else {
      anonLimiter(req, res, next);
    }
  };
}

/**
 * Login brute-force protection: rate limit by email, 5 attempts per 15 minutes.
 */
export function loginRateLimit() {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email;
    if (!email || typeof email !== 'string') {
      next();
      return;
    }
    const key = `login:${email}`;
    const now = Date.now();
    const windowMs = 15 * 60_000; // 15 minutes
    const maxAttempts = 5;

    let entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count++;

    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many login attempts — please try again later',
        code: 'LOGIN_RATE_LIMIT',
        retryAfter,
      });
      return;
    }
    next();
  };
}

/** Reset all rate limit state (for testing) */
export function resetRateLimits() {
  buckets.clear();
}
