# OBS-004: Analytics Dashboard Crash on "Analyse" Click

**Beobachtet:** 2026-02-23
**Severity:** medium
**Status:** fixed

---

## Beobachtung

Beim Klick auf den "Analyse"-Tab im Admin-Bereich stuerzt die Seite ab mit folgenden Console-Fehlern:

```
GET http://localhost:9090/api/analytics/events?limit=1000 401 (Unauthorized)
GET http://localhost:9090/api/analytics/overview 401 (Unauthorized)
Failed to load analytics: TypeError: N is not iterable
Uncaught TypeError: Cannot read properties of undefined (reading '0')
```

## Ursachenanalyse

### Fehlerkette

1. `GET /api/analytics/events` und `GET /api/analytics/overview` geben 401 zurueck (Admin-Auth fehlt)
2. `getAnalyticsOverview()` und `getAnalyticsEvents()` in `frontend/services/analytics.ts` pruefen **nicht** `res.ok` vor `res.json()`
3. Die 401-Fehlerantwort (`{"message":"Unauthorized"}`) wird als gueltiges Datenobjekt geparst
4. `AnalyticsDashboard.tsx` Zeile 48: `for (const e of events)` — events ist kein Array → **"N is not iterable"**
5. `AnalyticsDashboard.tsx` Zeile 126: `overview.conversionFunnel[0]` — kein `conversionFunnel` Property → **"Cannot read properties of undefined (reading '0')"**

### Betroffene Dateien

| Datei | Zeile | Befund |
|-------|-------|--------|
| `frontend/services/analytics.ts` | 201-202 | `getAnalyticsOverview()` pruefte `res.ok` nicht |
| `frontend/services/analytics.ts` | 219-220 | `getAnalyticsEvents()` pruefte `res.ok` nicht |
| `frontend/components/admin/AnalyticsDashboard.tsx` | 48 | `for (const e of events)` crasht bei Nicht-Array |
| `frontend/components/admin/AnalyticsDashboard.tsx` | 126 | `.conversionFunnel[0]` crasht bei undefined |
| `backend/internal/server/routes.go` | 216-228 | Analytics-Admin erfordert `FirebaseAuthMiddleware` + `RequireAdmin()` |

### Warum 401?

Die Analytics-Admin-Endpoints (`/api/analytics/events`, `/api/analytics/overview`) erfordern:
1. `FirebaseAuthMiddleware` (Firebase-Token)
2. `middleware.RequireAdmin()` (admin-Rolle)

Im lokalen Dev ohne Firebase-Konfiguration (oder ohne gueltige Admin-Session) schlaegt die Authentifizierung fehl.

## Fix (angewendet)

`frontend/services/analytics.ts`: Alle Admin-Fetcher pruefen nun `res.ok` und werfen einen Error bei HTTP-Fehlern. Der bestehende try/catch in `AnalyticsDashboard.tsx` (Zeile 62) faengt diese Fehler korrekt ab und zeigt "Keine Daten verfuegbar." statt zu crashen.

```typescript
// Vorher:
const res = await fetch('/api/analytics/overview', { headers: getAuthHeaders() });
return res.json();

// Nachher:
const res = await fetch('/api/analytics/overview', { headers: getAuthHeaders() });
if (!res.ok) throw new Error(`analytics overview: ${res.status}`);
return res.json();
```

## Verwandte Dokumente

- OBS-002: Sessions 405 (gleiche Sitzung, verwandter Auth-Kontext)
- OBS-003: Prompt-Logs 401 (gleiche Auth-Problematik)
- `backend/internal/server/routes.go` — Admin-Middleware-Konfiguration
