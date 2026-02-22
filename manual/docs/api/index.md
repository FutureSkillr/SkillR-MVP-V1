# API-Referenz

Diese Sektion dokumentiert die REST-API des Future SkillR Backends. Alle Endpoints werden vom Go-Backend (Echo Framework) bereitgestellt und sind unter der Basis-URL des Cloud-Run-Services erreichbar.

## Basis-URL

| Umgebung | URL |
|----------|-----|
| Production | `https://future-skillr-1041496140898.us-west1.run.app` |
| Local Development | `http://localhost:8080` |
| Docker Staging | `http://localhost:9090` |

## API-Struktur

Die API ist in drei Bereiche gegliedert:

```mermaid
graph TD
    API["/api"]
    Public["/api/health<br/>/api/config"]
    Auth["/api/auth/*"]
    V1["/api/v1"]
    Sessions["/api/v1/sessions/*"]
    Portfolio["/api/v1/portfolio/*"]
    AI["/api/v1/ai/*"]
    Lernreise["/api/v1/lernreise/*"]
    Pod["/api/v1/pod/*"]
    Admin["/api/v1/prompts/*<br/>/api/v1/agents/*"]

    API --> Public
    API --> Auth
    API --> V1
    V1 --> Sessions
    V1 --> Portfolio
    V1 --> AI
    V1 --> Lernreise
    V1 --> Pod
    V1 --> Admin
```

| Bereich | Auth | Beschreibung |
|---------|------|-------------|
| **Oeffentlich** | Keine | Health Check, Konfiguration |
| **Auth** | Eigene Validierung | Login, Registrierung, Passwort-Reset |
| **API v1 (Standard)** | Firebase JWT | Sessions, Portfolio, Lernreise, Pod |
| **API v1 (AI)** | Optional Firebase JWT | Chat, Extract, Generate, TTS, STT |
| **API v1 (Admin)** | Firebase JWT + Admin-Rolle | Prompt- und Agent-Verwaltung |

## Authentifizierung

Alle authentifizierten Endpoints erwarten einen Firebase JWT-Token im `Authorization`-Header:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token beziehen

1. **Google OAuth:** Firebase Client SDK `signInWithPopup(googleProvider)`
2. **E-Mail/Passwort:** Firebase Client SDK `signInWithEmailAndPassword(email, password)`
3. **Token abrufen:** `await firebase.auth().currentUser.getIdToken()`

### Token-Lebensdauer

Firebase JWT-Tokens haben eine Lebensdauer von **1 Stunde**. Das Firebase Client SDK erneuert Tokens automatisch.

## Response-Format

Alle Responses verwenden **JSON**.

### Erfolg

```json
{
  "status": "ok"
}
```

oder bei Daten:

```json
{
  "items": [...],
  "instance": {...}
}
```

### Fehler

```json
{
  "error": "Fehlerbeschreibung"
}
```

AI-Endpoints geben zusaetzlich einen `error_code` zurueck:

```json
{
  "error": "AI rate limit exceeded",
  "error_code": "ai_rate_limited"
}
```

## HTTP-Statuscodes

| Code | Bedeutung | Verwendung |
|------|-----------|-----------|
| 200 | OK | Erfolgreiche Anfrage |
| 201 | Created | Ressource erfolgreich erstellt |
| 400 | Bad Request | Ungueltige Eingabedaten |
| 401 | Unauthorized | Fehlende oder ungueltige Authentifizierung |
| 403 | Forbidden | Fehlende Berechtigung (z.B. kein Admin) |
| 404 | Not Found | Ressource nicht gefunden |
| 409 | Conflict | Ressource existiert bereits (z.B. doppelte E-Mail) |
| 429 | Too Many Requests | Rate Limit ueberschritten |
| 500 | Internal Server Error | Server-seitiger Fehler |
| 502 | Bad Gateway | Externer Service nicht erreichbar (Gemini, Honeycomb) |
| 503 | Service Unavailable | Datenbank oder AI nicht verfuegbar |
| 504 | Gateway Timeout | Externer Service Timeout |

## Rate Limits

| Endpoint-Gruppe | Limit | Fenster | Schluessel |
|-----------------|-------|---------|-----------|
| AI Chat/Extract/Generate | 30 Requests | 1 Minute | User-ID oder IP |
| AI TTS/STT | 10 Requests | 1 Minute | User-ID oder IP |
| Endorsement (oeffentlich) | 10 Requests | 1 Minute | IP |

Rate-Limit-Header werden bei jedem Response gesetzt:

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
```

Bei Ueberschreitung:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{"error": "rate limit exceeded"}
```

## API-Dokumentationsseiten

| Seite | Beschreibung |
|-------|-------------|
| [Server API](server-api.md) | Vollstaendige Endpoint-Referenz (Health, Auth, Sessions, Portfolio, Admin) |
| [Gemini Proxy API](gemini-proxy.md) | AI-Endpoints (Chat, Extract, Generate, TTS, STT) |
| [Lernreise API](lernreise-api.md) | Lernreise-Katalog, Auswahl, Fortschritt |

## Content-Type

Alle Requests mit Body muessen `Content-Type: application/json` senden. Die maximale Body-Groesse betraegt **10 MB**.

```http
POST /api/v1/ai/chat HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{"message": "Hallo!"}
```
