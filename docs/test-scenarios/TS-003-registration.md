# TS-003: Registration After Intro

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates user registration and login flow after completing intro sequence. The Go backend's register endpoint does NOT return a token -- a separate login call is required afterward.

## FR Coverage
- FR-054: Intro Sequence — registration follows intro completion
- FR-056: Auth & Sessions — server-side auth management
- FR-001: Google OAuth — authentication token handling

## Scenario Steps
1. User arrives from intro (think time)
2. Register via `registerAndLogin(email, displayName, password)` helper:
   a. POST `/api/auth/register` with `{email, displayName, password}` → 200/201 with user record (no token returned)
   b. POST `/api/auth/login` with `{email, password}` → 200 with auth token
3. Verify register response is valid JSON with no info leaks
4. Verify login response returns non-empty auth token

## Request Format
- **Register body:** `{email, displayName, password}` (uses `displayName`, not `name`)
- **Register response:** User record only, no token
- **Login required:** Must call login separately after register to obtain auth token

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 5 |
| Duration | 1m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 500ms |
| Error rate | < 2% |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-003-registration.js
```

## Dependencies
- Requires: `make local-up` running
