# Entwicklung

Alles fuer den Einstieg in die Entwicklung von Future SkillR.

---

## Ueberblick

Future SkillR ist eine KI-gesteuerte Web-App, in der junge Menschen (14+) durch eine gamifizierte, dialogbasierte Weltreise -- die "Reise nach VUCA" -- ihre Interessen entdecken. Das Ergebnis ist ein persoenliches Skill- und Interessenprofil.

### Tech Stack

| Schicht | Technologie |
|---------|-------------|
| **Frontend** | TypeScript Web-App (Browser, kein App Store) |
| **Backend** | Go (Echo Framework) |
| **KI / Dialog** | Google Gemini via Google AI Studio |
| **Datenbank** | PostgreSQL (Cloud SQL) + Firebase Firestore |
| **Authentifizierung** | Google OAuth + Email Login (Firebase Auth) |
| **Cloud** | Google Cloud Platform (Cloud Run) |
| **API Design** | OpenAPI 3.0 Spezifikationen |
| **Infrastruktur** | Terraform fuer GCP-Ressourcen |

### Repository-Struktur

```
mvp72/
├── backend/               # Go-Backend (Echo Framework)
│   ├── cmd/server/        # Haupteinstiegspunkt
│   ├── internal/          # Interne Packages
│   │   ├── ai/            # Gemini/VertexAI Integration
│   │   ├── admin/         # Admin-Endpunkte
│   │   ├── config/        # Konfigurationsmanagement
│   │   ├── domain/        # Domaenlogik (Evidence, Lernreise)
│   │   ├── firebase/      # Firebase Auth Integration
│   │   ├── middleware/     # HTTP Middleware (Auth, CORS, Rate Limit)
│   │   ├── redis/         # Redis Client
│   │   ├── server/        # HTTP Server und Routing
│   │   └── solid/         # SOLID Pod Integration
│   └── migrations/        # SQL-Migrationen
├── frontend/              # TypeScript Frontend
│   ├── components/        # React-Komponenten
│   ├── hooks/             # Custom React Hooks
│   ├── services/          # API-Clients und Business-Logik
│   ├── server/            # Express-Server (API Gateway)
│   ├── types/             # TypeScript Typen
│   └── tests/             # Frontend-Tests
├── docs/                  # Dokumentation
│   ├── features/          # Feature Requests (FR-001..FR-082)
│   ├── arch/              # Technische Architektur (TC-001..TC-030)
│   └── ops/               # Betriebsdokumentation
├── concepts/              # Fachkonzepte
│   ├── didactical/        # Didaktische Konzepte (DC-001..DC-004)
│   └── business/          # Geschaeftskonzepte (BC-001..BC-011)
├── integrations/          # API-Spezifikationen
├── terraform/             # Infrastruktur als Code
├── scripts/               # Betriebsskripte
├── Makefile               # Build- und Deployment-Befehle
├── Dockerfile             # Multi-Stage Docker Build
├── docker-compose.yml     # Lokales Staging
└── CLAUDE.md              # Agent-Instruktionen und Projektkonventionen
```

---

## Schnelleinstieg

| Thema | Beschreibung | Link |
|-------|-------------|------|
| **Projekt-Setup** | Repository klonen, Abhaengigkeiten installieren, lokal starten | [Projekt-Setup](projekt-setup.md) |
| **Konventionen** | Namensgebung, Git-Workflow, Agent-Team, Arbeitsregeln | [Konventionen](konventionen.md) |
| **Tests** | Go-Tests, Frontend-Tests, Integration Tests, Coverage | [Tests](tests.md) |
| **Design System** | Farben, Typografie, Komponenten, Dark Theme | [Design System](design-system.md) |
| **Feature Requests** | 82 FRs verwalten, Template, Status-Flow, Gate-System | [Feature Requests](feature-requests.md) |

---

## Wichtige Befehle

### Backend

```bash
make go-dev          # Go-Backend im Dev-Modus starten
make go-test         # Go-Tests ausfuehren
make go-lint         # Go-Linting
make go-build        # Go-Binary bauen
```

### Frontend

```bash
make install         # Frontend-Abhaengigkeiten installieren
make dev             # Vite Dev Server starten
make build           # Frontend fuer Produktion bauen
make typecheck       # TypeScript-Typpruefung
```

### Kombiniert

```bash
make test-all        # Alle Tests (Frontend + Backend)
make build-all       # Alles bauen (Frontend + Backend)
make local-stage           # Vollstaendiges lokales Staging (Docker Compose)
```

---

## Projektphasen

| Phase | Codename | Ziel | Feature Requests |
|-------|----------|------|-----------------|
| **MVP1** | "Es funktioniert" | Core Loop stabil, Demo-faehig | 16 FRs |
| **MVP2** | "Das bin ich" | Profil spiegelt den Nutzer wider | 10 FRs |
| **MVP3** | "Sicher unterwegs" | API Gateway, lokales Staging, oeffentliche URL | 2 FRs |
| **MVP4** | "Meine Daten, Mein Pod" | SOLID Pod als Transparenzspiegel | 3 FRs |
| **V1.0** | "Zeig es der Welt" | Produktionsreif, DSGVO, echte Daten | 12 FRs |
| **MVP5** | "Sponsor Showrooms" | Multi-Tenant B2B Plattform | 7 FRs |
| **V2.0** | "Oekosystem" | Kammern, Matching-Revenue, Skalierung | 7 FRs |

Details zu den Phasen und zugeordneten Features finden Sie in der [Roadmap](../roadmap/index.md).
