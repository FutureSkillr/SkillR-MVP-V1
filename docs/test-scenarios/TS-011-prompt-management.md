# TS-011: Prompt Management CRUD

**Status:** active
**Stakeholder:** Admin
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates prompt management routes (`/api/v1/prompts`) in the Go backend. In docker-compose without Firebase credentials, all prompt routes return 401 because `RequireAdmin()` depends on Firebase auth middleware to populate user context. The test verifies admin login works, probes prompt endpoints (expecting 401), and includes a fallback path for future environments where Firebase auth is available.

## FR Coverage
- FR-043: Admin Panel — prompt management API endpoints (`/api/v1/prompts`)
- FR-039: Prompt Tracking — prompt version history and audit trail

## Scenario Steps
1. POST `/api/auth/login` with admin credentials (`admin@futureskiller.local`) → 200, receive auth token
2. GET `/api/v1/prompts` with admin token → 401 (Firebase auth middleware not available in docker-compose)
3. GET `/api/v1/prompts/intro` with admin token → 401 (same reason)
4. PUT `/api/v1/prompts/intro` with admin token → 401 (same reason)
5. GET `/api/v1/prompts/intro/history` with admin token → 401 (same reason)
6. POST `/api/v1/prompts/intro/test` with admin token → 401 (same reason)
7. If any prompt route returns 200 (future enhancement with local Firebase), proceed with full CRUD: list prompts, get single prompt by ID, update prompt, get history, test prompt

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 1m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 1s |
| Error rate | < 5% |

## Run
```bash
make k6-admin  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/admin/ts-011-prompt-management.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL`
