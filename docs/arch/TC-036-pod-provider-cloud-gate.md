# TC-036: Pod Provider Cloud Gate

**Status:** done
**Created:** 2026-02-24
**Updated:** 2026-02-24
**Entity:** SkillR

## Context

On Cloud Run deployments, no CSS (Community Solid Server) is co-located in the container. The Pod readiness endpoint returned `available: false`, hiding the entire Pod panel. But the PodConnectModal had a hardcoded "Lokaler Dev-Server" option (`http://localhost:3000`) that only makes sense in local development.

Users on cloud instances should only see "Eigener Pod-Server" (external Solid Pod) — the local CSS option is a development-only tool (the "fake beast").

## Decision

### 1. Readiness: `managedAvailable` field

**Add `managedAvailable` boolean to `GET /api/v1/pod/readiness` response.**

- `managedAvailable: true` — CSS is reachable. "Lokaler Dev-Server" option shown.
- `managedAvailable: false` — CSS is down. "Lokaler Dev-Server" option hidden, default to "Eigener Pod-Server".
- `available: true` — Pod panel visible. Requires DB only (external pods work without CSS).

#### Response Shape

```json
{ "available": true,  "managedAvailable": true }                                     // local dev (DB + CSS)
{ "available": true,  "managedAvailable": false }                                    // Cloud Run (DB only, no CSS)
{ "available": false, "managedAvailable": false, "reason": "database_not_configured" } // no DB
```

#### Frontend Behavior

| `available` | `managedAvailable` | Pod Panel | "Lokaler Dev-Server" | "Eigener Pod-Server" |
|-------------|--------------------|-----------|---------------------|---------------------|
| `true` | `true` | Visible | Shown | Shown |
| `true` | `false` | Visible | Hidden | Shown (default) |
| `false` | `false` | Hidden | — | — |

### 2. External Pod Support

**Backend supports both managed (local CSS) and external Pod servers.**

- `Connect` with `provider: "external"`: creates a dynamic HTTP client, pings the external server, authenticates with CSS credentials (email/password), initializes SkillR containers.
- `Sync` / `Data`: `resolveClient()` routes to the correct client based on stored `pod_provider` value.
- Authenticated client is cached in-memory per user (cleared on disconnect or server restart).
- `PodProviderStep` shows email + password fields for external pods.

### 3. CSS Authentication

External CSS pods (e.g. solid.redpencil.io) require authentication. The `HTTPClient.Authenticate()` method performs a CSS v7 cookie-based login:

1. POST `/.account/login/password/` with `{email, password}`
2. Session cookie stored in the Go `http.Client` cookie jar
3. All subsequent requests include the cookie

Credentials are NOT stored in the database. The authenticated client lives in memory only.

## Files Changed

| File | Change |
|------|--------|
| `backend/internal/solid/handler.go` | Readiness: `available = dbReady` (not `dbReady && cssReachable`) |
| `backend/internal/solid/handler_test.go` | Updated CSSUnreachable test: available=true when DB is up |
| `backend/internal/solid/service.go` | `resolveClient`, `initPodContainers`, external provider in `Connect`, auth cache |
| `backend/internal/solid/service_test.go` | `TestInitPodContainers_WithExternalClient`, `TestNormalizePodPath_ExternalURL` |
| `backend/internal/solid/client.go` | `Authenticate()` method for CSS v7 cookie-based login |
| `backend/internal/solid/client_integration_test.go` | `TestIntegration_ExternalPod` with auth via env vars |
| `backend/internal/solid/model.go` | `ConnectRequest` adds `Email`, `Password` fields |
| `frontend/types/pod.ts` | `PodConnectRequest` adds `email`, `password` |
| `frontend/services/pod.ts` | `checkPodReadiness()` returns `PodReadiness` object |
| `frontend/services/pod.test.ts` | Updated expectations |
| `frontend/hooks/usePodConnection.ts` | `managedAvailable` state + session cache, `connect` accepts auth |
| `frontend/components/pod/PodConnectModal.tsx` | Email/password fields for external pods |
| `frontend/components/CombinedProfile.tsx` | Threads `managedAvailable` to modal |

## Consequences

### Benefits
- Cloud Run users see the Pod panel with external-only option
- External pods (solid.redpencil.io, etc.) can be connected with CSS credentials
- Local dev still shows "Lokaler Dev-Server" when CSS is running
- No breaking changes — backend adds fields, does not remove any

### Trade-offs
- In-memory auth cache: cleared on server restart (user must reconnect)
- CSS session cookies may expire (user must reconnect if Sync fails)
- Three sessionStorage keys: `skillr:pod_ready`, `skillr:pod_managed_ready`, `skillr:pod_managed_url`

### External Pod Support — Parked

External Solid Pod providers (TwinPod, solid.redpencil.io) use **Solid-OIDC** (OAuth2 Authorization Code + PKCE + DPoP) for authentication. The CSS v7 cookie-based auth (`/.account/login/password/`) only works for CSS instances that expose the Account API.

**Status:** External pod code (dynamic client, auth cache, email/password fields) remains in the codebase but is not production-ready for OIDC providers. External pods will be revisited when Solid-OIDC client support is implemented.

**What works:** CSS v7 instances with `/.account/` API (local dev CSS).
**What doesn't work:** TwinPod, solid.redpencil.io, and other Solid-OIDC providers.

### Managed Pod URL

The backend now stores its own CSS base URL (`cssBaseURL` on `Service`). For managed pods, WebID and display URL are constructed using this URL — not the frontend-provided `podUrl`. The readiness endpoint returns `managedPodUrl` so the frontend can display the correct URL dynamically.

## Testing

```bash
# Unit tests
make go-test

# Managed pod integration test (requires services running)
make services-up
make e2e-pod

# External pod integration test (CSS v7 instances only)
make e2e-pod-external \
  EXTERNAL_POD_URL=https://your-css-v7-instance.example.com/username \
  EXTERNAL_POD_EMAIL=... \
  EXTERNAL_POD_PASSWORD=...
```

## Dependencies

- [TC-032](TC-032-custom-solid-pod-server.md) — PodProxy (future)
- [FR-076](../features/FR-076-solid-pod.md) — Solid Pod integration
- [FR-127](../features/FR-127-pod-connection-health-gate.md) — Pod connection health gate
