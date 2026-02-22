# TS-031: Anonymous Rate Limiting

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that anonymous users are rate-limited after 15 requests per minute on the AI chat endpoint. Sends 16 requests without any auth token and expects HTTP 429 on or after the 16th request.

## FR Coverage
- FR-060: Rate Limiting — anonymous user rate limit of 15 requests per minute on AI chat endpoint

## Scenario Steps
1. POST `/api/v1/ai/chat` without auth token (request 1) → 200 (or 500/502/503 if GCP creds missing)
2. POST `/api/v1/ai/chat` without auth token (request 2) → 200 (or 500/502/503)
3. ...repeat through request 15 → 200 (or 500/502/503)
4. POST `/api/v1/ai/chat` without auth token (request 16) → 429 Too Many Requests
5. Verify at least one 429 response was received
6. Verify some requests went through before the rate limit triggered

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 2m |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-031-rate-limit-anon.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`
- Requires: Redis running for rate limit state

## Notes
- The Go backend has no session token concept. Anonymous requests are identified by IP address.
- In docker-compose without GCP credentials, the AI endpoint may return 500/502/503 instead of 200. The rate limiter middleware runs BEFORE the AI handler, so rate limiting triggers regardless of backend errors.
- Request body format: `{message, history:[{role,content}], system_instruction}`
