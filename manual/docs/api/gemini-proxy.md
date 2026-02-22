# Gemini Proxy API

Die Gemini Proxy API (FR-051) stellt einen serverseitigen Proxy fuer alle AI-Operationen bereit. Der Browser kommuniziert nie direkt mit der Gemini API -- alle Aufrufe laufen ueber das Go-Backend, das sich mit GCP Application Default Credentials (Service Account) authentifiziert.

## Warum ein Proxy?

- **Kein API-Key im Browser** -- Vertex AI authentifiziert ueber den Service Account
- **Rate Limiting** -- Pro Nutzer und pro IP, Redis-basiert
- **Jugendschutz** -- Safety Settings werden serverseitig erzwungen
- **Prompt-Management** -- System-Prompts koennen ueber die Admin-Konsole gesteuert werden
- **Audit** -- Alle AI-Aufrufe werden serverseitig protokolliert

## Authentifizierung

AI-Endpoints verwenden **optionale Authentifizierung**. Requests mit gueltigem Firebase JWT werden dem Nutzer zugeordnet; anonyme Requests werden nach IP-Adresse getrackt.

```http
# Mit Auth (empfohlen)
Authorization: Bearer <firebase-jwt>

# Ohne Auth (Intro-Flow)
# Kein Authorization-Header noetig
```

## Endpoints

### POST /api/v1/ai/chat

Konversation mit dem AI-Coach. Unterstuetzt zwei Modi.

#### Passthrough-Modus

Der Client liefert die System-Instruction direkt mit:

```http
POST /api/v1/ai/chat
Content-Type: application/json

{
  "message": "Ich interessiere mich fuer Robotik und KI",
  "system_instruction": "Du bist ein freundlicher Coach fuer Jugendliche. Frage nach Interessen und Staerken. Antworte auf Deutsch.",
  "history": [
    { "role": "user", "content": "Hallo!" },
    { "role": "model", "content": "Willkommen! Was begeistert dich?" }
  ]
}
```

#### Orchestrierter Modus

Der Orchestrator waehlt Agent und Prompt basierend auf dem Kontext:

```http
POST /api/v1/ai/chat
Content-Type: application/json

{
  "message": "Ich interessiere mich fuer Robotik und KI",
  "session_id": "session-uuid",
  "context": {
    "journey_type": "vuca"
  }
}
```

#### Response

```json
{
  "response": "Das ist grossartig! Robotik und KI sind faszinierende Felder...",
  "text": "Das ist grossartig! Robotik und KI sind faszinierende Felder...",
  "agent_id": "onboarding-coach",
  "markers": []
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `response` | string | AI-Antwort |
| `text` | string | Alias fuer `response` (Frontend-Kompatibilitaet) |
| `agent_id` | string | ID des verwendeten Agents (`passthrough`, `default`, oder Agent-ID) |
| `markers` | string[] | Erkannte Completion-Marker (z.B. `[REISE_VORSCHLAG]`) |

#### Validierung

| Feld | Regel |
|------|-------|
| `message` | Pflichtfeld, max. 10.000 Zeichen |
| `journey_type` (in context) | Pattern: `^[a-z0-9-]{1,50}$` |

---

### POST /api/v1/ai/extract

Strukturierte Datenextraktion aus Gespraechen. Gibt immer JSON zurueck.

#### Request

```http
POST /api/v1/ai/extract
Content-Type: application/json

{
  "prompt_id": "",
  "messages": [
    { "role": "user", "content": "Ich mag Technik und Programmieren" },
    { "role": "model", "content": "Spannend! Was genau an Technik fasziniert dich?" },
    { "role": "user", "content": "Roboter bauen und KI trainieren" }
  ],
  "context": {
    "extract_type": "insights"
  }
}
```

#### Response (insights)

```json
{
  "result": {
    "interests": ["Robotik", "Kuenstliche Intelligenz", "Programmieren"],
    "strengths": ["Technisches Verstaendnis", "Problemloesung"],
    "preferredStyle": "hands-on",
    "recommendedJourney": "vuca",
    "summary": "Der Nutzer zeigt starkes Interesse an Technik und praktischem Arbeiten."
  },
  "prompt_id": "builtin:insights",
  "prompt_version": 0
}
```

#### Response (station-result)

```json
{
  "result": {
    "dimensionScores": {
      "volatility": 75,
      "uncertainty": 60,
      "complexity": 85,
      "ambiguity": 70
    },
    "summary": "Starke Leistung in Komplexitaet, Verbesserungspotenzial bei Unsicherheit."
  },
  "prompt_id": "builtin:station-result",
  "prompt_version": 0
}
```

#### Extract-Typen

| Typ | Kontext-Feld | Beschreibung |
|-----|-------------|-------------|
| `insights` | `context.extract_type = "insights"` | Onboarding-Analyse: Interessen, Staerken, Lernstil |
| `station-result` | `context.extract_type = "station-result"` | Stations-Bewertung: Dimensions-Scores |

---

### POST /api/v1/ai/generate

Inhalts-Generierung. Gibt immer JSON zurueck.

#### Request (Curriculum)

```http
POST /api/v1/ai/generate
Content-Type: application/json

{
  "parameters": {
    "goal": "Softwareentwickler"
  },
  "context": {
    "generate_type": "curriculum"
  }
}
```

#### Response (Curriculum)

```json
{
  "result": {
    "goal": "Softwareentwickler",
    "modules": [
      {
        "id": "v1",
        "title": "Digitale Disruption verstehen",
        "description": "Wie Technologie Branchen veraendert",
        "category": "V",
        "order": 1
      },
      {
        "id": "v2",
        "title": "Agile Methoden",
        "description": "Flexibel auf Veraenderungen reagieren",
        "category": "V",
        "order": 2
      }
    ]
  },
  "prompt_id": "builtin:curriculum",
  "prompt_version": 0
}
```

#### Request (Course)

```http
POST /api/v1/ai/generate
Content-Type: application/json

{
  "parameters": {
    "goal": "Softwareentwickler",
    "module": {
      "title": "Digitale Disruption verstehen",
      "description": "Wie Technologie Branchen veraendert",
      "category": "V"
    }
  },
  "context": {
    "generate_type": "course"
  }
}
```

#### Generate-Typen

| Typ | Beschreibung | Ausgabe |
|-----|-------------|---------|
| `curriculum` | VUCA-Lehrplan mit 12 Modulen | `{goal, modules[]}` |
| `course` | Kursinhalt mit Quiz-Fragen | `{title, sections[], quiz[]}` |

---

### POST /api/v1/ai/tts

Text-to-Speech -- wandelt Text in gesprochenes Audio um.

#### Request

```http
POST /api/v1/ai/tts
Content-Type: application/json

{
  "text": "Willkommen bei Future SkillR! Lass uns deine Interessen entdecken.",
  "voice_dialect": "bayerisch"
}
```

#### Response

```json
{
  "audio": "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQoA..."
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `audio` | string | Base64-kodierte PCM-Audiodaten (24kHz, 16-bit, mono) |

#### Unterstuetzte Dialekte

| Schluessel | Beschreibung |
|-----------|-------------|
| `hochdeutsch` | Klares Hochdeutsch (Standard, wenn kein Dialekt angegeben) |
| `bayerisch` | Bayerischer Akzent |
| `schwaebisch` | Schwaebischer Akzent |
| `berlinerisch` | Berliner Dialekt |
| `saechsisch` | Saechsischer Akzent |
| `koelsch` | Koelscher Akzent |

#### Validierung

| Feld | Regel |
|------|-------|
| `text` | Pflichtfeld, max. 5.000 Zeichen |

---

### POST /api/v1/ai/stt

Speech-to-Text -- transkribiert Audio auf Deutsch.

#### Request

```http
POST /api/v1/ai/stt
Content-Type: application/json

{
  "audio": "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAIA...",
  "mime_type": "audio/wav"
}
```

#### Response

```json
{
  "text": "Ich interessiere mich fuer Technik und Programmieren"
}
```

#### Validierung

| Feld | Regel |
|------|-------|
| `audio` | Pflichtfeld, gueltiges Base64, max. 7 MB |
| `mime_type` | Optional, Default: `audio/wav` |

---

## Fehlerbehandlung

AI-Endpoints geben strukturierte Fehlercodes zurueck:

```json
{
  "error": "AI rate limit exceeded",
  "error_code": "ai_rate_limited"
}
```

### Fehlercodes

| error_code | HTTP | Beschreibung | Empfehlung |
|-----------|------|-------------|-----------|
| `ai_credentials_missing` | 503 | GCP Credentials nicht konfiguriert | GCP_PROJECT_ID pruefen |
| `ai_rate_limited` | 429 | Gemini-API Rate Limit | Warten und erneut versuchen |
| `ai_model_not_found` | 502 | Modell nicht verfuegbar | Modellname pruefen |
| `ai_permission_denied` | 403 | Service Account hat keine Berechtigung | IAM-Rollen pruefen |
| `ai_timeout` | 504 | Gemini-Timeout | Erneut versuchen |
| `ai_network_error` | 503 | Gemini nicht erreichbar | Netzwerk pruefen |
| `ai_internal_error` | 500 | Unbekannter Fehler | Serverseitige Logs pruefen |

## Rate Limits

| Endpoint | Limit | Fenster |
|----------|-------|---------|
| `/ai/chat` | 30 | 1 Minute |
| `/ai/extract` | 30 | 1 Minute |
| `/ai/generate` | 30 | 1 Minute |
| `/ai/tts` | 10 | 1 Minute |
| `/ai/stt` | 10 | 1 Minute |

!!! warning "Doppeltes Rate Limiting"
    Neben dem anwendungsseitigen Rate Limiting (Redis) gibt es auch Limits auf der Gemini-API-Seite. Wenn die Gemini-API ein `429` zurueckgibt, wird es als `ai_rate_limited` an den Client weitergeleitet.
