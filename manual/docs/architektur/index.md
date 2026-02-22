# Architektur-Ueberblick

Diese Sektion dokumentiert die technische Architektur von Future SkillR. Sie richtet sich an Entwickler, Architekten und DevOps-Engineers, die am System arbeiten oder es bewerten.

## System auf einen Blick

Future SkillR ist eine **Single-Page-Application (SPA)** mit einem monolithischen Go-Backend, das als einzelner Docker-Container auf Google Cloud Run laeuft. Der Container buendelt das kompilierte Frontend (statische Dateien), den Go-Server und alle Datenbank-Migrationen.

```mermaid
graph LR
    Browser["Browser<br/>(React SPA)"]
    CloudRun["Cloud Run<br/>(Docker Container)"]
    GoBackend["Go Backend<br/>(Echo Framework)"]
    Gemini["Gemini API<br/>(Vertex AI)"]
    Firebase["Firebase<br/>(Auth + Firestore)"]
    PostgreSQL["PostgreSQL<br/>(Cloud SQL)"]
    Redis["Redis<br/>(Memorystore)"]
    Honeycomb["Honeycomb<br/>(Lernreise)"]

    Browser -->|"HTTPS"| CloudRun
    CloudRun --> GoBackend
    GoBackend -->|"gRPC/REST"| Gemini
    GoBackend -->|"Admin SDK"| Firebase
    GoBackend -->|"pgx"| PostgreSQL
    GoBackend -->|"go-redis"| Redis
    GoBackend -->|"HTTP"| Honeycomb
```

## Architektur-Prinzipien

- **Alle Secrets serverseitig** -- API-Keys, Service-Account-Credentials und Datenbank-Passwoerter erreichen niemals den Browser
- **Ein Container, alle Umgebungen** -- Das gleiche Docker-Image laeuft in Development, Staging und Production; Konfiguration erfolgt ueber Umgebungsvariablen
- **Firebase fuer persoenliche Daten** -- User-Authentifizierung und persoenliche Daten liegen in Firebase; operationale Daten in PostgreSQL
- **Graceful Degradation** -- Redis, Honeycomb und AI-Services sind optional; das System laeuft (eingeschraenkt) auch ohne sie

## Architektur-Seiten

| Seite | Beschreibung |
|-------|-------------|
| [Tech Stack](tech-stack.md) | Detaillierte Technologie-Tabelle mit Versionen und Begruendungen |
| [Systemuebersicht](system-uebersicht.md) | Komponentendiagramm und Request-Flow |
| [Datenmodell](datenmodell.md) | Firebase Firestore und PostgreSQL Schemata |
| [API Gateway](api-gateway.md) | Routing, Middleware, Rate Limiting, CORS |
| [Chat & Dialog](chat-dialog.md) | Gemini-Integration, AI-Orchestrator, Intro-Sequenz |
| [Feature Toggles](feature-toggles.md) | Gate-System fuer Feature-Sichtbarkeit (TC-024) |
| [Sicherheit](sicherheit.md) | Security-Schichten, DSGVO, Jugendschutz |
| [Entscheidungen (ADR)](entscheidungen/index.md) | Index aller Architecture Decision Records |

## Deployment-Modell

```mermaid
graph TD
    subgraph "Docker Container (Cloud Run)"
        StaticFiles["Statische Dateien<br/>(Frontend SPA)"]
        GoServer["Go Server<br/>(Echo, Port 8080)"]
        Migrations["DB Migrationen"]
    end

    subgraph "Externe Dienste"
        CloudSQL["Cloud SQL<br/>(PostgreSQL)"]
        Memorystore["Memorystore<br/>(Redis)"]
        VertexAI["Vertex AI<br/>(Gemini)"]
        FirebaseAuth["Firebase Auth"]
        Firestore["Cloud Firestore"]
    end

    GoServer -->|"Statische Dateien<br/>servieren"| StaticFiles
    GoServer -->|"Startup"| Migrations
    GoServer --> CloudSQL
    GoServer --> Memorystore
    GoServer --> VertexAI
    GoServer --> FirebaseAuth
    GoServer --> Firestore
```

!!! info "Build-Prozess"
    Das Docker-Image wird in einem **Multi-Stage-Build** erstellt:

    1. **Stage 1** -- Node.js: `npm run build` erzeugt die Frontend-SPA (Vite)
    2. **Stage 2** -- Go: `go build` kompiliert das Backend zu einem einzelnen Binary
    3. **Stage 3** -- Production: Binary + statische Dateien in einem minimalen Image
