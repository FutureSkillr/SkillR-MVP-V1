# TC-029: Consolidated Configuration Management

**Status:** accepted
**Created:** 2026-02-21
**Entity:** SkillR

## Context

After implementing the Honeycomb/Memory integration (FR-072/FR-073), an audit revealed that new environment variables exist in `config.go` and `.env.example` but are **not wired through `deploy.sh`, `Makefile`, or Terraform**. This is a systemic inconsistency across all 4 deployment layers.

The app requires ~20 environment variables. Before this consolidation:

- **Terraform** only deployed 4 of ~20 env vars (DATABASE_URL, GEMINI_API_KEY, GCP_PROJECT_ID, GCP_REGION)
- **deploy.sh** was missing Honeycomb, Memory, and ALLOWED_ORIGINS
- **Makefile** was missing Honeycomb, Memory, and Redis vars
- There was no startup logging showing which services were actually configured

## Decision

### 1. Canonical Environment Variable Registry

All environment variables are documented here as the single source of truth. Each variable must be present in all 4 layers.

#### Core Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | HTTP server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `REDIS_URL` | No | — | Redis connection URL (rate limiting) |
| `RUN_MIGRATIONS` | No | `false` | Run DB migrations on startup |
| `MIGRATIONS_PATH` | No | `migrations` | Path to migration files |
| `STATIC_DIR` | No | `static` | Path to static frontend assets |

#### GCP / Firebase

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GCP_PROJECT_ID` | **Yes** | — | Google Cloud project ID |
| `GCP_REGION` | No | `europe-west3` | GCP region |
| `FIREBASE_PROJECT_ID` | No | — | Firebase project (falls back to GCP_PROJECT_ID) |
| `FIREBASE_API_KEY` | No | — | Firebase client API key (injected into /api/config) |
| `FIREBASE_AUTH_DOMAIN` | No | — | Firebase auth domain |
| `FIREBASE_STORAGE_BUCKET` | No | — | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | No | — | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | No | — | Firebase app ID |

#### AI / Gemini

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | — | Gemini API key (frontend proxy) |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | — | Path to VertexAI service account JSON |

#### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HEALTH_CHECK_TOKEN` | No | — | Shared secret for `/api/health/detailed` |
| `ALLOWED_ORIGINS` | No | `localhost:5173,localhost:9090` | Comma-separated CORS origins |
| `ADMIN_SEED_EMAIL` | No | — | Email for initial admin user |
| `ADMIN_SEED_PASSWORD` | No | — | Password for initial admin user |

#### External Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HONEYCOMB_URL` | No | — | Honeycomb API base URL (FR-072) |
| `HONEYCOMB_API_KEY` | No | — | Honeycomb API key |
| `MEMORY_SERVICE_URL` | No | — | Memory Service base URL (FR-073) |
| `MEMORY_SERVICE_API_KEY` | No | — | Memory Service API key |

### 2. Four-Layer Deployment Model

Configuration flows through 4 layers, each serving a different deployment context:

```
Layer 1: .env.example / .env.local     → Local development (developer machine)
Layer 2: docker-compose.yml            → Local staging (Docker)
Layer 3: deploy.sh / Makefile          → Manual Cloud Run deploys (CI/CD)
Layer 4: Terraform                     → Infrastructure-as-code deploys
```

**Rule:** Every env var in the canonical registry must be present in all 4 layers. Optional vars use empty defaults (`default = ""`).

### 3. Startup Diagnostics

The backend logs a `=== Configuration Status ===` block at startup showing which services are configured (without exposing secrets). This makes it immediately visible which integrations are active on any given deployment.

### 4. Secrets Strategy

**Current state:**
- VertexAI service account key is stored in Secret Manager and mounted via `--set-secrets`
- All other secrets (GEMINI_API_KEY, HONEYCOMB_API_KEY, MEMORY_SERVICE_API_KEY, HEALTH_CHECK_TOKEN) are plaintext env vars

**Future (out of scope for this iteration):**
- Migrate API keys to Secret Manager using `--set-secrets` flag
- Create `terraform.tfvars.example` for each environment

## Consequences

**Positive:**
- Single source of truth for all env vars
- Terraform can deploy the full application without manual intervention
- Startup log makes misconfiguration immediately visible
- New integrations follow a documented checklist

**Negative:**
- More variables in Terraform means more `tfvars` values to manage per environment
- Sensitive variables with `default = ""` may silently deploy without required keys

## Checklist: Adding a New Integration

When adding a new external service:

1. Add env vars to `backend/internal/config/config.go` (struct + Load)
2. Add env vars to `.env.example` and `.env.local`
3. Add to `docker-compose.yml` environment block
4. Add to `scripts/deploy.sh` ENVFILE block
5. Add to `Makefile` DEPLOY_ENV_VARS block
6. Add to `terraform/environments/staging/variables.tf` + `main.tf`
7. Add to `terraform/environments/production/variables.tf` + `main.tf`
8. Add to `cfg.LogStatus()` output
9. Update this document's canonical registry

## Alternatives Considered

1. **Single .env file read by all layers** — Rejected because Terraform uses HCL variables, not dotenv files. Docker Compose and shell scripts already support dotenv.

2. **Secret Manager for everything** — Future phase. Currently only the VertexAI SA key warrants Secret Manager (it's a JSON file). API keys will migrate as the project matures.

3. **Runtime config service (Consul/etcd)** — Over-engineering for an MVP. Environment variables are the right abstraction at this scale.

## Related

- FR-072: Honeycomb Service Configuration
- FR-073: User Context Synchronization
- FR-069: GCP Credential Management
- TC-027: Infrastructure as Code
