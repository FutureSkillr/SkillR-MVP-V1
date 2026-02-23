<p align="center">
  <img src="frontend/public/icons/app-icon.png" alt="SkillR" width="120" />
</p>

<p align="center">
  <strong>Bist Du ein SkillR? — Die Reise nach VUCA.</strong><br/>
  AI-powered skill discovery for young people aged 14+.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#development">Development</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#specifications">Specifications</a>
</p>

---

## What is SkillR?

SkillR is a web app where young people (14+) discover their interests and build a personal skill profile through a gamified, dialogue-based world journey — the **"Reise nach VUCA"**. An AI coach (Google Gemini) guides them through an interactive travel experience. The result is a personal skill/interest profile, not a career recommendation.

- **Start where you are** — the journey begins at your real location
- **Follow your interests** — choose a topic (woodworking, cooking, history, ...) and discover related places worldwide
- **Collect VUCA experiences** — the journey completes when you've experienced all four dimensions (Volatility, Uncertainty, Complexity, Ambiguity)
- **Get your profile** — dialogues automatically produce an interest profile across Hard Skills, Soft Skills, Future Skills, and Resilience

The goal: a young person looks at their profile and says *"Stimmt, das bin ich."*

---

## Entity Context

SkillR exists within a brand ecosystem:

| Entity | Role |
|--------|------|
| **SkillR** | Kids education brand. This repo. App + backend + SkillR-scoped concepts |
| **maindset.ACADEMY** | Learning education brand that owns maindfull.LEARNING |
| **maindfull.LEARNING** | AI engine by maindset.ACADEMY. The backend in this repo IS a custom instance |

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 20+ | `brew install node` |
| **Go** | 1.22+ | `brew install go` |
| **Docker** | 24+ | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Make** | any | Pre-installed on macOS |

Optional for testing and deployment:

| Tool | Purpose | Install |
|------|---------|---------|
| k6 | Load/scenario tests | `brew install k6` |
| gcloud | GCP deployment | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) |
| golangci-lint | Go linting | `brew install golangci-lint` |
| golang-migrate | DB migrations | `brew install golang-migrate` |

### 1. Clone and configure

```bash
git clone git@github.com:<org>/SkillR-MVP-V1.git
cd SkillR-MVP-V1

# Create your local environment file
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `GEMINI_API_KEY` | Yes | [Google AI Studio](https://aistudio.google.com/) |
| `FIREBASE_API_KEY` | Yes | Firebase Console → Project Settings → Web App |
| `FIREBASE_AUTH_DOMAIN` | Yes | Same as above |
| `FIREBASE_PROJECT_ID` | Yes | Same as above |
| `DATABASE_URL` | Auto | Pre-filled for local Docker Postgres |
| `REDIS_URL` | Auto | Pre-filled for local Docker Redis |
| `SOLID_POD_URL` | Auto | Pre-filled for local Docker Solid server |

### 2. Start developing

**Option A: Native processes + Docker services (recommended for daily dev)**

```bash
make dev-all
```

This starts:
- PostgreSQL, Redis, and Solid Pod in Docker containers
- Go backend as a native process (with hot reload on restart)
- Vite dev server as a native process

Access the app at **http://localhost:3000** (frontend) and **http://localhost:8080** (Go backend API).

**Option B: Full Docker stack**

```bash
make local-up
```

Builds and starts everything in Docker. Access at **http://localhost:9090**.

**Option C: Frontend only (no backend)**

```bash
make run-local
```

Installs npm dependencies and starts the Vite dev server on http://localhost:3000.

### 3. Verify it works

```bash
# Health check (Docker stack must be running)
make local-health

# Run all tests
make test-all
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript Web-App (Vite + React, runs in browser) |
| Backend | Go (Echo Framework) |
| AI / Dialogue | Google Gemini via Vertex AI |
| Profiles | Solid Pod-based lifelong profiles (data sovereignty) |
| Database | PostgreSQL (queryable index) + Firebase Firestore (personal data) |
| Cache | Redis (rate limiting, session cache) |
| Authentication | Google OAuth + optional Email Login via Firebase Auth |
| Cloud | Google Cloud Platform (Cloud Run, Cloud SQL, Secret Manager) |
| Infrastructure | Terraform |
| API Design | OpenAPI 3.0 |

### Four-Tier Storage Architecture (TC-019)

```
Tier S: Solid Pod         — canonical, user-sovereign (the user owns this data)
Tier A: Firebase Firestore — real-time cache for personal data
Tier B: PostgreSQL         — queryable index for backend operations
Tier C: Analytics          — append-only, anonymised
```

### Services in Local Dev

```
┌─────────────────────────────────────────────────────────────┐
│  make dev-all                                               │
│                                                             │
│  Native processes:                Docker services:          │
│  ├─ Vite dev (localhost:3000)     ├─ PostgreSQL (:5432)     │
│  └─ Go backend (localhost:8080)   ├─ Redis (:6379)          │
│                                   └─ Solid Pod (:3003)      │
│                                                             │
│  make local-up                                              │
│  └─ All in Docker ─────────────── App (localhost:9090)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
SkillR-MVP-V1/
├── README.md                  ← You are here
├── CLAUDE.md                  ← Agent instructions and conventions
├── SCOPE-MATRIX.md            ← Feature scope: CORE / SELECT / PLATFORM
├── Makefile                   ← Build, dev, test, deploy commands
├── Dockerfile                 ← Container build
├── docker-compose.yml         ← Full local stack
├── docker-compose.services.yml← Infrastructure services only
├── .env.example               ← Environment template (copy to .env.local)
│
├── frontend/                  ← TypeScript Frontend (SkillR App)
│   ├── App.tsx                   Root component
│   ├── components/               UI components
│   ├── services/                 API clients (Gemini, analytics)
│   ├── hooks/                    React hooks (Gemini chat, speech, AI status)
│   ├── styles/                   CSS / Tailwind
│   ├── public/                   Static assets
│   │   ├── icons/                App icons (app-icon.png, favicons)
│   │   └── manifest.json         PWA manifest
│   └── graphx-design/            Brand design source files
│
├── backend/                   ← Go Backend (maindfull.LEARNING engine)
│   ├── cmd/server/               Entry point (main.go)
│   ├── internal/
│   │   ├── server/               HTTP server, auth, routing
│   │   ├── ai/                   Gemini / Vertex AI integration
│   │   ├── admin/                Admin panel handlers
│   │   ├── gateway/              API gateway handlers (analytics, brand, campaign, etc.)
│   │   ├── config/               Configuration loading
│   │   ├── postgres/             Database repositories
│   │   ├── redis/                Cache, rate limiting
│   │   ├── solid/                Solid Pod client + sync
│   │   ├── honeycomb/            Lernreise tracking
│   │   ├── memory/               User context sync
│   │   └── middleware/           HTTP middleware
│   └── migrations/               PostgreSQL migrations (000001..000023)
│
├── specs/                     ← Allium behavioural specifications
│   ├── vuca-journey.allium       VUCA journey domain model
│   ├── engagement.allium         Gamification / XP system
│   ├── job-navigator.allium      Job discovery engine
│   ├── lernreise.allium          Learning journey (Lernreise)
│   ├── solid-pod.allium          Solid Pod profile system
│   ├── skill-wallet.allium       Skill-Wallet (credentials + portfolio)
│   ├── views/                    UI view companion docs
│   │   ├── intro-chat.md            Intro chat view
│   │   ├── intro-coach-select.md    Coach selection view
│   │   ├── journey-select.md        Journey selection view
│   │   └── profile.md               Profile view
│   └── flows/                    UI flow companion docs
│       ├── FORMAT.md                Flow document format spec
│       ├── wallet-overview.md       Wallet dashboard flows
│       ├── credential-list.md       Credential browsing flows
│       ├── credential-detail.md     Credential detail + evidence
│       ├── portfolio-view.md        Portfolio upload + management
│       ├── access-grant-manager.md  Sharing + access control
│       ├── guardian-consent.md      Parental consent (DSGVO)
│       ├── verification.md          Third-party verification
│       ├── journey-minor-onboarding.md  Cross-surface: minor setup
│       └── journey-share-and-verify.md  Cross-surface: share + verify
│
├── docs/
│   ├── ROADMAP.md             ← SkillR-specific roadmap
│   ├── user-story/            ← User stories
│   ├── features/              ← Feature requests (FR-NNN)
│   ├── arch/                  ← Technical architecture (TC-NNN)
│   ├── test-scenarios/        ← Test scenarios
│   ├── ops/                   ← Operational reports
│   └── protocol/              ← Session transcripts
│
├── concepts/
│   ├── maindset-academy/      ← Reference docs (MA-001, MA-002, MA-005)
│   ├── didactical/            ← Didactical concepts (DC-001..DC-016)
│   └── business/              ← Business concepts (BC-001..BC-012)
│
├── integrations/
│   └── api-spec/              ← OpenAPI 3.0 specifications
│
├── terraform/                 ← GCP infrastructure (Cloud Run, Cloud SQL)
│   ├── environments/             staging + production configs
│   └── modules/                  cloud-run, cloud-sql modules
│
├── scripts/                   ← Operational scripts
│   ├── dev-local.sh              All-in-one local dev launcher
│   ├── deploy.sh                 Cloud Run deployment
│   ├── gcp-onboard.sh           First-time GCP setup wizard
│   ├── health-check.sh          Service health check
│   ├── health-monitor.sh        Continuous health polling
│   ├── setup-secrets.sh         Secret Manager setup
│   └── seed-pod.sh              Solid Pod admin seeding
│
├── k6/                        ← Load and scenario tests
│   ├── scenarios/
│   │   ├── student/              Student stakeholder tests (TS-001..008)
│   │   ├── admin/                Admin tests (TS-010..013)
│   │   ├── operator/             Operator tests (TS-020..022)
│   │   ├── security/             Security tests (TS-030..037)
│   │   └── load/                 Smoke, sustained, spike tests
│   └── reports/                  Test output (gitignored)
│
├── solid/                     ← Solid Pod configuration
└── manual/                    ← MkDocs documentation site
```

---

## Development

### Make targets (daily use)

```bash
# ─── Start developing ──────────────────────────────────
make dev-all          # Services + backend + frontend (recommended)
make dev              # Frontend only (Vite dev server)
make go-dev           # Go backend only
make services-up      # Start Docker services (PG, Redis, Solid)
make services-down    # Stop Docker services

# ─── Build ─────────────────────────────────────────────
make build            # Frontend production build
make go-build         # Go backend binary
make build-all        # Both

# ─── Test ──────────────────────────────────────────────
make go-test          # Go unit tests
make test-all         # Frontend + backend tests
make typecheck        # TypeScript type checking
make go-lint          # Go linting

# ─── Database ──────────────────────────────────────────
make migrate-up       # Run pending migrations
make migrate-down     # Rollback last migration
make migrate-reset    # Drop all + re-run (destructive)

# ─── Docker ────────────────────────────────────────────
make local-up         # Full Docker stack on :9090
make local-down       # Stop + remove volumes
make local-health     # Health check local stack
make local-seed-pod   # Seed admin on Solid Pod
```

Run `make help` for the complete list.

### Environment files

| File | Purpose | Committed? |
|------|---------|-----------|
| `.env.example` | Template with all variables | Yes |
| `.env.local` | Your local dev values | No (gitignored) |
| `.env.deploy` | GCP deployment config (created by `make onboard`) | No (gitignored) |

### Code conventions

- **Go tests:** `foo.go` → `foo_test.go` (every function gets a unit test)
- **Frontend tests:** `foo.ts` → `foo.test.ts`
- **Integration tests:** `*_integration_test.go` / `*.integration.test.ts`
- **Feature requests:** `docs/features/FR-NNN-short-topic.md`
- **Architecture decisions:** `docs/arch/TC-NNN-short-topic.md`
- **User-facing text:** German (product language is German for 14+ youth)
- **Code and docs:** English
- **Never use the word "Zertifikat"** in user-facing text

### Feature scoping

All features are classified in **`SCOPE-MATRIX.md`**:

| Tag | Meaning |
|-----|---------|
| `[CORE]` | Must ship in SkillR V1.0 |
| `[SELECT]` | Available, toggled on for future sprints |
| `[PLATFORM]` | maindfull.LEARNING platform feature — not in this repo |

Check `SCOPE-MATRIX.md` before implementing any new feature.

---

## Testing

### Unit and integration tests

```bash
# Go backend
cd backend && go test ./...

# Frontend
cd frontend && npm test

# Both at once
make test-all
```

### K6 scenario tests

K6 tests validate the system from the outside. Start the local stack first:

```bash
make local-up

# Quick check (30 seconds)
make k6-smoke

# Stakeholder-specific suites
make k6-student       # Student flows (TS-001..008)
make k6-admin         # Admin flows (TS-010..013)
make k6-operator      # Operator monitoring (TS-020..022)
make k6-security      # Security validation (TS-030..037)

# Load testing
make k6-load          # Sustained 10-minute load
make k6-spike         # Spike test (50 VU peak)

# All functional scenarios
make k6-all

# Generate HTML report
make k6-report
```

---

## Deployment

### First-time GCP setup

```bash
make onboard          # Interactive wizard — creates .env.deploy
make setup-firebase   # Configure Firebase Auth
make setup-secrets    # Store SA key in Secret Manager
```

### Deploy to Cloud Run

```bash
make ship             # Production deploy (uses .env.deploy)
make ship-staging     # Staging deploy (single instance)

# Or manual control:
make deploy           # Build → push → deploy
make deploy-staging   # Same for staging
```

### Monitor

```bash
make health           # One-shot health check
make monitor          # Continuous polling (Ctrl+C to stop)
make logs             # Tail Cloud Run logs
make cloudrun-list    # List services and revisions
```

---

## Specifications

SkillR uses **Allium** (`.allium` files) for formal behavioural specifications. Allium sits between informal feature descriptions and implementation — it defines what the system does without prescribing how.

### Allium specs

| Spec | Domain |
|------|--------|
| `specs/vuca-journey.allium` | VUCA journey: stations, dimensions, dialogue |
| `specs/engagement.allium` | Gamification: XP, streaks, levels |
| `specs/job-navigator.allium` | Job discovery based on interest profile |
| `specs/lernreise.allium` | Learning journey (Lernreise) structure |
| `specs/solid-pod.allium` | Solid Pod: connection, sync, endorsements |
| `specs/skill-wallet.allium` | Skill-Wallet: credentials, portfolio, blockchain, access grants |

### Flow companion docs

Each major UI surface has a companion doc in `specs/flows/` that describes how the user experiences it: screen sequencing, decision points, error recovery. Every action references an Allium trigger; every view references `exposes` fields.

### How they're used

1. **Generate test cases** — each rule produces success + failure tests
2. **Validate implementation** — checklist for handlers, models, and UI components
3. **Anchor conversations** — shared language between product, dev, design, and legal

---

## Key Documents

| Document | What it tells you |
|----------|-------------------|
| [CLAUDE.md](CLAUDE.md) | Agent instructions, conventions, naming rules |
| [SCOPE-MATRIX.md](SCOPE-MATRIX.md) | Feature classification (CORE / SELECT / PLATFORM) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | SkillR roadmap (V1.0 / V1.1 / V2.0) |
| [docs/features/](docs/features/) | Feature requests (FR-NNN) |
| [docs/arch/](docs/arch/) | Architecture decisions (TC-NNN) |
| [concepts/didactical/](concepts/didactical/) | Didactical concepts (DC-NNN) |
| [concepts/business/](concepts/business/) | Business concepts (BC-NNN) |
| [specs/](specs/) | Allium behavioural specs |
| [specs/flows/](specs/flows/) | UI flow companion docs |
| [integrations/api-spec/](integrations/api-spec/) | OpenAPI 3.0 specifications |

---

## Domain Glossary

| Term | Meaning |
|------|---------|
| **Reise nach VUCA** | The gamified world journey through Volatility, Uncertainty, Complexity, Ambiguity |
| **Moeglichkeitsraum** | The possibility space of jobs, skills, and life paths |
| **Gegensatzsuche** | Deliberate opposite/contrasting suggestions to widen perspective |
| **Level 2 Reflection** | AI-triggered coaching mode that probes understanding |
| **VUCA Bingo** | Completion matrix — 4 items per dimension (V, U, C, A) |
| **Travel Journal** | Accumulated record of all interactions during the journey |
| **Job-Navigator** | Discovery engine showing job possibilities from interest profile |
| **Lernreise** | A structured learning journey |
| **Skill-Wallet** | User-sovereign container for verified, blockchain-anchored skill credentials |
| **Solid Pod** | Personal data store owned by the user (data sovereignty) |

---

## What SkillR V1.0 deliberately does NOT do

- No career recommendations ("become a forester")
- No pre-built course platform
- No avatar system
- No enterprise matching
- No payment system
- The word "Zertifikat" is never used in user-facing text
