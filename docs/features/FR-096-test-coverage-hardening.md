# FR-096: Test Coverage Hardening

**Status:** done
**Priority:** should
**Created:** 2026-02-23

## Problem
Daily audit (2026-02-23) found 35% backend unit test coverage, 0% React component tests,
and missing tests for security-critical middleware (rate limiting, Firebase auth wiring).

## Solution
Add targeted tests for security middleware and critical integration points.

## Acceptance Criteria
- [ ] Unit test for RateLimit middleware (in-memory fallback path)
- [ ] Unit test for RateLimit middleware (Redis path)
- [ ] Integration test: FirebaseAuth middleware rejects invalid tokens
- [ ] Integration test: CSP header present on all responses
- [ ] Unit test for RateLimiter.SetClient upgrade path
- [ ] Test for credentials/ directory not tracked by git

## Dependencies
- FR-056 (auth middleware must be wired)
- FR-060 (rate limiters must be wired)
