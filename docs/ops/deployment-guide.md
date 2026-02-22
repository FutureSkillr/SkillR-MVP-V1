# Deployment Guide — Future SkillR

**Created:** 2026-02-19
**Maintained by:** Ops / Architect Agent

---

## Overview

Future SkillR deploys to **Google Cloud Run** with:

- **Cloud Build** — builds Docker images from source
- **Artifact Registry** — stores built images
- **Cloud Run** — runs the containerized app (Go backend + static frontend)
- **Cloud SQL** — managed PostgreSQL 16 (database for backend)
- **Firebase** — Authentication + Firestore (user personal data)
- **Memorystore** *(optional)* — managed Redis for caching

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Developer   │────▶│ Cloud Build  │────▶│ Artifact Registry │
│  (git push)  │     │ (Dockerfile) │     │ (Docker images)   │
└──────────────┘     └──────────────┘     └────────┬──────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────┐
                    │          Cloud Run Service            │
                    │  ┌──────────┐  ┌──────────────────┐  │
                    │  │ Go API   │  │ Static Frontend   │  │
                    │  │ :8080    │  │ /app/static       │  │
                    │  └────┬─────┘  └──────────────────┘  │
                    └───────┼──────────────────────────────┘
                            │
               ┌────────────┼────────────┐
               ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Cloud SQL │ │ Firebase │ │Memorystore│
        │PostgreSQL│ │Auth + DB │ │  Redis    │
        └──────────┘ └──────────┘ └──────────┘
```

---

## Prerequisites

### Tools

| Tool | Install | Verify |
|------|---------|--------|
| **gcloud CLI** | `brew install google-cloud-sdk` | `gcloud --version` |
| **Docker** | [docker.com](https://docs.docker.com/get-docker/) | `docker --version` |
| **Git** | `brew install git` | `git --version` |

### GCP Access

The project owner must grant you **at minimum**:

| Role | Why |
|------|-----|
| `roles/editor` | Covers all deployment roles (shortcut) |

Or granularly:

| Role | Why |
|------|-----|
| `roles/serviceusage.serviceUsageConsumer` | Set quota project, call APIs |
| `roles/run.admin` | Deploy to Cloud Run |
| `roles/cloudbuild.builds.editor` | Trigger builds |
| `roles/artifactregistry.writer` | Push Docker images |
| `roles/cloudsql.admin` | Manage Cloud SQL instances |

```bash
# Owner runs this (once per deployer):
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:DEPLOYER_EMAIL" \
  --role="roles/editor"
```

---

## Quick Start

### First-Time Setup

```bash
# 1. Run the onboarding wizard (interactive)
make onboard

# This will:
#   - Authenticate with Google Cloud
#   - Select/validate GCP project
#   - Enable required APIs
#   - Set up Artifact Registry
#   - Provision Cloud SQL PostgreSQL
#   - Collect API keys and Firebase config
#   - Write .env.deploy (git-ignored)
#   - Optionally deploy immediately
```

### Deploy

```bash
# Production deploy (from .env.deploy config)
make ship

# Staging deploy (max 1 instance)
make ship-staging

# Direct deploy (pass env vars explicitly)
make deploy GEMINI_API_KEY=... DATABASE_URL=...
```

---

## Deployment Flows

### Flow 1: `make onboard` (first-time setup)

Runs `scripts/gcp-onboard.sh` which:

1. **Preflight** — verifies gcloud + Docker are installed
2. **Auth** — authenticates with Google Cloud (`gcloud auth login`)
3. **Project** — selects and validates the GCP project
4. **Region** — selects deployment region (default: `europe-west3` Frankfurt)
5. **APIs** — enables required GCP APIs (Cloud Run, Cloud Build, Cloud SQL, etc.)
6. **Artifact Registry** — creates Docker image repository
7. **Cloud SQL** — provisions PostgreSQL 16 instance, creates database and user
8. **Secrets** — collects Gemini API key and Firebase config
9. **Config** — writes `.env.deploy` and `frontend/.env.local`
10. **Deploy** — optionally deploys to Cloud Run

**Re-runs** detect `.env.deploy` and skip interactive prompts (auto mode).
Use `--fresh` to force interactive mode. Use `--no-deploy` to skip deployment.

### Flow 2: `make ship` (routine deploy)

Runs `scripts/deploy.sh` which:

1. Loads config from `.env.deploy`
2. Validates required vars (project, region, service, Gemini key, DATABASE_URL)
3. Builds image via Cloud Build (`cloudbuild.yaml`)
4. Deploys to Cloud Run with:
   - All environment variables (Firebase, Gemini, DB, migrations)
   - Cloud SQL Auth Proxy connection (`--add-cloudsql-instances`)
5. Generates HTML deployment report in `docs/ops/deployments/`
6. Updates deployment history index

### Flow 3: `make deploy` (direct deploy)

Bypasses `.env.deploy` — uses Makefile variables directly.
Useful for CI/CD pipelines or when you want explicit control.

---

## Cloud SQL PostgreSQL

### How It Works

Cloud Run connects to Cloud SQL via the **built-in Cloud SQL Auth Proxy**. No sidecar or VPN needed.

```
Cloud Run Container
  └── Go backend reads DATABASE_URL
        └── postgres://user:pass@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE
              └── Unix socket at /cloudsql/PROJECT:REGION:INSTANCE
                    └── Cloud SQL Auth Proxy (built-in to Cloud Run)
                          └── Cloud SQL PostgreSQL instance
```

The `--add-cloudsql-instances` flag on `gcloud run deploy` mounts the proxy socket automatically.

### Provisioned by Onboarding

The onboarding script creates:

| Resource | Value |
|----------|-------|
| Instance | `future-skillr-db` |
| Version | PostgreSQL 16 |
| Tier | `db-f1-micro` (~$9/month) |
| Database | `futureskiller` |
| User | `futureskiller` |
| Password | Auto-generated (saved in `.env.deploy`) |
| Backups | Daily at 03:00 UTC |
| Storage | 10 GB, auto-increase |

### Manual Cloud SQL Setup

If you skipped Cloud SQL during onboarding:

```bash
# 1. Create instance
gcloud sql instances create future-skillr-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=europe-west3 \
  --project=YOUR_PROJECT

# 2. Create database
gcloud sql databases create futureskiller \
  --instance=future-skillr-db \
  --project=YOUR_PROJECT

# 3. Create user
gcloud sql users create futureskiller \
  --instance=future-skillr-db \
  --password=YOUR_SECURE_PASSWORD \
  --project=YOUR_PROJECT

# 4. Get connection name
gcloud sql instances describe future-skillr-db \
  --project=YOUR_PROJECT \
  --format='value(connectionName)'
# Output: YOUR_PROJECT:europe-west3:future-skillr-db

# 5. Add to .env.deploy
CLOUDSQL_INSTANCE=future-skillr-db
CLOUDSQL_CONNECTION_NAME=YOUR_PROJECT:europe-west3:future-skillr-db
DB_NAME=futureskiller
DB_USER=futureskiller
DB_PASS=YOUR_SECURE_PASSWORD
DATABASE_URL=postgres://futureskiller:YOUR_SECURE_PASSWORD@/futureskiller?host=/cloudsql/YOUR_PROJECT:europe-west3:future-skillr-db
```

### Migrations

The Go backend runs migrations automatically on startup when `RUN_MIGRATIONS=true`.
Migration files are in `backend/migrations/` and are embedded in the Docker image at `/app/migrations`.

Manual migration management:

```bash
# Run migrations up (locally)
make migrate-up DATABASE_URL=postgres://...

# Rollback last migration
make migrate-down DATABASE_URL=postgres://...

# Reset (drop all + re-run)
make migrate-reset DATABASE_URL=postgres://...
```

---

## Redis (Optional)

Redis is optional — the Go backend works without it (`REDIS_URL` defaults to empty string).

### Option A: Memorystore Redis (recommended for production)

Requires a **VPC Connector** for Cloud Run to reach Memorystore.

```bash
# 1. Create VPC Connector
gcloud compute networks vpc-access connectors create future-skillr-vpc \
  --region=europe-west3 \
  --range=10.8.0.0/28 \
  --project=YOUR_PROJECT

# 2. Create Redis instance
gcloud redis instances create future-skillr-cache \
  --size=1 \
  --region=europe-west3 \
  --redis-version=redis_7_0 \
  --project=YOUR_PROJECT

# 3. Get Redis IP
REDIS_IP=$(gcloud redis instances describe future-skillr-cache \
  --region=europe-west3 --project=YOUR_PROJECT \
  --format='value(host)')

# 4. Add to .env.deploy
REDIS_URL=redis://${REDIS_IP}:6379/0

# 5. Add --vpc-connector flag to deploy command
# (manual — not yet automated in deploy.sh)
gcloud run deploy future-skillr \
  --vpc-connector future-skillr-vpc \
  ...
```

### Option B: No Redis

Simply leave `REDIS_URL` empty in `.env.deploy`. The backend skips Redis initialization.

---

## Environment Variables

### Required for Cloud Run

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Cloud SQL | PostgreSQL connection string (Unix socket format) |
| `GEMINI_API_KEY` | Google AI Studio | API key for Gemini AI |
| `FIREBASE_PROJECT_ID` | Firebase Console | Firebase project identifier |
| `FIREBASE_API_KEY` | Firebase Console | Web API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase Console | Auth domain |
| `FIREBASE_STORAGE_BUCKET` | Firebase Console | Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Console | Messaging sender ID |
| `FIREBASE_APP_ID` | Firebase Console | App identifier |
| `RUN_MIGRATIONS` | Set by deploy script | `true` — run DB migrations on startup |
| `STATIC_DIR` | Set by deploy script | `/app/static` — path to frontend files |
| `MIGRATIONS_PATH` | Set by deploy script | `/app/migrations` — path to SQL files |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | *(empty)* | Redis connection string |
| `PORT` | `8080` | Server port (Cloud Run sets this) |
| `GCP_PROJECT_ID` | Firebase project | GCP project for VertexAI |
| `GCP_REGION` | `europe-west3` | GCP region |
| `ALLOWED_ORIGINS` | `localhost:5173,localhost:9090` | CORS allowed origins |

---

## Deployment Tracking

Every deployment generates an **HTML report** saved to `docs/ops/deployments/`.

### Report Contents

Each report captures:

- **Status** — SUCCESS or FAILED
- **Service** — Cloud Run service name and revision
- **Project / Region** — GCP project and region
- **URL** — Live app URL
- **Git** — commit SHA, branch, message, deployer account
- **Timestamps** — deploy start and end time
- **Quick Links** — direct links to Cloud Run console, logs, builds, Cloud SQL, Firebase
- **Recent Commits** — last 10 git commits at time of deploy

### Deployment History Index

An auto-generated `docs/ops/deployments/index.html` lists all deployments (newest first) with status badges.

### Viewing Reports

```bash
# Open the deployment history in your browser
open docs/ops/deployments/index.html

# List all deployment reports
ls -la docs/ops/deployments/deploy-*.html
```

### Report Naming Convention

Reports follow the pattern: `deploy-YYYYMMDD-HHMMSS.html`

Example: `deploy-20260219-143022.html`

---

## Local Staging

For local testing with PostgreSQL and Redis via Docker Compose:

```bash
# Start local staging (builds app + PostgreSQL + Redis)
make local-stage

# App available at http://localhost:9090
# PostgreSQL at localhost:5432 (user: futureskiller, pass: localdev)
# Redis at localhost:6379

# Stop and clean up
make local-stage-down
```

Local staging uses `docker-compose.yml` which provisions its own PostgreSQL and Redis containers.
Environment variables are loaded from `.env.local`.

---

## Troubleshooting

### Build Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `PERMISSION_DENIED` on Cloud Build | Missing IAM roles | Owner grants `roles/editor` |
| `npm ci` fails in Docker | `package-lock.json` out of sync | `cd frontend && npm install` then commit |
| `go mod download` slow | First build, no cache | Normal (~2-4 min), cached after |
| Image too large | Build cache bloat | Check Dockerfile stages |

### Deploy Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `DATABASE_URL is required` | Missing in .env.deploy | Run `make onboard` or set manually |
| Container fails to start | Missing env vars | Check Cloud Run logs: `make logs` |
| Migration error | Bad migration file | Check `backend/migrations/` naming (`.up.sql`/`.down.sql`) |
| `Connection refused` to DB | Cloud SQL not connected | Verify `--add-cloudsql-instances` in deploy |

### Cloud SQL Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Connection refused` | Instance not running | `gcloud sql instances list --project=...` |
| `Authentication failed` | Wrong password | Reset in Cloud Console or `gcloud sql users set-password` |
| `Database does not exist` | DB not created | `gcloud sql databases create futureskiller --instance=...` |
| Slow first query | Instance was stopped | Cloud SQL auto-stops idle micro instances; first query wakes it |

### Common Commands

```bash
# Check Cloud Run service status
gcloud run services describe future-skillr \
  --project=PROJECT_ID --region=europe-west3

# Tail logs
make logs

# List all revisions
make cloudrun-list

# Connect to Cloud SQL (for debugging)
gcloud sql connect future-skillr-db --user=futureskiller --project=PROJECT_ID

# Check deployed env vars
gcloud run services describe future-skillr \
  --project=PROJECT_ID --region=europe-west3 \
  --format='yaml(spec.template.spec.containers[0].env)'
```

---

## Cost Estimate

| Resource | Tier | Monthly Cost |
|----------|------|-------------|
| Cloud Run | Free tier (2M requests) | $0 |
| Cloud SQL | db-f1-micro, 10 GB | ~$9 |
| Cloud Build | 120 min/day free | $0 |
| Artifact Registry | 0.5 GB storage | ~$0.05 |
| Firebase Auth | Free tier (50K MAU) | $0 |
| Firestore | Free tier (1 GB) | $0 |
| **Total (MVP)** | | **~$9/month** |

Memorystore Redis (if added): `basic-m1`, 1 GB = ~$35/month.

---

## File Reference

| File | Purpose |
|------|---------|
| `scripts/gcp-onboard.sh` | First-time GCP setup wizard |
| `scripts/deploy.sh` | Production/staging deploy with HTML reports |
| `.env.deploy` | Deploy config (git-ignored, generated by onboard) |
| `.env.local` | Local dev config (git-ignored) |
| `.env.example` | Template showing all required env vars |
| `Makefile` | Build/deploy/stage targets |
| `Dockerfile` | Multi-stage build (Node + Go → distroless) |
| `docker-compose.yml` | Local staging with PostgreSQL + Redis |
| `cloudbuild.yaml` | Cloud Build configuration |
| `docs/ops/deployments/` | HTML deployment reports and history index |
| `docs/ops/release-checklist.md` | Pre-launch and launch verification checklist |
