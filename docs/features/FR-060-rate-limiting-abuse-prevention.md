# FR-060: Rate Limiting & Abuse Prevention

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR
**Phase:** MVP3+

## Problem

The frontend rate limiter grants the higher (authenticated) rate limit to any request with an `Authorization` header — the token is never validated. The Go backend rate limiter fails open: Redis errors or misconfiguration disables rate limiting entirely. The public endorsement submit endpoint has no auth or rate limiting — vulnerable to spam. Login endpoints have no brute-force protection. IP-based rate limiting trusts proxy headers without configuring trusted ranges.

**Sec-report findings:** H4, H7, H9, M15, M22, M24

## Solution

### Frontend Express
1. **Validate token before granting auth rate limit** — In `rateLimit.ts`, verify the JWT (from FR-056) before applying the authenticated rate limit tier. Invalid/missing tokens get the anonymous tier.
2. **Brute-force protection on login** — After 5 failed login attempts for the same email within 15 minutes, block further attempts for that email for 15 minutes. Return 429.
3. **Pre-auth AI abuse prevention** — After the anonymous Gemini rate limit is exhausted, require a lightweight proof (e.g., browser fingerprint + timestamp HMAC). Full CAPTCHA deferred to V1.0.

### Go backend
4. **In-memory fallback for rate limiter** — When Redis is unavailable, fall back to a local `sync.Map`-based counter instead of skipping rate limiting. For critical endpoints (auth, AI), fail closed (reject requests when rate state is unknown).
5. **Rate limit + invitation token on endorsement submit** — Apply rate limiting. Consider requiring a signed invitation token (UUID + HMAC) to prevent anonymous spam.
6. **Configure IP extractor** — Set Echo's `IPExtractor` to trust only Cloud Run's proxy IP ranges. Do not trust arbitrary `X-Forwarded-For` values.

## Acceptance Criteria

- [x] Request with `Authorization: garbage` gets anonymous rate limit, not authenticated tier
- [x] 6th failed login for same email within 15 minutes returns 429
- [x] Redis connection failure does not disable rate limiting — in-memory fallback activates
- [x] `POST /api/v1/portfolio/endorsements` without rate limiting returns 429 after threshold
- [x] IP spoofing via `X-Forwarded-For` does not bypass rate limits (Echo uses configured IP extractor)
- [x] Anonymous Gemini abuse beyond threshold is blocked
- [x] Unit tests for: rate limit tier selection, brute-force lockout, Redis failover

### Pod endpoints (MVP4)
7. **Pod route rate limiting** — Pod routes (`/api/v1/pod/*`) inherit the v1 group's Firebase auth middleware, so only authenticated users can access them. The sync endpoint (`POST /api/v1/pod/sync`) is the most resource-intensive as it reads from PostgreSQL and writes to the CSS Pod server. Consider adding a per-user sync rate limit (e.g., 5 syncs/hour) in V1.0 when Pod goes to production.

## Dependencies

- FR-056 (Auth & Sessions) — JWT validation used for rate limit tier
- FR-051 (API Gateway)
- FR-076 (Solid Pod Connection) — Pod endpoint protection
- TC-025 (Security Hardening Phase)

## Notes

- In-memory rate limiting is sufficient for single-instance Cloud Run. Multi-instance requires Redis (V1.0 scale concern).
- The endorsement invitation token pattern can reuse the portfolio sharing mechanism from FR-030.
- Pod sync rate limiting deferred to V1.0 — MVP4 is dev-only with on-demand manual sync.
