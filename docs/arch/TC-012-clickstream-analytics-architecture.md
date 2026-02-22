# TC-012: Clickstream Analytics Architecture

**Status:** accepted
**Created:** 2026-02-18

## Context

FR-050 requires tracking user behavior across the app. We need an architecture that is lightweight, privacy-preserving, and fits the existing dev infrastructure (SQLite backend on port 3001).

## Decision

### Data Model

Single `user_events` table with a flexible JSON `properties` column:

```sql
CREATE TABLE IF NOT EXISTS user_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  browser_session_id TEXT NOT NULL,
  prompt_session_id TEXT,
  timestamp INTEGER NOT NULL,
  properties TEXT NOT NULL DEFAULT '{}'
);
```

Indexes on `browser_session_id`, `event_type`, and `timestamp` for efficient querying.

### Client-Side Architecture

- **Session ID**: UUID generated per browser tab via `sessionStorage`
- **Event Queue**: Internal array flushed every 2 seconds via `POST /api/analytics/events`
- **Unload Safety**: `navigator.sendBeacon` on `beforeunload` to flush remaining events
- **Fire-and-Forget**: Tracking calls never block UI; errors are silently logged

### Server-Side Architecture

Express routes following the existing `promptLogs.ts` pattern:
- `POST /api/analytics/events` — Batch insert (SQLite transaction)
- `GET /api/analytics/events` — Query with filters
- `GET /api/analytics/overview` — Aggregated stats via SQL
- `GET /api/analytics/sessions/:id` — Full clickstream for one session
- `GET /api/analytics/export-csv` — CSV export
- `DELETE /api/analytics/events` — Clear all

### Instrumentation Points

- `App.tsx`: Page views, onboarding lifecycle, journey/station lifecycle, profile views
- `useGeminiChat.ts`: Chat message metadata (index, length, role)
- `OnboardingChat.tsx` + station components: Chat session end events

## Consequences

- **Pro**: Minimal code footprint, reuses existing SQLite infrastructure
- **Pro**: Privacy-safe by design (no content, no user identity)
- **Pro**: Flexible JSON properties allow adding new event data without schema migrations
- **Con**: SQLite not suitable for production-scale analytics (acceptable for MVP)
- **Con**: Browser session ID does not persist across tabs or page reloads in new tabs

## Alternatives Considered

1. **Firebase Analytics**: Would require Firebase JS SDK integration and Google Analytics setup. Rejected because the dev backend is local SQLite.
2. **PostHog/Mixpanel**: Third-party SaaS. Rejected for MVP simplicity.
3. **Structured tables per event type**: More normalized but requires schema changes for each new event. Rejected in favor of flexible JSON properties.
