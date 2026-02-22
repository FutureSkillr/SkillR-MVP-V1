# Deployment

Future SkillR wird als Docker-Container auf Google Cloud Run deployed. Es gibt zwei Deployment-Methoden, die sich in Konfigurationsquelle und Automatisierungsgrad unterscheiden.

---

## Zwei Methoden im Vergleich

| | `make ship` | `make deploy` |
|---|---|---|
| **Konfigurationsquelle** | `.env.deploy`-Datei | Makefile-Variablen / Umgebung |
| **Logik lebt in** | `scripts/deploy.sh` | `Makefile` |
| **Validierung** | Prueft 5 Pflichtfelder | Prueft nur `GEMINI_API_KEY` |
| **HTML-Report** | Ja, automatisch generiert | Nein |
| **Secret-Handling** | Schreibt Env-Vars in Temp-Datei (nicht in `ps aux` sichtbar) | Env-Vars in Kommandozeile |
| **Staging-Variante** | `make ship-staging` | `make deploy-staging` |
| **Voraussetzung** | `make onboard` (einmalig) | Env-Vars manuell bereitstellen |
| **Empfohlen fuer** | Menschen (Alltag) | Maschinen (CI/CD) |

!!! tip "Empfehlung"
    Verwenden Sie `make ship` fuer den taeglichen Betrieb. `make deploy` ist fuer CI/CD-Pipelines und Sonderfaelle gedacht.

---

## Methode 1: `make ship` (empfohlen)

Liest die gesamte Konfiguration aus `.env.deploy` und fuehrt das Deployment automatisch durch.

```bash
# Produktion
make ship

# Staging (max 1 Instanz)
make ship-staging
```

### Ablauf im Detail

```
make ship
  └── scripts/deploy.sh
        ├── 1. Liest .env.deploy
        ├── 2. Validiert: PROJECT_ID, REGION, SERVICE, GEMINI_KEY, DATABASE_URL
        ├── 3. docker build (lokales Image, getaggt mit Git-SHA)
        ├── 4. docker push (Artifact Registry)
        ├── 5. gcloud run deploy (Cloud Run)
        │      ├── Env-Vars via Temp-Datei (--env-vars-file)
        │      ├── Secret Manager: vertexai-sa.json (--set-secrets)
        │      └── Cloud SQL Connector (--add-cloudsql-instances, falls konfiguriert)
        ├── 6. Erstellt HTML-Report in docs/ops/deployments/
        └── 7. Aktualisiert Deployment-Index (docs/ops/deployments/index.html)
```

### Deployment-Reports

Jedes `make ship`-Deployment erzeugt automatisch einen HTML-Report:

```bash
# Deployment-Historie im Browser oeffnen
open docs/ops/deployments/index.html

# Letzten Report direkt oeffnen
ls -t docs/ops/deployments/deploy-*.html | head -1 | xargs open
```

Jeder Report enthaelt:

- Deployment-Status (SUCCESS / FAILED)
- Service-Name, Revision, Projekt, Region
- Git SHA, Branch, Commit-Message
- Deployer (gcloud Account)
- Start- und Endzeitpunkt
- Quick-Links zur Cloud Console (Revisions, Logs, Build History, Images, Cloud SQL, Firebase)
- Letzte 10 Git-Commits

---

## Methode 2: `make deploy` (manuell / CI/CD)

Verwendet keine `.env.deploy`-Datei. Alle Werte werden als Makefile-Variablen oder Umgebungsvariablen uebergeben.

```bash
# Variablen direkt uebergeben
make deploy GEMINI_API_KEY=AIza... DATABASE_URL=postgres://...

# Oder vorher exportieren
export GEMINI_API_KEY=AIza...
export DATABASE_URL=postgres://...
make deploy
```

### Ablauf im Detail

```
make deploy
  ├── check-api-key  (prueft ob GEMINI_API_KEY gesetzt ist)
  ├── docker-auth    (gcloud auth configure-docker)
  ├── docker build   (lokales Image, getaggt mit Git-SHA)
  ├── docker push    (Artifact Registry)
  └── gcloud run deploy
         ├── --set-env-vars (alle Variablen als kommaseparierte Liste)
         ├── --set-secrets (vertexai-sa.json aus Secret Manager)
         └── --add-cloudsql-instances (falls konfiguriert)
```

### Wann `make deploy` statt `make ship`

| Situation | Empfehlung |
|-----------|------------|
| Normale Entwicklung | `make ship` |
| CI/CD-Pipeline (GitHub Actions, Cloud Build) | `make deploy` |
| Anderes GCP-Projekt testen | `make deploy PROJECT_ID=... REGION=...` |
| Schnell ohne `.env.deploy` deployen | `make deploy` mit exportierten Vars |
| Deployment-Report benoetigt | `make ship` (nur ship erstellt Reports) |

---

## Docker-Build-Prozess

Das Docker-Image wird in einem Multi-Stage-Build erstellt:

| Stage | Basis-Image | Aufgabe |
|-------|-------------|---------|
| **frontend-build** | `node:20-alpine` | Frontend-SPA bauen (`npm ci` + `npm run build`) |
| **backend-build** | `golang:1.24-alpine` | Go-Backend kompilieren (CGO_ENABLED=0, statisches Binary) |
| **production** | `node:20-alpine` | Go-Binary + Frontend-Assets + Migrations + Solid Pod Server |

Das Build-Argument `GIT_SHA` wird als Version in das Binary eingebettet:

```bash
docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD) -t future-skillr:latest .
```

!!! info "Basis-Images"
    Die Basis-Images sind auf SHA-Digests gepinnt (Supply-Chain-Sicherheit gemaess FR-061). Bei Upgrades muessen die Digests im `Dockerfile` aktualisiert werden.

---

## Artifact Registry

Docker-Images werden in der **Google Artifact Registry** gespeichert:

```
REGION-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/SERVICE:GIT_SHA
```

Beispiel:

```
europe-west3-docker.pkg.dev/gen-lang-client-0456368718/cloud-run-source-deploy/future-skillr:b5ac0f0
```

Die Artifact Registry wird automatisch von `make onboard` eingerichtet. Bei manueller Einrichtung:

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=europe-west3
```

---

## Cloud Run Konfiguration

| Parameter | Wert |
|-----------|------|
| **Max Instances** | 10 (Produktion), 1 (Staging) |
| **Port** | 8080 (Container-intern) |
| **Authentifizierung** | `--allow-unauthenticated` (App-eigene Auth) |
| **Cloud SQL** | Automatischer Connector via `--add-cloudsql-instances` |
| **Secrets** | Vertex AI SA Key via `--set-secrets` aus Secret Manager |

---

## Umgebungsvariablen

### Pflichtfelder

| Variable | Beschreibung |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API-Schluessel |
| `DATABASE_URL` | PostgreSQL-Verbindungs-URL |
| `FIREBASE_API_KEY` | Firebase Web-API-Schluessel |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `FIREBASE_PROJECT_ID` | Firebase/GCP Projekt-ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `FIREBASE_APP_ID` | Firebase App ID |

### Optionale Felder

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `REDIS_URL` | *(leer)* | Redis-Verbindung fuer Rate Limiting |
| `ALLOWED_ORIGINS` | *(leer)* | CORS Allowed Origins (kommasepariert) |
| `ADMIN_SEED_EMAIL` | *(leer)* | Admin-Benutzer automatisch anlegen |
| `ADMIN_SEED_PASSWORD` | *(leer)* | Passwort fuer Admin-Seed |
| `HEALTH_CHECK_TOKEN` | *(leer)* | Token fuer `/api/health/detailed` |
| `HONEYCOMB_URL` | *(leer)* | Honeycomb API URL (Lernreise-Tracking) |
| `HONEYCOMB_API_KEY` | *(leer)* | Honeycomb API-Schluessel |
| `QUEUE_ENABLED` | `false` | Warteraum aktivieren (FR-062) |
| `META_PIXEL_ID` | *(leer)* | Meta Pixel Tracking ID |

---

## Secret Management

Sensible Daten werden ueber den **Google Secret Manager** verwaltet:

```bash
# Vertex AI Service Account Key hochladen (einmalig)
make setup-secrets

# Erstellt das Secret "vertexai-sa-key" im Projekt
# Cloud Run mountet es als Datei: /app/credentials/vertexai-sa.json
```

!!! warning "Keine Secrets im Code"
    API-Keys, Credentials und Tokens duerfen niemals in committierten Dateien erscheinen. Verwenden Sie Umgebungsvariablen oder Secret Manager.

### So funktioniert es

1. `make setup-secrets` laed `credentials/vertexai-sa.json` in Secret Manager hoch
2. Beim Deploy wird das Secret als Datei in den Container gemountet: `--set-secrets "/app/credentials/vertexai-sa.json=vertexai-sa-key:latest"`
3. Das Go-Backend liest die Datei ueber `GOOGLE_APPLICATION_CREDENTIALS`

---

## Staging-Deployment

Fuer eine separate Staging-Umgebung auf Cloud Run:

```bash
# Via ship (empfohlen)
make ship-staging

# Via deploy (manuell)
make deploy-staging
```

Unterschiede zur Produktion:

| Parameter | Produktion | Staging |
|-----------|-----------|---------|
| Service-Name | `future-skillr` | `future-skillr-staging` |
| Max Instances | 10 | 1 |
| Image-Tag | `future-skillr:SHA` | `future-skillr-staging:SHA` |

---

## CI/CD-Integration

Fuer automatisierte Pipelines verwenden Sie `make deploy` mit Secrets aus der Pipeline-Konfiguration:

```yaml
# Beispiel: GitHub Actions
- name: Deploy to Cloud Run
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    # ... weitere Variablen
  run: make deploy
```

Die Pipeline muss zusaetzlich `gcloud auth` konfigurieren (z.B. ueber Workload Identity Federation oder Service Account Key).
