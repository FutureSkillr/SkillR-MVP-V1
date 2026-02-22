# TS-013: Analytics Dashboard

**Status:** active
**Stakeholder:** Admin
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates analytics route availability in the Go backend. All `/api/analytics/*` routes are Node.js-only and return 404 in the Go backend. The scenario verifies admin login, confirms analytics routes are not available, then falls back to health endpoints to verify system reachability.

## FR Coverage
- FR-050: User Behavior Tracking — `/api/analytics/*` routes not available in Go backend (404)
- FR-065: Flood Detection — `/api/analytics/flood-status` not available in Go backend (404)

## Scenario Steps
1. POST `/api/auth/login` with admin credentials (`admin@futureskiller.local`) → 200, receive admin auth token
2. GET `/api/analytics/overview` with admin token → 404 (Node.js-only route, not in Go backend)
3. GET `/api/analytics/events` with admin token → 404 (Node.js-only route)
4. GET `/api/analytics/export-csv` with admin token → 404 (Node.js-only route)
5. GET `/api/analytics/flood-status` with admin token → 404 (Node.js-only route)
6. GET `/api/health` with admin token → 200, verify system is accessible
7. GET `/api/health/detailed` with admin token → 200 or 401, verify detailed health probe

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
make k6-admin  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/admin/ts-013-analytics-dashboard.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL`
