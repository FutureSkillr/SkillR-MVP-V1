# FR-130: Show Admin Panel for All Users in Local/Docker Mode

**Status:** done
**Priority:** should
**Created:** 2026-02-24

## Problem

During local development and Docker-based testing, only users with `role === 'admin'` can see the admin panel. Developers must seed an admin user or manually toggle roles to access admin tools like Analytics, Flow, Content Editor, etc.

## Solution

The backend detects whether it is running on Cloud Run (`K_SERVICE` or `CLOUD_RUN` env vars). When neither is set, the `/api/config` response includes `"devMode": true`. The frontend stores this flag at bootstrap time and uses it to show the admin panel for all authenticated users regardless of their role.

In production (Cloud Run), the admin panel remains restricted to users with `role === 'admin'`.

## Acceptance Criteria

- [x] Backend `/api/config` returns `devMode: true` when not on Cloud Run
- [x] Frontend stores `SKILLR_DEV_MODE` flag from config response
- [x] `isDevMode()` utility available at `frontend/services/devMode.ts`
- [x] Admin panel visible for all authenticated users in local/Docker mode
- [x] Admin panel restricted to admin role in production (Cloud Run)

## Dependencies

- None

## Notes

- Detection uses the same `K_SERVICE` / `CLOUD_RUN` check already present in `backend/internal/config/config.go:124`
- The flag is injected via the existing `/api/config` bootstrap flow — no new endpoints needed
