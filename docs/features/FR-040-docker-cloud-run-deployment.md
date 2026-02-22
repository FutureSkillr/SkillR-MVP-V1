# FR-040: Docker & Cloud Run Deployment Infrastructure

**Status:** done
**Priority:** must
**Created:** 2026-02-18

## Problem
The frontend app builds and runs locally but has no deployment infrastructure. We need containerized builds and automated deployment to Google Cloud Run.

## Solution
Multi-stage Docker build (Node.js build + nginx serve) with Cloud Run deployment via `gcloud run deploy --source .` and GitHub Actions CI/CD on tag push.

### Files Created
- `Dockerfile` — multi-stage build: node:20-alpine (build) + nginx:1.25-alpine (serve)
- `nginx.conf` — SPA-aware config with health checks, gzip, cache headers, security headers
- `.dockerignore` — excludes docs, node_modules, .git from Docker context
- `.gcloudignore` — same exclusions for Cloud Build uploads
- `Makefile` — project-level build/deploy orchestration
- `.github/workflows/deploy.yml` — CI/CD: deploy on `v*` tag push

## Acceptance Criteria
- [x] `make docker-build` produces a working Docker image
- [x] `make docker-run` serves the app at localhost:8080 with SPA routing
- [x] `make deploy` deploys to Cloud Run production (europe-west3)
- [x] `make deploy-staging` deploys to staging with max 1 instance
- [x] `/_health` endpoint returns 200 for Cloud Run probes
- [x] GitHub Actions workflow triggers on `v*` tag push
- [x] GEMINI_API_KEY is injected at build time, never stored in image layers
- [x] index.html is served with no-cache headers; assets with immutable cache

## Dependencies
- FR-013-web-app-deployment
- TC-011-cloud-run-architecture

## Notes
- GCP Project: `future-skillr`, Region: `europe-west3` (Frankfurt)
- GitHub Actions uses Workload Identity Federation (with SA key fallback commented)
- Required GitHub secrets: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `GEMINI_API_KEY`
