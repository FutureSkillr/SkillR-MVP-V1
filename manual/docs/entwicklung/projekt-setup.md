# Projekt-Setup

Anleitung zur Einrichtung der lokalen Entwicklungsumgebung fuer Future SkillR.

---

## Voraussetzungen

| Werkzeug | Mindestversion | Installation |
|----------|---------------|-------------|
| **Go** | 1.21+ (empfohlen: 1.24) | [go.dev/dl](https://go.dev/dl/) oder `brew install go` |
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org/) oder `brew install node@20` |
| **Docker** | 24+ | [docker.com/get-docker](https://docs.docker.com/get-docker/) |
| **Git** | 2.30+ | `brew install git` |
| **Make** | -- | Vorinstalliert auf macOS/Linux |
| **gcloud CLI** | -- | `brew install google-cloud-sdk` (fuer Deployment) |

Versionen pruefen:

```bash
go version        # go1.24.x oder neuer
node --version    # v20.x oder neuer
docker --version  # Docker 24+
git --version
make --version
```

---

## Repository klonen

```bash
git clone https://github.com/FutureSkillr/MVP72.git
cd MVP72
```

---

## Backend einrichten

### Abhaengigkeiten installieren

```bash
cd backend
go mod download
cd ..
```

### Backend starten (Entwicklungsmodus)

```bash
make go-dev
```

Dies fuehrt `go run ./cmd/server` im `backend/`-Verzeichnis aus. Der Server startet auf Port `8080` (oder dem in `PORT` konfigurierten Wert).

### Backend bauen

```bash
make go-build
# Erzeugt: bin/server
```

---

## Frontend einrichten

### Abhaengigkeiten installieren

```bash
cd frontend
npm install
cd ..
```

Oder ueber das Makefile:

```bash
make install
```

### Frontend starten (Entwicklungsmodus)

```bash
make dev
```

Dies startet den Vite Dev Server mit Hot Module Replacement (HMR). Die Anwendung ist unter `http://localhost:5173` erreichbar.

### Frontend bauen

```bash
make build
# Erzeugt: frontend/dist/
```

---

## Umgebungsvariablen

### Konfigurationsdatei anlegen

```bash
cp .env.example .env.local
```

!!! warning ".env.local ist git-ignored"
    Die Datei `.env.local` enthaelt Secrets und darf niemals committed werden. Sie ist in `.gitignore` eingetragen.

### Pflichtfelder fuer lokale Entwicklung

Tragen Sie mindestens folgende Werte in `.env.local` ein:

| Variable | Beschreibung | Quelle |
|----------|-------------|--------|
| `GEMINI_API_KEY` | Gemini API-Schluessel | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `DATABASE_URL` | PostgreSQL-Verbindung | Standard: `postgres://futureskiller:localdev@localhost:5432/futureskiller` |

### Optionale Felder

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `FIREBASE_API_KEY` | *(leer)* | Firebase Web-API-Key (fuer Auth) |
| `FIREBASE_AUTH_DOMAIN` | *(leer)* | Firebase Auth Domain |
| `FIREBASE_PROJECT_ID` | *(leer)* | Firebase Projekt-ID |
| `JWT_SECRET` | *(leer)* | JWT-Schluessel fuer Session-Tokens |
| `REDIS_URL` | *(leer)* | Redis-Verbindung (optional fuer Rate Limiting) |
| `ADMIN_SEED_EMAIL` | *(leer)* | Admin-Benutzer automatisch anlegen |

Die vollstaendige Liste aller Variablen finden Sie in `.env.example`.

---

## Lokal starten: Drei Optionen

### Option 1: Einzelne Services (schnellste Iteration)

Ideal fuer die Frontend-Entwicklung mit schnellem Feedback:

```bash
# Terminal 1: Backend
make go-dev

# Terminal 2: Frontend (Vite HMR)
make dev
```

!!! note "Datenbank erforderlich"
    Das Backend benoetigt eine laufende PostgreSQL-Instanz. Starten Sie entweder eine lokale PostgreSQL oder nutzen Sie Option 2/3.

### Option 2: Docker Compose (produktionsnah)

Startet den gesamten Stack in Containern -- exakt wie Cloud Run:

```bash
make local-stage

# App: http://localhost:9090
# PostgreSQL: localhost:5432
# Redis: localhost:16379
# Solid Pod: localhost:3000

# Beenden
make local-stage-down
```

### Option 3: Backend lokal + Docker-Datenbank

Hybrid-Ansatz -- Go-Backend nativ, Datenbank im Container:

```bash
# Nur Datenbank und Redis starten
docker compose up postgres redis -d

# Backend nativ starten
make go-dev

# Frontend nativ starten
make dev
```

---

## Datenbank-Migrationen

Migrationen werden bei `make local-stage` automatisch ausgefuehrt (`RUN_MIGRATIONS=true`). Fuer manuelle Steuerung:

```bash
# Migrationen ausfuehren
make migrate-up

# Letzte Migration zurueckrollen
make migrate-down

# Alles zuruecksetzen (Achtung: loescht alle Daten)
make migrate-reset
```

Migrationsdateien liegen in `backend/migrations/`.

---

## Tests ausfuehren

```bash
# Alle Tests
make test-all

# Nur Backend
make go-test

# Nur Frontend
cd frontend && npm test

# TypeScript-Typpruefung
make typecheck
```

Details zur Teststrategie finden Sie unter [Tests](tests.md).

---

## Nuetzliche Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `make help` | Alle verfuegbaren Make-Targets anzeigen |
| `make clean` | Build-Artefakte entfernen |
| `make go-lint` | Go-Linting mit golangci-lint |
| `make typecheck` | TypeScript-Typpruefung |
| `make docker-build` | Docker-Image lokal bauen |
| `make docker-run` | Docker-Image lokal ausfuehren (Port 8080) |
| `make api-gen` | OpenAPI Code-Generation ausfuehren |

---

## IDE-Empfehlungen

### VS Code

Empfohlene Extensions:

- **Go** (`golang.go`) -- Go-Sprachunterstuetzung
- **ESLint** -- TypeScript/JavaScript Linting
- **Prettier** -- Code-Formatierung
- **Docker** -- Dockerfile-Unterstuetzung
- **YAML** -- YAML-Unterstuetzung (docker-compose, Workflows)

### GoLand / WebStorm

JetBrains-IDEs erkennen die Projektstruktur automatisch. Stellen Sie sicher, dass die Go SDK Version auf 1.21+ gesetzt ist.
