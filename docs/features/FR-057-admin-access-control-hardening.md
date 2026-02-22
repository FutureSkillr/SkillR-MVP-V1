# FR-057: Admin Access Control & Credential Hygiene

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR
**Phase:** MVP3+

## Problem

Admin routes in the Go backend (`/api/v1/prompts`, `/api/v1/agents`) lack the `RequireAdmin()` middleware — any authenticated user can modify AI prompts and invoke agents. Both the Go backend and frontend Express server seed a hardcoded admin account with password `skillr`, logged to stdout. The first-user-gets-admin logic has a race condition where a failed DB query silently grants admin role.

**Sec-report findings:** C1, C2, C6, H10

## Solution

### Go backend
1. **Wire `RequireAdmin()` middleware** to the `/prompts` and `/agents` route groups in `routes.go`:
   ```go
   prompts := v1.Group("/prompts", middleware.RequireAdmin())
   agents := v1.Group("/agents", middleware.RequireAdmin())
   ```
2. **Remove hardcoded admin seed** from `auth.go:251`. Replace with:
   - Read `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from env vars
   - Skip seeding entirely if env vars are not set (production default)
   - Remove the `log.Println` that prints credentials
3. **Fix first-user race condition** — Check `QueryRow` error. Use an atomic `INSERT ... ON CONFLICT` pattern instead of SELECT-then-INSERT.

### Frontend Express server
4. **Remove hardcoded seed password** from `seed.ts`. Same env-var pattern as backend.
5. **Remove console.log** that prints credentials.

### Shared
6. **Validate role claims** — In `backend/internal/firebase/auth.go:38`, reject role values that are not `"user"` or `"admin"`.
7. **Move `SetTestUserInfo`** from production `middleware` package to a `_test.go` file.

## Acceptance Criteria

- [x] `PUT /api/v1/prompts/:id` returns 403 for non-admin authenticated user
- [x] `PUT /api/v1/agents/:id` returns 403 for non-admin authenticated user
- [x] No hardcoded passwords in source code (`grep -r "skillr" backend/ frontend/` returns 0 results)
- [x] Admin seed only runs when `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD` env vars are set
- [x] No credentials printed to stdout/logs
- [x] Concurrent first-user registration does not create multiple admins
- [x] Unknown role values in Firebase token are rejected (default to "user")
- [x] `SetTestUserInfo` is not exported in production middleware package

## Dependencies

- FR-056 (Auth & Sessions) — admin auth builds on the auth middleware
- TC-025 (Security Hardening Phase)

## Notes

- Update `.env.example` with `ADMIN_SEED_EMAIL=` and `ADMIN_SEED_PASSWORD=` placeholders.
- Update local dev docs to explain the new seeding approach.
