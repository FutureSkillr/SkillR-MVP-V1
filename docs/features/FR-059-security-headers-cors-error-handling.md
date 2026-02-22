# FR-059: Security Headers, CORS & Error Handling

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR
**Phase:** MVP3+

## Problem

The frontend Express server uses `cors()` with no arguments — all origins allowed. No security headers (CSP, HSTS, X-Frame-Options) are set. Internal error messages including stack traces, config errors, and file paths are sent directly to clients. The Go backend has duplicate CORS configuration and defaults to localhost origins if `ALLOWED_ORIGINS` is unset. The health endpoint leaks infrastructure details (DB hostnames, connection errors).

**Sec-report findings:** H1, H5, H14, M1, M4, M6, M12, M23

## Solution

### CORS
1. **Frontend Express** — Replace `cors()` with explicit origin allowlist from `ALLOWED_ORIGINS` env var. Fail startup if not set in production (`NODE_ENV=production`).
2. **Go backend** — Remove duplicate `cors.go` file. Keep the single CORS config in `server.go`. Require explicit `ALLOWED_ORIGINS` in production (reject startup if unset and not in dev mode).
3. **Reject wildcard** — Both servers must reject `ALLOWED_ORIGINS=*` when credentials are enabled.

### Security headers
4. **Add `helmet` middleware** to Express server with:
   - `Content-Security-Policy`: restrict to self, inline styles (for React), and Gemini/Firebase domains
   - `Strict-Transport-Security`: max-age=31536000; includeSubDomains
   - `X-Frame-Options`: DENY
   - `X-Content-Type-Options`: nosniff
   - `Referrer-Policy`: strict-origin-when-cross-origin
5. **Go backend** — Add equivalent headers via Echo middleware.

### Error handling
6. **Frontend Express** — Replace error handler to never send internal error messages to clients:
   ```ts
   console.error(`[gateway] ${req.method} ${req.path} — ${err.message}`);
   res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
   ```
7. **Go backend health endpoint** — Return only `"ok"` / `"error"` for each check on the public endpoint. Move detailed diagnostics to an admin-only health endpoint.
8. **Set `trust proxy`** — Add `app.set('trust proxy', 1)` for correct IP extraction behind Cloud Run's load balancer.

## Acceptance Criteria

- [x] `curl -H "Origin: https://evil.com" /api/health` does not return `Access-Control-Allow-Origin: https://evil.com`
- [x] Response headers include `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- [x] `Content-Security-Policy` header is present and blocks inline scripts
- [x] 500 errors return `{"error": "Internal server error"}` — no stack traces, no file paths
- [x] `/api/health` public response contains only status strings, no hostnames or connection details
- [x] Server refuses to start in production without `ALLOWED_ORIGINS` set
- [x] `ALLOWED_ORIGINS=*` is rejected at startup
- [x] Go backend has a single CORS configuration (no duplicate `cors.go`)

## Dependencies

- FR-051 (API Gateway)
- TC-025 (Security Hardening Phase)

## Notes

- CSP will need tuning as new frontend features are added. Start restrictive, loosen as needed.
- The `helmet` npm package handles most headers with sensible defaults.
