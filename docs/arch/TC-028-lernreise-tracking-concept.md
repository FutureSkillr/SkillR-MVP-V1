# TC-028: Lernreise Tracking via Honeycomb Integration

**Status:** accepted
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Context

Future SkillR needs to track learning journeys (Lernreisen) for users. The external Honeycomb service owns all course templates, personalized instances, and task-level progress. Our backend acts as an authenticated proxy — mapping Firebase-authenticated users to Honeycomb's `ctx_id` via the Memory service's `/user/access` endpoint.

This mirrors the existing VertexAI integration pattern: our backend mediates between the authenticated frontend and an external API, adding identity mapping, local event logging, and engagement rewards.

## Decision

### Architecture

1. **Proxy pattern** — Backend proxies Honeycomb API calls, adding Firebase auth and ctx_id resolution.
2. **Identity mapping** — On first Lernreise interaction, backend calls Memory `/user/access` to register the Firebase user and obtain their `ctx_id`. The mapping is cached in PostgreSQL (`users.honeycomb_ctx_id`).
3. **Honeycomb owns course state** — Templates, personalized content, and task state (open/in progress/done) live in Honeycomb. Backend never duplicates this data.
4. **Backend owns event log** — Progress events (which task was submitted, when, XP awarded) are logged locally in PostgreSQL for analytics and engagement.
5. **XP integration** — Task/module/course completion events award XP via the existing engagement system.

### Data Flow

```
Firebase UID → Memory /user/access → ctx_id → Honeycomb API
```

### What Lives Where

| Data | Owner | Storage |
|------|-------|---------|
| Course templates | Honeycomb | Honeycomb API |
| Personalized content | Honeycomb | Honeycomb API |
| Task state (open/in progress/done) | Honeycomb | Honeycomb API |
| User ↔ ctx_id mapping | Backend | PostgreSQL `users.honeycomb_ctx_id` |
| Active instance binding | Backend | PostgreSQL `lernreise_instances` |
| Progress event log | Backend | PostgreSQL `lernreise_progress` |
| XP/engagement | Backend | PostgreSQL engagement tables |

### API Surface

| Route | Purpose |
|-------|---------|
| `GET /api/v1/lernreise/catalog` | Browse available Lernreisen |
| `GET /api/v1/lernreise/catalog/:dataId` | Course detail from Honeycomb |
| `POST /api/v1/lernreise/select` | Select a Lernreise, create instance |
| `GET /api/v1/lernreise/active` | Current active instance |
| `GET /api/v1/lernreise/instances` | All user instances |
| `GET /api/v1/lernreise/instances/:id` | Instance detail + Honeycomb data |
| `POST /api/v1/lernreise/instances/:id/submit` | Submit task, award XP |
| `GET /api/v1/lernreise/instances/:id/progress` | Progress event history |

## Consequences

- Backend depends on two new external services (Honeycomb, Memory). If either is down, Lernreise features are degraded but other features remain available.
- The `ctx_id` mapping adds a one-time latency cost on first interaction per user.
- Health check extended with `honeycomb` component for operational visibility.
- No data migration needed — Honeycomb owns all course content.

## Alternatives Considered

1. **Store course data locally** — Rejected: duplicates Honeycomb's responsibility, creates sync issues.
2. **Direct frontend → Honeycomb** — Rejected: would expose API keys to the browser and bypass our auth layer.
3. **Firebase-only identity** — Rejected: Honeycomb uses its own `ctx_id` scheme via the Memory service.

## Related

- FR-072: Honeycomb service configuration
- FR-073: User context synchronization
- FR-074: Lernreise catalog and selection
- FR-075: Lernprogress tracking
