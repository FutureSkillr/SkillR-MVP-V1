# TC-017: Unified Data Model

**Status:** draft
**Created:** 2026-02-19
**Entity:** SkillR

## Context

The MVP frontend stores user state in Firebase Firestore (`users/{uid}/state/{key}`) with localStorage fallback, while the Express dev-server uses SQLite for auth, sessions, analytics, and prompt logs. Legacy OpenAPI specs (server.yml, career-services.yml, honeycomb-services.yml, memory-services.yml) define unimplemented Go backend endpoints.

As the product grows from MVP into V1.0, we need a **unified data model** that:

1. Covers all 17 entity categories from the requirements (including prompt management and agent execution)
2. Classifies which existing Express API endpoints can be reused vs. must be replaced
3. Defines the new **skill-proof-profile-portfolio-api** — a Go backend service focused on profiles, portfolios, skill evidence, and endorsements
4. Documents the **agent-assisted backend** pattern for managing these services

This decision is needed because the current ad-hoc split between Firestore, SQLite, and frontend-only state will not scale to V1.0 requirements (endorsements, artifacts, job matching, DSGVO compliance, multi-user interactions).

## Decision

We adopt a **four-tier storage architecture** with 21 entity groups (14 domain + 3 agent/prompt management + 4 analytics), a phased API migration plan, and an agent-assisted backend pattern. All AI execution goes through a Go backend using VertexAI with service account auth (TC-018). Prompts are managed in Firebase Firestore, not hardcoded.

**Tier S (SOLID Pods)** is added as the canonical store for personal and company data (see [TC-019](TC-019-solid-pod-storage-layer.md)). Firestore becomes a reactive cache mirroring Pod data. PostgreSQL becomes a queryable index with materialized views.

---

## Four-Tier Storage Architecture

### Tier S — SOLID Pods (canonical personal/company data, user-sovereign)

SOLID Pods are the canonical store for all personal and company data. Data is stored as RDF (Turtle/JSON-LD) in Pod containers with WebACL access control. See [TC-019](TC-019-solid-pod-storage-layer.md) for the full Pod architecture, entity-to-Pod mapping, RDF vocabulary, sync architecture, and CSS deployment.

**User Pod entities:** UserState, VucaState, EngagementState, InterestProfile, UserPreferences, DsgvoConsent, ParentLink, Session, Interaction, PortfolioEntry, Endorsement, ExternalArtifact, ReflectionResult, SkillProfile.

**Company Pod entities:** JourneyDefinition, StationDefinition.

**Write path:** Go API → Pod (canonical) → Firestore (mirror, async) → PostgreSQL (index, async).

**Conflict rule:** Pod wins (canonical for personal data).

**Phased introduction:** No Pods in V1.0; CSS deployed in V1.5; Company Pods + BYOP in V2.0.

### Tier A — Firebase Firestore (real-time cache, mirrors Pod for frontend reactivity)

Firestore remains the primary store for real-time app state that the frontend reads/writes directly via the Firebase SDK. Data is scoped to `users/{uid}/`.

| Entity | Collection Path | Key Fields | Phase |
|--------|----------------|------------|-------|
| **UserState** | `users/{uid}/state/state` | view, interests[], journeyType, selectedStation, completedStations[], stationResults[], journeyStartedAt, profileData | MVP1 (done) |
| **VucaState** | `users/{uid}/state/vuca-state` | currentDimension, dimensionScores{}, completedDimensions[], chatHistory[], isComplete, bingoMatrix[][], reflectionResults[] | MVP1 (done) |
| **EngagementState** | `users/{uid}/state/engagement` | currentStreak, longestStreak, totalXP, level, levelTitle, lastActiveDate, weeklyXP, streakFreezeAvailable | MVP2 (done) |
| **InterestProfile** | `users/{uid}/state/interest-profile` | skillCategories[], topInterests[], topStrengths[], completeness, lastUpdated | MVP2 (done) |
| **UserPreferences** | `users/{uid}/state/preferences` | voiceDialect, voiceEnabled, audioMode, theme | MVP1 (done) |
| **DsgvoConsent** | `users/{uid}/consent/{consentId}` | type, version, grantedAt, parentEmail, parentVerified, withdrawnAt | V1.0 |
| **ParentLink** | `users/{uid}/parents/{parentId}` | parentUid, relationship, verified, linkedAt | V1.0 |
| **PromptTemplate** | `prompts/{promptId}` | name, category, systemInstruction, modelConfig{model, temperature, topP, topK, maxOutputTokens, responseMimeType, responseSchema}, completionMarkers[], version, isActive, tags[], createdBy, createdAt, updatedAt | MVP3 (TC-018) |
| **AgentConfig** | `agents/{agentId}` | name, role, promptIds[], activationRules{journeyStates, behavioralTriggers, minProfileCompleteness}, transitionRules{canTransitionTo, transitionConditions}, tone, temperature, isActive, createdAt, updatedAt | V1.0 (TC-018) |

**Firestore persistence pattern** (from `frontend/services/firestore.ts`):
- Always cache to localStorage immediately
- Sync to Firestore asynchronously with 500ms debounce
- On load: read Firestore first, fallback to localStorage
- Migration: `migrateLocalStorageToFirestore()` on first login

### Tier B — Go Backend PostgreSQL (structured, relational, queryable)

PostgreSQL (Cloud SQL) stores structured data that requires relational queries, cross-user access, or server-side computation. Accessed exclusively through the Go API.

| Entity | Table | Key Fields | Phase |
|--------|-------|------------|-------|
| **User** | `users` | id (UUID), email, display_name, role, auth_provider, photo_url, firebase_uid, age_group, dsgvo_consent_version, webid, pod_url, pod_provider, created_at, updated_at | MVP1 → V1.0 |
| **Session** | `sessions` | id, user_id, session_type, journey_type, station_id, started_at, ended_at | MVP1 (exists in SQLite) |
| **Interaction** | `interactions` | id, user_id, session_id, modality (text/voice/choice), user_input, assistant_response, timing{}, context{place, vuca_dims, journey_step}, profile_impact{}, timestamp | V1.0 |
| **PortfolioEntry** | `portfolio_entries` | id, user_id, source_interaction_ids[], skill_dimensions{}, evidence_type, summary, confidence, context{}, created_at | V1.0 |
| **Endorsement** | `endorsements` | id, learner_id, endorser_id, endorser_role, endorser_verified, skill_dimensions{}, statement, context, artifact_refs[], created_at | V1.0 |
| **ExternalArtifact** | `external_artifacts` | id, learner_id, artifact_type (photo/doc/video/link), description, skill_dimensions{}, storage_ref, endorsement_ids[], uploaded_at | V1.0 |
| **ReflectionResult** | `reflection_results` | id, user_id, station_id, question_id, response, response_time_ms, capability_scores{}, created_at | MVP2 (frontend-only now) |
| **SkillProfile** (computed) | `skill_profiles` | id, user_id, skill_categories[], top_interests[], top_strengths[], completeness, evidence_summary{}, last_computed_at | V1.0 |
| **JobPosting** | `job_postings` | id, title, company, location, required_skills{}, source, bundesagentur_id, created_at | V1.0 |
| **JobMatch** | `job_matches` | id, user_id, job_posting_id, match_score, matching_dimensions{}, created_at | V1.0 |
| **JourneyDefinition** | `journey_definitions` | id, type, title, subtitle, description, dimensions[], stations[], created_by, is_custom | MVP2 (frontend-only now) |
| **StationDefinition** | `station_definitions` | id, journey_id, title, description, setting, character, challenge, technique, dimensions[], coordinates{} | MVP2 (frontend-only now) |

### Tier C — Analytics/Observability (append-only, high-volume)

Append-only data for analytics, debugging, and audit trails. Stored in PostgreSQL initially; may move to BigQuery or dedicated time-series storage at scale.

| Entity | Table | Key Fields | Phase |
|--------|-------|------------|-------|
| **ClickstreamEvent** | `user_events` | id, event_type, browser_session_id, prompt_session_id, timestamp, properties{} | MVP1 (exists in SQLite) |
| **PromptLog** | `prompt_logs` | request_id, session_id, method, model_name, system_prompt, user_message, raw_response, status, latency_ms, token_count, timestamps | MVP1 (exists in SQLite) |
| **AgentExecution** | `agent_executions` | id, agent_id, prompt_id, prompt_version, user_id, session_id, trigger_event, input_summary, output_summary, model_name, latency_ms, token_count, status, created_at | V1.0 (TC-018) |
| **BlockchainAnchor** | `verification_anchors` | id, user_id, profile_snapshot_hash, anchored_at, chain_ref, verification_url | V2.0 |

---

## Entity Relationship Diagram

```
User (1) ──< Session (N) ──< Interaction (N)
User (1) ──< ReflectionResult (N)
User (1) ──< PortfolioEntry (N) ──> Interaction (N:M via source_interaction_ids)
User (1) ──< SkillProfile (1, latest computed)
User (1) ──< Endorsement (N, as learner)
User (1) ──< ExternalArtifact (N)
User (1) ──< EngagementState (1, Firestore)
User (1) ──< InterestProfile (1, Firestore)
Endorsement (N) ──> ExternalArtifact (M, via artifact_refs)
SkillProfile ──> PortfolioEntry (evidence chain)
SkillProfile ──> Endorsement (trust-weighted)
JobPosting (N) ──< JobMatch (N) >── User
JourneyDefinition (1) ──< StationDefinition (N)
PromptTemplate (1) ──< AgentConfig (N, via promptIds)
AgentConfig (1) ──< AgentExecution (N)
AgentExecution ──> PromptLog (1:1, linked audit trail)
AgentExecution ──> Session (N:1)
```

**Cross-tier relationships:**
- `User.firebase_uid` (Tier B) ↔ Firestore document path `users/{uid}` (Tier A)
- `User.webid` (Tier B) ↔ SOLID Pod root `/{webid}/` (Tier S) — see [TC-019](TC-019-solid-pod-storage-layer.md)
- `User.pod_url` (Tier B) → Pod base URL (managed: `pods.maindset.academy/{username}/`, or external BYOP URL)
- `Session.id` (Tier B) ↔ `PromptLog.session_id` (Tier C)
- `SkillProfile` (Tier B) is a computed view of `InterestProfile` (Tier A/S) enriched with evidence
- Tier A mirrors Tier S for real-time UI state; Tier B indexes Tier S for cross-user queries

---

## Existing API Endpoint Classification

The Express dev-server currently exposes **21 endpoints** across 5 route files. These are classified by migration strategy.

### REUSE AS-IS (keep in Express dev-server, migrate to Go later)

These endpoints work correctly and serve their purpose. They will be migrated to Go+PostgreSQL in V1.0 mid/end phase.

| # | Endpoint | Source File | Reason |
|---|----------|-------------|--------|
| 1 | `POST /api/analytics/events` | analytics.ts | Clickstream batch insert — works as-is |
| 2 | `GET /api/analytics/events` | analytics.ts | Event query with filters — works as-is |
| 3 | `GET /api/analytics/overview` | analytics.ts | Aggregated analytics dashboard — works as-is |
| 4 | `GET /api/analytics/sessions/:id` | analytics.ts | Session clickstream — works as-is |
| 5 | `GET /api/analytics/export-csv` | analytics.ts | CSV export — works as-is |
| 6 | `POST /api/prompt-logs` | promptLogs.ts | Prompt log recording — works as-is |
| 7 | `GET /api/prompt-logs` | promptLogs.ts | List with filters — works as-is |
| 8 | `GET /api/prompt-logs/stats` | promptLogs.ts | Aggregate stats — works as-is |
| 9 | `GET /api/prompt-logs/export-csv` | promptLogs.ts | CSV export — works as-is |

### MODIFY (keep but add fields/logic)

These endpoints need enhancement to support V1.0 requirements but can be modified in-place.

| # | Endpoint | Source File | Changes Needed |
|---|----------|-------------|---------------|
| 10 | `POST /api/auth/register` | auth.ts | Add firebase_uid field, age_group, DSGVO consent tracking |
| 11 | `POST /api/auth/login` | auth.ts | Return engagement state summary in response |
| 12 | `POST /api/auth/login-provider` | auth.ts | Add Apple/Meta providers, link to Firebase UID |
| 13 | `POST /api/auth/reset-password` | auth.ts | Implement actual email sending (currently logs only) |
| 14 | `GET /api/users` | users.ts | Add filters: role, age_group, journey progress |

### REPLACE (reimplement in new Go API)

These endpoints need fundamental changes and will be reimplemented in the Go portfolio API.

| # | Endpoint | New API Equivalent | Reason |
|---|----------|-------------------|--------|
| 15 | `POST /api/sessions` | `POST /api/v1/sessions` | Needs user_id association, interaction tracking, journey context |
| 16 | `GET /api/sessions` | `GET /api/v1/sessions` | Needs richer query: by journey, station, date range, user |
| 17 | `PATCH /api/sessions/:id/end` | `PUT /api/v1/sessions/:id` | Needs state sync with Firestore engagement |

### DEPRECATED (superseded by new API)

These endpoints will be superseded by more comprehensive implementations.

| # | Endpoint | Superseded By | Reason |
|---|----------|--------------|--------|
| 18 | `DELETE /api/users/:id` | New user lifecycle management | Needs DSGVO-compliant data deletion cascade |
| 19 | `PATCH /api/users/:id/role` | New role management | Needs Firebase custom claims sync |
| 20 | `DELETE /api/prompt-logs` | Admin API with audit trail | Bulk delete needs audit logging |
| 21 | `DELETE /api/analytics/events` | Admin API with audit trail | Bulk delete needs audit logging |

---

## New skill-proof-profile-portfolio-api

**Base path:** `/api/v1/portfolio`
**Tech:** Go (Echo Framework), PostgreSQL, Firebase Admin SDK
**Auth:** Firebase JWT token verification middleware
**OpenAPI Spec:** `integrations/api-spec/portfolio-api.yml`

### Domain: Profile

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/profile` | Get current user's computed skill profile | MVP2 → V1.0 |
| `POST` | `/profile/compute` | Trigger profile recomputation from all evidence | V1.0 |
| `GET` | `/profile/history` | Profile snapshots over time (growth visualization) | V1.0 |
| `GET` | `/profile/public/{userId}` | Public profile view (with consent) | V1.0 |
| `GET` | `/profile/export` | Export profile as PDF/JSON | V1.0 |

### Domain: Portfolio Evidence

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/evidence` | List all portfolio entries for current user | V1.0 |
| `GET` | `/evidence/{id}` | Get single evidence entry with interaction chain | V1.0 |
| `POST` | `/evidence` | Create evidence entry (auto or manual) | V1.0 |
| `GET` | `/evidence/by-dimension/{dim}` | Evidence filtered by skill dimension | V1.0 |
| `GET` | `/evidence/verify/{id}` | Public verification endpoint (with token) | V1.0 |

### Domain: Endorsements

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/endorsements` | List endorsements received | V1.0 |
| `POST` | `/endorsements/invite` | Send endorsement invitation (link/QR) | V1.0 |
| `POST` | `/endorsements` | Submit endorsement (endorser-facing) | V1.0 |
| `PUT` | `/endorsements/{id}/visibility` | Toggle endorsement visibility on profile | V1.0 |
| `GET` | `/endorsements/pending` | Pending endorsement requests | V1.0 |

### Domain: Artifacts

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `POST` | `/artifacts` | Upload external artifact (multipart) | V1.0 |
| `GET` | `/artifacts` | List user's artifacts | V1.0 |
| `GET` | `/artifacts/{id}` | Get artifact with endorsements | V1.0 |
| `DELETE` | `/artifacts/{id}` | Remove artifact | V1.0 |
| `POST` | `/artifacts/{id}/link-endorsement` | Link endorsement to artifact | V1.0 |

### Domain: Erinnerungsraum (Travel Journal)

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/journal` | Chronological journey narrative | V1.0 |
| `GET` | `/journal/station/{stationId}` | Interactions for a specific station | V1.0 |
| `GET` | `/journal/dimension/{dim}` | Journey filtered by VUCA dimension | V1.0 |
| `POST` | `/journal/interactions` | Record interaction (from frontend) | V1.0 |

### Domain: Engagement (Backend sync)

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/engagement` | Get engagement state (authoritative) | MVP2 → V1.0 |
| `POST` | `/engagement/award` | Award XP (server-validated) | V1.0 |
| `GET` | `/engagement/leaderboard` | League/leaderboard rankings | V1.0 |

### Domain: Reflection

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `POST` | `/reflections` | Submit reflection result | V1.0 |
| `GET` | `/reflections` | List user's reflection history | V1.0 |
| `GET` | `/reflections/capabilities` | Aggregated capability scores | V1.0 |

---

## Architecture: Agentic Backend with VertexAI

See [TC-018](TC-018-agentic-backend-vertexai.md) for the full agentic backend and VertexAI migration architecture.

```
+-----------------------------------------------------------+
|                    FRONTEND (Browser)                      |
|  TypeScript SPA -- direct Google API access where safe    |
+----------+------------------------+-----------------------+
           |                        |
     Direct (no keys)          REST API (JWT)
           |                        |
           v                        v
+-----------------+    +------------------------------------+
|  Firebase       |    |  Go Backend (Cloud Run)            |
|  (client SDK)   |    |                                    |
|                 |    |  +-------------------------------+ |
|  - Auth         |    |  | /api/v1/ai/*    (VertexAI)    | |
|  - Firestore    |    |  | /api/v1/portfolio/*           | |
|    - user state |    |  | /api/v1/sessions/*            | |
|    - prompts RO |    |  | /api/v1/prompts/*  (admin)    | |
|    - agents  RO |    |  | /api/v1/agents/*   (admin)    | |
|  - Storage      |    |  +------------+------------------+ |
|                 |    |               |                    |
+---------+-------+    |  +------------v------------------+ |
          |            |  |  PostgreSQL (Cloud SQL)       | |
          |            |  |  - profiles, evidence         | |
          |            |  |  - interactions, reflections  | |
    reads prompts      |  |  - agent_executions           | |
    + agent configs    |  |  - prompt_logs (audit)        | |
          |            |  +-------------------------------+ |
          |            |               |                    |
          +----------->|  +------------v------------------+ |
                       |  |  VertexAI (service account)   | |
                       |  |                               | |
                       |  |  Prompts loaded from Firebase | |
                       |  |  Models configured per prompt | |
                       |  |  ADC auth (no API keys)       | |
                       |  +-------------------------------+ |
                       |                                    |
                       |  +-------------------------------+ |
                       |  |  Agent Orchestrator           | |
                       |  |                               | |
                       |  |  - Entdecker-Agent            | |
                       |  |  - Reflexions-Agent           | |
                       |  |  - Skill-Agent                | |
                       |  |  - Match-Agent                | |
                       |  |  (configs from Firebase)      | |
                       |  +-------------------------------+ |
                       +------------------------------------+

Express Dev Server (KEEP for MVP3, decommission in V1.0):
  - /api/auth/*        -> Auth (SQLite, migrate to Go+PG later)
  - /api/analytics/*   -> Clickstream (SQLite, migrate later)
  - /api/prompt-logs/* -> Prompt logging (SQLite, migrate later)
  - /api/gemini/*      -> Gemini proxy (TC-016, replace with Go+VertexAI)
```

**Key principle:** The client connects directly to Google APIs (Firebase Auth, Firestore, Storage) where no secret keys are needed. All key-protected operations (VertexAI, external APIs, email) go through the Go backend with service account auth.

### Agent-Assisted Pattern Details

Each agent service is a Go module that reads its config and prompts from Firebase and calls VertexAI via service account auth (no API keys):

- **Profile Computation Agent** (`agents/skill-agent`, `prompts/profile-computation-v1`): Triggered when a station is completed or evidence is added. Reads raw interaction data, reflection results, and endorsements from PostgreSQL. Loads prompt from Firebase. Calls VertexAI to compute updated `SkillProfile` with weighted evidence chains. Ports logic from `frontend/services/interestProfile.ts:computeInterestProfile()`.

- **Evidence Extraction Agent** (`prompts/evidence-extraction-v1`): Triggered when an interaction session ends. Analyzes conversation transcript via VertexAI to identify skill demonstrations. Creates `PortfolioEntry` records with confidence scores and dimension mappings.

- **Endorsement Verification Agent**: Triggered when an endorsement is submitted. Verifies endorser identity, checks for conflicts of interest. Assigns trust weight per TC-009 trust levels.

- **Job Matching Agent** (`agents/match-agent`, `prompts/job-matching-v1`): Triggered on profile update or new job posting. Calls VertexAI to compute dimension-wise match scores between `SkillProfile` and `JobPosting`. Implements Gegensatzsuche (contrasting suggestions) per DC-003.

- **Content Grounding Agent**: Triggered on interaction recording. Enriches interactions with geographic data (TC-001), Wikipedia context (TC-002), and job portal references (TC-003).

**Execution model:**
- Agents are triggered by API events (e.g., station complete -> profile recomputation)
- Agent configs and prompts are loaded from Firebase Firestore at runtime (TC-018)
- AI execution goes through VertexAI with service account auth (no API keys)
- Agents read structured data from PostgreSQL, write computed results back
- Every agent execution is logged in `agent_executions` + `prompt_logs` for auditability (TC-008)
- Agents can be invoked manually via admin API (`POST /api/v1/agents/{id}/invoke`) for debugging
- Each agent call is idempotent — re-triggering produces the same result
- Prompt changes in Firebase take effect immediately without redeploy

---

## Migration Strategy

### Phase 1: MVP2 (Done) — Current State
- Express + SQLite for auth/analytics/prompt-logs
- Frontend writes to Firestore directly for app state
- Profile computation happens client-side in `interestProfile.ts`
- Prompts hardcoded in `frontend/services/prompts.ts`
- No Go backend deployed

### Phase 2: MVP3 — Gemini Proxy + Prompts to Firebase
- Express Gemini proxy deployed (TC-016, FR-051)
- Prompts migrated from code to Firebase Firestore
- MetaKursEditor (FR-045) reads/writes prompts from Firebase
- Express proxy loads prompts from Firebase at runtime
- API key stays in Express env var (not in browser)

### Phase 3: V1.0 Start — Go Backend + VertexAI
- Deploy Go API alongside Express on Cloud Run
- Go backend uses VertexAI with service account auth (no API key)
- New endpoints: `/api/v1/ai/*`, `/api/v1/portfolio/*`, `/api/v1/agents/*`
- PostgreSQL (Cloud SQL) deployed for structured data
- Frontend calls both Express (auth/analytics) and Go (AI/portfolio)
- Agent orchestrator reads configs from Firebase

### Phase 4: V1.0 Mid — Auth Migration + Express Decommission
- Migrate auth to Go (Firebase Admin SDK for JWT verification)
- Migrate analytics/prompt-logs to Go + PostgreSQL
- Decommission Express server and Gemini proxy entirely
- All endpoints served by Go API via VertexAI

### Phase 5: V1.0 End — Full Agentic Backend
- All 4 agent personas active (Entdecker, Reflexions, Skill, Match)
- Agent orchestrator manages transitions
- Evidence extraction and profile computation run server-side
- Job matching via VertexAI

### Phase 5.5: V1.5 — SOLID Pod Introduction (TC-019)
- Deploy Community Solid Server (CSS) on Cloud Run at `pods.maindset.academy`
- Provision managed Pods for new users at registration
- Dual-write: Go API writes to Pod (canonical) AND Firestore/PostgreSQL (existing)
- Migrate existing users from Firestore to Pods (background job)
- Add `webid`, `pod_url`, `pod_provider` columns to `users` table
- Pod is write-ahead canonical but not yet read-primary

### Phase 6: V2.0 — Scale + Federation
- Full Go backend with VertexAI
- Firestore remains for real-time app state + prompt management
- BigQuery for analytics at scale
- Blockchain anchoring for verification (TC-010)
- Company Pods for organization-owned journey content (TC-019)
- BYOP support: users can link external Pod providers (TC-019)
- Federated discovery across Company Pods
- Pod-primary reads for non-mirrored entities

---

## Consequences

### Benefits
- **Single source of truth** per entity — no more ambiguity about where data lives
- **Clear migration path** from MVP to production with no big-bang rewrite
- **Relational queries** for cross-user features (leaderboards, job matching, endorsements)
- **Agent-assisted computation** moves expensive AI work server-side
- **DSGVO compliance** via proper consent tracking and data deletion cascades
- **Evidence chains** from raw interactions through to profile claims (TC-007, TC-009)

### Trade-offs
- **Two databases** (Firestore + PostgreSQL) during V1.0, requiring sync discipline
- **Two API servers** (Express + Go) during migration, requiring frontend routing
- **Data duplication** — some profile data exists in both Firestore (real-time) and PostgreSQL (authoritative)
- **Complexity** — agent services add operational overhead but are necessary for V1.0 features

### Mitigation
- Firestore is the "fast cache" and PostgreSQL is the "source of truth" — conflicts resolve in favor of PostgreSQL
- API gateway handles routing between Express and Go transparently
- Profile sync runs on a schedule + event triggers to keep Firestore current

---

## Alternatives Considered

### 1. Firestore-only (no PostgreSQL)
Rejected because Firestore lacks relational queries needed for job matching, cross-user endorsements, and leaderboard rankings. Also makes DSGVO data deletion cascades difficult.

### 2. SQLite in production (keep Express)
Rejected because SQLite doesn't support concurrent writes needed for multi-user features and lacks the query capabilities for complex joins.

### 3. Big-bang migration (replace everything at once)
Rejected because it would block MVP2 development and introduce high risk. Phased migration allows incremental validation.

### 4. Separate microservices per domain
Rejected for MVP/V1.0 as over-engineering. A single Go monolith with domain packages provides the same separation without operational complexity. Can split later if needed.

---

## Dependencies

- [TC-019](TC-019-solid-pod-storage-layer.md) — SOLID Pod decentralized storage layer (defines Tier S, Pod architecture, auth bridge, sync, and migration)
- [TC-018](TC-018-agentic-backend-vertexai.md) — Agentic backend and VertexAI migration (defines prompt management, agent orchestration, and VertexAI execution)
- [TC-016](TC-016-gemini-server-proxy.md) — API Gateway Architecture (MVP3 baseline, evolves to Go+VertexAI in V1.0)
- [TC-004](TC-004-multimodal-storage-layer.md) — Interaction data model (defines `interactions` table schema)
- [TC-007](TC-007-portfolio-evidence-layer.md) — Portfolio evidence layer (defines `portfolio_entries` and evidence chain)
- [TC-008](TC-008-auditierbare-methodik.md) — Auditable methodology (defines `prompt_logs` audit requirements)
- [TC-009](TC-009-multimodaler-erinnerungsraum.md) — Multimodal memory space (defines endorsement trust model and artifact types)
- [TC-010](TC-010-blockchain-learning-records.md) — Blockchain verification (defines `verification_anchors`)
- [TC-013](TC-013-firestore-persistence-strategy.md) — Firestore persistence strategy (defines Tier A patterns)
- [TC-014](TC-014-engagement-system-data-model.md) — Engagement data model (defines engagement state schema)
- [FR-008](../features/FR-008-interest-profile.md) — Interest profile generation
- [FR-014](../features/FR-014-interest-profile-v2.md) — Interest profile v2 with skill categories
- [FR-017](../features/FR-017-job-navigator.md) — Job navigator integration
- [FR-020](../features/FR-020-level2-reflection.md) — Level 2 reflection engine

## Notes

- The 21 existing Express endpoints were inventoried from `frontend/server/routes/*.ts` on 2026-02-19
- The current SQLite schema (4 tables: users, sessions, user_events, prompt_logs) from `frontend/server/db.ts` maps directly to Tier B + Tier C tables
- Skill categories in the profile model match the frontend implementation: hard-skills, soft-skills, future-skills, resilience (from `frontend/services/interestProfile.ts`)
- XP actions and level thresholds from `frontend/types/engagement.ts` are preserved in the engagement model
- The OpenAPI specification for the new API is at `integrations/api-spec/portfolio-api.yml`
