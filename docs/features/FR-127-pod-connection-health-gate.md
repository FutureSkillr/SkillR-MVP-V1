# FR-127: Pod Connection Health Gate

**Status:** done
**Priority:** must
**Created:** 2026-02-24
**Entity:** SkillR

## Problem

The Pod-Link panel (`PodManagementCard`) is always rendered on the profile page regardless of whether the backend can actually serve Pod operations. On staging (and any deployment without PostgreSQL), all five Pod endpoints return HTTP 500 because `s.db` is nil:

```
solid/service.go — Connect(), Disconnect(), Status(), Sync(), Data()
  → return fmt.Errorf("database not available")

solid/handler.go
  → wraps to HTTP 500: {"error": "failed to connect pod|..."}
```

**Root causes:**

1. **No PostgreSQL on staging** — The server uses a fast-boot pattern (`cmd/server/main.go`): it opens the HTTP port immediately, then connects to PostgreSQL asynchronously via `SetDB()`. If `DATABASE_URL` is not set or the connection fails, `s.db` stays nil permanently.
2. **Pod columns may not exist** — Migration `000018_solid_pod_connection` adds 6 columns to the `users` table (`pod_url`, `pod_webid`, `pod_provider`, `pod_connected_at`, `pod_last_synced_at`, `pod_sync_status`). If migrations haven't run, queries fail even when the DB connection exists.
3. **No Solid server on staging** — The Community Solid Server (CSS) runs as a Docker Compose service locally but is not deployed to Cloud Run staging.

The frontend has no way to know this. It renders the Pod panel, the user clicks "Verbinden", and gets an opaque error.

## Solution

### 1. Backend: Pod readiness probe

Add a dedicated Pod readiness signal to the existing health infrastructure:

**`GET /api/health/detailed`** — extend the components object:

```json
{
  "components": {
    "postgres": { "status": "ok", "latencyMs": 12 },
    "redis":    { "status": "ok", "latencyMs": 5 },
    "ai":       { "status": "ok" },
    "solid":    { "status": "ok", "latencyMs": 45 },
    "pod_ready": {
      "status": "ok",
      "checks": {
        "database": "ok",
        "migrations": "ok",
        "solid_server": "ok"
      }
    }
  }
}
```

**`GET /api/v1/pod/status`** — for unauthenticated readiness, return a lightweight response when `s.db` is nil instead of 500:

```json
{
  "available": false,
  "reason": "database_not_configured"
}
```

The `pod_ready` composite check verifies all three prerequisites:

| Check | How | Failure means |
|-------|-----|---------------|
| `database` | `s.db != nil && s.db.Ping()` | PostgreSQL not connected |
| `migrations` | Query for `pod_url` column on `users` table | Migration 000018 not applied |
| `solid_server` | HTTP HEAD to Solid server health endpoint | CSS not reachable |

### 2. Frontend: Conditional Pod-Link panel

The `CombinedProfile` component checks Pod readiness before rendering the `PodManagementCard`:

```
┌──────────────────────────────────────────────────┐
│  Profile Page                                    │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Pod-Link                                  │  │
│  │                                            │  │
│  │  IF pod_ready:                             │  │
│  │    → Show PodManagementCard (existing)     │  │
│  │                                            │  │
│  │  IF NOT pod_ready:                         │  │
│  │    → Hide panel entirely                   │  │
│  │    (no error, no placeholder — feature     │  │
│  │     simply not available on this instance) │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

#### Implementation

1. New frontend service function: `checkPodAvailability(): Promise<boolean>`
   - Calls `GET /api/v1/pod/status` (no auth required for the readiness check)
   - Returns `true` if response contains `"available": true` or a valid pod status object
   - Returns `false` on 500, network error, or `"available": false`

2. `usePodConnection()` hook gains an `available` flag:
   - On mount, calls `checkPodAvailability()`
   - Caches result for the session (Pod infra doesn't change mid-session)
   - `enabled` prop on the hook only activates when `available` is `true`

3. `CombinedProfile.tsx` conditionally renders:
   - `available === true` → render `PodManagementCard` as today
   - `available === false` → render nothing (panel hidden)
   - `available === undefined` → render nothing (still checking, avoid flash)

### 3. Backend: Graceful 503 instead of 500

Change all five Pod service methods to distinguish "not ready" from "internal error":

| Current | New |
|---------|-----|
| `s.db == nil` → `error("database not available")` → handler returns **500** | `s.db == nil` → `ErrNotReady` sentinel → handler returns **503 Service Unavailable** with `Retry-After: 30` |

This makes the failure mode explicit in HTTP semantics: 503 = "come back later, infrastructure not ready" vs 500 = "something broke".

## Acceptance Criteria

- [x] `GET /api/v1/pod/status` returns `{"available": false, "reason": "..."}` instead of 500 when DB is nil
- [x] `GET /api/health/detailed` includes `pod_ready` composite check (database + migrations + solid_server)
- [x] Pod service methods return 503 (not 500) when `s.db` is nil
- [x] 503 response includes `Retry-After: 30` header
- [x] Frontend `usePodConnection()` exposes an `available` boolean
- [x] `PodManagementCard` is hidden when Pod infrastructure is unavailable
- [x] No error flash, no placeholder — panel simply does not render when unavailable
- [x] Panel appears immediately on instances where Pod infra is ready (no loading delay visible to user)
- [x] Pod readiness is checked once per session and cached
- [x] Existing Pod functionality (connect, sync, disconnect, view data) unchanged when infra is available
- [x] `make health` output shows Pod readiness status

## Dependencies

- FR-068 (Health Check & Availability Monitoring) — health endpoint extension
- FR-076 (Solid Pod Connection) — Pod service and handler
- FR-077 (Pod Data Sync) — sync operations
- FR-078 (Pod Data Viewer) — data viewer modal

## Investigation Notes

The 500 on staging traces to one of three causes. All three must be resolved for the Pod-Link panel to activate:

| Cause | Where | Fix |
|-------|-------|-----|
| No PostgreSQL configured | `cmd/server/main.go` line ~200 — `DATABASE_URL` not set, `postgres.NewPool()` skipped, `SetDB()` never called | Return 503 instead of 500; hide panel |
| Pod columns missing | Migration `000018_solid_pod_connection` not applied — `users` table lacks `pod_url` etc. | `pod_ready.migrations` check catches this |
| `s.db` is nil | `solid/service.go` — all 5 methods check `s.db == nil`, log "database not available" | `ErrNotReady` sentinel → 503 |

## Notes

- The panel is hidden, not disabled. This is intentional: users on instances without Pod infrastructure should not see a broken or greyed-out feature. It simply doesn't exist for them.
- The readiness check is unauthenticated by design. It answers "can this instance do Pod operations?" — a property of the deployment, not the user.
- Future: when FR-126 (Infrastructure Health LED) ships, the Pod readiness state can feed into the same LED pattern for the admin view.
