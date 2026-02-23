# FR-111: Frontend Passive Rendering — No Active Components

**Status:** specified
**Priority:** must
**Created:** 2026-02-23

## Problem

The frontend must be a pure rendering layer. Currently, some components contain business logic, data fetching, state transformations, or validation that should live in the Go backend. All data, configuration, coach personas, and content must be served by the Go backend API — the frontend should only render what the backend provides.

This ensures:
- Single source of truth (backend)
- Easier testing (backend logic is unit-testable in Go)
- Frontend can be replaced or white-labeled without duplicating logic
- Content changes (coach names, dialects, taglines) don't require frontend redeployment

## Solution

Enforce the following architectural rule across the entire frontend:

1. **No business logic in components** — Components receive data via props or API responses and render it. No computation, filtering, sorting, or transformation of domain data in the frontend.
2. **No hardcoded content** — All user-facing text, coach personas, journey definitions, station content, and configuration must come from the Go backend API (e.g., `GET /api/v1/coaches`, `GET /api/config`).
3. **No client-side validation of domain rules** — Validation happens server-side. The frontend may do basic UX validation (e.g., "field required") but not domain validation (e.g., "role must be admin or user").
4. **API-first data flow** — Every piece of dynamic content is fetched from the backend. The frontend is a thin client.

## Acceptance Criteria

- [ ] All coach persona data (names, taglines, dialects, settings, colors, system prompts) is served by a backend API endpoint, not hardcoded in frontend constants
- [ ] All user-facing German text that is content (not UI chrome) comes from the backend
- [ ] No domain business logic exists in frontend components
- [ ] Frontend components are pure rendering functions of their props + API data
- [ ] The Express gateway (`frontend/server/`) is eliminated or reduced to a dev-only proxy

## Dependencies

- Go backend must expose all necessary API endpoints before frontend constants can be removed
- FR-096 (test coverage) should verify the boundary

## Notes

- UI-level state (modal open/closed, scroll position, animation state) is fine in the frontend — this rule applies to **domain data and business logic** only.
- The `coaches.ts` constants file is a prime example of data that should come from the backend.
- This is a gradual migration: new features must follow this rule immediately; existing hardcoded data will be migrated as backend endpoints are built.
