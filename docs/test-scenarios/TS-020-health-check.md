# TS-020: Health Check Endpoints

**Status:** active
**Stakeholder:** Operator
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates basic and detailed health endpoints. The detailed health endpoint uses a `?token=` query parameter (not an Authorization header) to authenticate. When authenticated, the detailed endpoint returns component status for postgres, redis, ai, and honeycomb.

## FR Coverage
- FR-068: Health Check — basic health (`/api/health`) and detailed health (`/api/health/detailed`)

## Scenario Steps
1. GET `/api/health` → 200 with `status` field (basic health check)
2. GET `/api/health/detailed` without token → 200 with basic/limited response
3. GET `/api/health/detailed?token=HEALTH_TOKEN` with valid token via query param → 200 with `{status, components:{postgres, redis, ai, honeycomb}}` response
4. GET `/api/health/nonexistent` → verify no information leaks on invalid paths

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 2 |
| Duration | 1m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms |
| Error rate | < 1% |

## Run
```bash
make k6-operator  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/operator/ts-020-health-check.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `HEALTH_TOKEN` (query param token for detailed health), `BASE_URL`
