# Operator Quickstart — Deployment fuer neue Bediener

**Erstellt:** 2026-02-20
**Gepflegt von:** Ops / Architect Agent

---

## Ueberblick

Future SkillR wird auf **Google Cloud Run** deployed. Es gibt zwei Wege, das zu tun:

| Weg | Befehl | Wann benutzen |
|-----|--------|---------------|
| **ship** (empfohlen) | `make ship` | Normaler Alltag — Config kommt aus `.env.deploy` |
| **deploy** (manuell) | `make deploy` | CI/CD, Sonderfaelle, oder wenn du Variablen direkt steuern willst |

Beide Wege bauen ein Docker-Image, pushen es in die Artifact Registry und deployen es auf Cloud Run. Der Unterschied liegt darin, **woher die Konfiguration kommt** und **wo die Logik lebt**.

---

## Voraussetzungen

### Werkzeuge installieren

| Werkzeug | Installieren | Pruefen |
|----------|-------------|---------|
| **gcloud CLI** | `brew install google-cloud-sdk` | `gcloud --version` |
| **Docker** | [docker.com](https://docs.docker.com/get-docker/) | `docker --version` |
| **Git** | `brew install git` | `git --version` |
| **Make** | Vorinstalliert auf macOS | `make --version` |

### GCP-Zugriff erhalten

Bevor du deployen kannst, muss der **Projektbesitzer** dir Zugriff geben:

```bash
# Der Projektbesitzer fuehrt aus (einmalig pro Bediener):
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:DEINE_EMAIL" \
  --role="roles/editor"
```

Pruefe deinen Zugriff:

```bash
gcloud auth login
gcloud projects describe PROJECT_ID        # Muss funktionieren
gcloud run services list --project PROJECT_ID   # Muss funktionieren
```

---

## Ersteinrichtung: `make onboard`

Beim **allerersten Mal** auf deinem Rechner fuehrst du den Onboarding-Wizard aus:

```bash
make onboard
```

Der Wizard geht 10 Schritte durch:

1. Prueft ob gcloud und Docker installiert sind
2. Meldet dich bei Google Cloud an
3. Waehlt das GCP-Projekt aus
4. Waehlt die Region (Standard: `europe-west3` Frankfurt)
5. Aktiviert benoetigte GCP-APIs
6. Richtet die Artifact Registry ein
7. Provisioniert Cloud SQL PostgreSQL (optional, ~9 EUR/Monat)
8. Fragt Gemini API Key und Firebase Config ab
9. Schreibt `.env.deploy` (git-ignored, wird nie committed)
10. Bietet ein sofortiges Deployment an

**Ergebnis:** Eine `.env.deploy`-Datei im Projekt-Root mit deiner kompletten Deploy-Konfiguration.

> **Hinweis:** Fuehre `make onboard` nur einmal aus. Bei erneutem Aufruf erkennt das Skript die vorhandene `.env.deploy` und laeuft automatisch durch. Mit `--fresh` erzwingst du den interaktiven Modus.

---

## Weg 1: `make ship` (empfohlen)

Dies ist der **Standardweg** fuer den Alltag. Er liest die gesamte Konfiguration aus `.env.deploy`.

```bash
# Produktion deployen
make ship

# Staging deployen (max 1 Instanz)
make ship-staging
```

### Was passiert im Detail

```
make ship
  └── scripts/deploy.sh
        ├── 1. Liest .env.deploy
        ├── 2. Validiert: PROJECT_ID, REGION, SERVICE, GEMINI_KEY, DATABASE_URL
        ├── 3. docker build (lokales Image)
        ├── 4. docker push (Artifact Registry)
        ├── 5. gcloud run deploy (Cloud Run)
        ├── 6. Erstellt HTML-Report in docs/ops/deployments/
        └── 7. Aktualisiert Deployment-Index
```

### Vorteile

- **Null Konfiguration noetig** — alles steht in `.env.deploy`
- **Validierung** — Skript prueft ob alle Pflichtfelder gesetzt sind
- **HTML-Report** — jedes Deployment erzeugt einen Report mit Status, Git-SHA, Quick-Links zur Cloud Console
- **Staging-Variante** — `make ship-staging` deployt mit max 1 Instanz

### Deployment-Reports ansehen

```bash
# Deployment-Historie im Browser oeffnen
open docs/ops/deployments/index.html

# Letzten Report direkt oeffnen
ls -t docs/ops/deployments/deploy-*.html | head -1 | xargs open
```

---

## Weg 2: `make deploy` (manuell)

Dieser Weg nutzt **keine `.env.deploy`**. Stattdessen werden alle Werte direkt als Makefile-Variablen uebergeben oder aus der Umgebung gelesen.

```bash
# Alles explizit uebergeben
make deploy GEMINI_API_KEY=AIza... DATABASE_URL=postgres://...

# Oder Variablen vorher exportieren
export GEMINI_API_KEY=AIza...
make deploy
```

### Was passiert im Detail

```
make deploy
  ├── check-api-key  (prueft ob GEMINI_API_KEY gesetzt ist)
  ├── docker-auth    (gcloud auth configure-docker)
  ├── docker build   (lokales Image, getaggt mit Git-SHA)
  ├── docker push    (Artifact Registry)
  └── gcloud run deploy (Cloud Run, mit allen Env-Vars)
```

### Wann `make deploy` statt `make ship`

| Situation | Empfehlung |
|-----------|------------|
| Normale Entwicklung | `make ship` |
| CI/CD-Pipeline | `make deploy` (Variablen aus Pipeline-Secrets) |
| Anderes GCP-Projekt testen | `make deploy PROJECT_ID=... REGION=...` |
| Schnell ohne `.env.deploy` deployen | `make deploy` mit exportierten Vars |
| Deployment-Report erzeugen | `make ship` (nur ship erstellt Reports) |

---

## Vergleich auf einen Blick

| | `make ship` | `make deploy` |
|---|---|---|
| Konfigurationsquelle | `.env.deploy`-Datei | Makefile-Variablen / Umgebung |
| Logik lebt in | `scripts/deploy.sh` | `Makefile` |
| Validierung | Prueft 5 Pflichtfelder | Prueft nur `GEMINI_API_KEY` |
| HTML-Report | Ja (automatisch) | Nein |
| Staging-Variante | `make ship-staging` | `make deploy-staging` |
| Voraussetzung | `make onboard` (einmalig) | Env-Vars manuell bereitstellen |
| Empfohlen fuer | Menschen | Maschinen (CI/CD) |

---

## Staging lokal testen

Bevor du in die Cloud deployst, kannst du lokal mit Docker Compose testen:

```bash
# Startet App + PostgreSQL + Redis lokal
make local-stage

# App erreichbar unter http://localhost:9090
# PostgreSQL unter localhost:5432
# Redis unter localhost:6379

# Beenden und aufraeumen
make local-stage-down
```

---

## Logs und Ueberwachung

```bash
# Cloud Run Logs live verfolgen
make logs

# Cloud Run Services und Revisionen auflisten
make cloudrun-list
```

---

## Fehlerbehebung

| Problem | Ursache | Loesung |
|---------|---------|---------|
| `.env.deploy not found` | Onboarding nicht ausgefuehrt | `make onboard` ausfuehren |
| `GEMINI_API_KEY is not set` | Fehlende Umgebungsvariable | Key in `.env.deploy` oder als Export setzen |
| `PERMISSION_DENIED` beim Build | Fehlende IAM-Rollen | Projektbesitzer vergibt `roles/editor` |
| `Connection refused` zur DB | Cloud SQL nicht verbunden | `CLOUDSQL_CONNECTION_NAME` in `.env.deploy` pruefen |
| Docker-Image baut nicht | `package-lock.json` nicht aktuell | `cd frontend && npm install` und committen |

---

## Zusammenfassung: Dein erster Deploy

```bash
# 1. Einmalig: Onboarding ausfuehren
make onboard

# 2. Ab jetzt immer: Deployen mit einem Befehl
make ship

# 3. Pruefen ob es funktioniert
make logs
```

---

## Setup-Eingaben: Was du brauchst, bevor du loslegst

Bevor eine neue Instanz der App aufgesetzt werden kann, muessen alle folgenden Eingaben bereitstehen. Die Tabelle zeigt, **woher** jeder Wert kommt und **wer** ihn liefern muss.

### Phase 0: Voraussetzungen (einmalig, manuell)

| # | Eingabe | Wer liefert | Woher | Beispiel |
|---|---------|-------------|-------|----------|
| 1 | **GCP-Konto** mit aktivierter Abrechnung | Projektbesitzer | [console.cloud.google.com](https://console.cloud.google.com) | — |
| 2 | **GCP-Projekt-ID** | Projektbesitzer | GCP Console → Neues Projekt erstellen | `future-skillr-prod` |
| 3 | **GCP-Region** | Projektbesitzer | Entscheidung (Standard: `europe-west3` Frankfurt) | `europe-west3` |
| 4 | **IAM-Rolle** fuer Bediener | Projektbesitzer | `gcloud projects add-iam-policy-binding` | `roles/editor` |
| 5 | **Terraform** installiert | Bediener | [terraform.io/downloads](https://developer.hashicorp.com/terraform/downloads) | `>= 1.5` |
| 6 | **gcloud CLI** installiert | Bediener | `brew install google-cloud-sdk` | — |
| 7 | **Docker** installiert | Bediener | [docker.com](https://docs.docker.com/get-docker/) | — |

### Phase 1: GCP-Dienste und Infrastruktur (Terraform)

Diese Werte werden als Terraform-Variablen (`TF_VAR_*`) uebergeben:

| # | Variable | Pflicht | Quelle | Beschreibung |
|---|----------|---------|--------|-------------|
| 8 | `TF_VAR_project_id` | Ja | Manuell | GCP-Projekt-ID (siehe #2) |
| 9 | `TF_VAR_gemini_api_key` | Ja | Google AI Studio | Gemini API Key — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| 10 | `TF_VAR_region` | Nein | Standard `europe-west3` | GCP-Region fuer alle Ressourcen |

Terraform erstellt automatisch: Cloud SQL (DB-Name, User, Passwort), Artifact Registry, Firebase, Firestore, Secret Manager, Cloud Run Service, 10 GCP APIs.

### Phase 2: Manuelle Schritte in der GCP Console

Diese Schritte **koennen nicht automatisiert werden** — sie erfordern manuelle Aktionen in der Web-Console:

| # | Schritt | Wo | Ergebnis | Details |
|---|---------|-----|----------|---------|
| 11 | **OAuth Consent Screen** einrichten | GCP Console → APIs & Services → OAuth consent screen | App-Name, Support-E-Mail, Scopes konfiguriert | Noetig bevor Google Sign-In funktioniert |
| 12 | **OAuth 2.0 Client-ID** erstellen | GCP Console → APIs & Services → Credentials → Create OAuth Client | `client_id` und `client_secret` | Typ: Web Application, Redirect-URIs eintragen |
| 13 | **Vertex AI Service Account** erstellen | GCP Console → IAM → Service Accounts → Create | SA E-Mail + JSON-Schluessel | Rolle: `roles/aiplatform.user`, dann Key als JSON herunterladen |
| 14 | **SA-Key JSON** lokal speichern | Lokales Dateisystem | `credentials/vertexai-sa.json` | Wird von `make setup-secrets` in Secret Manager hochgeladen |

### Phase 3: Secrets und Konfiguration

| # | Eingabe | Pflicht | Woher | Env-Variable |
|---|---------|---------|-------|-------------|
| 15 | **Gemini API Key** | Ja | Google AI Studio | `GEMINI_API_KEY` |
| 16 | **JWT Secret** | Ja | Selbst generieren: `openssl rand -hex 32` | `JWT_SECRET` |
| 17 | **Database URL** | Ja | Terraform-Output `cloud_sql.database_url` | `DATABASE_URL` |
| 18 | **Firebase API Key** | Ja | Terraform-Output `firebase_config.api_key` | `FIREBASE_API_KEY` |
| 19 | **Firebase Auth Domain** | Ja | `<project_id>.firebaseapp.com` | `FIREBASE_AUTH_DOMAIN` |
| 20 | **Firebase Project ID** | Ja | Gleich wie GCP Project ID | `FIREBASE_PROJECT_ID` |
| 21 | **Firebase Storage Bucket** | Ja | Terraform-Output `firebase_config.storage_bucket` | `FIREBASE_STORAGE_BUCKET` |
| 22 | **Firebase Messaging Sender ID** | Ja | Terraform-Output `firebase_config.messaging_sender_id` | `FIREBASE_MESSAGING_SENDER_ID` |
| 23 | **Firebase App ID** | Ja | Terraform-Output `firebase_config.app_id` | `FIREBASE_APP_ID` |
| 24 | **CORS Allowed Origins** | Ja | Cloud Run URL (nach erstem Deploy bekannt) | `ALLOWED_ORIGINS` |
| 25 | **OAuth Client ID** | Ja | GCP Console (Schritt #12) | Terraform-Variable in `modules/firebase` |
| 26 | **OAuth Client Secret** | Ja | GCP Console (Schritt #12) | Terraform-Variable in `modules/firebase` |

### Phase 4: Optionale Konfiguration (Feature Flags)

| # | Eingabe | Standard | Woher | Env-Variable |
|---|---------|----------|-------|-------------|
| 27 | Redis URL | *(leer = deaktiviert)* | MemoryStore oder localhost | `REDIS_URL` |
| 28 | Queue aktivieren | `false` | Entscheidung | `QUEUE_ENABLED` |
| 29 | Max gleichzeitige Gemini-Sessions | `10` | Kapazitaetsplanung | `MAX_CONCURRENT_GEMINI_SESSIONS` |
| 30 | Meta Pixel ID | *(leer = deaktiviert)* | Meta Business Suite | `META_PIXEL_ID` |
| 31 | Health Check Token | *(leer = kein detaillierter Endpoint)* | `openssl rand -hex 16` | `HEALTH_CHECK_TOKEN` |
| 32 | Admin Seed E-Mail | *(leer = kein Seed)* | Entscheidung | `ADMIN_SEED_EMAIL` |
| 33 | Admin Seed Passwort | *(leer = kein Seed)* | Entscheidung | `ADMIN_SEED_PASSWORD` |
| 34 | Flood Detection Schwelle | `50` | Entscheidung | `FLOOD_THRESHOLD` |

### Zusammenfassung: Minimale Eingaben fuer eine lauffaehige Instanz

Wer eine neue Instanz **so schnell wie moeglich** aufsetzen will, braucht genau diese **8 Eingaben** — alles andere hat Standardwerte oder wird automatisch generiert:

| # | Was | Woher |
|---|-----|-------|
| 1 | GCP-Projekt-ID | GCP Console (neues Projekt erstellen) |
| 2 | Gemini API Key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| 3 | Vertex AI SA JSON Key | GCP Console → IAM → Service Accounts |
| 4 | OAuth Client ID | GCP Console → Credentials (nach Consent Screen) |
| 5 | OAuth Client Secret | GCP Console → Credentials (nach Consent Screen) |
| 6 | JWT Secret | `openssl rand -hex 32` |
| 7 | Admin E-Mail | Eigene Wahl |
| 8 | CORS Origin | Cloud Run URL (nach erstem Deploy bekannt — erster Deploy funktioniert ohne) |

---

## Weiterführende Dokumente

| Dokument | Beschreibung |
|----------|-------------|
| [docs/arch/TC-027-infrastructure-as-code.md](../arch/TC-027-infrastructure-as-code.md) | Infrastruktur-Komponentendiagramm, Terraform-Abdeckung, Setup-Flowchart |
| [docs/ops/deployment-guide.md](deployment-guide.md) | Vollstaendige technische Deployment-Referenz |
| [docs/ops/release-checklist.md](release-checklist.md) | Checkliste fuer Pre-Launch und Launch |
| [.env.example](../../.env.example) | Vorlage fuer alle Umgebungsvariablen |
