# FR-115: Dev Admin Seed Defaults

**Status:** done
**Priority:** should
**Created:** 2026-02-23

## Problem

When starting the backend locally for the first time, developers must manually set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` env vars before they can log in to the admin panel. If neither is set, `SeedAdmin` silently skips — leaving the app without any admin user and no indication of what went wrong. Even when seeding succeeds, the credentials are not visible in the startup logs, forcing developers to grep env files.

## Solution

1. Add `AdminSeedEmail` and `AdminSeedPassword` to `Config` with dev defaults (`admin@skillr.local` / `Skillr1dev`).
2. Show both values in the `=== Configuration Status ===` log block so they are always visible at startup.
3. `SeedAdmin` receives credentials from config (single source of truth) and logs them when a new admin is actually created.

### Startup log output

```
=== Configuration Status ===
  Port:           8080
  ...
  CORS Origins:   [http://localhost:3000 http://localhost:5173 http://localhost:9090]
  Admin Email:    admin@skillr.local
  Admin Password: Skillr1dev
============================
```

When seeding actually inserts a new user:

```
seeded default admin user — email: admin@skillr.local  password: Skillr1dev
```

## Acceptance Criteria

- [x] `Config` has `AdminSeedEmail` / `AdminSeedPassword` with dev defaults
- [x] `LogStatus()` prints admin email and password in the configuration block
- [x] `SeedAdmin` reads credentials from config (not directly from env)
- [x] Default password passes existing password strength validation (8+ chars, upper + lower + digit)
- [x] Env vars `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` override the defaults
- [x] Seeding skipped when users table is non-empty
- [x] Go build passes, no test regressions

## Dependencies

- FR-057 (Admin Access Control Hardening) — admin seed mechanism

## Notes

- The default password `Skillr1dev` satisfies the M20 password policy (uppercase S, lowercase killrdev, digit 1).
- In production, `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` should always be set explicitly via Secret Manager or env config. The defaults are intended for local development only.
