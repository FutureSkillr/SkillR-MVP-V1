# TS-010: Admin Auth & Access Control

**Status:** active
**Stakeholder:** Admin
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates admin login, admin-only route protection, and authorization boundaries in docker-compose (Go backend). In docker-compose without Firebase credentials, admin routes (`/api/v1/prompts`, `/api/v1/agents`) return 401 for all callers because `RequireAdmin()` depends on Firebase auth middleware to populate user context. In production with Firebase, admin tokens would yield 200 and non-admin tokens would yield 403.

## FR Coverage
- FR-056: Auth & Sessions — admin login flow produces valid UUID token
- FR-057: Admin Access Control — admin routes protected by Firebase auth middleware (401 without Firebase, 403 for non-admin in production)

## Scenario Steps
1. POST `/api/auth/login` with admin credentials (`admin@futureskiller.local` / `Admin1local`) → 200, receive UUID auth token with admin role
2. GET `/api/v1/prompts` with admin token → 401 (Firebase auth middleware not available in docker-compose)
3. GET `/api/v1/agents` with admin token → 401 (same reason: no Firebase middleware)
4. POST `/api/auth/register` + POST `/api/auth/login` with non-admin credentials → 200, receive non-admin token
5. GET `/api/v1/prompts` with non-admin token → 401 (no Firebase middleware; would be 403 in production)
6. GET `/api/v1/agents` with non-admin token → 401 (same reason)
7. GET `/api/v1/prompts` without token → 401
8. GET `/api/v1/agents` without token → 401

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 30s |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-admin
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL`
