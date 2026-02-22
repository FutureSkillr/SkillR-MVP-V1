# TC-016: API Gateway Architecture

**Status:** accepted
**Created:** 2026-02-19
**Entity:** SkillR

## Context

The Future SkillR platform needs a centralized API gateway that:

1. **Protects secrets** — The Gemini API key is currently baked into the Vite JS bundle (`vite.config.ts` `define` block). Firebase config is hardcoded in frontend source. Future agent and external service keys must never reach the browser.
2. **Routes requests** — As the backend evolves from a single Express server (MVP3) to a Go service with VertexAI (V1.0), the gateway must route requests to the right backend while maintaining a stable client-side API surface.
3. **Enforces policy** — Authentication verification, rate limiting, DSGVO audit logging, and error handling must be applied consistently across all API endpoints.
4. **Enables evolution** — The gateway architecture must support a phased migration from Express+API key to Go+VertexAI+service account without breaking clients.

We need to decide:
1. Gateway structure and routing layers
2. Authentication and authorization model
3. Rate limiting strategy
4. How the gateway evolves across MVP3 → V1.0 → V2.0
5. Deployment model (single container vs. multi-service)

## Decision

**Build a layered API gateway that starts as Express routes in MVP3 and migrates to a Go (Echo) gateway in V1.0. The gateway handles all secret-key-protected operations, routes to the appropriate backend service, verifies Firebase JWTs, and enforces rate limits. The client-side API surface remains stable across migrations.**

---

## Gateway Architecture

### Routing Overview

```
Browser ──→ API Gateway
              │
              ├─ /api/config         → Runtime config (Firebase, feature flags)
              ├─ /api/health         → Health check
              │
              ├─ /api/v1/ai/*        → VertexAI execution (Go, service account)
              ├─ /api/v1/portfolio/* → Profile, evidence, endorsements (Go, PostgreSQL)
              ├─ /api/v1/sessions/*  → Session management (Go, PostgreSQL)
              ├─ /api/v1/prompts/*   → Prompt management (Go, Firebase, admin-only)
              ├─ /api/v1/agents/*    → Agent config & orchestration (Go, Firebase, admin-only)
              │
              ├─ /api/auth/*         → Authentication (Express→Go migration)
              ├─ /api/analytics/*    → Clickstream events (Express→Go migration)
              ├─ /api/prompt-logs/*  → Prompt audit logs (Express→Go migration)
              │
              └─ /*                  → Static files (SPA)
```

### Before and After

```
BEFORE (MVP2):
  Browser (API key in JS bundle)        ──→ Google AI Studio
  Browser (Firebase config hardcoded)   ──→ Firebase
  Browser                               ──→ Express dev server (SQLite)
                                              ↑ key exposed, no auth on API

AFTER (V1.0):
  Browser ──→ API Gateway (Go/Echo on Cloud Run)
               ├─ Firebase JWT verification on all /api/v1/* routes
               ├─ VertexAI via service account (no API key)
               ├─ PostgreSQL via Cloud SQL Proxy
               ├─ Firebase Firestore for prompts + app state
               ├─ Rate limiting per user + per IP
               └─ Full audit logging (TC-008)
```

---

## Gateway Layers

### Layer 1: Static Assets & SPA Fallback

The gateway serves the frontend SPA as static files. Any path not matching `/api/*` returns `index.html` for client-side routing.

- MVP3: `express.static('dist')` + SPA fallback
- V1.0: Go `echo.Static()` or reverse proxy to Cloud Storage

### Layer 2: Runtime Configuration (`/api/config`)

```
GET /api/config → 200 OK
{
  "firebase": { "apiKey": "...", "authDomain": "...", "projectId": "...", ... },
  "features": { "voiceEnabled": true, "reflectionEnabled": true, ... },
  "version": "1.0.0"
}
```

**No authentication required** — the config is needed before the user can log in.

**Why runtime injection:**
- One Docker image works for all environments (dev, staging, production)
- Config can be rotated without rebuilding
- Feature flags can be toggled without redeployment
- Firebase SDK still runs client-side — only the config delivery changes

### Layer 3: Authentication Middleware

All `/api/v1/*` routes pass through Firebase JWT verification middleware.

```
Request                          Middleware                     Handler
  │                                 │                             │
  ├─ Authorization: Bearer <jwt> ──→│                             │
  │                                 ├─ Verify JWT (Firebase Admin SDK)
  │                                 ├─ Extract uid, email, role   │
  │                                 ├─ Set user context           │
  │                                 └────────────────────────────→│
```

**Authorization levels:**

| Level | Routes | Check |
|-------|--------|-------|
| **Public** | `/api/config`, `/api/health`, `/api/v1/portfolio/evidence/verify/*`, `/api/v1/portfolio/endorsements` (POST, with invite token), `/api/v1/portfolio/profile/public/*` | No JWT required |
| **Authenticated** | All other `/api/v1/*` routes | Valid Firebase JWT |
| **Admin** | `/api/v1/prompts/*`, `/api/v1/agents/*` | JWT with `role=admin` custom claim |

**MVP3 (Express):** Use `firebase-admin` SDK's `verifyIdToken()`.
**V1.0 (Go):** Use Firebase Admin Go SDK's `VerifyIDToken()`.

### Layer 4: Rate Limiting

Per-user (authenticated) and per-IP (unauthenticated) rate limiting with tiered limits.

| Tier | Routes | Limit | Window | Key |
|------|--------|-------|--------|-----|
| **AI Standard** | `/api/v1/ai/chat`, `/api/v1/ai/extract`, `/api/v1/ai/generate` | 30 req | 1 minute | user_id |
| **AI Media** | `/api/v1/ai/tts`, `/api/v1/ai/stt` | 10 req | 1 minute | user_id |
| **Data** | `/api/v1/portfolio/*`, `/api/v1/sessions/*` | 120 req | 1 minute | user_id |
| **Admin** | `/api/v1/prompts/*`, `/api/v1/agents/*` | 60 req | 1 minute | user_id |
| **Config** | `/api/config` | 60 req | 1 minute | IP |
| **Public** | `/api/v1/*/verify/*`, public profile | 30 req | 1 minute | IP |

Returns `429 Too Many Requests` with `Retry-After` header.

**MVP3:** In-memory sliding window (sufficient for single Cloud Run instance).
**V1.0:** Redis-based rate limiter (supports Cloud Run auto-scaling with multiple instances).

### Layer 5: AI Execution Router

Routes AI requests to the appropriate backend depending on the deployment phase.

```
MVP3:   /api/gemini/*    → Express → @google/genai SDK → Google AI Studio
                           (GEMINI_API_KEY in env var)

V1.0:   /api/v1/ai/*     → Go/Echo → VertexAI Go SDK → Vertex AI
                           (service account via ADC, no API key)
                           (prompts loaded from Firebase)
```

**MVP3 proxy routes** (7 endpoints mirroring `geminiService` methods):

| Route | Maps To | Payload |
|-------|---------|---------|
| `POST /api/gemini/chat` | `sendMessage()` | `{ history, message, systemInstruction }` |
| `POST /api/gemini/extract-insights` | `extractInsights()` | `{ messages }` |
| `POST /api/gemini/extract-station-result` | `extractStationResult()` | `{ messages, stationContext }` |
| `POST /api/gemini/generate-curriculum` | `generateCurriculum()` | `{ topic, dimension }` |
| `POST /api/gemini/generate-course` | `generateCourse()` | `{ curriculum }` |
| `POST /api/gemini/tts` | `textToSpeech()` | `{ text, voice }` → `{ audio: base64 }` |
| `POST /api/gemini/stt` | `speechToText()` | `{ audio: base64 }` → `{ text }` |

**V1.0 AI routes** (5 endpoints, prompt-driven):

| Route | Description |
|-------|-------------|
| `POST /api/v1/ai/chat` | Agent-orchestrated chat via VertexAI |
| `POST /api/v1/ai/extract` | Structured extraction (prompt from Firebase) |
| `POST /api/v1/ai/generate` | Content generation (prompt from Firebase) |
| `POST /api/v1/ai/tts` | Text-to-speech via VertexAI |
| `POST /api/v1/ai/stt` | Speech-to-text via VertexAI |

See [TC-018](TC-018-agentic-backend-vertexai.md) for the full VertexAI execution architecture.

### Layer 6: Error Handling

All `/api/*` routes use centralized error handling:

```json
{
  "error": "Human-readable message",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": "Optional additional context"
}
```

Rules:
- Never leak stack traces or internal details to the client
- Log errors server-side with request context (method, path, user_id, latency)
- Standard HTTP status codes: 400, 401, 403, 404, 429, 500
- Error codes are stable strings for client-side error handling

### Layer 7: Observability

| Signal | MVP3 (Express) | V1.0 (Go) |
|--------|---------------|------------|
| **Request logging** | Console + SQLite `prompt_logs` | Cloud Logging (structured JSON) |
| **AI audit trail** | `prompt_logs` table (TC-008) | PostgreSQL `prompt_logs` + `agent_executions` |
| **Metrics** | Response time logged per request | Cloud Monitoring (latency, error rate, throughput) |
| **Tracing** | Request IDs in logs | Cloud Trace (distributed tracing) |
| **Health** | `GET /api/health` → `{ status: ok }` | `GET /api/health` → `{ status: ok, version, uptime }` |

---

## Phased Evolution

### Phase 1: MVP3 — Express Gateway

The existing Express server (`frontend/server/index.ts`) becomes the gateway. This is the minimum viable gateway that unblocks public deployment.

```
Browser ──→ Express Gateway (Node.js on Cloud Run)
              ├─ /api/gemini/*      → Gemini SDK (API key in env)
              ├─ /api/config        → Firebase config from env
              ├─ /api/auth/*        → SQLite auth (existing)
              ├─ /api/analytics/*   → SQLite clickstream (existing)
              ├─ /api/prompt-logs/* → SQLite prompt logs (existing)
              ├─ /api/agents/*      → 501 Not Implemented (reserved)
              ├─ /api/health        → Health check
              └─ /*                 → Static SPA files
```

**Client-side migration:** `geminiService` internals change from SDK calls to `fetch('/api/gemini/...')`. Exported signatures are unchanged. Zero component/hook changes.

**Dockerfile:** nginx → Node.js (`node:20-alpine`). Express serves static files via `express.static('dist')`.

**Environment variables:**

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Gemini API authentication |
| `FIREBASE_API_KEY` | Runtime config injection |
| `FIREBASE_AUTH_DOMAIN` | Runtime config injection |
| `FIREBASE_PROJECT_ID` | Runtime config injection |
| `FIREBASE_STORAGE_BUCKET` | Runtime config injection |
| `FIREBASE_MESSAGING_SENDER_ID` | Runtime config injection |
| `FIREBASE_APP_ID` | Runtime config injection |
| `PORT` | Cloud Run port (default 8080) |

### Phase 2: MVP3+ — Prompts to Firebase

Before the Go migration, the Express proxy starts loading prompts from Firebase instead of hardcoded constants. This validates the Firebase prompt management pattern (TC-018).

```
Express Gateway:
  1. Client sends POST /api/gemini/chat { message, sessionContext }
  2. Gateway loads PromptTemplate from Firestore: prompts/onboarding-coach-v1
  3. Gateway builds Gemini request with loaded systemInstruction
  4. Gateway calls Google AI Studio with API key
  5. Gateway returns response
```

### Phase 3: V1.0 — Go Gateway + VertexAI

Go (Echo) gateway replaces Express. VertexAI replaces Google AI Studio.

```
Browser ──→ Go Gateway (Echo on Cloud Run)
              ├─ /api/v1/ai/*        → VertexAI (service account, prompts from Firebase)
              ├─ /api/v1/portfolio/* → PostgreSQL (profiles, evidence, endorsements)
              ├─ /api/v1/sessions/*  → PostgreSQL (sessions, interactions)
              ├─ /api/v1/prompts/*   → Firebase (admin CRUD)
              ├─ /api/v1/agents/*    → Firebase (admin CRUD) + PostgreSQL (executions)
              ├─ /api/v1/engagement/* → PostgreSQL + Firestore sync
              ├─ /api/v1/reflections/* → PostgreSQL
              ├─ /api/config          → Runtime config
              ├─ /api/health          → Health check
              └─ /*                   → Static SPA files
```

**Key changes:**
- No more `GEMINI_API_KEY` — VertexAI uses Application Default Credentials (service account on Cloud Run)
- Firebase JWT verification via Go Firebase Admin SDK
- PostgreSQL via Cloud SQL Proxy (IAM auth)
- Redis for rate limiting (supports auto-scaling)
- All API endpoints under versioned `/api/v1/` prefix

**Express decommission:** Auth, analytics, and prompt-log routes migrate to Go. Express server is removed.

### Phase 4: V2.0 — Full Production Gateway

```
Browser ──→ Go Gateway (Cloud Run, auto-scaling)
              ├─ Firebase JWT auth middleware
              ├─ Redis rate limiting
              ├─ Cloud Trace distributed tracing
              ├─ All /api/v1/* routes → Go handlers
              ├─ VertexAI (service account)
              ├─ PostgreSQL (Cloud SQL)
              ├─ Cloud Storage (artifacts)
              ├─ External APIs (job portals, Bundesagentur)
              └─ Blockchain anchoring (TC-010)
```

---

## Client-Side API Surface

The client interacts with two categories of services:

### Direct Google API Access (no gateway)

The client uses Firebase client SDKs for services that don't require secret keys:

| Service | SDK | Why Direct |
|---------|-----|-----------|
| Firebase Auth | `firebase/auth` | Client SDK handles OAuth flows, JWT issuance |
| Firestore | `firebase/firestore` | Real-time sync for app state, security rules enforce access |
| Firebase Storage | `firebase/storage` | Direct file uploads with security rules |

Firestore security rules control access:
- `users/{uid}/**` — read/write by owner only
- `prompts/**` — read by all authenticated, write by admin only
- `agents/**` — read by all authenticated, write by admin only

### Gateway-Mediated Access (all key-protected operations)

| Operation | Why Through Gateway |
|-----------|-------------------|
| AI calls (VertexAI/Gemini) | Service account or API key required |
| PostgreSQL queries | Database credentials required |
| External API calls (job portals) | API keys required |
| Email sending (endorsement invites) | SMTP credentials required |
| Prompt writes (admin) | Server-side validation + audit logging |
| Agent management (admin) | Server-side validation + audit logging |

---

## Deployment Model

**Single container** on Cloud Run for all phases. The gateway serves both static files and API routes.

```
Cloud Run Container
  ├─ Static files (frontend SPA, built at Docker build time)
  ├─ API routes (gateway handlers)
  ├─ Service account (ADC for VertexAI, Cloud SQL, etc.)
  └─ Environment variables (non-secret config)
```

**MVP3 Dockerfile:**

```
Stage 1: npm run build → static files + compiled server
Stage 2: node:20-alpine → Node.js serves static + API
```

**V1.0 Dockerfile:**

```
Stage 1: npm run build → static frontend files
Stage 2: go build → Go binary
Stage 3: distroless → Go binary + static files
```

**Health check:** `GET /api/health` returns `{ "status": "ok" }` with HTTP 200.

**Docker Compose** for local staging (see FR-052):

```yaml
services:
  app:
    build: .
    ports: ["8080:8080"]
    env_file: .env.local
```

---

## File Change Map (MVP3 Implementation)

| File | Action | What Changes |
|------|--------|-------------|
| `frontend/server/routes/gemini.ts` | CREATE | 7 Express route handlers wrapping Gemini SDK |
| `frontend/server/routes/config.ts` | CREATE | `/api/config` endpoint returning Firebase + feature config from env |
| `frontend/server/routes/agents.ts` | CREATE | `/api/agents/*` returning 501 (reserved namespace) |
| `frontend/server/middleware/rateLimit.ts` | CREATE | In-memory per-IP/per-user rate limiter |
| `frontend/server/middleware/errorHandler.ts` | CREATE | Centralized JSON error handler for `/api/*` |
| `frontend/services/gemini.ts` | REWRITE | SDK calls → `fetch('/api/gemini/...')` |
| `frontend/services/firebase.ts` | MODIFY | Init from `/api/config` instead of compile-time vars |
| `frontend/server/index.ts` | MODIFY | Add gateway routes, static serving, health check, dynamic PORT |
| `frontend/vite.config.ts` | MODIFY | Remove `GEMINI_API_KEY` and Firebase config from `define` block |
| `frontend/package.json` | MODIFY | Move `@google/genai` to `dependencies`, add `start` script |
| `Dockerfile` | REWRITE | Node.js production server instead of nginx |
| `nginx.conf` | DELETE | No longer needed |
| `docker-compose.yml` | CREATE | Local staging environment |
| `.env.example` | CREATE | Documented env var template |
| `cloudbuild.yaml` | SIMPLIFY | Remove `--build-arg GEMINI_API_KEY` |
| `Makefile` | MODIFY | Add `stage` target |
| All components/hooks | UNCHANGED | `geminiService` interface stays the same |

---

## Consequences

### Benefits

- **All secrets server-side** — API keys, service account credentials, and database passwords never reach the browser
- **Stable client API** — Frontend calls the same gateway URL across all phases; backend implementation changes are invisible
- **Runtime configuration** — One Docker image works for dev, staging, and production. Config rotates without rebuild.
- **Phased migration** — Each phase is independently deployable and testable. No big-bang rewrite.
- **Unified policy** — Auth, rate limiting, error handling, and audit logging applied consistently at the gateway
- **VertexAI-ready** — Gateway abstracts the AI backend; switching from API key to service account is a backend-only change
- **Auto-scaling** — Gateway pattern works with Cloud Run auto-scaling (Redis rate limiter in V1.0)

### Trade-offs

- **Added latency** — ~50ms per AI call (browser → gateway → VertexAI vs. browser → Google AI Studio directly). Acceptable for the security benefit.
- **Node.js memory** — Express gateway uses ~80MB vs. nginx's ~10MB. Go gateway (~20MB) improves this in V1.0.
- **Startup dependency** — App must fetch `/api/config` before Firebase init. Mitigated by fast config endpoint (~5ms) and loading spinner.
- **Two gateways during migration** — In V1.0 transition, Express and Go run side-by-side briefly. Mitigated by clear routing rules and short transition window.

### Risks

- **Single-instance rate limiting (MVP3)** — In-memory rate limiter doesn't work with Cloud Run auto-scaling. Mitigation: pin to 1 instance for MVP3; add Redis for V1.0.
- **Large media payloads** — TTS/STT base64 audio increases server memory pressure. Mitigation: 10MB body limit, Cloud Run memory monitoring.
- **Gateway as bottleneck** — All traffic flows through one service. Mitigation: Cloud Run auto-scales horizontally; Go is efficient enough for the expected load.

---

## Alternatives Considered

### Google Cloud API Gateway (managed)
Use Google's managed API Gateway service. Rejected: requires separate OpenAPI config deployment, doesn't support custom middleware (Firebase JWT verification, prompt loading from Firestore), and adds complexity for the current scale.

### Cloud Functions per Endpoint
Each AI method as a separate Cloud Function. Rejected: cold start latency, deployment complexity (7+ functions), no shared middleware, splits the codebase.

### API Gateway with API Key Restriction
Restrict the Gemini API key to specific origins. Rejected: Google AI Studio API keys don't support referrer restrictions (unlike Maps keys).

### Client-Side VertexAI SDK
Google provides a VertexAI Web SDK. Rejected: still requires server-side token exchange for authentication. The gateway proxy is simpler and more secure.

### Skip Express, Go Gateway from Day One
Build the Go gateway for MVP3. Rejected: Go backend doesn't exist yet, Express server already works. Express gateway takes hours; Go gateway takes weeks. Start with Express, migrate to Go for V1.0.

### Firebase Config via Build Args
Keep Firebase config as build-time `define` variables. Rejected: requires separate builds per environment, cannot rotate without rebuild, doesn't align with "one image, many environments".

---

## Dependencies

- [TC-017](TC-017-unified-data-model.md) — Unified data model (defines all entity groups and API endpoints)
- [TC-018](TC-018-agentic-backend-vertexai.md) — Agentic backend & VertexAI migration (defines AI execution and prompt management)
- [FR-051](../features/FR-051-gemini-api-proxy.md) — Secure API Gateway feature request (acceptance criteria)
- [FR-052](../features/FR-052-local-staging.md) — Docker Compose local staging
- [FR-005](../features/FR-005-gemini-dialogue.md) — Gemini Dialogue Engine (defines the 7 methods being proxied)
- [FR-024](../features/FR-024-multi-agent-reisebegleiter.md) — Multi-Agent Reisebegleiter (future consumer of agent routes)
- [FR-040](../features/FR-040-docker-cloud-run.md) — Docker & Cloud Run deployment
- [TC-008](TC-008-auditierbare-methodik.md) — Auditable methodology (defines audit logging requirements)

## Notes

- No streaming needed for MVP — all current calls are request/response with loading indicators. Streaming can be added in V1.0 for chat responses if needed.
- TTS/STT payloads can be large (base64 audio). Body limit set to 10MB.
- The `/api/config` endpoint is intentionally unauthenticated — Firebase config is needed before the user can log in.
- The `geminiService` module (`frontend/services/gemini.ts`) is the only file that imports the Gemini SDK. All components/hooks call `geminiService` methods, which maintain the same interface across phases.
- The `/api/v1/` prefix is used for all new Go endpoints. Express legacy endpoints keep their `/api/` prefix without version.
- The OpenAPI specification for all V1.0 endpoints is at `integrations/api-spec/portfolio-api.yml`.
