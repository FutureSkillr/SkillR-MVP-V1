# TS-035: Security Headers

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that the Go backend returns proper security headers on API responses. Checks multiple endpoints (`/api/health`, `/api/config`, `/api/health/detailed`) for consistent header presence.

## FR Coverage
- FR-059: Security Headers/CORS — response header configuration for clickjacking prevention, MIME sniffing prevention, referrer policy, and permissions policy

## Scenario Steps
1. GET `/api/health` → 200
2. Verify `X-Frame-Options` header is `DENY`
3. Verify `X-Content-Type-Options` header is `nosniff`
4. Verify `Referrer-Policy` header is `strict-origin-when-cross-origin`
5. Verify `Permissions-Policy` header includes `camera=()` and `microphone=()`
6. Verify `Access-Control-Allow-Origin` is NOT set to `*` (no wildcard CORS)
7. Verify response body does not leak internal information (no stack traces, file paths, secrets)
8. GET `/api/config` → 200, repeat header checks
9. GET `/api/health/detailed` → 200 or 401, repeat header checks

## Headers Checked
| Header | Expected Value |
|--------|---------------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

## Headers NOT Checked
| Header | Reason |
|--------|--------|
| Strict-Transport-Security | Testing over HTTP in docker-compose; HSTS behavior differs from production |
| Content-Security-Policy | Only set on HTML responses from static file server, not on JSON API responses |
| X-XSS-Protection | Not set by the Go backend (deprecated in modern browsers) |

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 15s |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-035-security-headers.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`
