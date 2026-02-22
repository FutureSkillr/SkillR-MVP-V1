# Betrieb

Alles was Sie brauchen, um Future SkillR zu betreiben.

---

## Ueberblick

Future SkillR laeuft auf **Google Cloud Run** als containerisierte Anwendung. Der gesamte Stack -- Go-Backend, TypeScript-Frontend, PostgreSQL-Datenbank und optionales Redis -- wird in einem einzigen Docker-Image ausgeliefert und ueber einfache Make-Befehle gesteuert.

Diese Sektion deckt den vollstaendigen Betriebszyklus ab:

| Thema | Beschreibung | Link |
|-------|-------------|------|
| **Quickstart** | Vom leeren Rechner zur laufenden Instanz in 15 Minuten | [Quickstart](quickstart.md) |
| **Deployment** | Zwei Deploy-Methoden, Docker-Build, Artifact Registry, Cloud Run | [Deployment](deployment.md) |
| **Lokales Staging** | Produktionsnahe Umgebung mit Docker Compose | [Lokales Staging](local-staging.md) |
| **Monitoring** | Logs, Health Checks, Deployment-Reports, Observability | [Monitoring](monitoring.md) |
| **Kosten** | GCP-Kostenaufstellung und monatliche Schaetzung fuer den MVP | [Kosten](kosten.md) |

---

## Schnelleinstieg

Fuer den haeufigsten Anwendungsfall -- eine bestehende Instanz aktualisieren:

```bash
# Aenderungen deployen (liest Konfiguration aus .env.deploy)
make ship

# Logs pruefen
make logs

# Health Check
make health
```

!!! info "Ersteinrichtung"
    Wenn Sie Future SkillR zum ersten Mal auf einem neuen Rechner oder in einem neuen GCP-Projekt einrichten, starten Sie mit dem [Quickstart](quickstart.md). Der Onboarding-Wizard `make onboard` fuehrt Sie durch alle notwendigen Schritte.

---

## Architektur auf einen Blick

```
Browser ──> Cloud Run (Go + Static Files)
               ├── /api/gemini/*    -> Gemini API (serverseitig)
               ├── /api/config      -> Firebase Config (Runtime-Injection)
               ├── /api/health      -> Health Check
               ├── /api/lernreise/* -> Honeycomb API (optional)
               └── /*               -> SPA (Frontend)
                      |
               PostgreSQL (Cloud SQL)
                      |
               Redis (optional, MemoryStore)
```

---

## Werkzeuge

Alle Betriebsaufgaben werden ueber das `Makefile` im Projekt-Root gesteuert:

| Befehl | Zweck |
|--------|-------|
| `make onboard` | Ersteinrichtung: 10-Schritt-Wizard fuer GCP-Konfiguration |
| `make ship` | Produktions-Deployment (liest `.env.deploy`) |
| `make ship-staging` | Staging-Deployment (max 1 Instanz) |
| `make deploy` | Manuelles Deployment (Variablen aus Umgebung/CLI) |
| `make local-stage` | Lokales Staging mit Docker Compose |
| `make local-stage-down` | Lokales Staging herunterfahren |
| `make logs` | Cloud Run Logs live verfolgen |
| `make health` | Health Check der Cloud-Run-Instanz |
| `make health-local` | Health Check der lokalen Staging-Instanz |
| `make monitor` | Kontinuierliches Health-Monitoring (Ctrl+C zum Beenden) |
| `make cloudrun-list` | Cloud Run Services und Revisionen auflisten |
| `make test-all` | Frontend- und Backend-Tests ausfuehren |
