# FR-065: Flood-Detection und Admin-Alerts

**Status:** done
**Priority:** could
**Created:** 2026-02-20
**Entity:** SkillR
**Gate:** mvp3

## Problem

Kein Echtzeit-Monitoring fuer Besucherflutwellen nach Ad-Kampagnen. Admins haben keine Sicht auf Queue-Laenge und Wartezeiten.

## Solution

Neuer Admin-Endpunkt `GET /api/analytics/flood-status` mit Concurrent-Visitors, Queue-Length und Flood-Indikator. Konfigurierbar via `FLOOD_THRESHOLD` env var.

### API-Endpunkt

**`GET /api/analytics/flood-status`** (Admin-only)
```json
{
  "concurrentVisitors": 87,
  "floodThreshold": 50,
  "isFlooding": true,
  "queueLength": 42,
  "avgWaitMs": 180000,
  "activeGeminiSessions": 10,
  "maxGeminiSessions": 10
}
```

### Modifizierte Dateien
| Datei | Aenderung |
|-------|-----------|
| `frontend/server/routes/analytics.ts` | Neuer Flood-Status-Endpunkt |
| `frontend/server/routes/capacity.ts` | Export der Capacity-Daten fuer Flood-Status |
| `.env.example` | `FLOOD_THRESHOLD` (default: 50) |

## Acceptance Criteria

- [x] `GET /api/analytics/flood-status` gibt Concurrent-Visitors, Queue-Length, Flood-Status
- [x] Flood-Threshold konfigurierbar via `FLOOD_THRESHOLD` env var
- [x] Admin-Dashboard zeigt Echtzeit-Flood-Indikator
- [x] Queue-Wartezeit-Verteilung sichtbar in Admin-Analytics

## Dependencies

- FR-062 (Warteraum) — liefert Capacity-Daten
- FR-063 (Visitor Lifecycle Tracking) — liefert Visitor-Counts

## Notes

Admin-only Endpunkt, erfordert Auth + Admin-Rolle.
