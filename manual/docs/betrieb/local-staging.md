# Lokales Staging

Lokales Staging mit Docker Compose spiegelt die Cloud-Run-Produktionsumgebung auf Ihrem Rechner. Es nutzt dasselbe `Dockerfile` wie das Cloud-Deployment und ist ideal fuer Integrationstests vor dem Deploy.

Basiert auf: **FR-052 — Docker Compose Local Staging**

---

## Schnellstart

```bash
# Staging starten (baut Image und startet alle Services)
make local-stage

# Staging beenden und Volumes aufraeumen
make local-stage-down
```

Die App ist nach dem Start unter **http://localhost:9090** erreichbar.

---

## Services

Docker Compose startet vier Services:

| Service | Image | Host-Port | Container-Port | Beschreibung |
|---------|-------|-----------|----------------|-------------|
| **app** | Lokaler Build (Dockerfile) | `9090` | `8080` | Go-Backend + Frontend-SPA + Solid Pod |
| **postgres** | `postgres:16-alpine` | `5432` | `5432` | PostgreSQL-Datenbank |
| **redis** | `redis:7-alpine` | `16379` | `6379` | Redis fuer Rate Limiting und Caching |
| **solid** | `solidproject/community-server:7` | `3000` | `3000` | SOLID Pod Server (Datensouveraenitaet) |

### Service-Abhaengigkeiten

```
app
 ├── postgres (healthcheck: pg_isready)
 └── redis    (healthcheck: redis-cli ping)

solid (unabhaengig)
```

Die App startet erst, wenn PostgreSQL und Redis ihre Health Checks bestanden haben.

---

## Konfiguration

### Umgebungsvariablen

Die App liest ihre Konfiguration aus zwei Quellen:

1. **`.env.local`** (Datei, git-ignored) -- Ihre lokalen API-Keys und Firebase-Config
2. **`docker-compose.yml` environment** -- Ueberschreibt Werte fuer den Containerkontext

Standardmaessig gesetzte Werte im Compose-File:

| Variable | Wert | Beschreibung |
|----------|------|-------------|
| `DATABASE_URL` | `postgres://futureskiller:localdev@postgres:5432/futureskiller` | Interne Postgres-Verbindung |
| `REDIS_URL` | `redis://redis:6379/0` | Interne Redis-Verbindung |
| `RUN_MIGRATIONS` | `true` | Datenbank-Migrationen beim Start ausfuehren |
| `STATIC_DIR` | `/app/static` | Frontend-Assets im Container |
| `MIGRATIONS_PATH` | `/app/migrations` | Migrationen im Container |
| `ADMIN_SEED_EMAIL` | `admin@futureskiller.local` | Lokaler Admin-Benutzer |
| `ADMIN_SEED_PASSWORD` | `Admin1local` | Lokales Admin-Passwort |

### `.env.local` einrichten

```bash
# Vorlage kopieren
cp .env.example .env.local

# Werte eintragen (mindestens GEMINI_API_KEY)
# Tipp: DATABASE_URL muss NICHT eingetragen werden --
# docker-compose.yml ueberschreibt den Wert
```

---

## Vergleich: Lokales Staging vs. Cloud Run

| Eigenschaft | Lokales Staging | Cloud Run |
|------------|----------------|-----------|
| Dockerfile | Dasselbe | Dasselbe |
| PostgreSQL | Lokaler Container | Cloud SQL |
| Redis | Lokaler Container | MemoryStore (optional) |
| Solid Pod | Lokaler Container | Im App-Container integriert |
| Port | `localhost:9090` | Cloud Run URL (`:443`) |
| Secrets | `.env.local` Datei | Secret Manager |
| Migrationen | Automatisch beim Start | Automatisch beim Start |
| Max Instanzen | 1 | 10 (Produktion) |

!!! info "Gleiches Image"
    Das lokale Staging baut exakt dasselbe Docker-Image wie `make ship`. Wenn es lokal funktioniert, funktioniert es auch auf Cloud Run.

---

## Datenbank

### PostgreSQL-Zugangsdaten

| Parameter | Wert |
|-----------|------|
| Host | `localhost` (von aussen), `postgres` (im Container-Netzwerk) |
| Port | `5432` |
| Benutzer | `futureskiller` |
| Passwort | `localdev` |
| Datenbank | `futureskiller` |

### Direkter Zugriff

```bash
# psql (wenn installiert)
psql postgres://futureskiller:localdev@localhost:5432/futureskiller

# Oder via Docker
docker compose exec postgres psql -U futureskiller
```

### Migrationen

Migrationen werden automatisch beim App-Start ausgefuehrt (`RUN_MIGRATIONS=true`). Fuer manuelle Steuerung:

```bash
# Migrationen ausfuehren
make migrate-up

# Letzte Migration zurueckrollen
make migrate-down

# Alles zuruecksetzen
make migrate-reset
```

---

## Redis

Redis ist unter `localhost:16379` (Host) bzw. `redis:6379` (Container-Netzwerk) erreichbar.

```bash
# Redis CLI
docker compose exec redis redis-cli

# Ping testen
docker compose exec redis redis-cli ping
```

!!! note "Externer Port"
    Der Host-Port fuer Redis ist `16379` (nicht `6379`), um Konflikte mit einer eventuell lokal laufenden Redis-Instanz zu vermeiden.

---

## Herunterfahren

```bash
# Services stoppen und Volumes entfernen
make local-stage-down
```

Dies fuehrt `docker compose down -v` aus und entfernt:

- Alle Container
- Das `pgdata`-Volume (Datenbankdaten)
- Das `solid-data`-Volume (Pod-Daten)

!!! warning "Datenverlust"
    `make local-stage-down` loescht alle lokalen Daten. Dies ist beabsichtigt -- lokales Staging ist fuer Integrationstests, nicht fuer dauerhafte Datenhaltung.

---

## Fehlerbehebung

### Port-Konflikte

**Symptom:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Ursache:** Ein anderer Dienst belegt den Port (z.B. eine lokale PostgreSQL-Installation).

**Loesung:**

```bash
# Pruefen, welcher Prozess den Port belegt
lsof -i :5432

# Option 1: Anderen Dienst stoppen
brew services stop postgresql

# Option 2: Port in docker-compose.yml aendern
# ports: "15432:5432" statt "5432:5432"
```

### Docker-Speicher

**Symptom:** Build schlaegt fehl mit `no space left on device`

**Ursache:** Docker hat zu wenig Speicher zugewiesen oder alte Images belegen Platz.

**Loesung:**

```bash
# Ungenutzte Docker-Ressourcen aufraeumen
docker system prune -f

# Docker Desktop: Settings > Resources > Disk image size erhoehen
```

### Datenbank-Verbindungsfehler

**Symptom:** App startet, aber meldet `connection refused` zur Datenbank.

**Ursache:** PostgreSQL ist noch nicht bereit oder der Health Check schlaegt fehl.

**Loesung:**

```bash
# Container-Status pruefen
docker compose ps

# PostgreSQL-Logs ansehen
docker compose logs postgres

# Alle Container neu starten
make local-stage-down && make local-stage
```

### App startet nicht

**Symptom:** Container startet und stoppt sofort wieder.

**Loesung:**

```bash
# App-Logs ansehen
docker compose logs app

# Haeufige Ursachen:
# - GEMINI_API_KEY fehlt in .env.local
# - Ungueltige DATABASE_URL
# - Frontend-Build fehlgeschlagen (npm ci Fehler)
```

### Health Check lokal

```bash
# Einfacher Health Check
curl http://localhost:9090/api/health

# Detaillierter Health Check (falls HEALTH_CHECK_TOKEN gesetzt)
make health-local
```
