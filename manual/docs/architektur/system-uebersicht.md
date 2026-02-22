# Systemuebersicht

Detaillierte Darstellung der Systemarchitektur, Komponenteninteraktion und typische Request-Flows.

## Architekturdiagramm

```mermaid
graph TB
    subgraph "Client"
        Browser["Browser<br/>(React SPA, Vite-Build)"]
    end

    subgraph "Google Cloud Run"
        subgraph "Docker Container"
            Static["Statische Dateien<br/>(SPA Assets)"]
            Echo["Echo Router<br/>(Go)"]

            subgraph "Middleware-Stack"
                Recover["Recover"]
                ReqID["Request ID"]
                CORS["CORS"]
                BodyLimit["Body Limit (10MB)"]
                SecHeaders["Security Headers"]
            end

            subgraph "Authentifizierung"
                FBAuth["Firebase Auth<br/>Middleware"]
                OptAuth["Optional Auth<br/>(AI-Routen)"]
                AdminAuth["Admin Guard<br/>(role: admin)"]
            end

            subgraph "Handler-Gruppen"
                Public["Public<br/>/api/health<br/>/api/config"]
                Auth["Auth<br/>/api/auth/*"]
                Sessions["Sessions<br/>/api/v1/sessions/*"]
                Portfolio["Portfolio<br/>/api/v1/portfolio/*"]
                AI["AI<br/>/api/v1/ai/*"]
                Lernreise["Lernreise<br/>/api/v1/lernreise/*"]
                Pod["Pod<br/>/api/v1/pod/*"]
                Admin["Admin<br/>/api/v1/prompts/*<br/>/api/v1/agents/*"]
            end

            Orchestrator["AI Orchestrator<br/>(Agent-Auswahl, Prompt-Loading)"]
        end
    end

    subgraph "Externe Dienste"
        VertexAI["Vertex AI<br/>(Gemini 2.0/2.5)"]
        FirebaseAuth2["Firebase Auth<br/>(JWT-Verifizierung)"]
        Firestore["Cloud Firestore<br/>(Prompts, Agents)"]
        CloudSQL["Cloud SQL<br/>(PostgreSQL)"]
        Memorystore["Memorystore<br/>(Redis)"]
        HoneycombSvc["Honeycomb Service<br/>(Lernreise-Katalog)"]
        MemorySvc["Memory Service<br/>(User Context Sync)"]
    end

    Browser -->|"HTTPS"| Echo
    Echo --> Static
    Echo --> Recover --> ReqID --> CORS --> BodyLimit --> SecHeaders

    SecHeaders --> Public
    SecHeaders --> Auth
    FBAuth --> Sessions
    FBAuth --> Portfolio
    FBAuth --> Lernreise
    FBAuth --> Pod
    OptAuth --> AI
    AdminAuth --> Admin

    AI --> Orchestrator --> VertexAI
    Auth --> CloudSQL
    Sessions --> CloudSQL
    Portfolio --> CloudSQL
    Lernreise --> CloudSQL
    Lernreise --> HoneycombSvc
    Lernreise --> MemorySvc
    Pod --> CloudSQL
    Admin --> Firestore

    Echo --> FirebaseAuth2
    Echo --> Memorystore
```

## Middleware-Stack

Jeder Request durchlaeuft den folgenden Middleware-Stack in dieser Reihenfolge:

| Schritt | Middleware | Funktion |
|---------|-----------|----------|
| 1 | `Recover` | Faengt Panics ab, verhindert Server-Absturz |
| 2 | `RequestID` | Weist jedem Request eine eindeutige ID zu |
| 3 | `CORS` | Prueft und setzt Cross-Origin-Header |
| 4 | `BodyLimit` | Begrenzt Request-Body auf 10 MB |
| 5 | `Security Headers` | Setzt `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, `Permissions-Policy` |
| 6 | `FirebaseAuth` | JWT-Verifizierung (nur `/api/v1/*` ausser AI) |
| 7 | `RateLimit` | Redis-basiertes Rate Limiting (pro Route konfigurierbar) |

## Request-Flow: AI-Chat-Interaktion

Typischer Ablauf einer Chat-Nachricht vom Browser bis zur Gemini-Antwort:

```mermaid
sequenceDiagram
    participant B as Browser
    participant E as Echo Router
    participant M as Middleware
    participant H as AI Handler
    participant O as Orchestrator
    participant V as Vertex AI

    B->>E: POST /api/v1/ai/chat<br/>{message, system_instruction, history}
    E->>M: Optional Firebase Auth
    M-->>E: User Info (oder anonym)
    E->>M: Rate Limit Check
    M-->>E: Erlaubt (X-RateLimit-Remaining: 29)
    E->>H: Chat Handler

    alt Passthrough-Modus (system_instruction vorhanden)
        H->>V: Chat mit client-seitigem System-Prompt
    else Orchestrierter Modus
        H->>O: SelectAgent(journey_type)
        O-->>H: Agent + Prompt-Template
        H->>V: Chat mit geladenem Prompt
    end

    V-->>H: {text, token_count, model_used}
    H->>H: Marker-Erkennung<br/>(z.B. [REISE_VORSCHLAG])
    H-->>B: {response, text, agent_id, markers[]}
```

## Request-Flow: Authentifizierter API-Aufruf

```mermaid
sequenceDiagram
    participant B as Browser
    participant FB as Firebase Auth (Client)
    participant E as Echo Router
    participant MW as Firebase Auth Middleware
    participant H as Handler
    participant DB as PostgreSQL

    B->>FB: signInWithGoogle() / signInWithEmail()
    FB-->>B: Firebase ID Token (JWT)
    B->>E: GET /api/v1/portfolio/profile<br/>Authorization: Bearer {jwt}
    E->>MW: FirebaseAuth Middleware
    MW->>MW: VerifyIDToken(jwt)
    MW->>MW: Claims extrahieren (uid, email, role)
    MW-->>E: User Info im Context
    E->>H: Profile Handler
    H->>DB: SELECT * FROM users WHERE id = $1
    DB-->>H: User-Daten
    H-->>B: 200 OK {profile: {...}}
```

## Statische Dateien

Das Go-Backend serviert die Frontend-SPA als statische Dateien:

- Alle Pfade unter `/` die nicht mit `/api/` beginnen liefern statische Assets
- Nicht gefundene Pfade liefern `index.html` (SPA-Fallback fuer Client-Side-Routing)
- Assets aus dem Vite-Build liegen im Verzeichnis `static/` innerhalb des Containers

## Container-Architektur

```
/app/
  server          # Go Binary (kompiliert in Stage 2)
  static/         # Frontend SPA (gebaut in Stage 1)
    index.html
    assets/
      *.js
      *.css
  migrations/     # PostgreSQL Migrationen
    000001_*.up.sql
    000017_*.up.sql
    000018_*.up.sql
  solid-config/   # Community Solid Server Konfiguration
  entrypoint.sh   # Startskript (CSS + Go Server)
```

## Umgebungsvariablen

Die Konfiguration erfolgt vollstaendig ueber Umgebungsvariablen. Es gibt keine Konfigurationsdateien im Container.

| Variable | Pflicht | Default | Beschreibung |
|----------|---------|---------|-------------|
| `PORT` | Nein | `8080` | Server-Port |
| `DATABASE_URL` | Ja | - | PostgreSQL Connection String |
| `REDIS_URL` | Nein | - | Redis Connection String |
| `FIREBASE_PROJECT_ID` | Nein | - | Firebase Projekt-ID |
| `GCP_PROJECT_ID` | Nein | `FIREBASE_PROJECT_ID` | GCP Projekt fuer Vertex AI |
| `GCP_REGION` | Nein | `europe-west3` | GCP Region |
| `ALLOWED_ORIGINS` | Nein | `localhost:5173,localhost:9090` | CORS-Origins (kommasepariert) |
| `HEALTH_CHECK_TOKEN` | Nein | - | Token fuer `/api/health/detailed` |
| `RUN_MIGRATIONS` | Nein | `false` | Auto-Migration beim Start |

!!! warning "Produktions-Hinweis"
    In der Produktion **muss** `ALLOWED_ORIGINS` gesetzt werden. Ohne explizite Konfiguration werden nur localhost-Origins akzeptiert. Cloud Run setzt zusaetzlich eine Warnung ins Log.
