# FR-041: Root-Level Project Makefile

**Status:** done
**Priority:** must
**Created:** 2026-02-18

## Problem
No unified command interface exists for building, testing, deploying, and managing the project. Developers must remember individual tool commands across frontend, backend, Docker, and GCP.

## Solution
A root-level `Makefile` providing standardized targets for all common project operations.

### Targets
| Target | Description |
|--------|-------------|
| `install` | Install frontend npm dependencies |
| `dev` | Start Vite dev server |
| `build` | Build frontend for production |
| `typecheck` | Run TypeScript type checking |
| `clean` | Remove build artifacts |
| `docker-build` | Build Docker image (requires GEMINI_API_KEY) |
| `docker-run` | Run Docker image locally on :8080 |
| `deploy` | Deploy to Cloud Run production |
| `deploy-staging` | Deploy to Cloud Run staging (max 1 instance) |
| `logs` | Tail Cloud Run logs |
| `api-gen` | Delegate to OpenAPI code generation |
| `help` | Show available targets |

## Acceptance Criteria
- [x] `make help` lists all available targets
- [x] `make install` installs frontend dependencies
- [x] `make dev` starts the development server
- [x] `make build` builds the frontend
- [x] Docker and deploy targets require GEMINI_API_KEY
- [x] `make api-gen` delegates to `integrations/api-spec/makefile`

## Dependencies
- FR-040-docker-cloud-run-deployment

## Notes
- Existing makefile at `integrations/api-spec/makefile` is preserved and delegated to via `$(MAKE) -C`.
