/**
 * Rate limiter unit tests.
 *
 * The rate limiter lives in server/ which is excluded from the Vite test runner.
 * This file tests a self-contained reimplementation of the sliding-window logic
 * to validate the algorithm. The actual server middleware is tested via
 * integration tests (docker-compose + curl).
 */
import { describe, it, expect } from 'vitest';

// Inline sliding-window rate limiter logic (mirrors server/middleware/rateLimit.ts)
function createLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now: number): { allowed: boolean; retryAfter?: number } {
    let entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { allowed: true };
  };
}

describe('rate limiter algorithm', () => {
  it('allows requests within the limit', () => {
    const check = createLimiter(3, 60_000);
    const now = Date.now();

    expect(check('ip1', now).allowed).toBe(true);
    expect(check('ip1', now).allowed).toBe(true);
    expect(check('ip1', now).allowed).toBe(true);
  });

  it('blocks requests exceeding the limit', () => {
    const check = createLimiter(2, 60_000);
    const now = Date.now();

    expect(check('ip1', now).allowed).toBe(true);
    expect(check('ip1', now).allowed).toBe(true);
    const third = check('ip1', now);
    expect(third.allowed).toBe(false);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it('resets after the window expires', () => {
    const check = createLimiter(1, 1000);
    const now = Date.now();

    expect(check('ip1', now).allowed).toBe(true);
    expect(check('ip1', now).allowed).toBe(false);

    // After window expires
    expect(check('ip1', now + 1001).allowed).toBe(true);
  });

  it('tracks different keys independently', () => {
    const check = createLimiter(1, 60_000);
    const now = Date.now();

    expect(check('ip1', now).allowed).toBe(true);
    expect(check('ip1', now).allowed).toBe(false);
    // Different key still allowed
    expect(check('ip2', now).allowed).toBe(true);
  });

  it('returns correct retryAfter value', () => {
    const check = createLimiter(1, 30_000);
    const now = Date.now();

    check('ip1', now);
    const blocked = check('ip1', now + 10_000);
    expect(blocked.allowed).toBe(false);
    // 30s window started at `now`, checked at now+10s → 20s remaining
    expect(blocked.retryAfter).toBe(20);
  });
});
