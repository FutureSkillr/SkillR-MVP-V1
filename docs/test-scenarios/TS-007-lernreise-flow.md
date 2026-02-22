# TS-007: Lernreise Catalog and Progress

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates Lernreise selection, task submission, and progress tracking. Lernreise routes (`/api/v1/lernreise/*`) are only available when `HONEYCOMB_URL` and `MEMORY_SERVICE_URL` are configured. The scenario probes with `routeExists()` and skips gracefully if not available.

## FR Coverage
- FR-074: Lernreise Catalog — catalog listing and selection
- FR-075: Lernprogress Tracking — task submission and progress

## Scenario Steps
1. Register + login via `registerAndLogin(email, displayName, password)` → obtain auth token
2. Probe `/api/v1/lernreise/catalog` via `routeExists()` to check availability
3. **If lernreise routes NOT available** (Honeycomb/Memory not configured):
   a. Log warning and fall back to health check as sanity test
   b. GET `/api/health` → 200 with `status` field
4. **If lernreise routes ARE available:**
   a. GET `/api/v1/lernreise/catalog` with auth → 200 with catalog array
   b. POST `/api/v1/lernreise/select` with `{catalogId}` + auth → 200/201 with selection confirmation
   c. GET `/api/v1/lernreise/active` with auth → 200 with active Lernreise (extract `instanceId`)
   d. POST `/api/v1/lernreise/instances/{instanceId}/submit` with `{taskId, answer}` + auth → 200
   e. GET `/api/v1/lernreise/instances/{instanceId}/progress` with auth → 200 with progress data

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 2 |
| Duration | 2m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 500ms |
| Error rate | < 5% |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-007-lernreise-flow.js
```

## Dependencies
- Requires: `make local-up` running
- Requires: `HONEYCOMB_URL` and `MEMORY_SERVICE_URL` configured for lernreise routes to be available
