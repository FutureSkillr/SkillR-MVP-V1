# TS-032: Authenticated Rate Limiting

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that authenticated users are rate-limited after 30 requests per minute on the AI chat endpoint. Registers and logs in a user via `registerAndLogin()` to obtain a UUID token, then sends 31 requests with that token and expects HTTP 429 on or after the 31st request.

## FR Coverage
- FR-060: Rate Limiting — authenticated user rate limit of 30 requests per minute on AI chat endpoint

## Scenario Steps
1. POST `/api/auth/register` + POST `/api/auth/login` via `registerAndLogin()` → receive UUID auth token
2. POST `/api/v1/ai/chat` with auth token (request 1) → 200 (or 500/502/503 if GCP creds missing)
3. POST `/api/v1/ai/chat` with auth token (request 2) → 200 (or 500/502/503)
4. ...repeat through request 30 → 200 (or 500/502/503)
5. POST `/api/v1/ai/chat` with auth token (request 31) → 429 Too Many Requests
6. Verify at least one 429 response was received
7. Verify some requests went through before the rate limit triggered

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 3m |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-032-rate-limit-auth.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`
- Requires: Redis running for rate limit state

## Notes
- Uses `registerAndLogin()` helper which registers a new user and logs in to get a UUID token. This token is used as `Authorization: Bearer <token>`.
- In docker-compose without GCP credentials, the AI endpoint may return 500/502/503 instead of 200. The rate limiter middleware runs BEFORE the AI handler, so rate limiting triggers regardless of backend errors.
- Request body format: `{message, history:[{role,content}], system_instruction}`
