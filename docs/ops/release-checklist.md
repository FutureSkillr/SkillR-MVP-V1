# Release Checklist — Future SkillR

**Created:** 2026-02-19
**Maintained by:** QA Agent / Ops
**Source:** ROADMAP.md, Checkliste.md, Scope.md

---

## Release Overview

| Release | Codename | Target Audience | Goal |
|---------|----------|-----------------|------|
| **Pre-Launch Test Release** | "Rauchtest" | Internal team, IHK stakeholders (5-10 users) | Validate core loop, collect feedback, catch blockers |
| **Official Launch Release** | "Es funktioniert" | IHK pilot group, first external testers (50-100 users) | MVP1 complete, demo-ready, stable under real usage |

---

## GCP Access Prerequisites

> Before any deployment, every team member deploying must have these permissions
> on the target GCP project. The **project owner** grants them.

### Required IAM Roles (per deploying user)

| Role | Role ID | Why |
|------|---------|-----|
| **Service Usage Consumer** | `roles/serviceusage.serviceUsageConsumer` | Set quota project, call APIs via ADC |
| **Cloud Run Admin** | `roles/run.admin` | Deploy and manage Cloud Run services |
| **Cloud Build Editor** | `roles/cloudbuild.builds.editor` | Trigger builds via `--source` deploys |
| **Artifact Registry Writer** | `roles/artifactregistry.writer` | Push Docker images |
| **Storage Admin** (Cloud Build) | `roles/storage.admin` | Cloud Build needs to write build logs |

> **Shortcut:** Granting `roles/editor` covers all of the above.

### Owner grants access (one command per role)

```bash
# Minimum for deploying — owner runs these:
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:THEIR_EMAIL" \
  --role="roles/editor"

# Or granular (service usage only):
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:THEIR_EMAIL" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

### Deployer verifies access

```bash
gcloud auth login
gcloud auth application-default login
gcloud auth application-default set-quota-project PROJECT_ID   # Fails without serviceUsageConsumer
gcloud projects describe PROJECT_ID                             # Fails without any access
gcloud run services list --project PROJECT_ID                   # Fails without run.viewer
```

### Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `serviceusage.services.use` permission denied | Missing `serviceUsageConsumer` role | Owner grants `roles/serviceusage.serviceUsageConsumer` |
| `Cannot enable API` on `gcloud services enable` | Missing `serviceusage.serviceUsageAdmin` | Owner grants `roles/editor` or enables APIs themselves |
| `PERMISSION_DENIED` on `gcloud run deploy` | Missing Cloud Run / Cloud Build roles | Owner grants `roles/editor` |
| `Access denied` on Artifact Registry | Missing `artifactregistry.writer` | Owner grants role or `roles/editor` |

- [ ] All deployers have verified `gcloud auth application-default set-quota-project` works
- [ ] All deployers can run `gcloud run services list --project PROJECT_ID`
- [ ] Onboarding script runs to completion (`./scripts/gcp-onboard.sh`)

---

## Pre-Launch Test Release — "Rauchtest"

> Internal release for team walkthrough and stakeholder preview.
> Every box must be checked before inviting external testers.

### 1. Authentication & Accounts

- [ ] Google OAuth login works end-to-end (sign in, redirect, token)
- [ ] Email + password registration works (FR-002)
- [ ] Password reset email is sent and functional
- [ ] Firebase Auth token is issued and stored client-side
- [ ] Logout clears session and redirects to welcome/login page
- [ ] No secrets or API keys exposed in client bundle

### 2. Onboarding & Journey Entry

- [ ] Welcome page loads and is understandable without instructions
- [ ] User can enter a free-text interest (e.g. "Holz", "Kochen", "Holocaust")
- [ ] Gemini generates a meaningful, age-appropriate first response
- [ ] Interest entry leads into the VUCA journey (no dead-end states)

### 3. VUCA Journey — Core Loop

- [ ] VUCA station loads and presents AI-generated curriculum
- [ ] User can progress through modules within a station
- [ ] Dialogue is dynamic — responses vary based on user input
- [ ] Gegensatzsuche (contrasting suggestions) appear in dashboard (FR-006)
- [ ] User has choice at every step: local/global, deepen/switch topic
- [ ] No bias — system doesn't tunnel into a single topic
- [ ] All four VUCA dimensions (V, U, C, A) are reachable
- [ ] VUCA Bingo matrix tracks progress toward completion (FR-007)

### 4. Skill / Interest Profile

- [ ] Profile radar chart (Spinnennetz) renders correctly
- [ ] Chart updates visibly after completing a station
- [ ] Profile data reflects actual user interactions (not placeholder data)
- [ ] User can view their profile and understand what it shows

### 5. AI Coach & Voice

- [ ] Text input/output works without errors
- [ ] TTS voice output plays (Gemini TTS or browser fallback)
- [ ] STT voice input captures speech and submits to dialogue
- [ ] Voice toggle switches between text and voice mode (FR-011)
- [ ] Coach responses are contextual, not generic boilerplate
- [ ] Rate-limit handling: no crash on rapid TTS requests

### 6. Data Persistence & Session Continuity

- [ ] User data saves to Firestore (FR-003)
- [ ] Closing and reopening the app resumes where user left off (FR-012)
- [ ] LocalStorage fallback works if Firestore is unreachable
- [ ] No data loss on page refresh mid-journey
- [ ] Different users on the same device see their own data

### 7. Admin Console

- [ ] Admin console accessible at expected route (FR-043)
- [ ] Users tab shows registered users
- [ ] Prompt Logs tab shows AI interaction logs with timestamps (FR-039)
- [ ] Prompt log export works (CSV/JSON)
- [ ] Stats and filters functional in prompt log viewer
- [ ] Non-admin users cannot access admin routes

### 8. Deployment & Infrastructure

- [ ] App builds without errors (`npm run build`)
- [ ] Docker image builds successfully (FR-040)
- [ ] Cloud Run deployment completes (`make deploy`)
- [ ] Live URL responds with the app (not error page)
- [ ] HTTPS active, no mixed-content warnings
- [ ] Environment variables set correctly in Cloud Run (Firebase config, Gemini API key)
- [ ] Gemini API quota sufficient for test group (~10 users)

### 9. Browser & Device Compatibility

- [ ] Chrome desktop — full functionality
- [ ] Chrome mobile (Android) — layout responsive, touch works
- [ ] Safari mobile (iOS) — layout responsive, voice works
- [ ] Firefox desktop — no layout breakage
- [ ] No console errors blocking core functionality

### 10. Scope Guardrails

- [ ] App does NOT make career recommendations ("werde Foerster")
- [ ] The word "Zertifikat" appears nowhere in user-facing text
- [ ] No pre-built course catalogs shown
- [ ] No features from excluded scope (avatars, matching, payment, etc.)

### Pre-Launch Sign-Off

| Role | Name | Approved | Date |
|------|------|----------|------|
| Product Owner | | [ ] | |
| Lead Developer | | [ ] | |
| QA | | [ ] | |

---

## Official Launch Release — "Es funktioniert"

> Public-facing release for IHK demo and first real users.
> Includes everything from Pre-Launch plus stability, polish, and monitoring.

### 11. Pre-Launch Checklist Complete

- [ ] All items from sections 1-10 above are checked and verified
- [ ] All bugs found during pre-launch testing are resolved or documented as known issues

### 12. Feature Completion (MVP1 ROADMAP)

- [ ] FR-001 — Google OAuth: fully working (Apple/Meta deferred)
- [ ] FR-002 — Email login: done, password reset working
- [ ] FR-003 — Firebase persistence: Firestore active with localStorage fallback
- [ ] FR-004 — Interest-based journey entry: done
- [ ] FR-005 — Gemini dialogue engine: done, stable
- [ ] FR-006 — VUCA navigation with Gegensatzsuche: done
- [ ] FR-007 — VUCA Bingo matrix: done
- [ ] FR-008 — Skill profile generation: done
- [ ] FR-009 — Profile visualization: done
- [ ] FR-010 — AI coach voice: done
- [ ] FR-011 — Text/voice switching: done
- [ ] FR-012 — Session continuity: done
- [ ] FR-013 — Web app deployment: done
- [ ] FR-039 — Prompt tracking: done
- [ ] FR-040 — Docker & Cloud Run: done
- [ ] FR-041 — Makefile: done
- [ ] FR-042 — CI/CD pipeline: done
- [ ] FR-043 — Admin panel: done
- [ ] FR-044 — Role management: verified with Firebase custom claims
- [ ] FR-046 — User administration: admin CRUD working
- [ ] FR-047 — Management console: unified and functional
- [ ] FR-048 — Journey progress cards: done
- [ ] FR-049 — Profile + activity history: done
- [ ] FR-050 — Clickstream analytics: done

### 13. Test Coverage

- [ ] All frontend unit tests pass (`npm test`)
- [ ] All backend unit tests pass (`go test ./...`)
- [ ] Integration tests pass for auth flow
- [ ] Integration tests pass for VUCA journey state transitions
- [ ] Integration tests pass for Firestore persistence
- [ ] No test regressions from pre-launch fixes
- [ ] Test coverage report generated and reviewed

### 14. Performance & Reliability

- [ ] Page load time < 3 seconds on 4G connection
- [ ] Gemini API response time < 5 seconds for dialogue turns
- [ ] TTS audio plays within 2 seconds of trigger
- [ ] App handles 50 concurrent users without degradation
- [ ] No memory leaks during extended sessions (30+ minutes)
- [ ] Graceful error handling when Gemini API is slow or unavailable
- [ ] Graceful error handling when Firebase is unreachable

### 15. Content & Localization

- [ ] All user-facing text is in German
- [ ] No English placeholder text visible to users
- [ ] AI coach dialogue is age-appropriate for 14+ audience
- [ ] No offensive, inappropriate, or biased content in generated responses
- [ ] Welcome/onboarding text is clear and inviting

### 16. Security & Privacy

> **Security gate per `docs/security/gate-checklist.md` supersedes individual items below.**
> The gate checklist (Part A: 17 static analysis items + Part B: 17 live system checks) is the
> authoritative source for security sign-off. Items below are retained for quick reference only.
> See also: `docs/security/OWASP-inspection.md`, `docs/security/DSGVO-inspection.md`, TC-021.

- [ ] Security gate Part A (static analysis) — all 17 items PASS or EXCEPTION
- [ ] Security gate Part B (live system checks) — all 17 items PASS or EXCEPTION (max 3 exceptions)
- [ ] Art. 8 hard block cleared (age gate for under-16 users)
- [ ] Gate sign-off table completed (Lead Dev, QA, Product Owner)
- [ ] No API keys or secrets in client-side code or git history
- [ ] Firebase security rules restrict data access to authenticated users
- [ ] Users can only read/write their own data (no cross-user access)
- [ ] Admin routes protected by role check
- [ ] No XSS vulnerabilities in user input rendering
- [ ] CORS configured correctly for production domain
- [ ] HTTPS enforced on all endpoints

### 16b. Security: API Gateway (FR-051, FR-052 / MVP3)

**Gemini Proxy (Layer 1)**

- [ ] Gemini API key does NOT appear in JS bundle (`curl <app-url>/assets/*.js | grep AIza` returns nothing)
- [ ] `/api/gemini/chat` returns 200 with valid request body
- [ ] All 7 Gemini proxy routes respond correctly
- [ ] Direct Gemini SDK calls removed from frontend code (`grep -r "GoogleGenAI" frontend/services/` returns nothing)
- [ ] Rate limiting returns 429 on rapid requests (>30/min for chat, >10/min for TTS/STT)
- [ ] Cloud Run env var `GEMINI_API_KEY` is set (not build arg)

**Firebase Config Injection (Layer 2)**

- [ ] `GET /api/config` returns Firebase configuration as JSON
- [ ] Firebase config values do NOT appear as hardcoded strings in JS bundle
- [ ] App initializes Firebase SDK from `/api/config` response (not compile-time vars)
- [ ] All Firebase env vars set in Cloud Run: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

**Agent Namespace (Layer 3 — reserved)**

- [ ] `/api/agents/*` returns 501 Not Implemented
- [ ] No agent service keys required for MVP3

**Gateway Infrastructure**

- [ ] `Dockerfile` uses Node.js (not nginx) — serves static + API
- [ ] Health check at `/api/health` returns `{ "status": "ok" }`
- [ ] Error responses use structured JSON: `{ "error": "...", "code": "..." }`
- [ ] No secrets or API keys in git history or client bundle

**Docker Compose Local Staging (FR-052)**

- [ ] `docker-compose.yml` exists at project root
- [ ] `make local-stage` builds and runs the container
- [ ] App accessible at `http://localhost:9090`
- [ ] All gateway routes work in local staging
- [ ] `.env.example` documents required env vars
- [ ] `.env.local` is in `.gitignore`

### 17. Monitoring & Observability

- [ ] Cloud Run logs accessible and showing request activity
- [ ] Error tracking captures unhandled exceptions
- [ ] Clickstream analytics recording user interactions (FR-050)
- [ ] Prompt logs capturing all AI interactions for review (FR-039)
- [ ] Alert or notification for deployment failures in CI/CD

### 18. Documentation & Handoff

- [ ] Live demo URL confirmed and accessible
- [ ] Admin credentials documented securely (not in repo)
- [ ] Known issues list created with workarounds
- [ ] IHK demo script or walkthrough prepared
- [ ] FR document statuses updated to match implementation reality
- [ ] ROADMAP.md next-actions section updated

### 19. Rollback Plan

- [ ] Previous working Docker image tagged and available
- [ ] Cloud Run revision history allows instant rollback
- [ ] Database migration is backward-compatible (or rollback steps documented)
- [ ] Team knows the rollback procedure

### 20. Final Acceptance (Checkliste.md Criteria)

- [ ] User can log in (Google OAuth or email)
- [ ] Onboarding chat extracts interests and recommends a journey
- [ ] VUCA station generates curriculum, user completes modules + quiz
- [ ] Profile radar chart updates after station completion
- [ ] State persists in Firebase across sessions
- [ ] Admin can view users and prompt logs
- [ ] Deployable to Cloud Run with `make deploy`

### Launch Sign-Off

| Role | Name | Approved | Date |
|------|------|----------|------|
| Product Owner | | [ ] | |
| Lead Developer | | [ ] | |
| QA | | [ ] | |
| IHK Stakeholder | | [ ] | |

---

## Post-Launch Checklist (First 48 Hours)

- [ ] Monitor Cloud Run logs for errors
- [ ] Verify real users can complete login flow
- [ ] Check Gemini API usage against quota limits
- [ ] Review first prompt logs for quality
- [ ] Collect initial user feedback
- [ ] Triage any reported bugs (P0 = blocks journey, P1 = degrades experience, P2 = cosmetic)
- [ ] Confirm no data loss incidents
- [ ] Document lessons learned for MVP2 planning

---

## Tracker Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started / not verified |
| `[x]` | Done and verified |
| `[~]` | Partial / known issue documented |
| `[N/A]` | Not applicable for this release |

---

> **Ultimate success test (from Checkliste.md):**
> Ein Jugendlicher macht die Reise freiwillig zu Ende, schaut auf sein Profil und sagt: "Stimmt, das bin ich."
