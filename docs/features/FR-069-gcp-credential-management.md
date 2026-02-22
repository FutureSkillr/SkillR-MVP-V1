# FR-069: GCP Credential Management

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR
**Release:** MVP2

## Problem

The Go backend uses Vertex AI (Gemini) which requires GCP Application Default Credentials (ADC). Currently:

- **Cloud Run:** No service account key is provisioned — AI service fails with "could not find default credentials"
- **Local dev (docker-compose):** Volume-mounted key file works but was set up manually
- **Deploy scripts:** Pass secrets inline via `--set-env-vars` (visible in `ps aux`, shell history)

Without proper credential management, the AI coach — the core product feature — cannot function.

## Solution

### Cloud Run: Secret Manager

Store the Vertex AI service account key in **GCP Secret Manager** and mount it as a file volume in Cloud Run using `--set-secrets`:

```
gcloud run deploy ... \
  --set-secrets "/app/credentials/vertexai-sa.json=vertexai-sa-key:latest" \
  --set-env-vars "GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/vertexai-sa.json,GCP_PROJECT_ID=...,GCP_REGION=..."
```

This avoids embedding the key in env vars or Docker images.

### Local dev: Volume mount

The `docker-compose.yml` mounts `./credentials/` (gitignored) into the container at `/app/credentials:ro`. The SA key file is stored locally at `credentials/vertexai-sa.json`.

### Setup script

A one-time `scripts/setup-secrets.sh` script that:
1. Creates the Secret Manager secret from the local key file
2. Grants the Cloud Run service account access to read the secret
3. Adds the secret name to `.env.deploy` for deploy scripts to reference

## Acceptance Criteria

- [x] `scripts/setup-secrets.sh` stores `credentials/vertexai-sa.json` in Secret Manager
- [x] `scripts/deploy.sh` mounts the secret as a file volume via `--set-secrets`
- [x] `Makefile` deploy targets pass the same `--set-secrets` flag
- [x] `GOOGLE_APPLICATION_CREDENTIALS` is set in both local and Cloud Run environments
- [x] `credentials/` directory remains gitignored
- [x] AI service initializes successfully on Cloud Run after deploy
- [x] `make health` shows AI component as OK after deploy
- [x] No service account keys are embedded in Docker images or env vars

## Dependencies

- FR-068: Health check — used to verify AI availability after deploy
- FR-061: Infrastructure supply-chain hardening — aligns with secret management goals
- TC-025: Security hardening — credential handling pattern

## Notes

- Cloud Run's default service account already has some GCP permissions, but Vertex AI requires explicit `roles/aiplatform.user`.
- The `--set-secrets` flag mounts secrets as files (preferred over env vars for key files).
- Secret rotation: update the secret version in Secret Manager, then redeploy. No code changes needed.
- The SA key in `credentials/` is for local dev only. Cloud Run never sees this file directly.
