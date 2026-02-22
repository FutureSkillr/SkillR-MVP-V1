# TS-033: Brute Force Login Protection

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that repeated failed login attempts trigger rate limiting. The Go backend tracks failed login attempts per IP and blocks after 5 failed attempts within a 15-minute window (returns 429). Uses `uniqueEmail('brute')` and `registerUser()` to create a real account first, then sends wrong-password login attempts.

## FR Coverage
- FR-060: Rate Limiting — login attempt throttling after 5 failed attempts per 15-minute window

## Scenario Steps
1. POST `/api/auth/register` with `uniqueEmail('brute')` and known password → 200, create test account
2. POST `/api/auth/login` with correct email but wrong password (attempt 1) → 401
3. POST `/api/auth/login` with correct email but wrong password (attempt 2) → 401
4. POST `/api/auth/login` with correct email but wrong password (attempt 3) → 401
5. POST `/api/auth/login` with correct email but wrong password (attempt 4) → 401
6. POST `/api/auth/login` with correct email but wrong password (attempt 5) → 401
7. POST `/api/auth/login` with correct email but wrong password (attempt 6) → 429 Too Many Requests
8. Verify brute force protection triggered within 6 attempts
9. Verify response bodies do not leak internal information

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 1m |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-033-brute-force-login.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`
- Requires: Redis running for rate limit state

## Notes
- The test registers a real user account first, then attempts login with wrong passwords. This ensures the brute force protection is tested against an existing account.
- Rate limit is tracked per IP address. The 5 attempts/15min limit applies to all failed login attempts from the same IP.
