# TC-023: Chat Dialog Architecture

**Status:** accepted
**Created:** 2026-02-19
**Entity:** maindfull.LEARNING + SkillR

## Context

The onboarding dialog ("Dein Coach") and all station dialogs share a common architecture
for AI-powered chat, text-to-speech (TTS), and speech-to-text (STT). This document captures
the current architecture to support improvement decisions.

Two separate backends exist: a **Node.js Express gateway** (primary, used by the frontend)
and a **Go Echo backend** (planned production target, not yet wired to frontend).

---

## Component Diagram

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                        BROWSER (React SPA)                         │
 │                                                                    │
 │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
 │  │ Onboarding  │  │ VucaStation  │  │ Entrepreneur │  ...more     │
 │  │ Chat        │  │              │  │ Station      │  stations    │
 │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘              │
 │         │                │                  │                      │
 │         └────────────────┼──────────────────┘                      │
 │                          │                                         │
 │                          ▼                                         │
 │                 ┌─────────────────┐                                │
 │                 │ useGeminiChat   │◄─── core hook: message state,  │
 │                 │ (hook)          │     error handling, markers     │
 │                 └────────┬────────┘                                │
 │                          │                                         │
 │              ┌───────────┼────────────┐                            │
 │              ▼           ▼            ▼                            │
 │   ┌──────────────┐ ┌──────────┐ ┌──────────────┐                  │
 │   │ geminiService│ │ useSpeech│ │ useSpeech    │                  │
 │   │ .chat()      │ │ Synthesis│ │ Recognition  │                  │
 │   │ .extract*()  │ │ (TTS)    │ │ (STT)        │                  │
 │   │ .generate*() │ │          │ │              │                  │
 │   └──────┬───────┘ └────┬─────┘ └──────┬───────┘                  │
 │          │              │              │                           │
 │          │   ┌──────────┘              │                           │
 │          ▼   ▼                         ▼                           │
 │   ┌────────────────────────────────────────┐                      │
 │   │          gatewayFetch()                │                      │
 │   │   fetch('/api/gemini/{endpoint}')      │                      │
 │   └──────────────────┬─────────────────────┘                      │
 │                      │                                             │
 └──────────────────────┼─────────────────────────────────────────────┘
                        │  HTTP POST (JSON)
                        │
        ┌───────────────┼───────────────────────────────┐
        │  DEV: Vite proxy :3000 -> :3001               │
        │  PROD: Express serves SPA + API on :8080      │
        └───────────────┼───────────────────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │               EXPRESS GATEWAY (Node.js)                          │
 │               frontend/server/index.ts (:3001 dev / :8080 prod) │
 │                                                                  │
 │  ┌──────────────────────────────────────────────────┐            │
 │  │ Middleware                                       │            │
 │  │  - CORS                                          │            │
 │  │  - JSON body parser (10MB limit)                 │            │
 │  │  - Rate limiter: 30 req/min per IP (/api/gemini) │            │
 │  │  - apiErrorHandler (centralized 500 response)    │            │
 │  └──────────────────────────────────────────────────┘            │
 │                                                                  │
 │  ┌───────────────────────────────────────────────────────┐       │
 │  │ /api/gemini/* routes  (routes/gemini.ts)              │       │
 │  │                                                       │       │
 │  │  POST /chat            ── Chat with history           │       │
 │  │  POST /extract-insights ── Onboarding analysis (JSON) │       │
 │  │  POST /extract-station-result ── Station scoring      │       │
 │  │  POST /generate-curriculum ── VUCA 12-module plan     │       │
 │  │  POST /generate-course  ── Course content + quiz      │       │
 │  │  POST /tts              ── Text-to-Speech (PCM audio) │       │
 │  │  POST /stt              ── Speech-to-Text             │       │
 │  │                                                       │       │
 │  │  Shared: getAI() -> GoogleGenAI({ apiKey })           │       │
 │  │  Shared: withRetry() -> 3 retries on 429              │       │
 │  └──────────────────────┬────────────────────────────────┘       │
 │                         │                                        │
 │  ┌──────────────────────┼────────────────────────────────┐       │
 │  │ Other routes                                          │       │
 │  │  /api/config    ── Firebase config (runtime inject)   │       │
 │  │  /api/agents    ── Agent configuration                │       │
 │  │  /api/auth      ── Local auth (login/register)        │       │
 │  │  /api/users     ── User management                    │       │
 │  │  /api/sessions  ── Session management                 │       │
 │  │  /api/prompt-logs ── Prompt log storage               │       │
 │  │  /api/analytics ── Analytics events                   │       │
 │  └──────────────────────┼────────────────────────────────┘       │
 └─────────────────────────┼────────────────────────────────────────┘
                           │  HTTPS (API Key auth)
                           ▼
              ┌──────────────────────────┐
              │  GOOGLE GEMINI API       │
              │  (Google AI Studio)      │
              │                          │
              │  gemini-2.0-flash-lite   │
              │   ├─ Chat                │
              │   ├─ Extract (JSON mode) │
              │   ├─ Generate (JSON)     │
              │   └─ STT (multimodal)    │
              │                          │
              │  gemini-2.5-flash-       │
              │  preview-tts             │
              │   └─ TTS (audio output)  │
              └──────────────────────────┘


 ┌──────────────────────────────────────────────────────────────────┐
 │  GO BACKEND (Echo) — NOT currently used by frontend             │
 │  backend/cmd/server/main.go (:8080)                             │
 │                                                                  │
 │  /api/v1/ai/chat     ── VertexAI chat (with Orchestrator)       │
 │  /api/v1/ai/extract  ── VertexAI extract (prompt-driven)        │
 │  /api/v1/ai/generate ── VertexAI generate (prompt-driven)       │
 │  /api/v1/ai/tts      ── STUB (returns empty audio)              │
 │  /api/v1/ai/stt      ── STUB (returns empty text)               │
 │                                                                  │
 │  Uses: cloud.google.com/go/vertexai/genai                       │
 │  Auth: GCP_PROJECT_ID + IAM (no API key needed)                 │
 │  Extra: Orchestrator pattern (agent selection, dynamic prompts)  │
 │  Deps: PostgreSQL (required), Redis (optional), Firebase Auth   │
 └──────────────────────────────────────────────────────────────────┘
```

---

## Sequence Diagram: Onboarding Chat (Happy Path)

```
 ┌────────┐          ┌──────────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐
 │ User   │          │ Onboarding   │     │useGemini  │     │ Express    │     │ Gemini   │
 │        │          │ Chat.tsx     │     │Chat hook  │     │ Gateway    │     │ API      │
 └───┬────┘          └──────┬───────┘     └─────┬─────┘     └─────┬──────┘     └────┬─────┘
     │                      │                   │                  │                  │
     │  Navigate to         │                   │                  │                  │
     │  onboarding          │                   │                  │                  │
     │ ────────────────────>│                   │                  │                  │
     │                      │                   │                  │                  │
     │                      │ useEffect mount   │                  │                  │
     │                      │──────────────────>│                  │                  │
     │                      │ startConversation │                  │                  │
     │                      │ ("Starte das      │                  │                  │
     │                      │  Onboarding...")   │                  │                  │
     │                      │                   │                  │                  │
     │                      │                   │  POST /api/      │                  │
     │                      │                   │  gemini/chat     │                  │
     │                      │                   │ ────────────────>│                  │
     │                      │                   │  {system:        │                  │
     │                      │                   │   ONBOARDING_    │                  │
     │                      │                   │   SYSTEM_PROMPT, │                  │
     │                      │                   │   history: [],   │  generateContent │
     │                      │                   │   userMessage}   │ ────────────────>│
     │                      │                   │                  │                  │
     │                      │                   │                  │  {text: "Hallo!  │
     │                      │                   │                  │  Was begeistert  │
     │                      │                   │  {text, retry    │  dich?"}         │
     │                      │                   │   Count: 0}      │ <────────────────│
     │                      │                   │ <────────────────│                  │
     │                      │                   │                  │                  │
     │                      │  messages=[       │                  │                  │
     │  Show greeting       │   {assistant,     │                  │                  │
     │  in ChatBubble       │    "Hallo!..."}]  │                  │                  │
     │ <────────────────────│                   │                  │                  │
     │                      │                   │                  │                  │
     │                      │  onAssistantMsg() │                  │                  │
     │                      │  -> speak(text)   │                  │                  │
     │                      │  (if voice on)    │                  │                  │
     │                      │                   │  POST /api/      │                  │
     │  [TTS audio plays]   │                   │  gemini/tts      │  TTS model       │
     │ <· · · · · · · · · · │                   │ ────────────────>│ ────────────────>│
     │                      │                   │  {audio: base64} │ <────────────────│
     │                      │                   │ <────────────────│                  │
     │                      │                   │                  │                  │
     │  Type response       │                   │                  │                  │
     │  "Ich mag Technik"   │                   │                  │                  │
     │ ────────────────────>│                   │                  │                  │
     │                      │ sendMessage(      │                  │                  │
     │                      │  "Ich mag..")     │                  │                  │
     │                      │──────────────────>│                  │                  │
     │                      │                   │  POST /api/      │                  │
     │                      │                   │  gemini/chat     │                  │
     │                      │                   │ ────────────────>│ ────────────────>│
     │                      │                   │                  │ <────────────────│
     │                      │                   │ <────────────────│                  │
     │                      │                   │                  │                  │
     │  Show AI response    │  update messages  │                  │                  │
     │ <────────────────────│                   │                  │                  │
     │                      │                   │                  │                  │
     │      ... (3-5 more exchanges, asking about strengths,       │                  │
     │           learning style, summarizing) ...                   │                  │
     │                      │                   │                  │                  │
     │                      │                   │  POST /chat      │                  │
     │                      │                   │ ────────────────>│ ────────────────>│
     │                      │                   │                  │  "...great!      │
     │                      │                   │                  │  [REISE_         │
     │                      │                   │ <────────────────│  VORSCHLAG]"     │
     │                      │                   │                  │ <────────────────│
     │                      │                   │                  │                  │
     │                      │  marker detected: │                  │                  │
     │                      │  [REISE_VORSCHLAG]│                  │                  │
     │                      │<──────────────────│                  │                  │
     │                      │                   │                  │                  │
     │                      │  handleMarker()   │                  │                  │
     │                      │──────────────────>│                  │                  │
     │                      │                   │  POST /api/gemini│                  │
     │                      │                   │  /extract-       │                  │
     │                      │                   │  insights        │                  │
     │                      │                   │ ────────────────>│ ────────────────>│
     │                      │                   │                  │                  │
     │                      │                   │  {data: {        │  JSON mode:      │
     │                      │                   │   interests:[],  │  structured      │
     │                      │                   │   strengths:[],  │  extraction      │
     │                      │                   │   preferred      │                  │
     │                      │                   │   Style,         │                  │
     │                      │                   │   recommended    │                  │
     │                      │                   │   Journey,       │                  │
     │                      │                   │   summary}}      │                  │
     │                      │                   │ <────────────────│ <────────────────│
     │                      │                   │                  │                  │
     │                      │ onComplete(       │                  │                  │
     │                      │  insights)        │                  │                  │
     │                      │──────────────────>│                  │                  │
     │                      │                   │                  │                  │
     │  Transition to       │  App.tsx:         │                  │                  │
     │  Journey Select      │  view =           │                  │                  │
     │  (Globe Navigation)  │  'journey-select' │                  │                  │
     │ <────────────────────│                   │                  │                  │
     │                      │                   │                  │                  │
```

---

## Sequence Diagram: Error Path (Current Issue)

```
 ┌────────┐          ┌──────────────┐     ┌───────────┐     ┌───────────┐
 │ User   │          │ Onboarding   │     │useGemini  │     │ Express   │
 │        │          │ Chat.tsx     │     │Chat hook  │     │ Gateway   │
 └───┬────┘          └──────┬───────┘     └─────┬─────┘     └─────┬─────┘
     │                      │                   │                  │
     │  Navigate to         │                   │                  │
     │  onboarding          │                   │                  │
     │ ────────────────────>│                   │                  │
     │                      │ startConversation │                  │
     │                      │──────────────────>│                  │
     │                      │                   │  POST /api/      │
     │                      │                   │  gemini/chat     │
     │                      │                   │ ────────────────>│
     │                      │                   │                  │
     │                      │                   │                  │  getAI() throws:
     │                      │                   │                  │  "GEMINI_API_KEY
     │                      │                   │                  │   not set"
     │                      │                   │                  │
     │                      │                   │                  │  apiErrorHandler
     │                      │                   │                  │  catches error,
     │                      │                   │                  │  returns:
     │                      │                   │  HTTP 500        │
     │                      │                   │  {error:         │
     │                      │                   │   "Internal      │
     │                      │                   │   server error"} │
     │                      │                   │ <────────────────│
     │                      │                   │                  │
     │                      │                   │ gatewayFetch()
     │                      │                   │ throws Error(
     │                      │                   │  "Internal
     │                      │                   │   server error")
     │                      │                   │
     │                      │                   │ formatError():
     │                      │                   │ no pattern match
     │                      │                   │ -> fallback:
     │                      │                   │ "Verbindungs-
     │                      │  messages=[       │  fehler: Internal
     │  Show error          │   {assistant,     │  server error"
     │  in ChatBubble       │    "Verbindungs-  │
     │ <────────────────────│    fehler:..."}]  │
     │                      │                   │
```

**Note:** The error `"GEMINI_API_KEY not set"` is caught by `apiErrorHandler` which
strips the original message and returns a generic `"Internal server error"`. This loses
useful diagnostic information. The `formatError()` function in `useGeminiChat.ts` checks
for `API_KEY` in the error message but never sees it because the Express error handler
already replaced it.

**Improvement opportunity:** The Express error handler should pass through specific
error codes so the frontend can show targeted guidance (e.g., "Set GEMINI_API_KEY in
.env.local").

---

## Data Flow: Chat Message Lifecycle

```
  User Input                    State Machine                  Network
  ──────────                    ─────────────                  ───────

  1. User types text     ──>  ChatInput.handleSend()
     OR speaks                  │
                                ▼
  2. Text normalized     ──>  useGeminiChat.sendMessage(text)
                                │
                                ├── Create ChatMessage {role:'user', content, timestamp}
                                ├── Append to messages[]
                                ├── trackChatMessage() (analytics)
                                │
                                ▼
  3. API call            ──>  chatFn(systemPrompt, history, userMessage)
                                │
                                ├── If sessionId set: loggingService.chat()
                                │     └── geminiService.chat() + write prompt log
                                └── Else: geminiService.chat()
                                      │
                                      ▼
  4. Gateway fetch       ──>  gatewayFetch('chat', {...})
                                │
                                ├── POST /api/gemini/chat
                                ├── Check 429 -> throw rate limit error
                                ├── Check !ok -> throw gateway error
                                └── Return {text, retryCount}
                                      │
                                      ▼
  5. Response handling   ──>  Create ChatMessage {role:'assistant', content, timestamp}
                                │
                                ├── Append to messages[]
                                ├── trackChatMessage() (analytics)
                                ├── onAssistantMessage?.(response) -> triggers TTS
                                │
                                ▼
  6. Marker detection    ──>  for each marker in markers[]
                                │
                                ├── if response.includes(marker)
                                │     └── onMarkerDetected(marker, allMessages)
                                │           └── triggers extraction + view transition
                                └── else: wait for next user message
```

---

## TTS Flow Detail

```
  Assistant response arrives
         │
         ▼
  onAssistantMessage(text)
         │
         ├── voiceEnabled? ──No──> done
         │
         Yes
         │
         ▼
  useSpeechSynthesis.speak(text)
         │
         ├── generationRef++ (stale prevention)
         ├── delay 1500ms (avoid stacking)
         │
         ▼
  geminiService.textToSpeech(text, dialect)
         │
         ├── POST /api/gemini/tts
         │     ├── Model: gemini-2.5-flash-preview-tts
         │     ├── Config: responseModalities: ['AUDIO']
         │     ├── Voice: 'Kore'
         │     ├── Dialect prompt: e.g. "Lies ... bayerisch"
         │     └── Returns: base64 PCM audio
         │
         ▼
  pcmToWavBlob(base64)
         │
         ├── Decode base64 -> ArrayBuffer
         ├── Add 44-byte RIFF/WAV header
         │     ├── Sample rate: 24000 Hz
         │     ├── Channels: 1 (mono)
         │     └── Bits: 16
         ├── Create Blob -> URL.createObjectURL
         │
         ▼
  new Audio(url).play()
         │
         ├── Check generationRef (if stale, skip)
         └── On error: fallback to browser speechSynthesis(de-DE)
```

---

## Key Observations for Improvement

### 1. Error Transparency
The `apiErrorHandler` in `middleware/errorHandler.ts` strips all error detail, returning
a generic "Internal server error" for any non-429 error. The frontend's `formatError()`
has pattern matching for `API_KEY`, `401`, `403` etc., but never sees these strings
because they're stripped server-side.

**Fix:** Return structured error codes from the gateway that map to frontend messages.

### 2. Dual Backend Problem
The frontend calls `/api/gemini/*` (Express), but the Docker production image runs
the Go backend which only has `/api/v1/ai/*`. This means:
- In dev: Express works, Go backend is separate/unused for AI
- In Docker prod: the AI proxy routes are missing entirely

**Fix:** Either consolidate to one backend, or make the Go backend proxy-compatible
with `/api/gemini/*` routes.

### 3. Go Backend TTS/STT are Stubs
`handler.go` lines 225-267: Both TTS and STT return empty responses.
To implement TTS via VertexAI, the Go backend would need to:
- Use the same `gemini-2.5-flash-preview-tts` model via VertexAI SDK
- Set `responseModalities: ['AUDIO']` and `speechConfig`
- OR use the dedicated `cloud.google.com/go/texttospeech/apiv1` client

### 4. No Conversation Persistence
Chat history lives only in React state (`useGeminiChat.messagesRef`). If the user
refreshes the page, the entire conversation is lost. The `sessionRoutes` and
`promptLogRoutes` exist but are not used for recovery.

### 5. Marker-Based Flow Control
The AI must output magic strings like `[REISE_VORSCHLAG]` to trigger transitions.
This is fragile — the AI may output the marker too early, too late, or not at all.
There is no retry or fallback if the marker is never produced.

### 6. System Prompt is Static
The Express server uses hardcoded prompts from `services/prompts.ts`. The Go backend
has an `Orchestrator` that loads prompts from Firebase dynamically, enabling A/B testing
and admin overrides. The frontend has partial support for this via `contentResolver.ts`
(localStorage overrides), but it's not connected to the Go backend's prompt system.

---

## Decision

This document captures the current architecture as-is. Improvement decisions are
tracked in separate TCs:
- TC-016: Gemini server proxy (consolidation)
- TC-018: Agentic backend with VertexAI (Go backend completion)

## Consequences

Understanding this architecture enables targeted improvements:
- Error handling can be fixed without restructuring
- TTS/STT stubs in Go backend need implementation before Docker prod migration
- The dual-backend situation needs resolution for production deployment

## Alternatives Considered

N/A — this is an analysis document, not a decision document.

## Related

- TC-016: Gemini Server Proxy
- TC-018: Agentic Backend VertexAI
- FR-051: Gemini API Proxy
- FR-032: Transit Audio Mode (TTS)
