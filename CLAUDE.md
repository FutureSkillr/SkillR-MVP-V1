# CLAUDE.md — SkillR-MVP-V1

> Agent instructions for the SkillR development team.

---

## Project Overview

**SkillR** is an AI-powered web app where young people (14+) discover their interests through a gamified dialogue-based world journey — the "Reise nach VUCA". The result is a personal skill/interest profile, not a career recommendation.

This is the **SkillR-MVP-V1** repository — the first standalone release of the SkillR app. It was forked from the maindfull.LEARNING platform monolith (`mvp72`) and contains the full SkillR app, its backend, and all SkillR-scoped concepts.

**Phase:** Development (MVP V1)

### Entity Context

| Entity | Role |
|--------|------|
| **SkillR** | Kids education brand. This repo. App + backend + SkillR-scoped concepts |
| **maindset.ACADEMY** | The new learning education brand that owns maindfull.LEARNING. SkillR runs on top of maindfull.LEARNING |
| **maindfull.LEARNING** | AI engine by maindset.ACADEMY. The backend in this repo IS the maindfull.LEARNING engine (custom instance) |

### Feature Scoping

All features are classified in **`SCOPE-MATRIX.md`** at the repo root:

| Tag | Meaning |
|-----|---------|
| `[CORE]` | Must ship in SkillR V1.0 |
| `[SELECT]` | Available, can be toggled on for future sprints |
| `[PLATFORM]` | maindfull.LEARNING platform feature — not in this repo |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript Web-App (browser, no app store) |
| Backend | Go (Echo Framework) |
| AI / Dialogue | Google Gemini via Google AI Studio |
| Profiles | Solid Pod-based lifelong profiles |
| Database | Google Firebase (user personal data) |
| Authentication | Google OAuth + optional Email Login |
| Cloud | Google Cloud Platform |
| API Design | OpenAPI 3.0 specifications |
| Version Control | Git + GitHub |

---

## Directory Structure

```
SkillR-MVP-V1/
├── CLAUDE.md                  ← You are here
├── SCOPE-MATRIX.md            ← Feature scope: CORE / SELECT / PLATFORM
├── README.md                  ← Project overview
├── docs/
│   ├── user-story/            ← User stories
│   ├── features/              ← Feature requests (FR-NNN)
│   ├── arch/                  ← Architecture decisions (TC-NNN)
│   ├── test-scenarios/        ← Test scenarios
│   ├── ROADMAP.md             ← SkillR-specific roadmap
│   └── 2026-02-17/            ← Session transcripts and scope docs
├── concepts/
│   ├── maindset-academy/      ← Reference docs (MA-001, MA-002, MA-005)
│   ├── didactical/            ← SkillR didactical concepts (DC-001..DC-016)
│   └── business/              ← SkillR business concepts (BC-001..BC-012)
├── integrations/
│   └── api-spec/              ← OpenAPI specifications
├── backend/                   ← Go backend (maindfull.LEARNING engine, custom instance)
├── frontend/                  ← TypeScript frontend (SkillR app)
├── terraform/                 ← GCP infrastructure
├── scripts/                   ← Deploy, setup, health scripts
├── solid/                     ← Solid Pod configuration
├── k6/                        ← Load/scenario tests
├── manual/                    ← MkDocs documentation site
└── .claude/                   ← Claude Code skills and commands
```

---

## Conventions

### Feature Requests — `docs/features/FR-NNN-topic.md`

- **Location:** `docs/features/`
- **Naming:** `FR-NNN-short-topic.md` (e.g., `FR-001-google-oauth.md`)
- **NNN:** Zero-padded three-digit sequential number
- **Template:**

```markdown
# FR-NNN: Title

**Status:** draft | specified | in-progress | done | rejected
**Priority:** must | should | could | wont
**Created:** YYYY-MM-DD

## Problem
What problem does this solve?

## Solution
What do we build?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies
- List of related FRs or concepts

## Notes
Additional context.
```

### Technical Architecture — `docs/arch/TC-NNN-topic.md`

- **Location:** `docs/arch/`
- **Naming:** `TC-NNN-short-topic.md`

### Didactical Concepts — `concepts/didactical/DC-NNN-topic.md`

- **Location:** `concepts/didactical/`
- **Naming:** `DC-NNN-short-topic.md`

### Business Concepts — `concepts/business/BC-NNN-topic.md`

- **Location:** `concepts/business/`
- **Naming:** `BC-NNN-short-topic.md`

---

## Testing Requirements

### Unit Tests
- **Every function** must have corresponding unit tests
- Go tests: `foo.go` → `foo_test.go`
- Frontend tests: `foo.ts` → `foo.test.ts`

### Integration Tests
- Integration tests: `*_integration_test.go` / `*.integration.test.ts`

### Running Tests
```bash
# Go backend
go test ./...

# Frontend
npm test
```

---

## Authentication

1. **Google OAuth** (primary) — sign in with Google account
2. **Email Login** (optional) — email + password via Firebase Auth

Both methods produce a Firebase Auth token. User personal data is stored in Firebase Firestore.

---

## Agent Working Rules

1. **Read before writing.** Always read existing files before modifying them.
2. **Follow naming conventions.** Use the NNN-prefixed naming for all tracked documents.
3. **Test everything.** No function without a unit test. No concept without an integration test.
4. **Check SCOPE-MATRIX.md.** Before implementing a new feature, verify it is `[CORE]` or `[SELECT]` with approval.
5. **Speak the user's language.** The product targets German-speaking youth. Code and docs are in English; user-facing text is in German.
6. **Commit often, commit small.** Each commit should address one concern.
7. **Track decisions.** Every technical decision gets a TC document.
8. **Firebase for personal data only.** User personal data lives in Firebase. Non-personal data can live elsewhere.
9. **No secrets in code.** API keys, credentials, and tokens must never appear in committed files.
10. **Avoid the word "Zertifikat"** in all user-facing text.

---

## Procedures

### Promoting a SELECT Feature

1. Change its tag in `SCOPE-MATRIX.md` from `[SELECT]` to `[CORE]`
2. Create or update the FR document in `docs/features/`
3. Add to the SkillR roadmap
4. Implement, test, deploy

### Adding a New Feature

1. Create the FR in `docs/features/FR-NNN-name.md`
2. Add it to `SCOPE-MATRIX.md` as `[CORE]`
3. If it introduces an architecture decision, create `docs/arch/TC-NNN-topic.md`
4. Implement with unit + integration tests
5. Update API specs if the feature exposes an API

### Entity Naming Rules

| Pattern | Usage |
|---------|-------|
| **SkillR** | The kids education brand (capital R) |
| **maindset.ACADEMY** | The new learning brand (lowercase "maindset", dot, uppercase "ACADEMY") |
| **maindfull.LEARNING** | The AI engine (lowercase "maindfull", dot, uppercase "LEARNING") |

---

## Domain Concepts

| Term | Meaning |
|------|---------|
| Moeglichkeitsraum | The possibility space of jobs, skills, and life paths |
| Gegensatzsuche | Deliberate opposite/contrasting suggestions to widen perspective |
| Level 2 Reflection | AI-triggered coaching mode that probes understanding |
| VUCA Bingo | Completion matrix — 4 items per dimension (V, U, C, A) |
| Travel Journal | Accumulated record of all interactions during the journey |
| Job-Navigator | Discovery engine showing job possibilities based on interest profile |
| Lernreise | A learning journey |

---

## Quick Reference

| What | Where | Prefix |
|------|-------|--------|
| Feature scope | `SCOPE-MATRIX.md` | — |
| Feature requests | `docs/features/` | FR-NNN |
| Architecture | `docs/arch/` | TC-NNN |
| Didactical concepts | `concepts/didactical/` | DC-NNN |
| Business concepts | `concepts/business/` | BC-NNN |
| Academy reference | `concepts/maindset-academy/` | MA-NNN |
| API specifications | `integrations/api-spec/` | — |
| SkillR roadmap | `docs/ROADMAP.md` | — |
