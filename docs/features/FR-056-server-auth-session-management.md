# FR-056: Server-Side Authentication & Session Management

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR
**Phase:** MVP3+

## Problem

The frontend Express server has **no authentication middleware** on sensitive routes (`/api/users`, `/api/prompt-logs`, `/api/analytics`). Login returns user data without issuing a JWT or session token — auth state is client-side only and trivially spoofable via DevTools. The Go backend's v1 group claims auth middleware is "added in main.go" but it is never wired. Any anonymous user can list all users, promote themselves to admin, delete accounts, and read all prompt logs.

**Sec-report findings:** C3, C4, C5, H6, H8, H11

## Solution

### Frontend Express server
1. **Issue JWT on login** — After successful password verification in `auth.ts`, sign a JWT (HS256, secret from env var `JWT_SECRET`) with claims `{ sub, email, role }` and 24h expiry. Return it in the response body.
2. **Auth middleware** — Create `requireAuth` middleware that verifies the JWT from `Authorization: Bearer <token>`. Apply it to all routes except `/api/auth/login`, `/api/auth/register`, `/api/config`, `/api/health`, and `/api/gemini/*` (which have their own rate limiting).
3. **requireAdmin middleware** — Check `role === 'admin'` from verified token claims. Apply to `/api/users`, `/api/prompt-logs`, `/api/analytics`.
4. **Protect user management routes** — `GET /api/users`, `PATCH /api/users/:id/role`, `DELETE /api/users/:id` all require admin auth.
5. **Protect prompt logs** — `GET /api/prompt-logs` requires admin auth (exposes system prompts).

### Go backend
6. **Wire `FirebaseAuth` middleware** at the v1 route group level in `routes.go`, not relying on individual handler checks.
7. **Issue session token** after local auth login in `auth.go` — return a signed JWT alongside user data.

## Acceptance Criteria

- [x] `POST /api/auth/login` returns a JWT in the response body
- [x] `GET /api/users` returns 401 without a valid JWT
- [x] `GET /api/users` returns 403 with a valid non-admin JWT
- [x] `PATCH /api/users/:id/role` returns 403 for non-admin
- [x] `DELETE /api/users/:id` returns 403 for non-admin
- [x] `GET /api/prompt-logs` returns 403 for non-admin
- [x] `GET /api/analytics` returns 403 for non-admin
- [x] Go backend v1 group rejects requests without valid Firebase JWT (401)
- [x] JWT_SECRET is loaded from env var, not hardcoded
- [x] Unit tests cover: valid token, expired token, missing token, wrong role

## Dependencies

- FR-051 (API Gateway) — MVP3, provides the Express server structure
- TC-025 (Security Hardening Phase)

## Notes

- The frontend Express server JWT is separate from Firebase Auth JWT used by the Go backend. Both auth paths must work.
- Consider migrating to Firebase Auth for the Express server in V1.0 to unify auth. For now, local JWT is faster to implement.
