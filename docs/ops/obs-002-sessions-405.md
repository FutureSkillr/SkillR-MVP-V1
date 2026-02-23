# OBS-002: POST /api/sessions Returns 405 Method Not Allowed

**Beobachtet:** 2026-02-23
**Severity:** medium
**Status:** open

---

## Beobachtung

Beim Laden der App und beim Navigieren erscheinen im Browser-Console:

```
POST http://localhost:9090/api/sessions 405 (Method Not Allowed)
PATCH http://localhost:9090/api/sessions/<uuid>/end 405 (Method Not Allowed)
```

Betroffen sind sowohl das Erstellen (POST) als auch das Beenden (PATCH) von Sessions.

## Ursachenanalyse

Der `Session` Handler wird in `backend/cmd/server/main.go` **nie initialisiert**. Die Route ist in `backend/internal/server/routes.go` (Zeile 36) durch `if deps.Session != nil` geschuetzt. Da `deps.Session` nie zugewiesen wird, werden weder `/api/v1/sessions` noch die Kompatibilitaets-Alias-Route `/api/sessions` registriert.

Echo gibt 405 zurueck, weil der Pfad `/api/sessions` teilweise durch andere registrierte Routen (z.B. GET) erkannt wird, aber POST nicht verfuegbar ist.

### Betroffene Dateien

| Datei | Zeile | Befund |
|-------|-------|--------|
| `backend/cmd/server/main.go` | 61-65 | `deps.Session` wird nie zugewiesen |
| `backend/internal/server/routes.go` | 34-41 | v1 Session-Routen hinter nil-Guard |
| `backend/internal/server/routes.go` | 173-187 | Kompatibilitaets-Routen hinter nil-Guard |
| `backend/internal/domain/session/handler.go` | — | Handler ist vollstaendig implementiert |

### Vorhandene Implementierung

Der Session Handler existiert vollstaendig in `backend/internal/domain/session/handler.go` mit allen Methoden: `Create`, `List`, `Get`, `Update`, `Delete`. Es fehlt nur die Initialisierung und Zuweisung in `main.go`.

## Loesungsvorschlag

Session Handler in `main.go` initialisieren, nachdem der PostgreSQL Pool verbunden ist:

```go
// Nach pool-Verbindung:
sessionRepo := postgres.NewSessionRepository(pool)
sessionSvc := session.NewService(sessionRepo)
deps.Session = session.NewHandler(sessionSvc)
```

## Verwandte Dokumente

- `backend/internal/server/routes.go` — Route-Registrierung
- `backend/internal/domain/session/` — Vollstaendiger Handler + Service
