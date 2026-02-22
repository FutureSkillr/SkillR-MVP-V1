# TC-027: Infrastructure as Code with Terraform

**Status:** accepted
**Created:** 2026-02-20
**Entity:** SkillR

## Context

The project provisions GCP resources using 4 bash scripts (~1600 lines total). These scripts run imperatively — they execute `gcloud` commands sequentially and rely on exit codes and manual verification to confirm success. This approach has become a maintenance burden:

- Scripts have no state tracking, so there is no way to know what infrastructure currently exists without inspecting GCP console or running discovery commands.
- Scripts require manual intervention when a step fails mid-execution, as there is no rollback or partial-apply mechanism.
- Creating a second environment (staging) requires duplicating scripts and changing hardcoded values.
- Team members cannot collaborate on infrastructure changes safely, as there is no locking or conflict detection.

A declarative infrastructure-as-code tool is needed to manage the 13 GCP resources the project depends on.

## Decision

Adopt **Terraform** with the `google` and `google-beta` providers for base infrastructure management. Maintain bash scripts for the Docker build/push/deploy cycle and database migrations.

### What Terraform Manages

- Cloud Run service definition and configuration
- Cloud SQL instance, database, and users
- Artifact Registry repository
- Secret Manager secrets
- Firebase project configuration and Firestore
- Enabled GCP APIs
- IAM service accounts and role bindings
- VPC networking and serverless connectors
- GCS buckets (including Terraform state bucket)

### What Bash/Makefile Continues to Manage

- Docker image build and push to Artifact Registry
- `gcloud run deploy` with specific image tags (the deploy cycle)
- Database schema migrations
- Local development environment setup

### State Management

- Terraform state stored in a GCS bucket with object versioning enabled.
- State locking provided by GCS to prevent concurrent `terraform apply` operations.
- Separate state files for staging and production environments.

## Consequences

- **Team members need Terraform knowledge** — At least basic understanding of HCL syntax, `plan`/`apply` workflow, and state concepts is required.
- **State file must be protected** — The Terraform state file contains sensitive information (resource IDs, some configuration values). The GCS bucket must have restricted access and versioning for recovery.
- **CI/CD pipeline needs the Terraform binary** — Any automated infrastructure pipeline must install and configure Terraform. This adds a dependency to the build environment.
- **Import phase required** — Existing GCP resources must be imported into Terraform state before Terraform can manage them. This is a one-time migration step per resource.
- **Declarative drift detection** — `terraform plan` will detect any manual changes made outside of Terraform, enabling the team to identify and correct configuration drift.

## Alternatives Considered

### Pulumi

Pulumi allows writing infrastructure code in general-purpose languages (TypeScript, Go, Python). While this avoids learning HCL, it introduces SDK complexity and a larger dependency surface. The team assessed Pulumi as too complex for the current team size and skill set. Terraform's declarative model is simpler to reason about for infrastructure that changes infrequently.

### Google Cloud Deployment Manager

Cloud Deployment Manager is GCP's native IaC tool using YAML/Jinja2 templates. It was rejected because it is GCP-only (no multi-cloud option if needed later), has a limited resource type catalog compared to Terraform, has slower feature adoption for new GCP services, and has a smaller community and ecosystem.

### CDK for Terraform (CDKTF)

CDKTF allows writing Terraform configurations in TypeScript or Python, compiling down to HCL. While appealing for the TypeScript-familiar frontend team, it adds an extra abstraction layer, increases build complexity, and the generated HCL is harder to debug. The indirection was judged unnecessary for the project's infrastructure complexity.

---

## Infrastructure Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                       │
│                                                                             │
│   ┌──────────┐    HTTPS     ┌──────────────────────────────────────────┐    │
│   │  Browser  │────────────▶│           Google Cloud Run               │    │
│   │  (User)   │◀────────────│         future-skillr :8080              │    │
│   └──────────┘              │                                          │    │
│                             │  ┌─────────────────────────────────────┐ │    │
│                             │  │  Go Binary (single process)         │ │    │
│                             │  │                                     │ │    │
│                             │  │  ┌───────────┐  ┌────────────────┐  │ │    │
│                             │  │  │ Static    │  │ API Gateway    │  │ │    │
│                             │  │  │ File      │  │ /api/*         │  │ │    │
│                             │  │  │ Server    │  │                │  │ │    │
│                             │  │  │ (frontend │  │ • /health      │  │ │    │
│                             │  │  │  dist/)   │  │ • /auth        │  │ │    │
│                             │  │  └───────────┘  │ • /ai          │  │ │    │
│                             │  │                  │ • /evidence    │  │ │    │
│                             │  │                  │ • /admin       │  │ │    │
│                             │  │                  │ • /config      │  │ │    │
│                             │  │                  │ • /gemini      │  │ │    │
│                             │  │                  └───────┬────────┘  │ │    │
│                             │  └──────────────────────────┼──────────┘ │    │
│                             └──────────────────────────────┼──────────┘     │
│                                                            │                │
│                     ┌──────────────────┬───────────────────┼────────┐       │
│                     │                  │                   │        │       │
│                     ▼                  ▼                   ▼        ▼       │
│  ┌──────────────────────┐ ┌───────────────────┐ ┌──────────┐ ┌─────────┐  │
│  │   Cloud SQL          │ │   Firebase        │ │ Vertex   │ │  Redis  │  │
│  │   PostgreSQL 16      │ │                   │ │ AI /     │ │  (opt.) │  │
│  │                      │ │ ┌───────────────┐ │ │ Gemini   │ │         │  │
│  │ • futureskiller DB   │ │ │ Auth          │ │ │          │ │ • Rate  │  │
│  │ • sessions           │ │ │ (Identity     │ │ │ • Chat   │ │   limit │  │
│  │ • reflections        │ │ │  Platform)    │ │ │ • TTS    │ │ • Cache │  │
│  │ • profiles           │ │ │               │ │ │ • STT    │ │         │  │
│  │ • evidence           │ │ │ • Google OAuth│ │ │          │ │         │  │
│  │ • journals           │ │ │ • Email/Pass  │ │ │ Models:  │ │         │  │
│  │ • analytics          │ │ └───────────────┘ │ │ gemini-  │ │         │  │
│  │                      │ │ ┌───────────────┐ │ │ 2.0-     │ │         │  │
│  │ Unix socket via      │ │ │ Firestore     │ │ │ flash-   │ │         │  │
│  │ Cloud SQL Auth Proxy │ │ │ (user data)   │ │ │ lite     │ │         │  │
│  └──────────┬───────────┘ │ └───────────────┘ │ └────┬─────┘ └────┬────┘  │
│             │             └───────────────────┘      │             │       │
│             │                                        │             │       │
│     /cloudsql/ mount                    /app/credentials/     REDIS_URL    │
│                                         vertexai-sa.json      (env var)   │
│                                               │                            │
│                                               │                            │
│  ┌────────────────────┐   ┌──────────────────────────┐                     │
│  │  Artifact Registry │   │    Secret Manager        │                     │
│  │                    │   │                          │                     │
│  │  cloud-run-source- │   │  vertexai-sa-key         │                     │
│  │  deploy/           │   │  (SA JSON mounted        │                     │
│  │  future-skillr:    │   │   as volume in           │                     │
│  │    <git-sha>       │   │   Cloud Run)             │                     │
│  └────────────────────┘   └──────────────────────────┘                     │
│                                                                             │
│  ┌────────────────────┐                                                     │
│  │  GCS Bucket        │                                                     │
│  │  <project>-tfstate │                                                     │
│  │                    │                                                     │
│  │  terraform/prod    │                                                     │
│  │  terraform/staging │                                                     │
│  └────────────────────┘                                                     │
│                                                                             │
│                          Google Cloud Platform                              │
└─────────────────────────────────────────────────────────────────────────────┘

Connection Types:
  ────▶  HTTPS / API call
  ─ ─ ▶  Volume mount / file path
  ──────  Unix socket (Cloud SQL Auth Proxy)
```

### Component Inventory

| # | Component | GCP Service | Terraform Module | Status |
|---|-----------|-------------|------------------|--------|
| 1 | Web Server | Cloud Run | `modules/cloud-run` | Defined |
| 2 | Database | Cloud SQL PostgreSQL 16 | `modules/cloud-sql` | Defined |
| 3 | User Auth | Firebase Auth (Identity Platform) | `modules/firebase` | Defined |
| 4 | User Data Store | Firestore | `modules/firebase` | Defined |
| 5 | AI Engine | Vertex AI / Gemini | — | Not managed (SaaS) |
| 6 | Container Registry | Artifact Registry | `modules/artifact-registry` | Defined |
| 7 | Credential Store | Secret Manager | `modules/secret-manager` | Defined |
| 8 | IaC State | GCS Bucket | `bootstrap/` | Defined |
| 9 | API Enablement | GCP Service APIs (10) | `modules/apis` | Defined |
| 10 | Cache / Rate Limit | Redis (MemoryStore) | — | **Not defined** |
| 11 | Service Identity | IAM Service Accounts | — | **Not defined** |
| 12 | Network Path | VPC Connector | — | **Not defined** |
| 13 | Security Rules | Firestore Rules | — | **Not defined** |

---

## Terraform Coverage Gap Analysis

### Defined and complete

| Resource | Module | Notes |
|----------|--------|-------|
| 10 GCP APIs | `modules/apis` | All required services enabled |
| Cloud Run service | `modules/cloud-run` | Service + IAM public access, `ignore_changes` on image tag |
| Cloud SQL instance + DB + user | `modules/cloud-sql` | PostgreSQL 16, random password, daily backups, deletion protection |
| Artifact Registry | `modules/artifact-registry` | Docker format, `cloud-run-source-deploy` |
| Firebase project + web app | `modules/firebase` | Firebase init + Identity Platform + Firestore |
| Secret Manager | `modules/secret-manager` | `vertexai-sa-key` with Cloud Run SA accessor binding |
| Terraform state bucket | `bootstrap/` | GCS with versioning + `prevent_destroy` |

### Defined but incomplete

| Resource | Issue | Action Needed |
|----------|-------|---------------|
| Google OAuth provider | Placeholder `client_id` / `client_secret` in `modules/firebase` | Must be set after manual OAuth consent screen setup in GCP Console. Terraform cannot create OAuth clients — this is a manual prerequisite. |
| Secret Manager | Only `vertexai-sa-key` defined | Additional secrets needed: `GEMINI_API_KEY`, `JWT_SECRET`. Currently passed as plain env vars to Cloud Run (visible in revision config). |
| Cloud Run env vars | `GEMINI_API_KEY` passed as plaintext env var | Should reference Secret Manager instead of `var.gemini_api_key` directly. |

### Missing — required for production

| Resource | Why Needed | Recommended Module |
|----------|------------|--------------------|
| IAM service account | Cloud Run uses default compute SA. Needs explicit SA with least-privilege roles for Cloud SQL, Firestore, Secret Manager, Vertex AI. | `modules/iam` |
| IAM role bindings | Cloud Run → `roles/cloudsql.client`, `roles/datastore.user`, `roles/aiplatform.user` | `modules/iam` |
| Firestore security rules | `firestore.rules` exists in repo but is not deployed via Terraform. Production Firestore is unprotected without rules. | `modules/firebase` (add `google_firebaserules_ruleset` + `google_firebaserules_release`) |
| Additional secrets | `GEMINI_API_KEY` and `JWT_SECRET` should be in Secret Manager, not plaintext env vars | `modules/secret-manager` (extend) |

### Missing — recommended for production readiness

| Resource | Why Needed | Recommended Module |
|----------|------------|--------------------|
| MemoryStore Redis | Rate limiting and caching. Code supports it (`REDIS_URL`), docker-compose includes it, but no cloud instance provisioned. | `modules/redis` (new) |
| VPC Connector | Serverless VPC access for Cloud Run → private Cloud SQL / Redis. API is enabled but connector not created. | `modules/networking` (new) |
| Cloud SQL private IP | Currently public-IP only. VPC connector would allow private connectivity. | `modules/cloud-sql` (extend) |
| Monitoring alerts | No alerting on error rate, latency, or instance count. | `modules/monitoring` (new) |
| GCS backup bucket | Database export destination, deployment artifacts. | `modules/storage` (new) |
| Artifact Registry cleanup | No image retention policy. Old images accumulate. | `modules/artifact-registry` (extend) |

### Cannot be managed by Terraform (manual steps)

| Resource | Reason | Documented Procedure |
|----------|--------|----------------------|
| OAuth consent screen | No Terraform resource for `google_oauth2_consent_screen`. Must be configured in GCP Console before Firebase Google sign-in works. | `scripts/setup-firebase.sh` step 5 |
| Vertex AI service account key | Key must be created in GCP Console or via `gcloud iam service-accounts keys create`. Terraform can create the SA but generating and downloading the key JSON is a manual step. | `scripts/setup-secrets.sh` |
| Billing account linkage | Terraform requires an existing project with billing. Linking billing is a manual/org-policy step. | `make onboard` step 2 |
| Domain verification | Custom domain mapping requires DNS ownership verification. | Not yet needed (using `*.run.app` URL) |

---

## Setup Procedure Flowchart

```
 ┌─────────────────────────────────────────────┐
 │          PREREQUISITES                       │
 │                                              │
 │  Install:  gcloud, docker, terraform, git    │
 │  Have:     GCP account with billing          │
 │            Gemini API key (AI Studio)        │
 │            Vertex AI SA key JSON (optional)  │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 1: Bootstrap Terraform State          │
 │                                              │
 │  cd terraform/bootstrap                      │
 │  export TF_VAR_project_id="<PROJECT_ID>"     │
 │  terraform init                              │
 │  terraform apply                             │
 │                                              │
 │  Creates: GCS bucket <PROJECT_ID>-tfstate    │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 2: Provision Infrastructure           │
 │                                              │
 │  cd terraform/environments/production        │
 │  (or staging)                                │
 │                                              │
 │  export TF_VAR_project_id="<PROJECT_ID>"     │
 │  export TF_VAR_gemini_api_key="<KEY>"        │
 │                                              │
 │  terraform init \                            │
 │    -backend-config="bucket=<PID>-tfstate"    │
 │  terraform plan                              │
 │  terraform apply                             │
 │                                              │
 │  Creates: APIs, Cloud SQL, Artifact          │
 │           Registry, Firebase, Firestore,     │
 │           Secret Manager, Cloud Run          │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 3: Manual Console Steps               │
 │  (cannot be automated by Terraform)          │
 │                                              │
 │  3a. GCP Console → APIs & Services →         │
 │      OAuth consent screen → Configure        │
 │      (app name, support email, scopes)       │
 │                                              │
 │  3b. GCP Console → APIs & Services →         │
 │      Credentials → Create OAuth 2.0          │
 │      Client ID → Copy client_id + secret     │
 │                                              │
 │  3c. Update Terraform firebase module        │
 │      variables with real OAuth client_id     │
 │      and client_secret, then re-apply:       │
 │      terraform apply                         │
 │                                              │
 │  3d. GCP Console → IAM → Service Accounts    │
 │      → Create Vertex AI SA → Download        │
 │      JSON key → Save as                      │
 │      credentials/vertexai-sa.json            │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 4: Upload Secrets                     │
 │                                              │
 │  make setup-secrets                          │
 │  (uploads credentials/vertexai-sa.json       │
 │   to Secret Manager, grants Cloud Run        │
 │   service account access)                    │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 5: Write Deployment Config            │
 │                                              │
 │  Create .env.deploy with:                    │
 │    GCP_PROJECT_ID=<project>                  │
 │    GCP_REGION=europe-west3                   │
 │    CLOUD_RUN_SERVICE=future-skillr           │
 │    GEMINI_API_KEY=<key>                      │
 │    DATABASE_URL=<from terraform output>      │
 │    FIREBASE_API_KEY=<from terraform output>  │
 │    FIREBASE_AUTH_DOMAIN=<project>.fb.com     │
 │    FIREBASE_PROJECT_ID=<project>             │
 │    FIREBASE_STORAGE_BUCKET=<from output>     │
 │    FIREBASE_MESSAGING_SENDER_ID=<from out>   │
 │    FIREBASE_APP_ID=<from output>             │
 │    JWT_SECRET=<generated>                    │
 │    ALLOWED_ORIGINS=https://<run-url>         │
 │                                              │
 │  Alternatively: make onboard (interactive)   │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 6: First Deploy                       │
 │                                              │
 │  make ship                                   │
 │  (builds Docker image, pushes to Artifact    │
 │   Registry, deploys to Cloud Run, runs       │
 │   migrations on first start)                 │
 └──────────────────┬──────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │  PHASE 7: Verify                             │
 │                                              │
 │  make health         → HTTP 200 /api/health  │
 │  make logs           → No startup errors     │
 │  Open browser        → App loads, login works│
 └──────────────────────────────────────────────┘

 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

 SUBSEQUENT DEPLOYS (daily workflow):

 ┌──────────┐     ┌──────────┐     ┌──────────┐
 │ git push │────▶│make ship │────▶│make      │
 │          │     │          │     │health    │
 └──────────┘     └──────────┘     └──────────┘
```

### Phase Timing Estimate

| Phase | Duration | Blocking? |
|-------|----------|-----------|
| Prerequisites | 15 min (tool installs) | Yes |
| Bootstrap | 2 min | Yes |
| Provision | 10-15 min (Cloud SQL is slow) | Yes |
| Manual console | 10 min | Yes (OAuth required for Google sign-in) |
| Upload secrets | 2 min | Yes |
| Write config | 5 min (or `make onboard`) | Yes |
| First deploy | 5-8 min | Yes |
| Verify | 2 min | — |
| **Total** | **~50 min** | |
