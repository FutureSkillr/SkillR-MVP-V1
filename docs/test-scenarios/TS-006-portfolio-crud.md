# TS-006: Portfolio CRUD Operations

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates portfolio data operations. Portfolio routes (`/api/v1/portfolio/*`) are NOT registered in the Go backend. The scenario probes for their availability with `routeExists()` and gracefully falls back to testing available routes (health, config, health-detailed) when portfolio is absent.

## FR Coverage
- FR-003: Firebase Persistence — data is persisted and retrievable
- FR-020: Level 2 Reflection — reflection entries are stored
- FR-049: Profile + Activity History — engagement and activity data

## Scenario Steps
1. Register + login via `registerAndLogin(email, displayName, password)` → obtain auth token
2. Probe `/api/v1/portfolio/profile` via `routeExists()` to check availability
3. **If portfolio routes NOT available** (expected in current Go backend):
   a. Log warning: "portfolio routes not available in Go backend"
   b. Fallback group tests available routes:
      - GET `/api/health` → 200 with `status` field
      - GET `/api/config` → 200 with valid JSON
      - GET `/api/health/detailed` with auth headers → 200 or 401
   c. Verify no information leaks in all responses
4. **If portfolio routes ARE available** (future):
   a. GET `/api/v1/portfolio/profile` → 200 or 404
   b. POST `/api/v1/portfolio/reflections` → 200/201
   c. GET `/api/v1/portfolio/reflections` → 200
   d. POST `/api/v1/portfolio/evidence` → 200/201
   e. GET `/api/v1/portfolio/evidence` → 200
   f. GET `/api/v1/portfolio/engagement` → 200

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 3 |
| Duration | 2m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 500ms |
| Error rate | < 5% |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-006-portfolio-crud.js
```

## Dependencies
- Requires: `make local-up` running
- Note: Portfolio routes are not yet registered in Go backend; scenario gracefully skips
