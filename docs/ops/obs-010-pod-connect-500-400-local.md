# OBS-010: Pod Connect Returns 500/400 Locally and on Staging

**Status:** fix-deployed-locally, staging-pending
**Severity:** high
**Created:** 2026-02-24
**Updated:** 2026-02-24
**Component:** Solid Pod integration (FR-076)

## Symptom

When a user clicks "Pod verbinden" (connect to local Pod) in the profile page, the spinner starts but the connection fails.

### Local console (first report)

```
/api/v1/pod/status      → 500
/api/v1/pod/connect     → 500
/api/v1/pod/connect     → 400  (retries)
```

### Staging console (second report)

```
lockdown-install.js:1 SES Removing unpermitted intrinsics

Cross-Origin-Opener-Policy policy would block the window.closed call.
Cross-Origin-Opener-Policy policy would block the window.close call.

GET https://future-skillr-staging-3fjvhlhlra-ey.a.run.app/api/v1/pod/status 500
POST https://future-skillr-staging-3fjvhlhlra-ey.a.run.app/api/v1/pod/connect 500
```

### Console noise (not causal)

| Message | Source | Impact |
|---------|--------|--------|
| `SES Removing unpermitted intrinsics` | Inrupt Solid OIDC library lockdown (`lockdown-install.js`) | None — SES hardens the JS runtime |
| `Cross-Origin-Opener-Policy policy would block` | COOP header from Solid OIDC popup auth | Prevents popup-based Solid auth; not used by our managed flow |
| `A listener indicated an asynchronous response` | Browser extension message channel | None — unrelated to app |

## Root Causes

### 1. Status 500 — pgx.ErrNoRows not handled

`service.go:Status()` queries `SELECT pod_url, ... FROM users WHERE id=$1`. If the user
does not exist in the local PostgreSQL `users` table (e.g. Firebase-only auth), pgx returns
`ErrNoRows`, which gets wrapped into a generic 500.

**Fix (applied):** Return default `PodStatus{Connected: false}` on `ErrNoRows`.

### 2. Connect 500 — CSS not running

`service.go:Connect()` calls `initializePodStructure()` which PUTs containers to the CSS
(Community Solid Server). If CSS is not running, the HTTP client gets "connection refused"
and the handler returns a generic 500.

On **staging**: CSS is never started because `SOLID_POD_ENABLED=false` in the Cloud Run
deployment. The backend initializes the Pod handler anyway if `SOLID_POD_URL` is set but
CSS is unreachable.

**Fix (applied):** Ping CSS before attempting container creation. Return HTTP 502 with
clear message: "Pod server is not reachable. Is the Community Solid Server running?"

### 3. Connect 400 — retries after cascade failure

After the initial 500, subsequent retries may produce 400s due to request body serialization
issues or stale error state in the frontend.

**Fix:** The 500 fixes above prevent the cascade. No separate fix needed.

### 4. Readiness probe too optimistic

`handler.go:Readiness()` only checked `s.db != nil`. It did not verify CSS reachability.
The frontend shows the Pod connect button even when CSS is unreachable, leading users
into a broken flow.

**Fix (applied):** Readiness now checks both DB connectivity AND CSS reachability via Ping.
Returns `{ available: false, reason: "pod_server_unreachable" }` when CSS is down.
Frontend hides the Pod panel when `available: false`.

## Fixes Applied

| File | Change |
|------|--------|
| `backend/internal/solid/service.go` | Handle `pgx.ErrNoRows` in `Status()`, add `PingCSS()` method, pre-ping CSS in `Connect()` |
| `backend/internal/solid/handler.go` | Return 502 for CSS-unreachable in `Connect()`, check CSS in `Readiness()` |
| `backend/internal/solid/handler_test.go` | Tests: `TestReadiness_CSSUnreachable`, `TestReadiness_Available`, `TestConnect_CSSUnreachable` |
| `backend/internal/solid/service_test.go` | Tests: `TestService_PingCSS_Success`, `TestService_PingCSS_Error` |

## Integration Test

**File:** `backend/internal/solid/pod_flow_integration_test.go`

Simulates the full UI flow against Docker-local CSS (`make services-up`):

```
1. GET  /readiness  → available: true
2. GET  /status     → connected: false (new user)
3. POST /connect    → creates Pod containers on CSS
4. GET  /status     → connected: true
5. POST /sync       → pushes profile + engagement + journey data
6. GET  /data       → reads back synced Turtle data
7. DELETE /connect  → disconnects
8. GET  /status     → connected: false
9. Cleanup: delete containers from CSS
```

Run: `make e2e-pod`

Requires: `make services-up` (starts PostgreSQL + Redis + CSS in Docker)

## Verification

1. `make services-up` — start CSS + PG + Redis in Docker
2. `make e2e-pod` — run full-flow integration test
3. Stop CSS (`docker compose -f docker-compose.services.yml stop solid`)
4. Readiness returns `available: false` (verify manually or via test)
5. Frontend hides Pod connect button
6. Restart CSS → Pod connect button reappears
