# TS-036: Auth Boundary — Local Auth vs Firebase-Protected Routes

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates the authentication boundary between local auth endpoints and Firebase-protected v1 routes. The Go backend has NO session token concept. Local auth (`/api/auth/*`) uses email/password and returns a UUID token. Firebase-protected routes (`/api/v1/*`) require valid Firebase ID tokens and reject the local UUID token with 401.

## FR Coverage
- FR-056: Auth & Sessions — auth boundary enforcement between local auth system and Firebase-protected API routes

## Scenario Steps
1. POST `/api/auth/register` + POST `/api/auth/login` via `registerAndLogin()` → verify registration succeeded (200 or 201)
2. Verify login succeeded and returned a UUID token (non-empty string)
3. GET `/api/v1/prompts` with UUID token as `Authorization: Bearer <token>` → 401 (Firebase middleware rejects non-Firebase token)
4. Verify no internal information leaked in 401 response
5. GET `/api/v1/agents` with UUID token as `Authorization: Bearer <token>` → 401
6. Verify no internal information leaked in 401 response
7. POST `/api/v1/ai/chat` with UUID token → NOT 401 (AI routes use OptionalFirebaseAuth; UUID token silently ignored, request proceeds without user context)
8. Verify no internal information leaked in response
9. POST `/api/auth/login` with original credentials → 200 (auth endpoints work without Firebase)
10. Verify no internal information leaked in response

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 30s |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-036-session-token.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`

## Notes
- The Go backend has NO session token concept. The old Node.js frontend used session tokens, but they do not exist in the Go backend.
- Local auth returns a UUID token (not a Firebase ID token). This UUID token is rejected by the Firebase auth middleware on `/api/v1/*` admin routes.
- AI routes use OptionalFirebaseAuth, which silently ignores invalid tokens and allows unauthenticated access. The UUID token does not cause a 401 on AI routes.
