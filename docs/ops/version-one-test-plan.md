# SkillR V1.0 Test Plan

**Created:** 2026-02-24
**Supersedes:** `mvp3-test-plan.md`
**Scope:** All 55 `[CORE]` features (FR-001–FR-121), 35 architecture decisions (TC-001–TC-035)

---

## Overview

This is the consolidated test plan for the SkillR V1.0 release. It replaces the per-sprint test plans (MVP1–MVP4) with a single end-to-end verification covering unit tests, integration tests, build integrity, local staging, security, K6 scenario tests, and deployment readiness.

### Test Layers

| Layer | Tool | Runs where |
|-------|------|------------|
| Backend unit tests | `go test` | CI + local |
| Frontend unit tests | Vitest | CI + local |
| TypeScript compilation | `tsc --noEmit` | CI + local |
| Build verification | Vite + Go build | CI + local |
| Docker build | `make docker-build` | CI + local |
| Local stack smoke tests | curl / manual | Local |
| K6 scenario tests | K6 | CI + local |
| Security verification | grep + K6 security suite | CI + local |
| Deployment health | `make health` | Post-deploy |

---

## 1. Backend Unit Tests (Go)

```bash
make go-test
```

### Test files (25 suites)

| Package | File | What's tested |
|---------|------|---------------|
| `middleware` | `auth_test.go` | Firebase token validation, role extraction, anonymous access |
| `middleware` | `errorhandler_test.go` | Structured error responses, panic recovery |
| `middleware` | `ratelimit_test.go` | Per-endpoint rate limiting, sliding window, 429 responses |
| `server` | `health_test.go` | `/api/health`, `/api/health/detailed`, dependency status |
| `server` | `server_test.go` | Route registration, middleware ordering, graceful shutdown |
| `redis` | `client_test.go` | Connection, get/set, TTL, reconnect |
| `redis` | `ratelimiter_test.go` | Redis-backed rate limiter, distributed counters |
| `memory` | `client_test.go` | In-memory cache fallback, expiration |
| `postgres` | `connect_test.go` | DSN parsing, connection pool, health check |
| `honeycomb` | `client_test.go` | Telemetry client init, span export |
| `config` | `config_test.go` | Env parsing, defaults, validation, secret resolution |
| `solid` | `client_test.go` | Pod CRUD, auth token exchange |
| `solid` | `handler_test.go` | HTTP handler for `/api/v1/pod/*` routes |
| `solid` | `serializer_test.go` | RDF/Turtle serialization of profiles |
| `ai` | `handler_test.go` | Chat, extract, generate, TTS, STT handlers |
| `ai` | `vertexai_test.go` | Vertex AI client, Gemini prompt formatting |
| `domain/profile` | `service_test.go` | Profile computation, VUCA scoring, export |
| `domain/lernreise` | `handler_test.go` | Catalog list, instance CRUD, task submission |
| `domain/lernreise` | `service_test.go` | Progress tracking, completion rules |
| `domain/reflection` | `service_test.go` | Level-2 reflection triggers, coaching mode |
| `domain/session` | `service_test.go` | Session lifecycle, travel journal recording |

**Pass criteria:** All 25 suites pass. Zero test failures.

### Backend integration tests

```bash
# Solid Pod integration (requires local Solid server)
make local-up
go test ./backend/internal/solid/ -run Integration -tags=integration

# TTS via Vertex AI (requires ADC credentials)
make e2e-TTS-VertexAI
```

**Pass criteria:** Both integration suites pass when dependencies are available. Skipped gracefully otherwise.

---

## 2. Frontend Unit Tests (Vitest)

```bash
cd frontend && npm test
```

### Test files (16 suites)

| File | Count | What's tested |
|------|-------|---------------|
| `services/gemini.test.ts` | 7 | Proxy endpoints via mocked fetch, 429 handling, error paths |
| `services/firebase.test.ts` | 4 | `/api/config` fetch, init lifecycle, missing config, network error |
| `services/rateLimit.test.ts` | 5 | Sliding window algorithm, limits, reset, per-key isolation, retryAfter |
| `services/firestore.test.ts` | — | Firestore CRUD, offline persistence, collection queries |
| `services/firebaseErrors.test.ts` | — | Firebase error mapping to user-friendly messages |
| `services/engagement.test.ts` | — | Badge awarding, streak calculation, leaderboard |
| `services/interestProfile.test.ts` | — | VUCA dimension scoring, profile generation |
| `services/pod.test.ts` | — | Solid Pod connect/disconnect, sync status |
| `services/reflection.test.ts` | — | Reflection submission, capability mapping |
| `services/vuca.test.ts` | — | VUCA bingo matrix, dimension completion |
| `types/engagement.test.ts` | — | Engagement type guards, serialization |
| `types/user.test.ts` | — | User model validation, role checks |
| `types/vuca.test.ts` | — | VUCA type definitions, dimension enums |
| `constants/stationCoordinates.test.ts` | — | 3D globe station positions, coordinate bounds |
| `tests/mobile-responsive.test.ts` | — | Viewport breakpoints, touch targets, layout shifts |
| `tests/pod-integration.test.ts` | — | End-to-end Pod connection flow |

**Pass criteria:** All 16 suites pass. Zero test failures.

---

## 3. TypeScript Compilation

```bash
cd frontend && npx tsc --noEmit                 # Frontend types
cd frontend && npx tsc -p tsconfig.server.json   # Server types (if applicable)
```

**Pass criteria:** Zero errors from both commands.

---

## 4. Build Verification

```bash
make build-all
```

This runs both frontend and backend builds.

### Post-build checks

| Check | Command | Expected |
|-------|---------|----------|
| Frontend built | `ls frontend/dist/index.html` | File exists |
| Backend built | `ls backend/bin/server` or equivalent | Binary exists |
| No API key in frontend bundle | `grep -r "AIza" frontend/dist/` | No matches |
| No Firebase config in bundle | `grep -r "firebaseapp.com" frontend/dist/` | No matches |
| No hardcoded secrets | `grep -rE "(password|secret|token)\s*[:=]\s*[\"']" frontend/dist/` | No matches |

---

## 5. Docker Build

```bash
make docker-build
```

**Pass criteria:** Image builds successfully with no errors.

### Docker image checks

| Check | Method | Expected |
|-------|--------|----------|
| Image exists | `docker images future-skillr:latest` | Listed |
| No secrets in layers | `docker history $(docker images -q future-skillr:latest)` | No `--build-arg` with keys |
| Image size reasonable | `docker images --format '{{.Size}}' future-skillr:latest` | < 500MB |

---

## 6. Local Stack (docker-compose)

Start all four services:

```bash
make local-up
```

### Service health

| Service | Health check | Expected |
|---------|-------------|----------|
| App (Go) | `curl -s localhost:9090/api/health` | `{"status":"ok"}` |
| PostgreSQL | `docker exec <pg> pg_isready` | `accepting connections` |
| Redis | `docker exec <redis> redis-cli ping` | `PONG` |
| Solid Pod | `curl -s localhost:3003/.well-known/openid-configuration` | JSON response |

### API smoke tests against `http://localhost:9090`

| Test | Command | Expected |
|------|---------|----------|
| Health check | `curl -s localhost:9090/api/health` | `{"status":"ok"}` |
| Detailed health | `curl -s localhost:9090/api/health/detailed` | JSON with `postgres`, `redis`, `solid` keys |
| Config endpoint | `curl -s localhost:9090/api/config` | JSON with `firebase` key containing config fields |
| AI status | `curl -s localhost:9090/api/v1/ai/status` | JSON with AI availability status |
| SPA fallback | `curl -s localhost:9090/nonexistent \| head -1` | `<!DOCTYPE html>` |
| Static assets | `curl -s -o /dev/null -w '%{http_code}' localhost:9090/` | `200` |
| Gemini chat | `curl -s -X POST localhost:9090/api/v1/ai/chat -H 'Content-Type: application/json' -d '{"systemInstruction":"Test","history":[],"userMessage":"Hallo"}'` | JSON with `text` field |
| Legacy route alias | `curl -s -X POST localhost:9090/api/gemini/chat -H 'Content-Type: application/json' -d '{"systemInstruction":"Test","history":[],"userMessage":"Hallo"}'` | Same as above (compatibility) |
| Rate limit header | Send 31 rapid requests to `/api/v1/ai/chat` | `429` with `Retry-After` header |
| Auth required | `curl -s localhost:9090/api/v1/sessions` | `401 Unauthorized` |
| Admin required | `curl -s localhost:9090/api/v1/prompts` | `401` or `403` |

### Cleanup

```bash
make local-down
```

---

## 7. K6 Scenario Tests

K6 tests are organized by stakeholder group and can be run individually or as a full suite.

### Quick smoke

```bash
make k6-smoke
```

### Full suite

```bash
make k6-all
```

### Test suites

| Suite | Make target | Scenarios | FRs covered |
|-------|-------------|-----------|-------------|
| **Student** | `make k6-student` | TS-001–008 | FR-001, FR-003, FR-005, FR-008, FR-020, FR-039, FR-043–044, FR-046, FR-049–050, FR-054 |
| **Admin** | `make k6-admin` | TS-010–013 | FR-039, FR-043, FR-049 |
| **Operator** | `make k6-operator` | TS-020–022 | FR-056, FR-065, FR-068 |
| **Security** | `make k6-security` | TS-030–037 | FR-056–060, FR-062 |
| **Load** | `make k6-load` | TS-040–042 | FR-074–075 |

### Performance thresholds

| Endpoint tier | p95 | p99 | Error rate |
|---------------|-----|-----|------------|
| Health / Config | < 200ms | < 500ms | < 1% |
| Auth (register/login) | < 500ms | < 1s | < 2% |
| Portfolio CRUD | < 500ms | < 1.5s | < 5% |
| Admin CRUD | < 1s | < 2s | < 5% |
| AI chat (live Gemini) | < 8s | < 15s | < 10% |
| AI chat (mock) | < 200ms | < 500ms | < 1% |

**Pass criteria:** All scenarios pass within thresholds. Report generated via `make k6-report`.

---

## 8. Security Verification

### Static checks

| Check | Method | Expected |
|-------|--------|----------|
| No secrets in JS bundle | `grep -rE "AIza\|firebaseapp\.com" frontend/dist/` | No matches |
| No secrets in Docker layers | `docker history $(docker images -q future-skillr:latest)` | No secret args |
| `.env.local` gitignored | `git check-ignore .env.local` | Listed |
| No `.env` files tracked | `git ls-files '*.env*'` | Empty |
| Security headers present | `curl -sI localhost:9090/ \| grep -iE "x-frame-options\|x-content-type\|strict-transport"` | All three headers present |
| CORS configured | `curl -sI -H 'Origin: http://evil.com' localhost:9090/api/health` | No `Access-Control-Allow-Origin: *` |

### K6 security suite

```bash
make k6-security
```

| Scenario | What's tested |
|----------|---------------|
| TS-030 | Auth enforcement — protected routes reject anonymous requests |
| TS-031 | Anonymous rate limiting — unauthenticated endpoints throttled |
| TS-032 | Authenticated rate limiting — per-user limits enforced |
| TS-033 | Brute force login protection — repeated failures trigger lockout |
| TS-034 | Input validation — malformed payloads rejected with proper errors |
| TS-035 | Security headers — CSP, X-Frame-Options, HSTS on all responses |
| TS-036 | Auth boundary — local dev vs Firebase auth modes both secure |
| TS-037 | Admin escalation prevention — non-admin cannot reach admin routes |

**Pass criteria:** All 8 security scenarios pass.

---

## 9. DSGVO / Data Protection

| Check | Method | Expected |
|-------|--------|----------|
| Account deletion works | `DELETE /api/auth/account` with valid token | `200`, user data purged |
| Data export available | `GET /api/v1/portfolio/profile/export` | Full profile JSON |
| Cookie consent respected | Manual: load app with cookies declined | No tracking fires |
| Legal config endpoint | `GET /api/config/legal` | Returns privacy policy + terms URLs |

---

## 10. Deployment Readiness

### Pre-deploy checks

```bash
make test-all          # All unit tests (Go + frontend)
make build-all         # Full build
make docker-build      # Docker image
make k6-smoke          # Quick scenario smoke
```

### Deploy to staging

```bash
make ship-staging
```

### Post-deploy verification

```bash
make health            # Cloud Run health check
make monitor           # Continuous health polling
```

| Check | Command | Expected |
|-------|---------|----------|
| Cloud Run service running | `make cloudrun-list` | Service listed with `READY` |
| Health endpoint | `make health` | `{"status":"ok"}` |
| Firebase Auth working | Manual: complete Google OAuth login | Token issued, session created |
| AI chat working | Manual: send a message via UI | Response from Gemini |
| Pod sync available | Manual: connect Solid Pod | Status shows connected |

---

## 11. Dev Mode Regression

After all changes, local development mode must still work:

```bash
make dev-all
```

| Check | Expected |
|-------|----------|
| Frontend dev server | Running on port 3000 |
| Backend dev server | Running on port 9090 |
| API proxy working | `/api` calls reach backend |
| Hot reload (frontend) | Save a `.ts` file, browser refreshes |
| Hot reload (backend) | Save a `.go` file, server restarts |
| All API route groups reachable | `/api/health`, `/api/v1/ai/*`, `/api/v1/sessions`, `/api/v1/portfolio/*`, `/api/v1/pod/*` |

---

## Pass/Fail Summary

| # | Phase | Status |
|---|-------|--------|
| 1 | Backend unit tests (25 suites) | [ ] |
| 2 | Backend integration tests (2 suites) | [ ] |
| 3 | Frontend unit tests (16 suites) | [ ] |
| 4 | TypeScript compilation | [ ] |
| 5 | Build verification | [ ] |
| 6 | Docker build | [ ] |
| 7 | Local stack smoke tests | [ ] |
| 8 | K6 scenario tests — Student | [ ] |
| 9 | K6 scenario tests — Admin | [ ] |
| 10 | K6 scenario tests — Operator | [ ] |
| 11 | K6 scenario tests — Security | [ ] |
| 12 | K6 scenario tests — Load | [ ] |
| 13 | Security verification | [ ] |
| 14 | DSGVO / data protection | [ ] |
| 15 | Deployment to staging | [ ] |
| 16 | Post-deploy health | [ ] |
| 17 | Dev mode regression | [ ] |

---

## Feature Coverage Matrix

The following `[CORE]` feature groups are covered by this test plan:

| Sprint | Features | Tested by |
|--------|----------|-----------|
| MVP1 "Es funktioniert" | FR-001–014, FR-039–049 | Backend + frontend unit tests, K6 student + admin suites |
| MVP2 "Das bin ich" | FR-020, FR-026, FR-031–032, FR-038, FR-045, FR-054–055 | Frontend unit tests (engagement, vuca, reflection, profile), K6 student suite |
| MVP3 "Sicher unterwegs" | FR-051–069 | Security verification, K6 security + operator suites |
| MVP4 "Meine Daten, Mein Pod" | FR-070–077, FR-086 | Backend integration tests (Solid), K6 operator suite, deployment checks |
| V1.0 Launch | FR-033, FR-027, FR-025, FR-111–113, FR-119–121 | DSGVO checks, deployment readiness, manual verification |
