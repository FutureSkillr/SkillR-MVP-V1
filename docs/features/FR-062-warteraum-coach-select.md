# FR-062: Warteraum-Integration in Coach-Auswahl

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** maindset.ACADEMY
**Gate:** mvp3

## Problem

Bei hoher Last (nach Ad-Kampagnen) bekommen Nutzer 429-Fehler von der Gemini-API. Es gibt keine Warteschlange oder Entertainment fuer wartende Nutzer.

## Solution

Die CoachSelectPage wird zum Warteraum erweitert. Bei hoher Last wird die Entertainment-Sektion (Videos, Audio, Coach-Vorschau) betont. Bei niedriger Last ist sie sichtbar, aber ueberspringbar. Ein serverseitiger Capacity-Tracker steuert die Gemini-Session-Vergabe.

### Neue Dateien
| Datei | Zweck |
|-------|-------|
| `frontend/server/routes/capacity.ts` | `GET /api/capacity`, `POST /api/capacity/book`, Session-Counter |
| `frontend/hooks/useCapacityPolling.ts` | 5s-Polling-Hook fuer Queue-Status |
| `frontend/services/capacity.ts` | Client-seitige Capacity-API Wrapper |
| `frontend/components/intro/WaitingSection.tsx` | Warteraum-Sektion (Video, Audio, Queue-Anzeige) |
| `frontend/components/intro/QueueIndicator.tsx` | Animierter Queue-Position-Anzeiger |
| `frontend/components/intro/EmailBookingForm.tsx` | Email-Termin-Formular |

### Modifizierte Dateien
| Datei | Aenderung |
|-------|-----------|
| `frontend/components/intro/CoachSelectPage.tsx` | WaitingSection integrieren, betont bei hoher Last |
| `frontend/App.tsx` | `handleCoachSelect` → Capacity-Check vor Transition zu intro-chat |
| `frontend/server/routes/gemini.ts` | `acquireSlot()`/`releaseSlot()` Wrapper um alle Chat-Endpunkte |
| `frontend/server/index.ts` | Capacity-Route einbinden |
| `.env.example` | `MAX_CONCURRENT_GEMINI_SESSIONS`, `AVG_SESSION_DURATION_MS`, `QUEUE_ENABLED` |

### API-Endpunkte

**`GET /api/capacity`** (public, kein Auth)
```json
{
  "available": true,
  "activeSessionCount": 3,
  "maxConcurrentSessions": 10,
  "queue": {
    "position": 0,
    "estimatedWaitMs": 0,
    "ticketId": "uuid-..."
  }
}
```

**`POST /api/capacity/book`** (public)
```json
{ "email": "user@example.com", "ticketId": "uuid-..." }
```

## Acceptance Criteria

- [x] Bei `MAX_CONCURRENT_GEMINI_SESSIONS` erreicht → Warteraum-Sektion wird betont
- [x] Queue-Position und geschaetzte Wartezeit werden alle 5s aktualisiert
- [x] User wird automatisch zum IntroChat weitergeleitet wenn Slot frei
- [x] Email-Termin-Buchung speichert Slot-Reservierung
- [x] Direkte API-Calls zu `/api/gemini/chat` geben 503 bei Kapazitaet voll
- [x] Bei niedrigerer Last: Warteraum-Sektion sichtbar aber ueberspringbar
- [x] Graceful Degradation: Wenn `/api/capacity` fehlschlaegt → direkt durchlassen
- [x] `QUEUE_ENABLED=false` deaktiviert das Feature komplett (default: false)
- [x] Eingeloggte Nutzer passieren den Warteraum frei

## Dependencies

- TC-026 (Warteraum Architecture)
- FR-060 (Rate Limiting)
- FR-063 (Visitor Lifecycle Tracking)

## Notes

Implementierung in 2 Phasen: Kapazitaets-Infrastruktur (Server), dann UI (Frontend).
