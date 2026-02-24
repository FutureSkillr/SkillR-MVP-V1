# FR-126: Infrastructure Health LED for Content Pack Editor

**Status:** draft
**Priority:** must
**Created:** 2026-02-24
**Entity:** SkillR

## Problem

The Content Pack Editor (FR-124) depends on KafScale Broker and LFS-Proxy for raw video submissions. These infrastructure services live in the Lerning-Data-Room (IFR-001) and may be unavailable — during maintenance, outages, or before initial deployment. If a partner tries to submit a video set while the infrastructure is down, the upload silently fails or produces a confusing error.

Partners need a clear, at-a-glance signal of whether the upload pipeline is operational. When it is not, the submission features should be visibly deactivated rather than letting partners waste time filling out a form that cannot be submitted.

## Solution

### Backend: Infrastructure health probe

Extend the existing health system (FR-068) with a new endpoint that checks Lerning-Data-Room service reachability:

**`GET /api/health/infrastructure`**

```json
{
  "kafscale": {
    "status": "ok",
    "latency_ms": 12
  },
  "lfs_proxy": {
    "status": "ok",
    "latency_ms": 34
  }
}
```

| Field | Values | Meaning |
|-------|--------|---------|
| `status` | `ok` | Service reachable and responding to health probe |
| `status` | `degraded` | Service reachable but slow (> threshold) or partial functionality |
| `status` | `unavailable` | Service unreachable or returning errors |
| `latency_ms` | number | Round-trip time of the health probe |

The backend probes each service with a lightweight ping (KafScale: topic metadata request; LFS-Proxy: `HEAD /health`). Results are cached for 30 seconds to avoid probe storms.

### Frontend: Status LED component

A visual status indicator displayed in the Content Pack Editor header, next to the "Neue Lernreise einreichen" section:

```
┌─────────────────────────────────────────────────────────┐
│  Content Packs                                          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Infrastruktur-Status                             │  │
│  │                                                   │  │
│  │  ● KafScale Broker          ● LFS-Proxy          │  │
│  │    Verbunden (12ms)           Verbunden (34ms)    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [ + Neues Content Pack ]  [ Neue Lernreise einreichen ]│
│                                                         │
```

#### LED States

| LED | Color | Meaning | Effect on UI |
|-----|-------|---------|--------------|
| ● | Green | `ok` — service healthy | Submission form fully enabled |
| ● | Yellow | `degraded` — service slow | Submission form enabled, warning banner shown |
| ● | Red | `unavailable` — service down | Submission form disabled with explanation |
| ● | Grey | Unknown — health check pending or endpoint unreachable | Submission form disabled, "Pruefe Verbindung..." shown |

#### Deactivation behavior

When **either** KafScale or LFS-Proxy reports `unavailable`:

1. The "Neue Lernreise einreichen" button is visually disabled (greyed out, no pointer cursor).
2. The submission form section is replaced with a notice:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ Einreichung derzeit nicht verfuegbar                 │
│                                                         │
│  Der Upload-Dienst (KafScale / LFS-Proxy) ist           │
│  momentan nicht erreichbar. Bitte versuche es           │
│  spaeter erneut.                                        │
│                                                         │
│  Pack-Verwaltung und Lernreise-Bearbeitung              │
│  funktionieren weiterhin.                               │
└─────────────────────────────────────────────────────────┘
```

3. Pack CRUD and Lernreise CRUD remain fully operational — only the upload/submission features are gated.
4. YouTube link and text description inputs remain available even when LFS-Proxy is down (they don't require file upload). Only the "Video hochladen" option is disabled per slot.

#### Polling

- The frontend polls `GET /api/health/infrastructure` every 30 seconds while the Content Pack Editor tab is active.
- Polling stops when the user navigates away from the tab.
- On initial load, the LED starts grey ("Pruefe Verbindung...") until the first probe returns.

### Granular deactivation matrix

| KafScale | LFS-Proxy | Video upload | YouTube link | Text description | Submit button |
|----------|-----------|-------------|-------------|-----------------|---------------|
| ok | ok | Enabled | Enabled | Enabled | Enabled |
| ok | unavailable | Disabled | Enabled | Enabled | Enabled (if no file uploads selected) |
| unavailable | ok | Disabled | Disabled | Disabled | Disabled (events cannot be published) |
| unavailable | unavailable | Disabled | Disabled | Disabled | Disabled |

KafScale is the hard gate — without the event bus, no submission can proceed regardless of input type. LFS-Proxy only gates the file upload option.

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health/infrastructure` | Probe KafScale + LFS-Proxy reachability |

## Acceptance Criteria

- [ ] `GET /api/health/infrastructure` returns status for KafScale and LFS-Proxy
- [ ] Probe results are cached for 30 seconds to prevent probe storms
- [ ] Backend gracefully handles unreachable services (timeout, no panic)
- [ ] Content Pack Editor shows green/yellow/red/grey LED per service
- [ ] LED updates every 30 seconds while tab is active
- [ ] When KafScale is unavailable, the entire submission section is disabled with explanation
- [ ] When only LFS-Proxy is unavailable, "Video hochladen" option is disabled but YouTube link and text description remain available
- [ ] When both are available, submission form is fully enabled
- [ ] Pack CRUD and Lernreise CRUD are never affected by infrastructure status
- [ ] LED starts grey on initial load, transitions to correct color after first probe
- [ ] Polling stops when user navigates away from Content Pack Editor tab

## Dependencies

- FR-068 (Health Check & Availability Monitoring) — existing health endpoint pattern
- FR-124 (Content Pack Editor) — the editor UI where the LED is displayed
- IFR-001 (Lerning-Data-Room Integration) — KafScale Broker and LFS-Proxy services

## Notes

- This is a client-side availability gate, not a circuit breaker. The backend probe is a simple reachability check — it does not manage retries or failover.
- The `/api/health/infrastructure` endpoint does not require authentication. It exposes only service reachability status, no operational details (unlike `/api/health/detailed` which is token-gated per FR-068).
- Configuration: `KAFSCALE_HEALTH_URL` and `LFS_PROXY_HEALTH_URL` env vars define the probe targets. If not set, the endpoint returns `unavailable` for the unconfigured service.
