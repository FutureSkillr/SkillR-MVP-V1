# FR-042: GitHub Actions CI/CD Pipeline

**Status:** done
**Priority:** must
**Created:** 2026-02-18

## Problem
No automated deployment pipeline exists. Deployments are manual via `make deploy`, which is error-prone and not reproducible.

## Solution
GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to Cloud Run when a release tag (`v*`) is pushed.

### Workflow Details
- **Trigger:** `push.tags: ['v*']`
- **Authentication:** Google Workload Identity Federation (with commented SA key fallback)
- **Deploy command:** `gcloud run deploy --source . --build-arg GEMINI_API_KEY=... --quiet`
- **Output:** Prints the deployment URL after successful deploy

### Required GitHub Secrets
| Secret | Purpose |
|--------|---------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Federation provider |
| `GCP_SERVICE_ACCOUNT` | GCP service account email |
| `GEMINI_API_KEY` | Gemini API key for build-time injection |

### Required IAM Roles (on service account)
- `roles/run.admin`
- `roles/cloudbuild.builds.editor`
- `roles/iam.serviceAccountUser`
- `roles/storage.admin`

## Acceptance Criteria
- [x] Workflow triggers only on `v*` tag pushes
- [x] Uses Workload Identity Federation for keyless auth
- [x] Deploys to Cloud Run with correct project/region/service
- [x] GEMINI_API_KEY injected from GitHub secrets
- [x] Deployment URL printed as final step

## Dependencies
- FR-040-docker-cloud-run-deployment

## Notes
- To deploy: `git tag v0.1.0 && git push origin v0.1.0`
- SA key auth is commented out as a fallback option in the workflow file.
