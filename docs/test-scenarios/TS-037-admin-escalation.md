# TS-037: Admin Escalation Prevention

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that admin-only routes (`/api/v1/prompts`, `/api/v1/agents`) are protected and cannot be accessed by unauthorized users. In docker-compose without Firebase credentials, ALL users (including admin) get 401 because the Firebase middleware cannot verify the local UUID token. The test verifies routes are protected, not that role-based access works (that requires a real Firebase setup).

## FR Coverage
- FR-057: Admin Access Control — role-based access enforcement preventing unauthorized users from accessing administrative endpoints

## Scenario Steps
1. GET `/api/v1/prompts` without any token → 401
2. GET `/api/v1/agents` without any token → 401
3. Verify no internal information leaked in responses
4. POST `/api/auth/register` + POST `/api/auth/login` with normal user credentials → receive UUID token
5. GET `/api/v1/prompts` with regular user UUID token → 401 (Firebase middleware rejects UUID token)
6. GET `/api/v1/agents` with regular user UUID token → 401
7. Verify no prompt or agent data leaked in responses
8. POST `/api/auth/login` with seeded admin credentials via `loginAdmin()` → receive admin UUID token
9. GET `/api/v1/prompts` with admin UUID token → 401 (Firebase middleware still rejects UUID token)
10. GET `/api/v1/agents` with admin UUID token → 401
11. Verify no data leaked in any response

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
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-037-admin-escalation.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`

## Notes
- In docker-compose without Firebase, role-based access cannot be tested. All users get 401 because the Firebase auth middleware rejects UUID tokens before any role check occurs.
- The Go backend does not have `/api/users`, `/api/analytics/*`, or `/api/v1/portfolio/*` routes.
- Admin routes use RequireAdmin() which requires userInfo from the Firebase middleware. Without a valid Firebase ID token, the middleware short-circuits to 401.
