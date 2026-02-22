# TS-042: Spike Test

**Status:** active
**Stakeholder:** Operator
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates system behavior under rapid VU increase (spike) to 50 concurrent users, testing health and config endpoint responsiveness under stress. Ramps from 0 to 50 VUs, sustains peak for 2 minutes, then scales back down to observe recovery.

## FR Coverage
- FR-060: Rate Limiting — rate limiter behavior under stress
- FR-068: Health Check — health endpoint stability under spike load

## Scenario Steps
1. Warm up: 0 → 10 VUs over 30s
2. Spike: 10 → 50 VUs over 30s
3. Sustained peak: 50 VUs for 2m
4. Scale down: 50 → 10 VUs over 30s
5. Recovery: 10 VUs for 1m
6. Cool down: 10 → 0 VUs over 30s
7. Each VU per iteration: GET `/api/health` → GET `/api/config` → sleep

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 50 peak |
| Duration | 5m |
| Ramp | 6-stage ramp pattern |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 1s |
| Error rate | < 15% |
| Checks | > 90% |

## Run
```bash
make k6-spike  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/load/ts-042-spike-test.js
```

## Dependencies
- Requires: `make local-up` running

## Notes
- The Go backend does not have a `/api/capacity` endpoint. The spike test uses `/api/config` as the second public endpoint for validation.
- Thresholds are intentionally more lenient than the smoke test to account for expected degradation during the spike phase.
- Each VU iteration checks health and config for valid JSON, correct status codes, and no information leakage.
