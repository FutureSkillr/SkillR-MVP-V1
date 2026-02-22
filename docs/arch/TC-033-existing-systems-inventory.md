# TC-033: Existing Systems Inventory — Backend Toolset for Lernreise Management

**Status:** accepted
**Created:** 2026-02-21

## Context

The Future SkillR ecosystem is built on top of three existing Python-based systems that were developed independently under different project names. Before we can design a unified Go-based backend toolset for **maindfull.LEARNING**, we need a comprehensive inventory of what exists, what each system does, and which capabilities we want to carry forward.

This document captures the state of three source systems as inspected on 2026-02-21.

---

## System 1: aims-core (maindset.ACADEMY Main Service)

**Location:** `/Users/kamir/GITHUB.active/my-ai-X/aims-core`
**Language:** Python 3.12 (Flask 3.0.3 + FastAPI)
**Scale:** 827 Python files, 35+ modules, 282+ API endpoints, 119 dependencies

### Purpose

The production backend for the **maindset.ACADEMY** platform. A monolithic Flask application that handles authentication, learning journeys, memory synthesis, AI agents, certification, payments, and organizational role management.

### Architecture

| Layer | Technology |
|-------|-----------|
| Web Framework | Flask 3.0.3 (primary), FastAPI (plm-service) |
| API Style | REST, OpenAPI/Connexion |
| Database | Google Firestore (15+ collections) |
| Knowledge Graph | Neo4j |
| Vector DB | LanceDB (RAG) |
| Session Store | Redis |
| Auth | Firebase Auth, Google OAuth, OIDC |
| AI | Google Gemini, OpenAI, Ollama (via LiteLLM) |
| Payments | Stripe |
| Email | SendGrid, Gmail, Outlook/MS Graph |
| Deployment | Google Cloud Run (europe-north1), Cloud Build |

### Module Inventory

#### Learning & Onboarding (Relevant to Lernreise)

| Module | Purpose | Key Models | Relevance |
|--------|---------|-----------|-----------|
| **`hoc/`** (Honeycomb) | Lernreise management with 22+ routes. Task/module state machine, course progress, demo implementations (Magenta, Segeln themes) | `HoneycombModuleTask`, `HoneycombModule`, `HoneycombData` | **Critical** — core Lernreise engine |
| **`plm/`** | Project Lifecycle Management — dual-mode onboarding/project interface | — | Medium — onboarding flow |
| **`lernpfadgestaltung/`** | Learning path design (legacy) | — | Reference only |

#### Memory & Knowledge (Relevant to Erinnerungsraum)

| Module | Purpose | Key Models | Relevance |
|--------|---------|-----------|-----------|
| **`synthesis/`** | Memory Synthesis Studio — multi-prompt engine, template storage, usage quotas | Templates, Prompts | **Critical** — memory processing |
| **`memory/`** | Memory routes and storage | — | **Critical** — ER1 data layer |
| **`agents/`** | Next Best Action Agent — suggests next steps from memory items | Suggestions, Feedback | High — AI recommendation |
| **`assistant/`** | Personal Assistant with RAG — sentence transformers, LanceDB, Whoosh search | Embeddings, Index | High — semantic search |
| **`docservice/`** | Document handling (37 routes) — file upload, Neo4j knowledge graph, Erinnerungsraum visualization | Documents, Graphs | High — document processing |
| **`audioassistant/`** | Audio recording and AI processing (52+ routes) — transcription, action creation | Transcriptions, Actions | High — multimodal input |

#### Business & Platform

| Module | Purpose | Relevance |
|--------|---------|-----------|
| **`payments/`** | Stripe subscriptions, pricing, webhooks | Reference (future) |
| **`delegation/`** | Task delegation with role registry, audit logging | Reference |
| **`organizational_roles/`** | RBAC with 6-level hierarchy | Reference |
| **`p4te_v3/`** | Pass-to-Earn certification/badge system | Reference (future) |
| **`solidapp/`** | INRUPT Solid Pod integration | High — data portability |
| **`survey2/`** | Modern survey system with PDF generation | Medium |
| **`llm/`** | LLM provider configuration (multi-provider) | High — AI config |

#### Infrastructure & Integration

| Module | Purpose | Relevance |
|--------|---------|-----------|
| **`core/`** | App initialization, auth, sessions, CSRF | Reference |
| **`admin/`** | Admin panel | Reference |
| **`trello/`**, **`mailclient/`**, **`mailer/`** | External integrations | Low |
| **`qrcodes/`** | QR code generation for badges | Low |
| **`youtubesummarizer/`** | YouTube content processing | Low |

### Key API Groups (for Lernreise/ER1 Scope)

```
# Honeycomb / Lernreise
GET/POST /hoc/*                    — Course and task management

# Memory / Synthesis
GET  /api/synthesis/quota-status   — Usage quota
GET  /api/synthesis/templates      — Template listing
POST /api/synthesis/execute        — Run synthesis prompt

# Agents
GET  /api/agents/next-best-steps   — AI suggestions
GET  /api/agents/suggestions       — View suggestions
POST /api/agents/feedback          — Feedback on suggestions

# Personal Assistant (RAG)
POST /api/assistant/ask            — Ask with RAG context
GET  /api/assistant/search         — Semantic search
POST /api/assistant/index          — Index content

# Documents & Memory
GET  /docs                         — Document listing
POST /upload_doc                   — Upload document
GET  /show-memory/{ctx_id}/{doc_id} — View memory item
```

### Data Model (Firestore Collections)

| Collection | Purpose | Entity |
|-----------|---------|--------|
| `users` | User accounts and profiles | SkillR (app) |
| `smart-audio-transcriptions` | Memory items from audio | maindfull.LEARNING |
| `next_best_action_suggestions` | Agent suggestions | maindfull.LEARNING |
| `synthesis_templates` | Memory synthesis templates | maindfull.LEARNING |
| `delegations` | Task assignments | SkillR (app) |
| `roles` | Organizational roles | SkillR (app) |
| `certifications` | P4TE certificates | maindset.ACADEMY |
| `subscriptions` | User plans | SkillR (app) |
| `memory_items` | General memory storage | maindfull.LEARNING |

### Security

- Firebase Auth + Google OAuth + OIDC
- Flask-Login sessions (Redis-backed)
- RBAC with 6-level hierarchy
- SHPI-1.0 security hardening (11 fixes implemented)
- Flask-Limiter rate limiting
- CSRF protection (Flask-WTF)
- Input validation and HTML sanitization (Bleach)

---

## System 2: hoc-stage (Honeycomb Lernreise Editor)

**Location:** `/Users/kamir/GITHUB.scalytics/sparc2/scalytics-connect-examples/hoc-stage`
**Language:** Python 3.11+ (FastAPI + Typer CLI)
**Scale:** 53 Python files, 14 feature requests, full CLI + REST API

### Purpose

A CLI and REST API tool for **authoring, validating, and publishing** structured learning paths (Lernreisen). This is the **content creation toolset** — trainers and curriculum developers use it to build courses that are then consumed by the Honeycomb module in aims-core.

### Architecture

| Layer | Technology |
|-------|-----------|
| CLI Framework | Typer 0.12.3 |
| API Framework | FastAPI 0.116.1 |
| Data Validation | Pydantic 2.5.3 |
| Database | Google Firestore (publishing target) |
| Vector DB | LanceDB 0.24.3 (RAG for content suggestions) |
| AI | LiteLLM 1.75.9 (Scalytics Connect API) |
| Embeddings | sentence-transformers 5.1.0 |
| Content Format | YAML + Markdown with frontmatter |
| Graph Analysis | NetworkX 3.3 (dependency trees) |
| Visualization | D3.js hexagon layout (hoc-plane) |

### Core Capabilities

#### 1. Content Authoring (Composer Mode)

File-based course authoring using YAML + Markdown:

```
learning_paths/
├── {course_id}/
│   ├── course.yml              # Course metadata
│   ├── {module_id}/
│   │   ├── module.yml          # Module metadata
│   │   └── tasks/
│   │       └── {task_id}.md    # Task with YAML frontmatter
```

**CLI Commands:**
- `hoc-stage composer init` — Initialize workspace
- `hoc-stage composer validate` — Validate against Pydantic schemas
- `hoc-stage composer build` — Build `publication.json`
- `hoc-stage composer tree` — Display dependency graph (with cycle detection)

#### 2. Publishing (Coach Mode)

Publish validated content to Firestore:

- `hoc-stage coach configure` — Set Firestore credentials
- `hoc-stage coach publish [--dry-run] [--force]` — Upload to Firestore

**Target Collections:** `lernpfad_liste` (user lists), `lernpfad_template` (templates)

#### 3. AI-Assisted Content Generation (LLM Mode)

LLM-powered task suggestions using RAG:

- `hoc-stage llm build-rag-index` — Index content into LanceDB
- `hoc-stage llm suggest-task "<draft>"` — Generate task suggestion
- `hoc-stage llm list-candidates` — Review AI suggestions
- `hoc-stage llm accept-candidate <id>` — Accept into course
- `hoc-stage llm reject-candidate <id>` — Reject with feedback

**Workflow:** Draft → Embed → RAG Search → LLM Prompt → Structured JSON → Review → Accept/Reject

#### 4. Content Import (Ingest Mode)

- `hoc-stage ingest from-py <path> <var_name>` — Import from Python dicts

#### 5. REST API (Headless Mode)

FastAPI endpoints for programmatic access:

```
GET    /courses                    — List courses
GET    /courses/{course_id}        — Get course
POST   /courses                    — Create course
PUT    /courses/{course_id}        — Update course
PUT    /courses/{course_id}/field  — Update field

GET    /viewer/courses             — HTML viewer (all)
GET    /viewer/courses/{course_id} — HTML viewer (single)

# Same pattern for /modules/* and /tasks/*
```

### Data Models (Pydantic)

```python
class Task(BaseModel):
    id: str                           # e.g. "course-1.module-1.task-01"
    name: str
    name_short: Optional[str]
    description_short: Optional[str]
    description: Optional[str]
    state: Optional[str]              # OPEN → IN_PROGRESS → SUBMITTED → COMPLETED
    sources: List[Source]
    answer_placeholder_s: Optional[str]
    memory_id: Optional[str]          # Links to Erinnerungsraum
    module_id: Optional[str]
    content: Optional[str]            # Markdown body

class Module(BaseModel):
    id: str
    app: str
    name_short: str
    name: str
    duration: str
    severity: str
    badge: bool
    requirements_modules: List[str]   # Prerequisites
    goals_modules: List[str]          # Successors
    tasks: List[Task]
    # State: LOCKED → OPEN → COMPLETED

class Course(BaseModel):
    id: str
    app: str
    name: str
    version: str
    published_date: Optional[str]
    modules: List[Module]
    # State: NOT_STARTED → IN_PROGRESS → COMPLETED
```

### State Machine

```
Task:    OPEN → IN_PROGRESS → SUBMITTED → COMPLETED
Module:  LOCKED → OPEN → COMPLETED
Course:  NOT_STARTED → IN_PROGRESS → COMPLETED
```

### Validation Rules

| Rule | Description |
|------|------------|
| SchemaValidationRule | Pydantic model conformance |
| UniqueIDValidationRule | No duplicate IDs across all entities |
| RequirementsModulesValidationRule | All prerequisites exist |
| GoalModuleValidationRule | All successor references valid |
| Cycle Detection | NetworkX graph analysis with auto-break |

### Feature Requests (FR-HOC-*)

| FR | Title | Status |
|----|-------|--------|
| FR-HOC-1 | Core CLI and Composer Mode | Implemented |
| FR-HOC-2 | Coach Mode for Publishing | Implemented |
| FR-HOC-3 | Learning Path Tree View | Implemented |
| FR-HOC-4 | Interactive Shell | Implemented |
| FR-HOC-5 | Advanced Shell Features | Partial |
| FR-HOC-6 | Content Ingestion from Python | Implemented |
| FR-HOC-7 | Configurable Icons | Planned |
| FR-HOC-8 | Advanced Editing | Planned |
| FR-HOC-9 | Publishing Status & Browser | Planned |
| FR-HOC-10 | User Context | Planned |
| FR-HOC-11 | Headless API | Implemented |
| FR-HOC-12 | AI-Assisted Web Editor | Partial |
| FR-HOC-13 | LLM-Powered Task Candidates | Implemented |
| FR-HOC-14 | Scalytics Connect Integration | Implemented |

---

## System 3: confluent_topic_manager / CTM (Erinnerungsraum-Manager)

**Location:** `/Users/kamir/GITHUB.scalytics/sparc2/scalytics-connect-examples/confluent_topic_manager`
**Language:** Python 3.11+ (argparse CLI + Textual TUI)
**Scale:** 20+ command modules, 12 SQLite tables, 17 command groups, 27 spec files

### Purpose

A context-driven CLI tool that bridges **Confluent Kafka management** with an external **Erinnerungsraum (Memory Space)** API, providing AI-powered insights extraction and automated report generation. The "ER1 synchronization" capability lives here.

### Architecture

| Layer | Technology |
|-------|-----------|
| CLI Framework | argparse (built-in) |
| TUI | Textual (interactive shell) |
| Database | SQLite (app-context-state.db) |
| Vector DB | LanceDB |
| AI | LiteLLM (OpenAI-compatible) |
| Embeddings | OpenAI text-embedding-ada-002 |
| Message Queue | Confluent Kafka |
| Document Gen | Jinja2 + WeasyPrint (HTML/PDF) |
| Cloud APIs | Google Drive, Gmail |
| Formatting | Rich (terminal tables/trees) |
| Config | YAML + .env |

### Core Capabilities

#### 1. Memory Space Synchronization (Erinnerungsraum-Manager)

Syncs multimodal items (text, audio, images) from an external Memory Space API into local SQLite:

```bash
ctm memory-space add --url <URL> --user-context <CTX> --tags <TAGS>
ctm memory-space sync [--limit N] [--force]
ctm memory-space resync [--limit N] [--force]
ctm memory-space list
ctm memory-space view [--today|--yesterday|--last-week]
ctm memory-space ping
```

**Sync Flow:**
1. Configure link to Memory Space API (URL + user context + tags)
2. Fetch items via REST: `GET /memory/{context_id}`
3. Download media (audio/images) for tagged items
4. Store in SQLite `synchronized_items` table
5. Track deletions in `deleted_memory_items`
6. Log operations in `memory_space_operation_log`

#### 2. AI-Powered Report Generation (Journal Processor)

Automated reports from synchronized memory items:

```bash
ctm memory-space journal --week 2025-W42 [--distribute] [--gdrive]
ctm memory-space daily-review [--date DATE] [--yesterday]
ctm memory-space monthly-review [--month YYYY-MM]
```

**Pipeline:**
1. Load memory items filtered by date range
2. LLM clustering (group related items)
3. LLM summarization (per-cluster narratives)
4. LLM overall narrative generation
5. Jinja2 template rendering (HTML)
6. WeasyPrint PDF generation
7. Optional: Upload to Google Drive, create Gmail draft

**Report Types:** Weekly sprint journal, daily review, monthly retrospective

#### 3. Actionable Insights Processor

Batch-scan memory items for actionable content:

```bash
ctm memory-space insights scan-all [--type TYPE] [--force] [--show-changes]
ctm memory-space insights view [--type TYPE] [--changed-only]
ctm memory-space insights run [--date DATE] [--force]
```

**Action Types Detected:** Email drafts, feature requests, decisions, tasks, follow-ups

**Change Tracking:** Version history with substantial vs. cosmetic change detection

#### 4. AI Stack Management

Manage LLM prompts and personas:

```bash
ctm aistack connect --url <URL> --api-key <KEY>
ctm aistack sysprompt select
ctm aistack taskprompt list
ctm aistack taskprompt run --prompt-name <NAME> --topic <TOPIC>
```

**Personas:** `kafka_operator`, `trainer_curriculum_developer`
**Tasks:** `summarize_topic`, `summarize_with_issue_detection`, `process_meeting_transcript`

All LLM calls logged in `aicall_history` table for audit.

#### 5. Context Management

Multi-project isolation with Git-based versioning:

```bash
ctm context create <name>
ctm context list
ctm context select <name>
ctm context clone <source> <target>
ctm context snapshot
```

Each context gets its own SQLite database, config, and sync state.

#### 6. Confluent Kafka Management (Original Purpose)

Declarative topic management via inventory YAML:

```bash
ctm topics apply          # Sync inventory to cluster
ctm topics list           # List topics
ctm mirror create         # Setup topic mirroring
ctm workload run          # Performance testing
```

### Data Model (SQLite Tables)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `memory_space_links` | Configured ER connections | api_url, user_context, tags, last_sync |
| `synchronized_items` | Downloaded memory items | original_id, content, image_data, audio_data, metadata |
| `deleted_memory_items` | Deletion tracking | original_id, deletion_timestamp |
| `memory_space_operation_log` | Sync audit trail | operation_type, status, items_synced |
| `action_items` | Identified insights | type, description, next_step, status, version |
| `action_item_history` | Version tracking | change_type, is_substantial |
| `aicall_history` | LLM audit log | prompt_name, request/response, tokens |
| `settings` | Global config | key-value pairs |
| `context_settings` | Per-context config | key-value pairs |
| `journal_recipients` | Email distribution | email, report_type, name |
| `report_settings` | Report preferences | report_type, language, schedule |
| `report_tag_blacklist` | Excluded tags | context_name, tag |

### External API (Memory Space)

```
GET  /memory/{context_id}           — List items
GET  /memory/{context_id}/{item_id} — Get item details
GET  /memory/{context_id}/{item_id}/audio — Download audio
GET  /memory/{context_id}/{item_id}/image — Download image
Auth: X-API-KEY header
```

### Specification Documents (spec/)

| Spec | Title |
|------|-------|
| FR-001 to FR-N | Feature requirements (27 files) |
| FR-MEMORY-SPACE | Memory Space integration spec |
| FR-MemorySpace-Insights | Insights processor spec |
| SD-MemorySpace-Insights | System design for insights |
| DATA-MODEL | Entity-relationship diagrams |
| PLAN | Project roadmap |

---

## Cross-System Relationships

```
┌─────────────────────────┐
│   maindset.ACADEMY      │  ← User-facing brand
│   (aims-core / Flask)   │
│                         │
│  ┌───────────────────┐  │
│  │ HOC Module        │◄─┼──── Published courses from hoc-stage
│  │ (Lernreise Engine)│  │
│  └───────┬───────────┘  │
│          │              │
│  ┌───────▼───────────┐  │
│  │ Memory / Synthesis│◄─┼──── Synced items from CTM (ER1)
│  │ (Erinnerungsraum) │  │
│  └───────┬───────────┘  │
│          │              │
│  ┌───────▼───────────┐  │
│  │ Agents / RAG      │  │
│  │ (AI Suggestions)  │  │
│  └───────────────────┘  │
└─────────────────────────┘
          ▲ ▲
          │ │
    ┌─────┘ └─────────────────────┐
    │                             │
┌───┴──────────────┐  ┌──────────┴──────────┐
│  hoc-stage       │  │  CTM                │
│  (Lernreise      │  │  (Erinnerungsraum-  │
│   Editor)        │  │   Manager)          │
│                  │  │                     │
│  Composer → Build│  │  Sync → Process     │
│  Validate → Tree │  │  Insights → Report  │
│  LLM Suggest     │  │  AI Stack → Journal │
│  Publish → Fire. │  │  Vector DB → Search │
└──────────────────┘  └─────────────────────┘
```

### Data Flow

1. **Content Creation:** Trainers use `hoc-stage` CLI to author Lernreise content (YAML+MD)
2. **Validation:** Content validated against Pydantic schemas, dependency graph checked
3. **AI Enhancement:** LLM generates task candidates via RAG on existing content
4. **Publishing:** Validated content published to Firestore (`lernpfad_template`)
5. **Consumption:** aims-core HOC module loads published courses for users
6. **Memory Capture:** User interactions generate memory items (audio, text, images)
7. **ER1 Sync:** CTM syncs memory items from Memory Space API to local SQLite
8. **Insights:** CTM scans synced items for actionable insights using LLM
9. **Reports:** CTM generates weekly/daily/monthly journals from memory items
10. **Feedback Loop:** Insights inform new Lernreise content creation

### Shared Concepts

| Concept | aims-core | hoc-stage | CTM |
|---------|-----------|-----------|-----|
| Lernreise | Runtime engine (HOC) | Authoring tool | Referenced in reports |
| Erinnerungsraum | Storage + visualization | memory_id links | Sync + insights |
| Honeycomb | UI module name | Editor brand name | — |
| State Machine | Task states in HOC | Same model in builder | — |
| RAG | Personal assistant | Content suggestions | Insights enrichment |
| LLM Integration | Gemini + OpenAI | Scalytics Connect | LiteLLM (OpenAI-compatible) |
| Firestore | Primary database | Publishing target | — |
| Pydantic Models | HoneycombData etc. | Course/Module/Task | — |
| Vector DB | LanceDB (assistant) | LanceDB (suggestions) | LanceDB (embeddings) |

### Shared Dependencies (Python)

| Package | aims-core | hoc-stage | CTM |
|---------|-----------|-----------|-----|
| litellm | ✓ | ✓ | ✓ |
| lancedb | ✓ | ✓ | ✓ |
| sentence-transformers | ✓ | ✓ | — |
| pydantic | ✓ | ✓ | — |
| firebase-admin | ✓ | ✓ | — |
| rich | — | ✓ | ✓ |
| jinja2 | ✓ | ✓ | ✓ |
| python-dotenv | ✓ | ✓ | ✓ |
| pyyaml | — | ✓ | ✓ |

---

## Capabilities to Carry Forward (Go Rewrite Scope)

### Priority 1 — Core Lernreise Management (from hoc-stage)

| Capability | Source | Go Target |
|-----------|--------|-----------|
| Course/Module/Task CRUD | hoc-stage composer | `lernreise-cli` or API |
| YAML+MD content format | hoc-stage loader | Same format, Go parser |
| Pydantic validation | hoc-stage validator | Go struct validation |
| Dependency graph | hoc-stage tree (NetworkX) | Go graph library |
| Publication build | hoc-stage builder | Go JSON builder |
| Firestore publish | hoc-stage coach | Go Firebase SDK |
| REST API | hoc-stage FastAPI | Go Echo endpoints |

### Priority 2 — ER1 Synchronization (from CTM)

| Capability | Source | Go Target |
|-----------|--------|-----------|
| Memory Space API client | CTM memory_space_client | Go HTTP client |
| Item sync (text/audio/image) | CTM memory_space.py | Go sync service |
| Local persistence | CTM SQLite | Go SQLite or bbolt |
| Incremental sync | CTM sync logic | Go sync with checkpoints |
| Deletion tracking | CTM deleted_memory_items | Go soft-delete tracking |
| Operation logging | CTM operation_log | Go structured logging |

### Priority 3 — AI-Powered Processing (from both)

| Capability | Source | Go Target |
|-----------|--------|-----------|
| LLM prompt execution | CTM aistack, hoc-stage llm | Go LLM client |
| RAG indexing | hoc-stage rag_manager | Go embedding + vector |
| Task candidate generation | hoc-stage candidate_manager | Go candidate service |
| Insights extraction | CTM insights.py | Go insights processor |
| Report generation | CTM journal_processor | Go report generator |

### Priority 4 — Supporting Tools (from CTM)

| Capability | Source | Go Target |
|-----------|--------|-----------|
| Context management | CTM context.py | Go config management |
| Secrets management | CTM secrets.py | Go secrets (GCP SM) |
| Google Drive upload | CTM gdrive_client | Go Drive SDK |
| Email distribution | CTM gmail_client | Go email client |
| Audit logging | CTM aicall_history | Go audit trail |

---

## Consequences

### Benefits of Consolidation

1. **Single language (Go)** aligns with the maindfull.LEARNING engine stack
2. **Unified data models** eliminate inconsistencies between systems
3. **Single deployment** reduces operational complexity
4. **Type safety** from Go replaces runtime Pydantic validation
5. **Better performance** for sync and batch processing operations
6. **Shared auth/config** with the maindfull.LEARNING engine

### Risks

1. **Large migration scope** — three systems with significant functionality
2. **Python AI ecosystem** is more mature — Go LLM libraries less established
3. **Loss of interactive shell** — Textual TUI has no Go equivalent
4. **Learning curve** — team familiar with Python, less with Go
5. **Parallel maintenance** during migration period

### Mitigation

- Phased migration: Priority 1 → 2 → 3 → 4
- Keep Python systems running during transition
- Use Go's `os/exec` for LLM calls if Go libraries insufficient
- Consider Go CLI frameworks (Cobra) for interactive features

---

## Alternatives Considered

1. **Keep Python, add Go API gateway** — Rejected: two languages in production
2. **Rewrite everything at once** — Rejected: too risky, phased approach preferred
3. **Use Rust instead of Go** — Rejected: Go already established for maindfull.LEARNING engine
4. **Microservices per tool** — Deferred: start monolithic, split later if needed

---

## Related

- TC-034: Backend Toolset Migration Strategy (Go rewrite plan)
- TC-028: Lernreise Tracking Concept
- FR-074: Lernreise Catalog Selection
- FR-075: Lernprogress Tracking
- FR-089–FR-094: Go Toolset Feature Requests
