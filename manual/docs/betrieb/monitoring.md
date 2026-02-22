# Monitoring und Observability

Uebersicht der verfuegbaren Monitoring-Werkzeuge fuer den laufenden Betrieb von Future SkillR.

---

## Cloud Run Logs

### Live-Logs verfolgen

```bash
# Logs der Produktionsinstanz streamen
make logs
```

Dieser Befehl nutzt `gcloud beta run services logs tail` und zeigt alle Logs der aktiven Cloud-Run-Instanz in Echtzeit. Beenden mit `Ctrl+C`.

### Logs in der Cloud Console

Alternativ koennen Logs direkt in der Google Cloud Console eingesehen werden:

```
https://console.cloud.google.com/run/detail/REGION/SERVICE/logs?project=PROJECT_ID
```

Ersetzen Sie `REGION`, `SERVICE` und `PROJECT_ID` mit Ihren Werten (z.B. `europe-west3`, `future-skillr`, `gen-lang-client-0456368718`).

---

## Health Checks

### Oeffentlicher Endpoint

```
GET /api/health
```

Gibt den Gesamtstatus zurueck -- ohne interne Details (Sicherheitsrichtlinie H14):

```json
{
  "status": "ok"
}
```

Moegliche Status-Werte:

| Status | HTTP Code | Bedeutung |
|--------|-----------|-----------|
| `ok` | 200 | Alle Komponenten funktionieren |
| `degraded` | 503 | Mindestens eine Komponente nicht erreichbar |

### Detaillierter Endpoint (Token-geschuetzt)

```
GET /api/health/detailed?token=HEALTH_CHECK_TOKEN
```

Gibt umfassende Informationen zurueck -- nur mit gueltigem Token:

```json
{
  "status": "ok",
  "version": "b5ac0f0",
  "startedAt": "2026-02-21T10:30:00Z",
  "uptimeSeconds": 3600,
  "components": {
    "postgres": { "status": "ok", "latencyMs": 2 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "ai": { "status": "ok" },
    "honeycomb": { "status": "unavailable" }
  },
  "runtime": {
    "goroutines": 12,
    "heapMB": 8.5
  }
}
```

### Health Check ueber Make

```bash
# Cloud Run Instanz pruefen
make health

# Lokales Staging pruefen (localhost:9090)
make health-local

# Kontinuierliches Monitoring (pollt regelmaessig, Ctrl+C zum Beenden)
make monitor

# Kontinuierliches Monitoring lokal
make monitor-local
```

Der `make health`-Befehl zeigt eine formatierte Uebersicht mit:

- Service-Status (OK / DEGRADED / DOWN)
- Revision und Deploy-Zeitpunkt
- Komponentenstatus (PostgreSQL, Redis, AI, Honeycomb)
- Latenzen pro Komponente
- Speicherverbrauch und Goroutines
- Fehleranzahl der letzten Stunde (Cloud Run)

!!! tip "HEALTH_CHECK_TOKEN setzen"
    Ohne `HEALTH_CHECK_TOKEN` in `.env.deploy` zeigt `make health` nur den Basisstatus. Generieren Sie einen Token mit `openssl rand -hex 16` und tragen Sie ihn in `.env.deploy` ein.

---

## Deployment-Reports

Jedes `make ship`-Deployment erzeugt automatisch einen HTML-Report in `docs/ops/deployments/`.

### Reports ansehen

```bash
# Deployment-Index im Browser oeffnen
open docs/ops/deployments/index.html

# Neuesten Report direkt oeffnen
ls -t docs/ops/deployments/deploy-*.html | head -1 | xargs open
```

### Inhalt eines Reports

Jeder Report enthalt:

- **Status:** SUCCESS oder FAILED
- **Deployment-Info:** Service, Revision, Projekt, Region, URL
- **Source-Info:** Git SHA, Branch, Commit-Message, Deployer
- **Zeitstempel:** Start und Ende des Deployments
- **Quick-Links:** Direkte Links zu Cloud Console (Revisions, Logs, Build History, Images, Cloud SQL, Firebase)
- **Git-Historie:** Die letzten 10 Commits

---

## Cloud Console Links

Wichtige Seiten in der Google Cloud Console:

| Seite | URL |
|-------|-----|
| **Cloud Run Services** | `https://console.cloud.google.com/run?project=PROJECT_ID` |
| **Cloud Run Logs** | `https://console.cloud.google.com/run/detail/REGION/SERVICE/logs?project=PROJECT_ID` |
| **Cloud Run Revisions** | `https://console.cloud.google.com/run/detail/REGION/SERVICE/revisions?project=PROJECT_ID` |
| **Cloud SQL** | `https://console.cloud.google.com/sql?project=PROJECT_ID` |
| **Artifact Registry** | `https://console.cloud.google.com/artifacts?project=PROJECT_ID` |
| **Secret Manager** | `https://console.cloud.google.com/security/secret-manager?project=PROJECT_ID` |
| **Firebase Console** | `https://console.firebase.google.com/project/PROJECT_ID` |
| **Error Reporting** | `https://console.cloud.google.com/errors?project=PROJECT_ID` |

---

## Was ueberwachen?

### Primaere Metriken

| Metrik | Wo pruefen | Schwellenwert |
|--------|-----------|---------------|
| **Response-Zeiten** | Cloud Run Metrics / Health Check Latenzen | < 500ms (P95) |
| **Fehlerrate** | Cloud Run Logs (severity >= ERROR) | < 1% |
| **Gemini API Nutzung** | Google AI Studio Dashboard / Cloud Logging | Abhaengig vom Kontingent |
| **Aktive Sessions** | App-Logs (Goroutines im Health Check) | < Max Instances * 100 |
| **Datenbank-Latenz** | `/api/health/detailed` (postgres.latencyMs) | < 10ms |
| **Speicherverbrauch** | `/api/health/detailed` (runtime.heapMB) | < 256 MB |

### Cloud Run spezifisch

| Metrik | Beschreibung |
|--------|-------------|
| **Instanzanzahl** | Wie viele Container laufen (0 bis max 10) |
| **Cold Starts** | Dauer bis zur ersten Antwort nach Skalierung von 0 |
| **Billable Container Time** | Abgerechnete Containerzeit (Kostenrelevant) |
| **Request Count** | Anfragen pro Zeiteinheit |

### Services auflisten

```bash
# Alle Cloud Run Services und Revisionen anzeigen
make cloudrun-list
```

---

## Alerting

### Aktueller Stand

Im MVP gibt es kein automatisiertes Alerting. Das Monitoring erfolgt manuell ueber:

- `make health` / `make monitor` (CLI)
- Cloud Console (Web-UI)
- Deployment-Reports (HTML)

### Geplant: Honeycomb-Integration (FR-072)

Die Integration mit dem externen Honeycomb-Service ist in Vorbereitung (Status: `in-progress`). Sobald konfiguriert, stehen zur Verfuegung:

- Strukturierte Events fuer Lernreise-Tracking
- Verteiltes Tracing ueber Service-Grenzen
- Dashboards und Alerting-Regeln

Konfiguration ueber Umgebungsvariablen:

```bash
HONEYCOMB_URL=https://honeycomb.example.com
HONEYCOMB_API_KEY=your-api-key
```

### Google Cloud Alerting (empfohlen fuer Produktion)

Fuer produktive Instanzen empfiehlt sich die Einrichtung von Google Cloud Monitoring Alerts:

1. Cloud Console -- Monitoring -- Alerting
2. Alert Policy erstellen
3. Bedingung: Cloud Run -- Request Latency > 1s oder Error Rate > 5%
4. Benachrichtigungskanal: E-Mail oder Slack

---

## Checkliste fuer den taeglichen Betrieb

- [ ] `make health` zeigt Status "ok"
- [ ] Keine ERROR-Eintraege in `make logs` (letzte Stunde)
- [ ] Deployment-Report des letzten Deploys zeigt SUCCESS
- [ ] Gemini API Kontingent nicht erschoepft
- [ ] PostgreSQL-Latenz < 10ms
