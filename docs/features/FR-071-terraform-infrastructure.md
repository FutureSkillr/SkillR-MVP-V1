# FR-071: GCP Terraform Infrastructure as Code

**Status:** in-progress
**Priority:** should
**Created:** 2026-02-20
**Entity:** SkillR

## Problem

The project currently provisions GCP resources using 4 bash scripts totaling ~1600 lines of imperative shell code. This approach has critical limitations:

- **No state tracking** — There is no record of what has been created, making it impossible to know the current infrastructure state without manual inspection.
- **No team collaboration** — Multiple developers cannot safely modify infrastructure in parallel without risking conflicts or duplicated resources.
- **No reproducibility** — Running scripts multiple times can produce errors or inconsistent results. There is no idempotent apply mechanism.
- **No environment parity** — Creating a staging environment that mirrors production requires duplicating and modifying scripts by hand.

## Solution

Adopt Terraform with a hybrid approach: Terraform manages base infrastructure declaratively, while bash/Makefile handles the deploy cycle (Docker build, push, and database migrations).

### Terraform Modules

Create composable Terraform modules for all 13 GCP resources:

| Module              | Resources                                      |
|---------------------|-------------------------------------------------|
| `cloud-run`         | Cloud Run service, revision, domain mapping     |
| `cloud-sql`         | Cloud SQL instance, database, users             |
| `artifact-registry` | Artifact Registry repository                    |
| `secret-manager`    | Secret Manager secrets and versions             |
| `firebase`          | Firebase project, Firestore database            |
| `apis`              | Enabled GCP APIs (Cloud Run, SQL, etc.)         |
| `iam`               | Service accounts, IAM bindings, roles           |
| `networking`        | VPC connector, serverless VPC access            |
| `storage`           | GCS buckets (Terraform state, backups)          |

### Hybrid Workflow

- **Terraform** — Provisions and manages base infrastructure (Cloud Run service definition, Cloud SQL, networking, IAM, secrets).
- **Bash / Makefile** — Handles the deploy cycle: Docker build, push to Artifact Registry, `gcloud run deploy` with the new image, and database migrations.

### State Management

- Terraform state stored in a GCS bucket with versioning enabled.
- State locking via GCS bucket lock to prevent concurrent modifications.
- Separate state files per environment (staging, production).

## Acceptance Criteria

- [ ] `terraform init` + `terraform plan` + `terraform apply` provisions a complete staging environment from scratch
- [ ] `terraform destroy` tears down all managed resources cleanly without orphaned resources
- [ ] Terraform state is stored in a GCS bucket with versioning and locking enabled
- [ ] Modules are composable per-environment (staging and production use the same modules with different variables)
- [ ] `deploy.sh` is updated to a Docker-only workflow (build, push, deploy) that does not duplicate Terraform-managed resources
- [ ] Sensitive values (database passwords, API keys) are managed via Secret Manager, not stored in Terraform state as plaintext

## Dependencies

- FR-013 (Web App Deployment) — Current deployment scripts will be refactored
- FR-069 (GCP Credential Management) — Terraform must use the same credential patterns

## Notes

The migration from bash scripts to Terraform should be incremental. Start by importing existing resources into Terraform state using `terraform import`, then gradually move resource definitions from bash scripts into Terraform modules. At no point should infrastructure be torn down and recreated — the transition must be non-destructive.
