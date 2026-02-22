# TS-021: Public Endpoint Availability Monitoring

**Status:** active
**Stakeholder:** Operator
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates public endpoint availability under concurrent load. The `/api/capacity` endpoint does not exist in the Go backend (it was Node.js-only). This scenario instead tests the nearest public endpoints -- `/api/config` and `/api/health` -- to confirm the system is reachable and returning correct data under load.

## FR Coverage
- FR-062: Warteraum — `/api/capacity` not available in Go backend; adapted to test `/api/config` and `/api/health`

## Scenario Steps
1. GET `/api/config` → 200 with `firebase` field containing `apiKey` and `projectId`
2. GET `/api/health` → 200 with `status` field

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 5 |
| Duration | 2m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms |
| Error rate | < 1% |

## Run
```bash
make k6-operator  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/operator/ts-021-capacity-monitoring.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`
