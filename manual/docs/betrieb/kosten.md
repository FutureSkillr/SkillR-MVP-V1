# Kostenueberblick

Geschaetzte monatliche Kosten fuer den Betrieb von Future SkillR auf Google Cloud Platform. Alle Preise beziehen sich auf die Region `europe-west3` (Frankfurt) und den Stand Februar 2026.

---

## Kostenaufstellung nach Service

### Cloud Run

| Eigenschaft | Detail |
|------------|--------|
| **Preismodell** | Pay-per-Request |
| **Free Tier** | 2 Millionen Requests/Monat, 360.000 GB-Sekunden, 180.000 vCPU-Sekunden |
| **Kosten darueber** | $0.40 pro 1 Mio. Requests, $0.00002400 pro vCPU-Sek., $0.00000250 pro GB-Sek. |
| **MVP-Schaetzung** | **0 EUR/Monat** (innerhalb des Free Tier fuer MVP-Traffic) |

!!! tip "Free Tier reicht fuer den MVP"
    Bei typischem MVP-Traffic (wenige hundert Nutzer, unter 100.000 Requests/Monat) fallen keine Cloud-Run-Kosten an. Die Abrechnung beginnt erst bei Ueberschreitung des Free Tier.

### Cloud SQL (PostgreSQL)

| Eigenschaft | Detail |
|------------|--------|
| **Instanztyp** | `db-f1-micro` (shared vCPU, 0.6 GB RAM) |
| **Speicher** | 10 GB SSD |
| **Kosten** | **ca. 9 EUR/Monat** |
| **Hinweis** | Kein Free Tier fuer Cloud SQL. Guenstigste Option fuer eine produktionsnahe Datenbank. |

### Gemini API

| Eigenschaft | Detail |
|------------|--------|
| **Free Tier** | 60 Requests/Minute, 1.500 Requests/Tag (Gemini 1.5 Flash) |
| **Paid Tier** | Ab $0.075 pro 1 Mio. Input-Token, $0.30 pro 1 Mio. Output-Token |
| **MVP-Schaetzung** | **0 EUR/Monat** (Free Tier) bis **5-15 EUR/Monat** (Paid Tier bei aktivem Pilotbetrieb) |

!!! warning "Rate Limits beachten"
    Das Free Tier hat strikte Rate Limits (60 req/min). Bei einem Pilotbetrieb mit mehreren gleichzeitigen Nutzern wird das Paid Tier empfohlen. Den API Key erhalten Sie unter [aistudio.google.com](https://aistudio.google.com/apikey).

### Firebase

| Eigenschaft | Detail |
|------------|--------|
| **Plan** | Spark (kostenlos) |
| **Auth** | 50.000 monatlich aktive Nutzer inklusive |
| **Firestore** | 1 GiB Speicher, 50.000 Reads/Tag, 20.000 Writes/Tag |
| **MVP-Schaetzung** | **0 EUR/Monat** |

Der Spark-Plan ist fuer den MVP-Betrieb ausreichend. Ein Upgrade auf den Blaze-Plan (Pay-as-you-go) wird erst bei Skalierung ueber die Free-Tier-Grenzen noetig.

### Redis (MemoryStore)

| Eigenschaft | Detail |
|------------|--------|
| **Instanztyp** | Basic Tier, 1 GB |
| **Kosten** | **ca. 30 EUR/Monat** |
| **Hinweis** | Optional -- wird fuer Rate Limiting und Caching genutzt |
| **Alternative** | Cloud Run internes Rate Limiting (ohne Redis) |

!!! note "Redis ist optional"
    Fuer den MVP kann auf Redis verzichtet werden. Das Backend funktioniert auch ohne Redis -- Rate Limiting laeuft dann im Speicher des einzelnen Containers. Empfohlen erst bei mehreren Instanzen.

### Artifact Registry

| Eigenschaft | Detail |
|------------|--------|
| **Speicher** | $0.10 pro GB/Monat |
| **Netzwerk** | Kostenlos innerhalb derselben Region |
| **MVP-Schaetzung** | **< 1 EUR/Monat** (wenige Docker-Images, je ca. 200-400 MB) |

### Secret Manager

| Eigenschaft | Detail |
|------------|--------|
| **Kosten** | $0.06 pro 10.000 Zugriffe, 6 Secret-Versionen kostenlos |
| **MVP-Schaetzung** | **0 EUR/Monat** (innerhalb des Free Tier) |

---

## Monatliche Gesamtschaetzung (MVP)

### Minimal-Setup (Entwicklung / Demo)

| Service | Kosten/Monat |
|---------|-------------|
| Cloud Run | 0 EUR |
| Cloud SQL PostgreSQL | 9 EUR |
| Gemini API | 0 EUR |
| Firebase (Spark) | 0 EUR |
| Redis (MemoryStore) | -- (nicht aktiviert) |
| Artifact Registry | < 1 EUR |
| Secret Manager | 0 EUR |
| **Gesamt** | **ca. 10 EUR/Monat** |

### Standard-Setup (Pilotbetrieb)

| Service | Kosten/Monat |
|---------|-------------|
| Cloud Run | 0 EUR |
| Cloud SQL PostgreSQL | 9 EUR |
| Gemini API (Paid Tier) | 5-15 EUR |
| Firebase (Spark) | 0 EUR |
| Redis (MemoryStore) | 30 EUR |
| Artifact Registry | < 1 EUR |
| Secret Manager | 0 EUR |
| **Gesamt** | **ca. 45-55 EUR/Monat** |

### Produktions-Setup (100+ Nutzer)

| Service | Kosten/Monat |
|---------|-------------|
| Cloud Run | 5-20 EUR |
| Cloud SQL PostgreSQL (groessere Instanz) | 25-50 EUR |
| Gemini API (Paid Tier) | 15-50 EUR |
| Firebase (Blaze) | 0-10 EUR |
| Redis (MemoryStore) | 30 EUR |
| Artifact Registry | 1-2 EUR |
| Secret Manager | < 1 EUR |
| **Gesamt** | **ca. 80-165 EUR/Monat** |

---

## Kosten reduzieren

| Massnahme | Einsparung | Aufwand |
|-----------|-----------|--------|
| Redis weglassen (In-Memory Rate Limiting) | -30 EUR/Monat | Gering (Standard-Konfiguration) |
| Cloud SQL `db-f1-micro` verwenden | Bereits guenstigste Option | -- |
| Gemini Free Tier nutzen (Entwicklung) | -5 bis -15 EUR/Monat | Keine |
| Cloud Run Min-Instances auf 0 setzen | Cold Starts, aber 0 EUR Idle-Kosten | Standard-Einstellung |
| Alte Docker-Images aufraeumen | Minimale Speicherkosten | `gcloud artifacts docker images delete` |

---

## Kostenmonitoring

### Budget-Alerts einrichten

```
Cloud Console > Billing > Budgets & Alerts > Create Budget
```

Empfohlene Schwellenwerte:

| Schwelle | Aktion |
|----------|--------|
| 50% des Budgets | E-Mail-Benachrichtigung |
| 80% des Budgets | E-Mail-Benachrichtigung |
| 100% des Budgets | E-Mail + Pruefung |

### Kosten einsehen

```
Cloud Console > Billing > Reports
```

Filtern nach Service (Cloud Run, Cloud SQL, etc.) und Zeitraum fuer detaillierte Aufschluesslung.
