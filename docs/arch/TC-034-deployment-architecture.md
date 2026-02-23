# TC-034: Deployment Architecture

**Status:** done
**Created:** 2026-02-22

## Overview

Future SkillR ships as a single Docker image containing:
- **Go backend** (Echo framework, serves API + static frontend)
- **Pre-built frontend** (TypeScript, compiled to static files at Docker build time)
- **Embedded Solid Pod server** (Community Solid Server, optional, runs in-process in production)

## Local Development

```
make local-up
```

Starts four services via `docker-compose.yml`:

| Service | Port | Purpose |
|---------|------|---------|
| `app` | 9090 | Go backend + frontend (Express dev server proxies API) |
| `postgres` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 (session cache, rate limiting) |
| `solid` | 3003 | Community Solid Server (standalone) |

Environment variables are loaded from `.env.local` (gitignored).

**Why Solid Pod is standalone locally:** During development, the Solid Pod runs as a separate container so it can be restarted independently and its data volume persisted across app rebuilds.

## GCP Deployment

Two deployment paths are available:

### Path 1: Script-Based (Recommended for First Deploy)

```bash
make onboard    # Interactive wizard — writes .env.deploy, enables APIs, provisions Cloud SQL
make deploy     # Build Docker image locally, push to Artifact Registry, deploy to Cloud Run
```

`gcp-onboard.sh` is idempotent: first run is interactive, subsequent runs read `.env.deploy` and auto-deploy.

### Path 2: Terraform-Based (For Infrastructure-as-Code)

```bash
# 1. Bootstrap — create GCS bucket for Terraform state
cd terraform/bootstrap
terraform apply -var="project_id=YOUR_PROJECT"

# 2. Configure
cd terraform/environments/production
cp backend.tf.example backend.tf      # fill in project ID
cp terraform.tfvars.example terraform.tfvars  # fill in secrets

# 3. Apply
terraform init
terraform apply

# 4. Deploy app image (Terraform manages infra, not the image tag)
make deploy
```

### Cloud Run Service Architecture

```
Internet → Cloud Run (skillr) → PostgreSQL (Cloud SQL)
                              → Redis (Memorystore, optional)
                              → Vertex AI (Gemini, via SA key from Secret Manager)
```

- **Image tag** is managed by `gcloud run deploy` (in `deploy.sh`), not Terraform
- Terraform's `lifecycle.ignore_changes` prevents it from reverting the image on `terraform apply`
- Cloud SQL connection uses Unix socket via Cloud SQL Auth Proxy (built into Cloud Run)

## Environment Files

| File | Purpose | Gitignored |
|------|---------|------------|
| `.env.local` | Local development config | Yes |
| `.env.deploy` | GCP deployment config (API keys, DB passwords) | Yes |
| `.env.example` | Template — copy to `.env.local` | No |
| `frontend/.env.local` | Frontend-specific overrides | Yes |

## Design Decisions

### Why Express Replaced nginx

The original monolith used nginx as a reverse proxy in front of the Go backend. In the SkillR fork, the Express-based frontend dev server handles static file serving and API proxying. In production, the Go backend serves the pre-built static files directly from `/app/static`, eliminating the need for nginx entirely. This simplifies the Docker image to a single process.

### Why Solid Pod Is Embedded in Production

In production, the Community Solid Server runs inside the same container as the Go backend. This avoids needing a second Cloud Run service or a separate VM. The Solid Pod is accessed via `http://localhost:3000` within the container. Locally, it runs as a separate Docker container for development flexibility.

### Why Image Tag Is Managed by `gcloud`, Not Terraform

Cloud Run image updates happen frequently (every deploy), while infrastructure changes happen rarely. Letting `deploy.sh` manage the image tag via `gcloud run deploy` avoids Terraform state drift and keeps deploys fast. Terraform's `lifecycle.ignore_changes` on the image field prevents conflicts.

## Key Scripts

| Script | Purpose |
|--------|---------|
| `scripts/gcp-onboard.sh` | First-time GCP project setup wizard |
| `scripts/deploy.sh` | Build + push + deploy to Cloud Run |
| `scripts/setup-secrets.sh` | Upload Vertex AI SA key to Secret Manager |
| `scripts/setup-firebase.sh` | Enable Firebase Auth + fetch config |
| `scripts/health-check.sh` | One-shot health check against Cloud Run or local |
| `scripts/health-monitor.sh` | Continuous availability monitor with JSON logs |
| `scripts/seed-pod.sh` | Create admin account on Solid Pod |

## Naming Convention

| Context | Name |
|---------|------|
| Brand / display | Future SkillR |
| Cloud Run service | `skillr` |
| Cloud SQL instance | `skillr-db` |
| Database name | `skillr` |
| Docker image | `skillr:latest` |
| Artifact Registry repo | `cloud-run-source-deploy` |
