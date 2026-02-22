# FR-076: Solid Pod Connection

**Status:** done
**Priority:** should
**Created:** 2026-02-21
**Entity:** SkillR
**Gate:** MVP4

## Problem
Users have no visibility into or control over what data the platform stores about them. There is no mechanism for data sovereignty or transparency.

## Solution
Allow users to connect a SOLID Pod from their profile page. The Pod acts as a transparency mirror — a user-owned copy of their data that the platform syncs to on demand.

### Architecture
- App backend (Firestore + PostgreSQL) remains the source of truth
- Pod receives a one-directional copy (App -> Pod, write-only)
- No Pod-to-app sync (V2.0 scope)
- Pod connection is optional — app works normally without it

### Pod Provider Options
1. **Managed (local):** Community Solid Server v7 running as Docker Compose service
2. **External:** User-provided Pod URL

### Database Schema
New columns on `users` table:
- `pod_url` — Pod base URL
- `pod_webid` — WebID URI
- `pod_provider` — 'none', 'managed', or 'external'
- `pod_connected_at` — connection timestamp
- `pod_last_synced_at` — last sync timestamp
- `pod_sync_status` — 'none', 'connected', 'synced', 'partial'

### API Endpoints
- `POST /api/v1/pod/connect` — Connect a Pod
- `DELETE /api/v1/pod/connect` — Disconnect Pod
- `GET /api/v1/pod/status` — Connection + sync status

## Acceptance Criteria
- [ ] User can connect a Pod from profile page
- [ ] Pod connection state persisted in PostgreSQL
- [ ] App works normally without Pod (graceful degradation)
- [ ] CSS runs as Docker Compose service alongside app
- [ ] Connect flow has clear German-language UX with "digitaler Tresor" metaphor

## Security

- **Authentication:** Pod routes require Firebase auth (v1 middleware group). Handler uses `middleware.GetUserInfo(c)`.
- **SSRF prevention:** `podUrl` validated against blocked hosts (cloud metadata, RFC 1918 private ranges). Only HTTP/HTTPS schemes.
- **Input validation:** Provider enum, URL format, length limits (512 chars). See FR-058.
- **Error handling:** Generic client-facing messages. Internal details logged server-side only. See FR-059.
- **Rate limiting:** Inherits v1 auth-based rate limiting. Per-endpoint sync limits deferred to V1.0. See FR-060.

## Dependencies
- TC-019 (Solid Pod Storage Layer)
- TC-025 (Security Hardening Phase) — Pod security controls
- FR-058 (Input Validation) — Pod endpoint validation
- FR-060 (Rate Limiting) — Pod rate limiting
- FR-077 (Pod Data Sync)
- FR-078 (Pod Data Viewer)

## Notes
MVP4 scope — no DPoP auth, no automatic sync, no Pod-canonical mode. Those are V2.0.
