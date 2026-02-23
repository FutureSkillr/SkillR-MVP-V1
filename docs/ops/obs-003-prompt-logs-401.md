# OBS-003: POST /api/prompt-logs Returns 401 Unauthorized During Intro Flow

**Beobachtet:** 2026-02-23
**Severity:** low
**Status:** open

---

## Beobachtung

Waehrend der Onboarding-Chat-Phase (vor Login) erscheint im Browser-Console:

```
POST http://localhost:9090/api/prompt-logs 401 (Unauthorized)
```

## Ursachenanalyse

Der `POST /api/prompt-logs` Endpoint erfordert vollstaendige Firebase-Authentifizierung (`FirebaseAuthMiddleware`), wird aber waehrend des Intro-Flows aufgerufen, in dem der Nutzer noch nicht eingeloggt ist.

### Route-Registrierung

`backend/internal/server/routes.go`, Zeile 256-263:

```go
// POST is authenticated (not necessarily admin)
var promptLogAuthMws []echo.MiddlewareFunc
if deps.FirebaseAuthMiddleware != nil {
    promptLogAuthMws = append(promptLogAuthMws, deps.FirebaseAuthMiddleware)
}
e.POST("/api/prompt-logs", deps.GatewayPromptLogs.LogPrompt, promptLogAuthMws...)
```

### Frontend-Schutz

`frontend/services/db.ts`, Zeile 38-48 hat einen `hasAuthToken()` Guard, der den Call ueberspringen sollte, wenn kein Token vorhanden ist. Moegliche Ursachen fuer den 401:

1. Ein abgelaufener/ungueltiger Token im localStorage
2. Der `hasAuthToken()` Check erkennt ein vorhandenes Token, das Firebase dann ablehnt
3. Ein anderer Code-Pfad ruft den Endpoint ohne den Guard auf

### Vergleich mit AI-Endpoints

Die AI-Endpoints (`/api/v1/ai/chat` etc.) nutzen korrekterweise `OptionalFirebaseAuth` fuer den Intro-Flow (routes.go Zeile 148). Prompt-Logs sollte dasselbe Muster verwenden.

## Loesungsvorschlag

Option A (empfohlen): `OptionalFirebaseAuth` statt `FirebaseAuthMiddleware` fuer den POST Prompt-Logs Endpoint verwenden — anonyme Logs waehrend des Intro-Flows erlauben.

Option B: Den bestehenden Frontend-Guard in `db.ts` haerten, sodass abgelaufene Tokens erkannt und entfernt werden.

## Verwandte Dokumente

- OBS-001: Gemini API Quota (verwandtes AI-Thema)
- `backend/internal/server/routes.go` — Route-Middleware
- `frontend/services/db.ts` — Frontend Prompt-Log Client
