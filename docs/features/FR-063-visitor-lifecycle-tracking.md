# FR-063: Visitor-Lifecycle-Tracking

**Status:** done
**Priority:** should
**Created:** 2026-02-20
**Entity:** SkillR
**Gate:** mvp3

## Problem

Es gibt kein Tracking fuer Visitor-Arrival, Dropout, und Conversion. Absprungverhalten bei Ad-Kampagnen kann nicht analysiert werden.

## Solution

5 neue Event-Types im bestehenden Analytics-System: `visitor_arrived`, `visitor_waiting`, `visitor_entered`, `visitor_dropped`, `visitor_converted`. Diese werden in die bestehende SQLite-basierte Tracking-Pipeline integriert.

### Neue Event-Types

| Event | Wann | Properties |
|-------|------|-----------|
| `visitor_arrived` | Erster App-Mount | referrer, viewport, utm_*, arrived_at |
| `visitor_waiting` | Warteraum-Sektion aktiv | queue_position, coach_id, waited_at |
| `visitor_entered` | Uebergang zu IntroChat | wait_time_ms, coach_id, entered_at |
| `visitor_dropped` | Tab-Close ohne Conversion | last_view, time_spent_ms, was_waiting |
| `visitor_converted` | Erfolgreiche Registrierung | coach_id, time_to_convert_ms |

### Modifizierte Dateien
| Datei | Aenderung |
|-------|-----------|
| `frontend/types/analytics.ts` | 5 neue Event-Types zum Union hinzufuegen |
| `frontend/services/analytics.ts` | 5 neue Track-Funktionen, UTM an alle Events anhaengen |
| `frontend/App.tsx` | `visitor_arrived` bei Mount, `visitor_dropped` bei beforeunload, `visitor_converted` bei Login |
| `frontend/components/intro/CoachSelectPage.tsx` | `visitor_waiting` wenn Warteraum aktiv |
| `frontend/server/routes/analytics.ts` | Conversion-Funnel erweitern um Visitor-Lifecycle-Schritte |

## Acceptance Criteria

- [x] `visitor_arrived` feuert bei erstem Page-Load mit Referrer und Viewport
- [x] `visitor_dropped` feuert via `sendBeacon` bei Tab-Close fuer nicht-konvertierte Besucher
- [x] `visitor_converted` feuert bei erfolgreicher Registrierung mit Time-to-Convert
- [x] Drop-off-Rate pro View und Warteraum-Status in Admin-Overview sichtbar
- [x] Erweiterter Conversion-Funnel: Arrived → Coach-Select → Waiting → Entered → Completed → Registered
- [x] Keine PII in Events (kein Email, kein Name — nur browser_session_id)
- [x] Alle bestehenden Tests passen weiterhin

## Dependencies

- FR-050 (bestehendes Analytics-System)

## Notes

Internes Analytics funktioniert ohne Cookie-Consent (kein PII, First-Party only).
