# TC-018: Agentic Backend Services & VertexAI Migration

**Status:** draft
**Created:** 2026-02-19
**Entity:** maindfull.LEARNING + SkillR

## Context

The current MVP uses Google AI Studio's `@google/genai` SDK directly from the browser (migrating to Express proxy per TC-016). System prompts are hardcoded as string constants in `frontend/services/prompts.ts`. The four agent personas (FR-024) are planned but not implemented.

Three problems with the current approach:

1. **Prompt rigidity** — Prompts are compiled into the JS bundle. Changing a prompt requires a redeploy.
2. **API key dependency** — Google AI Studio requires an API key. VertexAI uses service account auth, which is more secure and production-grade.
3. **No agent orchestration** — The planned multi-agent system (FR-024: Entdecker, Reflexions, Skill, Match) has no runtime infrastructure.

This decision defines:
- Where prompts live and how they're managed
- How the backend executes AI calls via VertexAI
- How agent services are orchestrated
- The migration path from Google AI Studio to VertexAI

## Decision

**Prompts are managed in Firebase Firestore. All AI execution goes through a Go backend service using VertexAI with service account authentication. The client connects directly to Google APIs (Firebase Auth, Firestore, Storage) where no secret keys are needed. The backend handles all key-protected operations.**

---

## 1. Prompt Management in Firebase

### Current State (MVP2)

```
frontend/services/prompts.ts (hardcoded)
  ├── ONBOARDING_SYSTEM_PROMPT
  ├── VUCA_STATION_SYSTEM_PROMPT
  ├── ENTREPRENEUR_STATION_SYSTEM_PROMPT
  └── SELF_LEARNING_STATION_SYSTEM_PROMPT
```

Plus inline prompts in `gemini.ts` for:
- `extractInsights()` — JSON extraction prompt
- `extractStationResult()` — station scoring prompt
- `generateCurriculum()` — curriculum generation prompt
- `generateCourse()` — course content prompt

### Target State

```
Firebase Firestore: prompts/{promptId}
  ├── onboarding-coach-v1
  ├── vuca-station-guide-v1
  ├── entrepreneur-mentor-v1
  ├── self-learning-coach-v1
  ├── insight-extraction-v1
  ├── station-result-extraction-v1
  ├── curriculum-generation-v1
  ├── course-generation-v1
  ├── reflection-scoring-v1
  ├── evidence-extraction-v1
  ├── profile-computation-v1
  └── job-matching-v1

Firebase Firestore: agents/{agentId}
  ├── entdecker-agent
  ├── reflexions-agent
  ├── skill-agent
  └── match-agent
```

### PromptTemplate Schema

```
Collection: prompts/{promptId}

Fields:
  promptId: string           # e.g., "onboarding-coach-v1"
  name: string               # Human-readable name
  category: string           # "dialogue" | "extraction" | "generation" | "scoring" | "matching"
  systemInstruction: string  # The system prompt text (German)
  modelConfig:
    model: string            # e.g., "gemini-2.0-flash-lite"
    temperature: number      # 0.0 - 2.0
    topP: number
    topK: number
    maxOutputTokens: number
    responseMimeType: string # "text/plain" | "application/json"
    responseSchema: object   # JSON schema for structured output (optional)
  completionMarkers: string[] # e.g., ["[REISE_VORSCHLAG]", "[STATION_COMPLETE]"]
  version: number            # Auto-incremented on update
  isActive: boolean          # Only active prompts are used
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: string          # Admin user who created/edited
  tags: string[]             # e.g., ["onboarding", "vuca", "dialogue"]
```

### AgentConfig Schema

```
Collection: agents/{agentId}

Fields:
  agentId: string            # e.g., "entdecker-agent"
  name: string               # Display name
  role: string               # Agent role description
  promptIds: string[]        # Ordered list of prompt IDs this agent uses
  activationRules:
    journeyStates: string[]  # Journey states that activate this agent
    behavioralTriggers: string[] # e.g., ["low_engagement", "milestone_reached"]
    minProfileCompleteness: number # 0.0 - 1.0
  transitionRules:
    canTransitionTo: string[] # Other agent IDs this agent can hand off to
    transitionConditions: object # Conditions for each transition
  tone: string               # "warm" | "calm" | "structured" | "transparent"
  temperature: number        # Override for this agent's conversations
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
```

### Why Firebase for Prompts

| Requirement | Firebase | PostgreSQL | Code |
|-------------|----------|------------|------|
| Runtime editing without redeploy | Yes | Yes | No |
| Real-time sync to admin panel | Yes (built-in) | No (polling) | No |
| Version history | Firestore has no built-in versioning, but we version manually | Yes | Git |
| Sub-millisecond reads | Yes (cached) | ~5ms | ~0ms |
| Works offline | Yes (SDK cache) | No | Yes |
| MetaKursEditor integration | Direct (already uses Firestore) | New API needed | localStorage (current) |

Firebase wins because the admin panel (MetaKursEditor, FR-045) already uses Firestore, and prompts need real-time sync to the admin UI. Prompt version history is handled by incrementing the `version` field and optionally keeping old versions in a `prompts/{promptId}/history/{version}` subcollection.

---

## 2. VertexAI Migration

### Current: Google AI Studio

```
Client → Express Proxy → @google/genai SDK → Google AI Studio
                          (API key auth)
```

- Uses `GEMINI_API_KEY` environment variable
- Single API key shared across all users
- Rate limits per key (not per user)
- No IAM integration
- Limited to Google AI Studio models

### Target: VertexAI

```
Client → Go Backend → VertexAI Go SDK → Vertex AI API
                      (service account auth)
```

- Uses GCP service account (no API key)
- IAM-based access control
- Per-project quotas and billing
- Full Vertex AI model catalog (Gemini, PaLM, custom models)
- Integrated with Cloud Monitoring, Cloud Logging, Cloud Trace

### Migration Steps

#### Phase 1: MVP3 (Current — Express + API Key)

Keep the TC-016 Express proxy as-is. This is the working baseline.

```
Browser → Express /api/gemini/* → @google/genai → Google AI Studio
           (GEMINI_API_KEY)
```

#### Phase 2: Go Backend + VertexAI (V1.0 Start)

Deploy Go backend with VertexAI SDK. New endpoints serve AI calls.

```
Browser → Go /api/v1/ai/* → VertexAI Go SDK → Vertex AI
           (service account)

Browser → Express /api/gemini/* → still works (fallback)
```

**Go backend reads prompts from Firebase**, not from hardcoded constants.

#### Phase 3: Full VertexAI (V1.0 Mid)

Decommission Express Gemini proxy. All AI calls through Go backend.

```
Browser → Go /api/v1/ai/* → VertexAI Go SDK → Vertex AI
           (service account)
```

### VertexAI Go SDK Setup

```go
import aiplatform "cloud.google.com/go/aiplatform/apiv1"

// Service account auth is automatic on Cloud Run
// (Application Default Credentials)
client, err := aiplatform.NewPredictionClient(ctx)
```

On Cloud Run, Application Default Credentials (ADC) automatically use the Cloud Run service account. No API key, no key rotation, no key exposure risk.

### Service Account Permissions

```
roles/aiplatform.user          — Invoke Vertex AI predictions
roles/firebase.admin           — Read prompts from Firestore
roles/cloudsql.client          — Connect to Cloud SQL (PostgreSQL)
roles/storage.objectViewer     — Read artifacts from Cloud Storage
```

### Model Configuration

| Use Case | Current Model | VertexAI Equivalent | Endpoint |
|----------|--------------|---------------------|----------|
| Dialogue (chat) | gemini-2.0-flash-lite | gemini-2.0-flash-lite | `generateContent` |
| Extraction (JSON) | gemini-2.0-flash-lite | gemini-2.0-flash-lite | `generateContent` |
| Curriculum/Course gen | gemini-2.0-flash-lite | gemini-2.0-flash-lite | `generateContent` |
| TTS | gemini-2.5-flash-preview-tts | gemini-2.5-flash-preview-tts | `generateContent` |
| STT | gemini-2.0-flash-lite | gemini-2.0-flash-lite | `generateContent` |
| Profile computation | — | gemini-2.0-flash | `generateContent` |
| Evidence extraction | — | gemini-2.0-flash | `generateContent` |

Model names are stored in the PromptTemplate's `modelConfig.model` field, so they can be changed without redeploying.

---

## 3. Execution Architecture

### Client-Side Direct Access (No Backend Needed)

These Google APIs are called directly from the browser because they use Firebase client auth (no secret keys):

| Service | SDK | Auth | Purpose |
|---------|-----|------|---------|
| Firebase Auth | `firebase/auth` | Client SDK | Login, signup, JWT tokens |
| Firestore | `firebase/firestore` | Client SDK + security rules | App state, prompts (read-only), preferences |
| Firebase Storage | `firebase/storage` | Client SDK + security rules | Artifact uploads (images, documents) |

Firestore security rules ensure:
- Users can read/write their own `users/{uid}/**` data
- Prompts collection (`prompts/**`) is read-only for all authenticated users
- Agent configs (`agents/**`) are read-only for all authenticated users
- Admin users can write to prompts and agent configs

### Backend-Mediated Access (Keys/Service Account Required)

| Service | Why Backend | Auth |
|---------|------------|------|
| VertexAI (Gemini) | Service account required, no client SDK | Service account ADC |
| Cloud SQL (PostgreSQL) | Database credentials | Service account + Cloud SQL Proxy |
| External APIs (job portals, Bundesagentur) | API keys | Env vars on Cloud Run |
| Email sending (endorsement invites) | SMTP credentials | Env vars on Cloud Run |

### Request Flow: AI Call

```
1. Client sends request to Go backend
   POST /api/v1/ai/chat
   Authorization: Bearer <firebase-jwt>
   Body: { agentId: "entdecker-agent", sessionId: "...", message: "..." }

2. Go backend:
   a. Verify Firebase JWT → extract uid
   b. Load AgentConfig from Firestore: agents/entdecker-agent
   c. Load PromptTemplate from Firestore: prompts/{agentConfig.promptIds[0]}
   d. Load chat history from PostgreSQL: interactions WHERE session_id = ...
   e. Build VertexAI request:
      - systemInstruction = promptTemplate.systemInstruction
      - model = promptTemplate.modelConfig.model
      - temperature = agentConfig.temperature || promptTemplate.modelConfig.temperature
      - contents = chat history + new message
   f. Call VertexAI: generateContent(request)
   g. Log to PostgreSQL: prompt_logs (TC-008 auditability)
   h. Store interaction in PostgreSQL: interactions
   i. Check completion markers → trigger downstream agents if needed
   j. Return response to client

3. Client receives response
   { response: "...", agentId: "entdecker-agent", markers: [] }
```

### Request Flow: Agent Computation (Server-Side Only)

```
1. Trigger event: station completed → profile recomputation needed

2. Go backend (async):
   a. Load AgentConfig: agents/skill-agent
   b. Load PromptTemplate: prompts/profile-computation-v1
   c. Load all evidence from PostgreSQL: portfolio_entries, reflections, endorsements
   d. Build VertexAI request with evidence summary
   e. Call VertexAI: generateContent(request)
   f. Parse structured response (skill scores, completeness)
   g. Write computed SkillProfile to PostgreSQL
   h. Sync summary to Firestore: users/{uid}/state/interest-profile
   i. Log execution to PostgreSQL: prompt_logs + agent_executions
```

---

## 4. Agent Orchestration Pattern

### Orchestrator

The orchestrator is a Go service that decides which agent handles the next interaction. It runs on every chat request.

```
Input:
  - Current agent ID (from session state)
  - User message
  - Journey state (from Firestore)
  - Engagement state (from Firestore)
  - Profile completeness (from PostgreSQL)

Decision Logic:
  1. Load current agent's AgentConfig
  2. Check transitionRules against current state
  3. If transition triggered → switch to new agent
  4. Load appropriate PromptTemplate
  5. Execute AI call
```

### Agent Lifecycle

```
Session Start
  │
  ▼
Entdecker-Agent (exploration, Gegensatzsuche)
  │
  ├─ milestone_reached ──► Reflexions-Agent (Level 2 coaching)
  │                          │
  │                          └─ reflection_complete ──► back to Entdecker
  │
  ├─ evidence_accumulated ──► Skill-Agent (portfolio building)
  │                            │
  │                            └─ evidence_recorded ──► back to Entdecker
  │
  └─ profile_mature ──► Match-Agent (job/opportunity matching)
                          │
                          └─ matching_shown ──► back to Entdecker
```

Transitions are invisible to the user — they experience a single "Reisebegleiter" (travel companion).

### Agent Trigger Conditions

| Trigger | Agent | Condition |
|---------|-------|-----------|
| Session start | Entdecker | Default agent |
| Station complete | Reflexions | Every station completion (FR-020) |
| 3+ interactions with high skill signal | Skill | Evidence extraction threshold |
| Profile completeness > 0.6 | Match | Enough data for meaningful matches |
| Low engagement (streak break) | Entdecker | Re-engagement with exploration |
| Explicit user request | Any | User asks for specific guidance |

---

## 5. Backend API Endpoints

### AI Execution (`/api/v1/ai/*`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/ai/chat` | Send message to current agent |
| `POST` | `/api/v1/ai/extract` | Run extraction prompt (insights, station results) |
| `POST` | `/api/v1/ai/generate` | Run generation prompt (curriculum, course) |
| `POST` | `/api/v1/ai/tts` | Text-to-speech via VertexAI |
| `POST` | `/api/v1/ai/stt` | Speech-to-text via VertexAI |

### Prompt Management (`/api/v1/prompts/*`) — Admin Only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/prompts` | List all prompt templates |
| `GET` | `/api/v1/prompts/{id}` | Get prompt template with version history |
| `PUT` | `/api/v1/prompts/{id}` | Update prompt (auto-increments version) |
| `POST` | `/api/v1/prompts/{id}/test` | Test prompt with sample input |
| `GET` | `/api/v1/prompts/{id}/history` | Version history |

### Agent Management (`/api/v1/agents/*`) — Admin Only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/agents` | List all agent configs |
| `GET` | `/api/v1/agents/{id}` | Get agent config |
| `PUT` | `/api/v1/agents/{id}` | Update agent config |
| `GET` | `/api/v1/agents/{id}/executions` | Execution history for agent |
| `POST` | `/api/v1/agents/{id}/invoke` | Manually invoke agent (debug) |

---

## 6. Security Model

### What Stays Client-Side

```
Firebase Auth       → Client SDK, no secret keys
Firestore reads     → Security rules: users can read own data + prompts (read-only)
Firestore writes    → Security rules: users can write own state data only
Firebase Storage    → Security rules: users can upload to own path only
```

### What Goes Through Backend

```
VertexAI calls      → Service account (ADC on Cloud Run)
PostgreSQL queries  → Cloud SQL Proxy (IAM auth)
Prompt writes       → Admin-only API (Firebase custom claims: role=admin)
Agent config writes → Admin-only API (Firebase custom claims: role=admin)
Job portal APIs     → API keys in env vars
Email sending       → SMTP credentials in env vars
```

### Firestore Security Rules (Prompt-Related)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Prompts: read-only for authenticated users, write for admins
    match /prompts/{promptId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }

    // Agent configs: read-only for authenticated users, write for admins
    match /agents/{agentId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }

    // User state: owner only
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 7. Migration Path from Hardcoded Prompts

### Step 1: Seed Firebase with Current Prompts

Export the 4 system prompts from `frontend/services/prompts.ts` and the inline prompts from `gemini.ts` into Firestore documents. This is a one-time migration script.

### Step 2: MetaKursEditor Reads from Firebase

The admin panel (FR-045) already supports custom prompts via localStorage. Switch it to read/write from Firestore `prompts/` collection instead.

### Step 3: Express Proxy Reads from Firebase

Modify the TC-016 Express proxy to load prompts from Firestore instead of importing from `prompts.ts`. This validates the pattern before the Go migration.

### Step 4: Go Backend Takes Over

The Go backend reads prompts from Firebase and calls VertexAI. Express proxy is decommissioned.

### Step 5: Remove Hardcoded Prompts

Delete `frontend/services/prompts.ts`. All prompts live in Firebase.

---

## Consequences

### Benefits

- **Zero-downtime prompt updates** — Change a prompt in Firebase, it takes effect immediately
- **No API key exposure** — VertexAI uses service account auth, no key to leak
- **IAM-grade security** — GCP IAM controls who can invoke AI, with audit logs
- **Model flexibility** — Switch models by updating the PromptTemplate's `modelConfig.model` field
- **Agent orchestration** — Dynamic agent selection based on journey state
- **Full auditability** — Every AI call logged with prompt version, agent ID, and execution metadata
- **Admin control** — MetaKursEditor can edit prompts and agent configs in real-time
- **Cost visibility** — VertexAI billing is per-project with quotas, not per-key

### Trade-offs

- **Additional Firestore reads** — Every AI call reads 1-2 Firestore documents (prompt + agent config). Mitigated by Firestore SDK caching (sub-millisecond after first read).
- **VertexAI cold start** — First call in a new Cloud Run instance may be slower. Mitigated by min-instances=1 setting.
- **Complexity** — Prompt management in Firebase adds a new operational surface. Mitigated by admin UI (MetaKursEditor).
- **Firebase dependency** — Prompts in Firestore means Firebase is in the critical path for AI calls. Mitigated by SDK caching and fallback to last-known-good prompt in backend memory.

### Risks

- **Prompt injection via admin panel** — A compromised admin account could inject malicious prompts. Mitigation: prompt version history, audit log, role-based access.
- **VertexAI quota exhaustion** — High traffic could hit VertexAI quotas. Mitigation: per-user rate limiting in Go backend, monitoring alerts.
- **Firestore outage** — If Firestore is down, prompts can't be loaded. Mitigation: backend caches last-loaded prompts in memory with TTL.

---

## Alternatives Considered

### Keep Google AI Studio (API Key)

Simpler setup but blocked for production: API keys can't use IAM, can't be scoped per-user, and risk exposure. VertexAI is the production path for GCP.

### Store Prompts in PostgreSQL

Possible, but loses real-time sync to the admin panel. Would require polling or WebSocket infrastructure. Firebase gives us real-time out of the box.

### Store Prompts in Git (Code)

Current approach. Fast for development but requires redeploy for every prompt change. Not acceptable for iterating on prompts with educators and didactical experts.

### Client-Side VertexAI SDK

Google provides a VertexAI Web SDK, but it still requires authentication that involves server-side token exchange. The backend proxy is simpler and more secure.

---

## Dependencies

- [TC-016](TC-016-gemini-server-proxy.md) — API Gateway Architecture (Phase 1 baseline)
- [TC-017](TC-017-unified-data-model.md) — Unified data model (prompt entities added)
- [FR-024](../features/FR-024-multi-agent-reisebegleiter.md) — Multi-agent system (agent personas)
- [FR-045](../features/FR-045-meta-kurs-editor.md) — MetaKursEditor (admin prompt management)
- [FR-051](../features/FR-051-gemini-api-proxy.md) — Gemini API proxy (migration baseline)
- [TC-008](TC-008-auditierbare-methodik.md) — Auditable methodology (prompt logging)
- [DC-006](../../concepts/didactical/DC-006-reisebegleiter-agenten.md) — Reisebegleiter agent personas
- [DC-016](../../concepts/didactical/DC-016-vuca-reise-prompt-architecture.md) — Prompt architecture

## Notes

- The VertexAI Go SDK (`cloud.google.com/go/aiplatform`) uses Application Default Credentials on Cloud Run — zero config for auth.
- Prompt version numbers are integers, not semver. Each `PUT` to a prompt auto-increments.
- The orchestrator decision is logged as part of `agent_executions` for debugging agent transitions.
- TTS dialect support (6 German dialects) is preserved — the dialect is passed as a parameter in the AI call, not encoded in the prompt.
- Completion markers (`[REISE_VORSCHLAG]`, `[STATION_COMPLETE]`, etc.) are stored in the PromptTemplate, not hardcoded in the backend. This lets educators add new markers without code changes.
