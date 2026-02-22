# TS-030: Auth Enforcement

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that protected routes reject unauthenticated, invalid-token, and expired-token requests. Admin routes (`/api/v1/prompts`, `/api/v1/agents`) use Firebase auth middleware and must return 401. AI routes (`/api/v1/ai/chat`, `/api/v1/ai/extract`, `/api/v1/ai/generate`) use OptionalFirebaseAuth so they may allow unauthenticated access but must not leak internal information.

## FR Coverage
- FR-056: Auth & Sessions — token validation and expiration enforcement
- FR-057: Admin Access Control — admin route protection against unauthorized access

## Scenario Steps
1. GET `/api/v1/prompts` without Authorization header → 401
2. GET `/api/v1/agents` without Authorization header → 401
3. POST `/api/v1/ai/chat` without Authorization header → no info leak (may return 200, 500, or 503 depending on GCP config; AI routes use OptionalFirebaseAuth)
4. POST `/api/v1/ai/extract` without Authorization header → no info leak
5. POST `/api/v1/ai/generate` without Authorization header → no info leak
6. GET `/api/v1/prompts` with `Authorization: Bearer fake-invalid-token-xyz-12345` → 401
7. GET `/api/v1/agents` with `Authorization: Bearer fake-invalid-token-xyz-12345` → 401
8. POST `/api/v1/ai/chat` with fake Bearer token → no info leak (OptionalFirebaseAuth silently ignores invalid tokens)
9. POST `/api/v1/ai/extract` with fake Bearer token → no info leak
10. POST `/api/v1/ai/generate` with fake Bearer token → no info leak
11. GET `/api/v1/prompts` with expired-looking JWT → 401
12. GET `/api/v1/agents` with expired-looking JWT → 401

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 30s |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-030-auth-enforcement.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`

## Notes
- AI routes use OptionalFirebaseAuth (not strict RequireFirebaseAuth), so they do not reject unauthenticated requests with 401. The test verifies they do not leak internal information.
- Admin routes use RequireAdmin() which requires userInfo from Firebase middleware; any non-Firebase token results in 401.
- No `/api/v1/portfolio/*` routes exist in the Go backend (handler never initialized).
