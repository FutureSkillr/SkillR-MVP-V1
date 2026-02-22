# FR-051: Secure API Gateway

**Status:** done
**Priority:** must
**Gate:** env:all
**Created:** 2026-02-19
**Entity:** SkillR

## Problem

Multiple secret keys are currently exposed or at risk of exposure in the client bundle:

1. **Gemini API key** — baked into the Vite JS bundle via `define` in `vite.config.ts`. Anyone opening DevTools can extract it.
2. **Firebase config** — currently hardcoded in frontend source. While Firebase config is not strictly secret, exposing it without server-side control means no ability to rotate or restrict at runtime.
3. **Future agent service keys** — FR-024 (Multi-Agent Reisebegleiter) will require agent-to-agent and agent-to-external-service keys that must never reach the browser.

The root cause: there is no centralized server-side gateway that wraps all secret keys and provides runtime configuration to the frontend.

## Solution

Build a **Secure API Gateway** on the existing Express server that wraps ALL secret keys server-side and provides runtime configuration. The gateway has three layers:

### Layer 1: Gemini Proxy (`/api/gemini/*`)

Seven endpoints mirror the seven `geminiService` methods currently calling the Gemini SDK from the browser:

| Endpoint | Current Client Method | Payload |
|----------|----------------------|---------|
| `POST /api/gemini/chat` | `sendMessage()` | `{ history, message, systemInstruction }` |
| `POST /api/gemini/extract-insights` | `extractInsights()` | `{ messages }` |
| `POST /api/gemini/extract-station-result` | `extractStationResult()` | `{ messages, stationContext }` |
| `POST /api/gemini/generate-curriculum` | `generateCurriculum()` | `{ topic, dimension }` |
| `POST /api/gemini/generate-course` | `generateCourse()` | `{ curriculum }` |
| `POST /api/gemini/tts` | `textToSpeech()` | `{ text, voice }` → returns `{ audio: base64 }` |
| `POST /api/gemini/stt` | `speechToText()` | `{ audio: base64 }` → returns `{ text }` |

Wraps `GEMINI_API_KEY` — never shipped to the browser.

### Layer 2: Firebase Config Injection (`/api/config`)

A single `GET /api/config` endpoint returns the Firebase configuration at runtime:

```json
{
  "firebase": {
    "apiKey": "...",
    "authDomain": "...",
    "projectId": "...",
    "storageBucket": "...",
    "messagingSenderId": "...",
    "appId": "..."
  }
}
```

The Firebase SDK still runs client-side (authentication, Firestore), but the config is fetched from the gateway on app initialization instead of being baked into the Vite `define` block. This allows runtime rotation and per-environment injection without rebuilding.

### Layer 3: Agent Communication (`/api/agents/*`) — Reserved

The `/api/agents/*` namespace is reserved for FR-024 (Multi-Agent Reisebegleiter, V1.0). Keys for agent-to-agent or agent-to-external-service calls will stay server-side behind this namespace. No implementation in MVP3 — namespace reservation only.

### Environment Variables Wrapped by Gateway

| Variable | Layer | Phase |
|----------|-------|-------|
| `GEMINI_API_KEY` | Gemini Proxy | MVP3 |
| `FIREBASE_API_KEY` | Config Injection | MVP3 |
| `FIREBASE_AUTH_DOMAIN` | Config Injection | MVP3 |
| `FIREBASE_PROJECT_ID` | Config Injection | MVP3 |
| `FIREBASE_STORAGE_BUCKET` | Config Injection | MVP3 |
| `FIREBASE_MESSAGING_SENDER_ID` | Config Injection | MVP3 |
| `FIREBASE_APP_ID` | Config Injection | MVP3 |
| Agent service keys | Agent Comms | V1.0 (reserved) |

### Client-Side Changes

`geminiService` exports stay identical — same function names, same parameters, same return types. Only the internals change: SDK calls become `fetch('/api/gemini/...')` calls. Zero component changes needed.

Firebase initialization changes: instead of reading config from a compile-time constant, the app fetches `GET /api/config` on startup and initializes the Firebase SDK with the returned config.

### Rate Limiting

In-memory per-IP rate limiter with different tiers:

| Endpoint Type | Limit |
|---------------|-------|
| Chat, extract, generate | 30 requests/minute |
| TTS | 10 requests/minute |
| STT | 10 requests/minute |
| Config | 60 requests/minute |

Returns HTTP 429 with `Retry-After` header on abuse.

### Health Check

`GET /api/health` returns `{ "status": "ok" }` with HTTP 200.

### Centralized Error Handling

All `/api/*` routes use a shared error handler that:
- Returns structured JSON errors: `{ "error": "message", "code": "ERROR_CODE" }`
- Logs errors server-side with request context
- Never leaks stack traces or internal details to the client

## Acceptance Criteria

- [ ] Gemini API key does NOT appear in the JS bundle (verify: `curl <app-url>/assets/*.js | grep AIza` returns nothing)
- [ ] All 7 Gemini methods work through `/api/gemini/*` proxy endpoints
- [ ] TTS endpoint accepts text and returns base64 audio
- [ ] STT endpoint accepts base64 audio and returns transcription text
- [ ] `GET /api/config` returns Firebase configuration as JSON
- [ ] Firebase config values do NOT appear in the JS bundle as hardcoded strings
- [ ] App initializes Firebase SDK from `/api/config` response
- [ ] `/api/agents/*` namespace returns 501 Not Implemented (reserved)
- [ ] Rate limiting returns 429 on rapid requests (>30/min for chat)
- [ ] `GEMINI_API_KEY` is a runtime env var in Cloud Run (not a build-time arg)
- [ ] All Firebase config values are runtime env vars in Cloud Run
- [ ] Cloud Run serves both static files and API from a single container
- [ ] All existing UI flows work without modification (geminiService interface unchanged)
- [ ] Health check endpoint at `/api/health` returns 200
- [ ] Error responses use structured JSON format

## Dependencies

- FR-005: Gemini Dialogue Engine (defines the 7 methods being proxied)
- FR-052: Docker Compose Local Staging (local testing of the gateway)
- TC-016: Secure API Gateway Architecture (architecture decision)
- FR-040: Docker & Cloud Run (container deployment)
- FR-024: Multi-Agent Reisebegleiter (future consumer of Layer 3)

## Notes

- No streaming needed for MVP — all current calls are request/response and the UI already handles latency with loading indicators.
- The existing Express dev server (`frontend/server/index.ts`) already has routes, SQLite, and Vite proxy. The gateway routes extend this server for production use.
- TTS/STT payloads can be large (base64 audio). A request body limit of 10MB should be set.
- This is the **MVP3** priority — blocks public URL sharing but not local demo use.
- The `/api/config` endpoint is intentionally unauthenticated — the Firebase config is needed before the user can authenticate.
