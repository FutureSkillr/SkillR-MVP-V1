# TS-022: Config Endpoint Reliability

**Status:** active
**Stakeholder:** Operator
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that the config endpoint returns Firebase configuration with expected sub-fields and that security headers are set correctly. The Go backend does not issue session tokens via the config endpoint.

## FR Coverage
- FR-059: Security Headers/CORS — proper security headers on responses (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`)
- FR-054: Intro Sequence — config provides Firebase configuration for client initialization

## Scenario Steps
1. GET `/api/config` → 200 with response body containing `firebase` object
2. Verify `firebase` sub-fields: `apiKey`, `projectId`, `authDomain` are present
3. Check security header `X-Content-Type-Options` equals `nosniff`
4. Check security header `X-Frame-Options` equals `DENY`

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 3 |
| Duration | 1m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms |
| Error rate | < 1% |

## Run
```bash
make k6-operator  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/operator/ts-022-config-reliability.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`
