# TS-012: User Management

**Status:** active
**Stakeholder:** Admin
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates user management routes in the Go backend. `/api/users` is a Node.js-only route and returns 404 in the Go backend. The scenario verifies admin login, confirms `/api/users` is not available, then tests that user registration and login via the Go backend auth system work correctly.

## FR Coverage
- FR-046: User Administration — `/api/users` route not available in Go backend (404)
- FR-044: Role Management — role assignment routes not available in Go backend

## Scenario Steps
1. POST `/api/auth/login` with admin credentials (`admin@futureskiller.local`) → 200, receive admin auth token
2. GET `/api/users` with admin token → 404 (Node.js-only route, not in Go backend)
3. POST `/api/auth/register` with test user credentials → 200/201, register a new user
4. POST `/api/auth/login` with test user credentials → 200, receive user token
5. GET `/api/health` with user token → 200, verify registered user can access public endpoints

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
make k6-admin  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/admin/ts-012-user-management.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL`
