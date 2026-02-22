# TS-040: Baseline Smoke Test

**Status:** active
**Stakeholder:** Operator
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Fastest possible validation that the application stack is alive and responding. Sequentially hits the public endpoints (health, config, health again) and verifies each returns 200 with valid JSON.

## FR Coverage
- FR-068: Health Check — backend responds to health probe
- FR-054: Intro Sequence — config endpoint returns firebase configuration

## Scenario Steps
1. GET `/api/health` → 200 with `status` field and valid JSON
2. GET `/api/config` → 200 with `firebase` field and valid JSON
3. GET `/api/health` again → 200 (connectivity round-trip verification)

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 30s |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms |
| Error rate | < 1% |

## Run
```bash
make k6-smoke  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/load/ts-040-smoke.js
```

## Dependencies
- Requires: `make local-up` running

## Notes
- The Go backend does not have a `/api/capacity` endpoint. The third step uses `/api/health` again as a round-trip verification.
- No session token is involved. The config endpoint returns firebase configuration, not a session token.
