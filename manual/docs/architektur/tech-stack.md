# Tech Stack

Detaillierte Auflistung aller eingesetzten Technologien mit Versionen, Einsatzzweck und Begruendung der jeweiligen Wahl.

## Uebersicht

| Schicht | Technologie | Version | Zweck |
|---------|------------|---------|-------|
| Frontend | TypeScript + React | TS 5.x, React 18 | SPA-Entwicklung |
| Build-Tool | Vite | 5.x | Frontend-Bundling |
| Backend | Go | 1.24 | API-Server |
| Web-Framework | Echo | v4 | HTTP-Routing und Middleware |
| AI / Dialog | Google Gemini | gemini-2.0-flash-lite / gemini-2.5-flash-preview-tts | Chat, Extraction, TTS, STT |
| AI-SDK | Vertex AI Go SDK | cloud.google.com/go/vertexai | Server-seitige Gemini-Anbindung |
| Auth | Firebase Authentication | Firebase Admin Go SDK v4 | JWT-basierte Authentifizierung |
| User-Daten | Cloud Firestore | Firebase | Persoenliche Nutzerdaten |
| Operationale DB | PostgreSQL | 15+ | Relationale Geschaeftsdaten |
| DB-Treiber | pgx | v5 | PostgreSQL-Zugriff aus Go |
| Cache | Redis | 7.x | Rate Limiting, Caching |
| Cloud | Google Cloud Run | - | Serverless Container Hosting |
| Container | Docker | Multi-Stage Build | Deployment-Artefakt |
| API-Design | OpenAPI 3.0 | - | API-Spezifikation |
| Version Control | Git + GitHub | - | Quellcodeverwaltung |

## Begruendungen

### Go als Backend-Sprache

| Kriterium | Bewertung |
|-----------|-----------|
| **Performance** | Kompiliert zu nativem Maschinencode; deutlich schneller als Node.js fuer CPU-intensive Operationen |
| **Single Binary** | Ein einziges ausfuehrbares Binary ohne Runtime-Abhaengigkeiten -- vereinfacht das Docker-Image erheblich |
| **Speicherverbrauch** | ~20 MB Heap vs. ~80 MB bei Node.js/Express -- relevant fuer Cloud-Run-Kosten |
| **Concurrency** | Goroutines ermoeglichen tausende gleichzeitige Verbindungen ohne Thread-Overhead |
| **Typsicherheit** | Statische Typisierung reduziert Runtime-Fehler |
| **Google-Oekosystem** | Erstklassige SDKs fuer Vertex AI, Firebase, Cloud SQL |

### Echo Framework

| Kriterium | Bewertung |
|-----------|-----------|
| **Leichtgewichtig** | Minimaler Overhead gegenueber `net/http`; kein Framework-Lock-in |
| **Middleware-Architektur** | Standardisiertes Middleware-Pattern fuer Auth, CORS, Rate Limiting, Logging |
| **Routing** | Gruppen-basiertes Routing mit Parametern (`:id`) und verschachtelten Gruppen |
| **Community** | Aktive Community, gut dokumentiert, stabile API |

### Firebase (Auth + Firestore)

| Kriterium | Bewertung |
|-----------|-----------|
| **Authentifizierung** | Google OAuth, E-Mail/Passwort, Apple Sign-In -- alles aus einer Hand |
| **JWT-Tokens** | Standard-JWT-Tokens, serverseitig verifizierbar ueber Admin SDK |
| **Custom Claims** | Rollen-basierte Zugriffskontrolle ueber Custom Claims (`role: admin`) |
| **Real-time Sync** | Firestore ermoeglicht Echtzeit-Updates im Frontend (Prompt-Management, Agent-Konfiguration) |
| **Skalierung** | Automatische Skalierung ohne Infrastruktur-Management |
| **DSGVO** | EU-Rechenzentren verfuegbar; Datenverarbeitungsvertrag mit Google |

### PostgreSQL

| Kriterium | Bewertung |
|-----------|-----------|
| **Relationale Daten** | Sessions, Reflections, Evidence, Endorsements -- klassische relationale Entitaeten |
| **ACID** | Transaktionssicherheit fuer kritische Geschaeftsdaten |
| **JSON-Support** | `jsonb`-Spalten fuer flexible Schema-Erweiterungen ohne Migrationen |
| **Cloud SQL** | Managed Service auf GCP mit automatischen Backups und IAM-Auth |
| **Kosten** | Cloud SQL ist kosteneffizienter als Firestore fuer operationale Abfragen mit JOINs |

### Redis

| Kriterium | Bewertung |
|-----------|-----------|
| **Rate Limiting** | Sliding-Window-Rate-Limiter mit Redis Sorted Sets -- funktioniert bei Cloud-Run-Autoscaling |
| **Fallback** | In-Memory-Fallback wenn Redis nicht verfuegbar -- das System laeuft weiter |
| **Memorystore** | Managed Redis auf GCP, kompatibel mit Cloud Run ueber VPC Connector |

### Vite als Build-Tool

| Kriterium | Bewertung |
|-----------|-----------|
| **Build-Geschwindigkeit** | Esbuild-basiert -- 10-100x schneller als Webpack |
| **HMR** | Hot Module Replacement fuer schnelle Entwicklungszyklen |
| **TypeScript** | Native TypeScript-Unterstuetzung ohne zusaetzliche Konfiguration |
| **Proxy** | Integrierter Dev-Proxy fuer API-Weiterleitung an das Backend |

### Google Cloud Run

| Kriterium | Bewertung |
|-----------|-----------|
| **Serverless Containers** | Docker-Container ohne Cluster-Management -- kein Kubernetes noetig |
| **Pay-per-Use** | Abrechnung nur bei aktiven Requests -- ideal fuer MVP mit geringem Traffic |
| **Auto-Scaling** | Automatische Skalierung von 0 bis N Instanzen basierend auf Load |
| **Startup** | Go-Binary startet in <1 Sekunde -- minimale Cold-Start-Latenz |
| **IAM** | Service Account fuer Vertex AI, Cloud SQL, Secret Manager -- keine API-Keys noetig |

## Gemini-Modelle

| Modell | Einsatz | Besonderheiten |
|--------|---------|----------------|
| `gemini-2.0-flash-lite` | Chat, Extract, Generate, STT | Schnell, kostenguenstig, Standard-Modell |
| `gemini-2.5-flash-preview-tts` | Text-to-Speech | Audio-Output mit konfigurierbaren Stimmen und Dialekten |

!!! warning "Jugendschutz (JMStV SS5)"
    Alle Gemini-Aufrufe verwenden `HarmBlockMediumAndAbove` Safety-Settings fuer alle Harm-Kategorien. Die Zielgruppe ist 14+.

## Versionsmatrix Docker-Image

```
Stage 1 (Frontend): node:20-alpine (SHA-pinned)
Stage 2 (Backend):  golang:1.24-alpine (SHA-pinned)
Stage 3 (Prod):     node:20-alpine (fuer CSS/Solid)
```

!!! info "Supply-Chain-Sicherheit"
    Basis-Images sind mit SHA256-Digests gepinnt (nicht nur Tags), um Supply-Chain-Angriffe zu verhindern. Digests muessen bei Image-Updates manuell aktualisiert werden.
