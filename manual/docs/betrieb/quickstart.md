# Quickstart fuer Betreiber

Vom leeren Rechner zur laufenden Future-Skiller-Instanz -- Schritt fuer Schritt.

---

## Voraussetzungen

### Werkzeuge installieren

Stellen Sie sicher, dass folgende Werkzeuge installiert sind:

| Werkzeug | Installation | Pruefung |
|----------|-------------|----------|
| **gcloud CLI** | `brew install google-cloud-sdk` | `gcloud --version` |
| **Docker** | [docker.com/get-docker](https://docs.docker.com/get-docker/) | `docker --version` |
| **Git** | `brew install git` | `git --version` |
| **Make** | Vorinstalliert auf macOS/Linux | `make --version` |

!!! warning "Docker muss laufen"
    Docker Desktop muss gestartet sein, bevor Sie `make ship` oder `make local-stage` ausfuehren. Pruefen Sie mit `docker info`.

### GCP-Zugriff erhalten

Bevor Sie deployen koennen, muss der **Projektbesitzer** Ihnen Zugriff geben:

```bash
# Einmalig pro Betreiber (durch den Projektbesitzer):
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:IHRE_EMAIL" \
  --role="roles/editor"
```

Pruefen Sie Ihren Zugriff:

```bash
gcloud auth login
gcloud projects describe PROJECT_ID
gcloud run services list --project PROJECT_ID
```

---

## Minimale Eingaben

Fuer eine lauffaehige Instanz brauchen Sie genau **8 Eingaben**. Alles andere hat Standardwerte oder wird automatisch generiert.

| # | Eingabe | Quelle |
|---|---------|--------|
| 1 | **GCP-Projekt-ID** | GCP Console -- neues Projekt erstellen |
| 2 | **Gemini API Key** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| 3 | **Vertex AI SA JSON Key** | GCP Console -- IAM -- Service Accounts |
| 4 | **OAuth Client ID** | GCP Console -- Credentials (nach Consent Screen) |
| 5 | **OAuth Client Secret** | GCP Console -- Credentials (nach Consent Screen) |
| 6 | **JWT Secret** | Selbst generieren: `openssl rand -hex 32` |
| 7 | **Admin E-Mail** | Eigene Wahl |
| 8 | **CORS Origin** | Cloud Run URL (nach erstem Deploy bekannt) |

!!! tip "CORS beim ersten Deploy"
    Beim allerersten Deploy ist die Cloud Run URL noch nicht bekannt. Der erste Deploy funktioniert ohne CORS-Eintrag. Nach dem Deploy tragen Sie die URL in `.env.deploy` nach und deployen erneut.

---

## Schritt 1: Repository klonen

```bash
git clone https://github.com/FutureSkillr/MVP72.git
cd MVP72
```

---

## Schritt 2: Onboarding-Wizard ausfuehren

```bash
make onboard
```

Der Wizard fuehrt Sie durch **10 Schritte**:

1. Prueft ob `gcloud` und Docker installiert sind
2. Meldet Sie bei Google Cloud an
3. Waehlt das GCP-Projekt aus
4. Waehlt die Region (Standard: `europe-west3` Frankfurt)
5. Aktiviert benoetigte GCP-APIs
6. Richtet die Artifact Registry ein
7. Provisioniert Cloud SQL PostgreSQL (optional, ca. 9 EUR/Monat)
8. Fragt Gemini API Key und Firebase Config ab
9. Schreibt `.env.deploy` (git-ignored, wird nie committed)
10. Bietet ein sofortiges Deployment an

**Ergebnis:** Eine `.env.deploy`-Datei im Projekt-Root mit Ihrer kompletten Deploy-Konfiguration.

!!! info "Nur einmal ausfuehren"
    `make onboard` muss nur einmal pro Rechner ausgefuehrt werden. Bei erneutem Aufruf erkennt das Skript die vorhandene `.env.deploy` und laeuft automatisch durch. Mit `--fresh` erzwingen Sie den interaktiven Modus.

---

## Schritt 3: Secrets einrichten

Falls Vertex AI genutzt wird, laden Sie den Service-Account-Schluessel in Secret Manager hoch:

```bash
# SA-Key JSON in credentials/ ablegen (git-ignored)
cp ~/Downloads/vertexai-sa.json credentials/vertexai-sa.json

# In Secret Manager hochladen
make setup-secrets
```

---

## Schritt 4: Deployen

```bash
make ship
```

Dieser Befehl:

1. Liest die Konfiguration aus `.env.deploy`
2. Validiert alle Pflichtfelder
3. Baut ein Docker-Image lokal
4. Pusht das Image in die Artifact Registry
5. Deployt auf Cloud Run
6. Erstellt einen HTML-Report in `docs/ops/deployments/`

Nach erfolgreichem Deploy wird die Live-URL angezeigt.

---

## Schritt 5: Pruefen

```bash
# Logs live verfolgen
make logs

# Health Check ausfuehren
make health

# Deployment-Reports im Browser oeffnen
open docs/ops/deployments/index.html
```

---

## Taeglicher Betrieb

Nach der Ersteinrichtung reduziert sich der Workflow auf:

```bash
# Code aendern, testen, deployen
make test-all
make ship

# Logs pruefen
make logs
```

---

## Staging vor dem Deploy

Bevor Sie in die Cloud deployen, koennen Sie lokal testen:

```bash
# Lokales Staging starten (App + PostgreSQL + Redis)
make local-stage

# App erreichbar unter http://localhost:9090
# Beenden und aufraeumen
make local-stage-down
```

Siehe [Lokales Staging](local-staging.md) fuer Details.

---

## Fehlerbehebung

| Problem | Ursache | Loesung |
|---------|---------|---------|
| `.env.deploy not found` | Onboarding nicht ausgefuehrt | `make onboard` ausfuehren |
| `GEMINI_API_KEY is not set` | Fehlende Umgebungsvariable | Key in `.env.deploy` pruefen |
| `PERMISSION_DENIED` beim Build | Fehlende IAM-Rollen | Projektbesitzer vergibt `roles/editor` |
| `Connection refused` zur DB | Cloud SQL nicht verbunden | `CLOUDSQL_CONNECTION_NAME` in `.env.deploy` pruefen |
| Docker-Image baut nicht | `package-lock.json` veraltet | `cd frontend && npm install` und committen |
| `unauthorized` beim Push | Docker nicht authentifiziert | `gcloud auth configure-docker REGION-docker.pkg.dev` |

---

## Weiterfuehrende Dokumente

| Dokument | Beschreibung |
|----------|-------------|
| [Deployment-Guide](deployment.md) | Vollstaendige Deployment-Referenz mit beiden Methoden |
| Operator Quickstart (Referenz) | Detaillierte Referenzdokumentation im Repository: `docs/ops/operator-quickstart.md` |
| [Kosten](kosten.md) | GCP-Kostenaufstellung fuer den MVP |
