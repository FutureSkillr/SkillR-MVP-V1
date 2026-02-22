# FR-061: Infrastructure & Supply Chain Hardening

**Status:** done
**Priority:** should
**Created:** 2026-02-20
**Entity:** SkillR
**Phase:** MVP3+

## Problem

The `credentials/` directory is not in `.gitignore` — service account keys placed there for local Docker development could be accidentally committed. The CI/CD pipeline passes an unused `_GEMINI_API_KEY` to Cloud Build, exposing the secret for no purpose. Deployment scripts pass secrets inline via `--set-env-vars`, visible in process listings and shell history. Docker Compose exposes Postgres and Redis ports to all network interfaces. Base images and GitHub Actions are pinned to version tags, not SHA digests.

**Sec-report findings:** H13, M10, M18, M19, L1, L2, L10

## Solution

### .gitignore
1. Add `credentials/` to `.gitignore`
2. Add `*.pem` and `*.key` as safety-net patterns

### CI/CD
3. **Remove dead `_GEMINI_API_KEY` substitution** from `.github/workflows/deploy.yml`
4. **Pin GitHub Actions to commit SHAs** — Replace `@v4` / `@v2` with full SHA digests
5. **Pin Docker base images to SHA digests** — `node:20-alpine@sha256:...`, `golang:1.24-alpine@sha256:...`

### Deployment scripts
6. **Use `--env-vars-file`** instead of inline `--set-env-vars` in `Makefile` and `scripts/deploy.sh`. Generate a temp file, use it for deployment, then delete it.

### Docker Compose (local dev)
7. **Bind ports to 127.0.0.1** — `127.0.0.1:5432:5432` for Postgres, `127.0.0.1:6379:6379` for Redis

## Acceptance Criteria

- [x] `git add credentials/test-key.json` is rejected by `.gitignore`
- [x] `git add stray.pem` is rejected by `.gitignore`
- [x] `grep _GEMINI_API_KEY .github/workflows/deploy.yml` returns 0 results
- [x] GitHub Actions in `deploy.yml` use full commit SHA pins
- [x] Docker base images in `Dockerfile` use `@sha256:` digests
- [x] `make deploy` does not show secrets in `ps aux` output
- [x] `docker-compose up` binds Postgres to 127.0.0.1 only
- [x] `docker-compose up` binds Redis to 127.0.0.1 only

## Dependencies

- TC-025 (Security Hardening Phase)

## Notes

- SHA pinning requires periodic updates when base images release security patches. Consider Dependabot or Renovate for automated PR creation.
- The `--env-vars-file` approach requires the temp file to be created securely (mode 0600) and deleted in a trap handler.
