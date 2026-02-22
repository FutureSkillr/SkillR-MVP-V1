# Server API Referenz

Vollstaendige Dokumentation aller Backend-Endpoints, gruppiert nach Domaene.

## Health & Konfiguration

### GET /api/health

Minimaler Health Check. Gibt den Systemstatus zurueck, ohne interne Details preiszugeben.

**Authentifizierung:** Keine

```http
GET /api/health
```

**Response (200 OK):**

```json
{
  "status": "ok"
}
```

**Response (503 Service Unavailable):**

```json
{
  "status": "degraded"
}
```

!!! info "Sicherheitshinweis"
    Der oeffentliche Health-Endpoint gibt absichtlich keine Infrastruktur-Details preis (H14). Serverseitig werden PostgreSQL- und Redis-Ping-Fehler geloggt.

---

### GET /api/health/detailed

Detaillierter Health Check mit Komponentenstatus, Latenzen und Runtime-Metriken. Geschuetzt durch einen Token.

**Authentifizierung:** Query-Parameter `token`

```http
GET /api/health/detailed?token=<HEALTH_CHECK_TOKEN>
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "version": "abc123",
  "startedAt": "2026-02-21T10:00:00Z",
  "uptimeSeconds": 3600,
  "components": {
    "postgres": { "status": "ok", "latencyMs": 2 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "ai": { "status": "ok" },
    "honeycomb": { "status": "ok" }
  },
  "runtime": {
    "goroutines": 12,
    "heapMB": 18.5
  }
}
```

---

### GET /api/config

Runtime-Konfiguration fuer das Frontend. Liefert Firebase-Konfiguration, die das Frontend zur Initialisierung des Firebase SDKs benoetigt.

**Authentifizierung:** Keine

```http
GET /api/config
```

**Response (200 OK):**

```json
{
  "firebase": {
    "apiKey": "AIza...",
    "authDomain": "project.firebaseapp.com",
    "projectId": "project-id",
    "storageBucket": "project.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123:web:abc"
  }
}
```

!!! info "Runtime-Injektion"
    Die Firebase-Konfiguration wird zur Laufzeit aus Umgebungsvariablen geladen, nicht zur Build-Zeit. Dadurch funktioniert ein Docker-Image in allen Umgebungen.

---

## Authentifizierung

### POST /api/auth/login

E-Mail/Passwort-Login. Gibt Nutzerdaten und ein Session-Token zurueck.

**Authentifizierung:** Keine (eigene Validierung)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "nutzer@example.com",
  "password": "GeheimesPasswort1"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "nutzer@example.com",
    "displayName": "Max Mustermann",
    "role": "user",
    "authProvider": "email",
    "photoURL": null,
    "createdAt": 1708531200000
  },
  "token": "session-uuid"
}
```

**Fehler:**

| Code | Meldung | Ursache |
|------|---------|--------|
| 400 | email and password are required | Felder fehlen |
| 401 | E-Mail oder Passwort falsch. | Ungueltige Credentials |
| 429 | too many login attempts | 5 Fehlversuche in 15 min |
| 503 | database not available | PostgreSQL nicht erreichbar |

---

### POST /api/auth/register

Neues Nutzerkonto erstellen.

**Authentifizierung:** Keine

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "neu@example.com",
  "displayName": "Neue Nutzerin",
  "password": "SicheresPasswort1"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "neu@example.com",
  "displayName": "Neue Nutzerin",
  "role": "user",
  "authProvider": "email",
  "createdAt": 1708531200000
}
```

!!! info "Erster Nutzer wird Admin"
    Der allererste registrierte Nutzer erhaelt automatisch die Rolle `admin` (H10). Dies geschieht atomar ueber eine SQL-Subquery.

**Fehler:**

| Code | Meldung | Ursache |
|------|---------|--------|
| 400 | email, displayName, and password are required | Pflichtfelder fehlen |
| 400 | invalid email format | E-Mail-Format ungueltig |
| 400 | password must be at least 8 characters | Passwort zu kurz |
| 400 | password must contain uppercase, lowercase, and a digit | Passwort zu schwach |
| 409 | Ein Konto mit dieser E-Mail existiert bereits. | E-Mail bereits vergeben |

---

### POST /api/auth/login-provider

Provider-basierter Login (Google, Apple). Erstellt einen lokalen Nutzer fuer Development/Staging.

**Authentifizierung:** Keine

```http
POST /api/auth/login-provider
Content-Type: application/json

{
  "provider": "google"
}
```

---

### POST /api/auth/reset-password

Passwort-Reset anfordern. Gibt immer die gleiche Antwort zurueck (Anti-Enumeration).

**Authentifizierung:** Keine

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "nutzer@example.com"
}
```

**Response (immer 200 OK):**

```json
{
  "ok": true,
  "message": "Falls ein Konto existiert, wurde eine E-Mail gesendet."
}
```

---

### DELETE /api/auth/account

Konto und alle zugehoerigen Daten loeschen (DSGVO Art. 17 -- Recht auf Loeschung).

**Authentifizierung:** Eigene Passwort-Validierung

```http
DELETE /api/auth/account
Content-Type: application/json

{
  "email": "nutzer@example.com",
  "password": "GeheimesPasswort1"
}
```

**Response (200 OK):**

```json
{
  "ok": true,
  "message": "Dein Konto und alle Daten wurden geloescht."
}
```

---

## Sessions

Alle Session-Endpoints erfordern Firebase JWT-Authentifizierung.

### GET /api/v1/sessions

Alle Sessions des authentifizierten Nutzers auflisten.

### POST /api/v1/sessions

Neue Session erstellen.

### GET /api/v1/sessions/:id

Einzelne Session abrufen.

### PUT /api/v1/sessions/:id

Session aktualisieren (z.B. Status aendern).

### DELETE /api/v1/sessions/:id

Session loeschen.

---

## Portfolio

Alle Portfolio-Endpoints erfordern Firebase JWT-Authentifizierung (ausser explizit oeffentliche Endpoints).

### Reflections

#### GET /api/v1/portfolio/reflections

Alle Reflexionen des Nutzers auflisten.

#### POST /api/v1/portfolio/reflections

Neue Reflexion einreichen.

#### GET /api/v1/portfolio/reflections/capabilities

Aggregierte Faehigkeitsbewertungen aus allen Reflexionen.

---

### Profile

#### GET /api/v1/portfolio/profile

Profil des authentifizierten Nutzers abrufen.

#### POST /api/v1/portfolio/profile/compute

Profil-Berechnung ausloesen (aggregiert Reflexionen, Evidence, etc.).

#### GET /api/v1/portfolio/profile/history

Profilhistorie -- wie sich das Profil ueber die Zeit entwickelt hat.

#### GET /api/v1/portfolio/profile/export

Profil als strukturierte Daten exportieren.

#### GET /api/v1/portfolio/profile/public/:userId

**Oeffentlich (kein Auth).** Oeffentliches Profil eines Nutzers abrufen.

---

### Evidence

#### GET /api/v1/portfolio/evidence

Alle Evidence-Eintraege des Nutzers.

#### POST /api/v1/portfolio/evidence

Neuen Evidence-Eintrag erstellen.

#### GET /api/v1/portfolio/evidence/:id

Einzelnen Evidence-Eintrag abrufen.

#### GET /api/v1/portfolio/evidence/by-dimension/:dim

Evidence nach VUCA-Dimension filtern.

#### GET/POST /api/v1/portfolio/evidence/verify/:id

**Oeffentlich (kein Auth).** Evidence-Verifizierungslink. GET fuer E-Mail-Links, POST fuer programmatischen Zugriff.

---

### Endorsements

#### GET /api/v1/portfolio/endorsements

Alle Endorsements des Nutzers.

#### POST /api/v1/portfolio/endorsements/invite

Einladungslink fuer ein Endorsement generieren.

#### GET /api/v1/portfolio/endorsements/pending

Ausstehende Endorsement-Einladungen.

#### PUT /api/v1/portfolio/endorsements/:id/visibility

Sichtbarkeit eines Endorsements aendern (public/private).

#### POST /api/v1/portfolio/endorsements-public

**Oeffentlich (rate-limited).** Endorsement ueber Einladungslink abgeben.

---

### Artifacts

#### GET /api/v1/portfolio/artifacts

Alle Artifacts des Nutzers.

#### POST /api/v1/portfolio/artifacts

Neues Artifact hochladen.

#### GET /api/v1/portfolio/artifacts/:id

Einzelnes Artifact abrufen.

#### DELETE /api/v1/portfolio/artifacts/:id

Artifact loeschen.

#### POST /api/v1/portfolio/artifacts/:id/link-endorsement

Artifact mit einem Endorsement verknuepfen.

---

### Journal

#### GET /api/v1/portfolio/journal

Alle Journal-Eintraege des Nutzers.

#### GET /api/v1/portfolio/journal/station/:stationId

Journal-Eintraege einer bestimmten Station.

#### GET /api/v1/portfolio/journal/dimension/:dim

Journal-Eintraege einer VUCA-Dimension.

#### POST /api/v1/portfolio/journal/interactions

Neue Interaktion aufzeichnen.

---

### Engagement

#### GET /api/v1/portfolio/engagement

Engagement-Daten des Nutzers (XP, Level, Streak, Badges).

#### POST /api/v1/portfolio/engagement/award

XP vergeben (intern verwendet nach Task-Completion etc.).

#### GET /api/v1/portfolio/engagement/leaderboard

Leaderboard abrufen.

---

## Pod (Solid)

Alle Pod-Endpoints erfordern Firebase JWT-Authentifizierung.

### POST /api/v1/pod/connect

Solid Pod verbinden. Validiert die Pod-URL gegen SSRF-Angriffe.

### DELETE /api/v1/pod/connect

Solid Pod trennen.

### GET /api/v1/pod/status

Verbindungsstatus des Pods abrufen.

### POST /api/v1/pod/sync

Daten zum Pod synchronisieren (App-to-Pod, one-way).

### GET /api/v1/pod/data

Pod-Daten abrufen.

---

## Admin

Alle Admin-Endpoints erfordern Firebase JWT mit `role=admin` Custom Claim.

### Prompts

#### GET /api/v1/prompts

Alle Prompt-Templates auflisten.

#### GET /api/v1/prompts/:promptId

Einzelnes Prompt-Template abrufen.

#### PUT /api/v1/prompts/:promptId

Prompt-Template aktualisieren (erstellt neue Version).

#### POST /api/v1/prompts/:promptId/test

Prompt-Template testen -- sendet eine Test-Nachricht an Gemini mit dem Prompt.

#### GET /api/v1/prompts/:promptId/history

Versionshistorie eines Prompt-Templates.

---

### Agents

#### GET /api/v1/agents

Alle Agent-Konfigurationen auflisten.

#### GET /api/v1/agents/:agentId

Einzelne Agent-Konfiguration abrufen.

#### PUT /api/v1/agents/:agentId

Agent-Konfiguration aktualisieren.

#### GET /api/v1/agents/:agentId/executions

Ausfuehrungslog eines Agents.

#### POST /api/v1/agents/:agentId/invoke

Agent manuell ausfuehren (Test-Zweck).
