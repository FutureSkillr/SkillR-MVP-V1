# FR-068: Health Check & Availability Monitoring

**Status:** done
**Priority:** should
**Created:** 2026-02-20
**Entity:** SkillR

## Problem

After deploying to Cloud Run there is no quick way to verify the live system is healthy. The existing `/api/health` endpoint returns only `{"status":"ok"}` with no uptime, component latencies, version info, or runtime metrics. Operators have no single-command health overview and no continuous availability tracking.

## Solution

### Enhanced health endpoint

- **`GET /api/health`** — unchanged minimal response (`{"status":"ok|degraded"}`, H14 compliant)
- **`GET /api/health/detailed?token=<HEALTH_CHECK_TOKEN>`** — returns rich operational data gated by a shared-secret query param:
  - Service status, git version (build-time SHA via ldflags), started-at timestamp, uptime
  - Per-component status + latency (PostgreSQL, Redis, AI)
  - Runtime metrics (goroutines, heap MB)

### `make health` — one-shot health check

Combines Cloud Run metadata (revision, deploy time, instances) with the detailed health endpoint and recent error log count into a color-coded terminal dashboard.

### `make monitor` — continuous availability tracker

Polls the health endpoint at a configurable interval (default 30s), tracks uptime percentage and response times. On Ctrl+C prints a summary and writes a JSON log to `logs/`.

### Build-time version injection

`-ldflags "-X main.version=$(GIT_SHA)"` injected in `go build`, `docker build`, and all deploy paths.

## Acceptance Criteria

- [x] `GET /api/health` still returns only `{"status":"ok|degraded"}` (no leak)
- [x] `GET /api/health/detailed` without token returns 401
- [x] `GET /api/health/detailed?token=<valid>` returns full JSON with version, uptime, components, runtime
- [x] `HEALTH_CHECK_TOKEN` read from env, documented in `.env.example`
- [x] `make health` shows formatted Cloud Run + health output
- [x] `make monitor` polls continuously, Ctrl+C shows summary + writes JSON log
- [x] Go binary includes git SHA via ldflags (`version` field in detailed health)
- [x] Docker image includes git SHA via build arg
- [x] Unit tests cover: public health, token validation, detailed health response structure
- [x] Integration test: deploy + `make health` against live service

## Dependencies

- TC-025: Security hardening — token-based access pattern
- FR-013: Web app deployment — Cloud Run infrastructure

## Notes

- The health token is a simple shared secret, not user authentication. It protects operational data from public access per H14.
- The monitor script writes logs to `logs/` (gitignored) for post-incident analysis.
- Version injection uses Go `ldflags` pattern — no runtime file reads needed.
