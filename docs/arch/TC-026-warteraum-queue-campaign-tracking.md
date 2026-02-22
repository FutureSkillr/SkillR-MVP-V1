# TC-026: Warteraum-Queue und Campaign-Tracking Architektur

**Status:** accepted
**Created:** 2026-02-20
**Entity:** maindset.ACADEMY + SkillR

## Context

Nach Meta-Ad-Kampagnen koennen viele Nutzer gleichzeitig ankommen. Die Gemini-API hat begrenzte Kapazitaet. Statt haessliche 429-Fehler zu zeigen, brauchen wir einen Warteraum, Visitor-Lifecycle-Tracking und Campaign-Attribution.

Die CoachSelectPage IST der Warteraum. Bei hoher Last wird die Entertainment-Sektion betont, bei niedriger Last ist sie da, kann aber uebersprungen werden. Eingeloggte Nutzer gehen frei durch.

## Decision

### Architektur-Ueberblick

```
                    ┌────────────────────────────────────────┐
                    │  Meta Ad Kampagne                      │
                    │  utm_source=meta&utm_campaign=launch1  │
                    └──────────┬─────────────────────────────┘
                               │ Click
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  WelcomePage                                                         │
│  • captureUTM() → sessionStorage                                     │
│  • trackVisitorArrived()                                             │
│  • Meta Pixel: PageView (nur nach Cookie-Consent)                    │
└──────────┬───────────────────────────────────────────────────────────┘
           │ "Reise starten"
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CoachSelectPage (= Warteraum)                                       │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │ Warteraum-Sektion   │  │ Coach-Auswahl Grid (6 Coaches)      │   │
│  │ (betont bei Last)   │  │                                     │   │
│  │ • Coach-Vorschau    │  │ Susi  Karlshains  Rene              │   │
│  │ • Video-Carousel    │  │ Heiko  Andreas   Cloudia            │   │
│  │ • Audio-Streams     │  │                                     │   │
│  │ • Queue-Position    │  │ [Coach waehlen →]                   │   │
│  │ • Email-Termin      │  │                                     │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
│  GET /api/capacity → { available, position, waitMs }                 │
└──────────┬───────────────────────────────────────────────────────────┘
           │ Coach gewaehlt + Slot verfuegbar
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  IntroChat (Smalltalk → Demo)                                        │
│  • acquireSlot() bei Eintritt, releaseSlot() bei Ende                │
│  • trackVisitorEntered(waitTimeMs)                                   │
└──────────┬───────────────────────────────────────────────────────────┘
           │ Demo abgeschlossen
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  IntroRegisterPage                                                   │
│  • trackVisitorConverted()                                           │
│  • Meta Pixel: CompleteRegistration (nach Consent)                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Kapazitaets-Tracking

**Server-seitig** (Express, in-memory fuer MVP3):
- `activeSessions: Map<string, { startedAt, browserSessionId }>` — zaehlt aktive Gemini-Chat-Sessions
- `MAX_CONCURRENT_GEMINI_SESSIONS` (env var, default: 10)
- Jeder `/api/gemini/chat` Aufruf: `acquireSlot()` → +1, `releaseSlot()` im finally → -1
- Bei Kapazitaet voll: Return `503 { code: 'QUEUE_REQUIRED' }`

**Queue** (in-memory FIFO fuer MVP3, Redis fuer V1.0):
- Ticket-ID pro Warteraum-Besucher (in sessionStorage)
- Position wird bei jedem `/api/capacity` Poll berechnet
- Estimated Wait = `position × AVG_SESSION_DURATION_MS / MAX_CONCURRENT`

**Frontend-Polling**: `useCapacityPolling` Hook, alle 5s, mit Backoff bei Fehler.

### Entscheidungen

| Entscheidung | Gewaehlt | Alternative | Warum |
|-------------|----------|-------------|-------|
| Queue-Speicher | In-Memory (MVP3) | Redis Sorted Set | Cloud Run Single-Instance; Redis fuer V1.0 |
| Update-Mechanismus | 5s Polling | WebSocket / SSE | Cloud Run Billing, Einfachheit |
| Meta Pixel Timing | Nach Cookie-Consent | Sofort | DSGVO fuer 14+ Zielgruppe |
| Warteraum-Position | In Coach-Select Page | Separater Screen | User-Entscheidung: Coach-Auswahl = Entertainment |

## Consequences

- Users experience graceful queuing instead of raw 429 errors
- CoachSelectPage becomes dual-purpose: entertainment + queue management
- Campaign attribution enables ROI tracking for Meta ad spend
- Cookie-Consent-Banner is mandatory before any third-party tracking
- In-memory queue does not survive restarts — acceptable for MVP3

## Alternatives Considered

- **Separate queue page**: Rejected — less engaging, more friction
- **WebSocket updates**: Rejected — adds complexity, Cloud Run billing concerns
- **Redis queue from start**: Rejected — overkill for single-instance MVP3
- **No queue, just retry**: Rejected — poor UX for ad-driven traffic spikes

## Dependencies

- FR-062 (Warteraum Integration)
- FR-063 (Visitor Lifecycle Tracking)
- FR-064 (Campaign Attribution)
- FR-065 (Flood Detection)
- FR-066 (Cookie Consent Banner)
