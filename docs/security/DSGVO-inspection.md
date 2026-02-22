# DSGVO Compliance Inspection — Article-by-Article

**Project:** Future SkillR MVP3
**Date:** 2026-02-19
**Scope:** Personal data processing of minors (14+) in Germany
**Reference:** TC-021 (Security Inspection Framework), FR-033 (Datenschutz for Minors)
**Applicable Law:** DSGVO (EU 2016/679), BDSG, JMStV, TTDSG

---

## How to Use This Document

For each DSGVO article (and German-specific law):
1. **Requirement** — what the law demands
2. **Implementation** — what exists in the codebase
3. **Evidence** — specific files, database fields, endpoints
4. **Status** — **PASS** / **PARTIAL** / **GAP**

---

## Art. 5 — Principles Relating to Processing of Personal Data

### Art. 5(1)(a) — Lawfulness, Fairness, Transparency

**Requirement:** Data processing must be lawful, fair, and transparent to the data subject.

**Implementation:**
- Consent-based processing for journey and profile data (Art. 6(1)(a))
- `dsgvo_consent_version` field in users table tracks which privacy policy version was accepted
- `/api/config` delivers Firebase config transparently (no hidden tracking)

**Evidence:**
- `backend/migrations/000002_users_up.sql:10` — `dsgvo_consent_version TEXT` column
- `frontend/services/firebase.ts` — Firebase initialized from server config, not hidden embed
- No third-party analytics SDKs in `frontend/package.json`

**Status: PARTIAL**

Consent version is recorded in the database schema. **Gap:** No consent recording endpoint exists — the field can be written but there is no API route to record consent acceptance. No teen-friendly privacy policy text exists yet.

---

### Art. 5(1)(b) — Purpose Limitation

**Requirement:** Data collected for specified, explicit, and legitimate purposes; not processed in a manner incompatible with those purposes.

**Implementation:**
- Data categories defined in FR-033: account data, journey data, profile data, timing data, endorsements
- No matching/commercial use without separate explicit consent (FR-033 design)
- No data sharing with third parties in current implementation

**Evidence:**
- `docs/features/FR-033-datenschutz-minors.md` — data categories table with legal basis per category
- `backend/internal/postgres/` — all stores are user-scoped, no cross-user aggregation endpoints

**Status: PASS**

Purpose limitation is respected in current implementation. No secondary use of personal data.

---

### Art. 5(1)(c) — Data Minimisation

**Requirement:** Personal data must be adequate, relevant, and limited to what is necessary.

**Implementation:**
- User table collects: email, display_name, age_group, auth_provider, photo_url — all necessary for app function
- No location data, no contacts, no device fingerprinting
- No friend lists or social graph

**Evidence:**
- `backend/migrations/000002_users_up.sql` — minimal user schema (12 columns including system fields)
- `backend/migrations/000012_analytics_user_events_up.sql` — analytics events include user_id but no PII beyond what's needed

**Status: PASS**

Data collection is minimal and purpose-driven. No unnecessary personal data fields.

---

### Art. 5(1)(d) — Accuracy

**Requirement:** Personal data must be accurate and kept up to date.

**Implementation:**
- Users can update their display name and profile
- Profile data is computed from actual interactions, not static input
- `updated_at` triggers ensure modification timestamps are accurate

**Evidence:**
- `backend/migrations/000002_users_up.sql:19-21` — `trigger_set_updated_at()` on users table
- PUT endpoints exist for user-modifiable data

**Status: PASS**

---

### Art. 5(1)(e) — Storage Limitation

**Requirement:** Personal data stored only as long as necessary.

**Implementation:**
- FR-033 specifies: timing data anonymized after 90 days
- Account data retained until account deletion
- ON DELETE CASCADE ensures no orphaned personal data

**Evidence:**
- `docs/features/FR-033-datenschutz-minors.md` — retention table
- CASCADE verified on migrations 003-009, 012

**Status: PARTIAL**

CASCADE ensures deletion propagates. **Gap:** No automated 90-day anonymization job for timing data exists yet. No data retention policy enforcement mechanism.

---

### Art. 5(1)(f) — Integrity and Confidentiality

**Requirement:** Appropriate security to protect personal data.

**Implementation:**
- Firebase JWT auth for all API access
- Parameterized SQL (pgx/v5) — no injection
- Error handler suppresses internal details
- Distroless Docker, nonroot user
- All secrets via environment variables

**Evidence:**
- See OWASP inspection document for full security analysis
- `backend/internal/middleware/auth.go` — JWT verification
- `backend/internal/middleware/errorhandler.go` — 500 suppression
- `Dockerfile:28,36` — distroless, nonroot

**Status: PARTIAL**

Strong security foundation. **Gaps:** Missing security headers (HSTS, CSP), rate limiter not wired, auth middleware not wired in main.go. See OWASP A01, A04, A05.

---

## Art. 6 — Lawfulness of Processing

**Requirement:** Processing must have a legal basis under one of six grounds.

**Implementation:**

| Data Category | Legal Basis | Implementation |
|---------------|-------------|----------------|
| Account data (email, name) | Art. 6(1)(b) — contract | Account creation flow |
| Journey data (interactions, choices) | Art. 6(1)(a) — consent | `dsgvo_consent_version` recorded |
| Profile data (skills, VUCA progress) | Art. 6(1)(a) — consent | Same consent covers profile |
| Timing data (session duration) | Art. 6(1)(f) — legitimate interest | Analytics events table |
| Aggregate analytics | Art. 6(1)(f) — legitimate interest | Anonymized — not personal data |

**Evidence:**
- `backend/migrations/000002_users_up.sql:10` — `dsgvo_consent_version` field
- FR-033 data categories table

**Status: PARTIAL**

Legal basis is defined per data category. Schema supports consent recording. **Gap:** No consent recording API endpoint — consent version can be stored but there is no flow to capture it during signup.

---

## Art. 7 — Conditions for Consent

**Requirement:** Consent must be freely given, specific, informed, and unambiguous. Must be as easy to withdraw as to give. Controller must demonstrate consent was given.

**Implementation:**
- `dsgvo_consent_version` in users table records which policy version was accepted
- FR-033 specifies: consent records must be immutable and timestamped

**Evidence:**
- `backend/migrations/000002_users_up.sql:10` — `dsgvo_consent_version TEXT`
- FR-033 acceptance criteria: "Consent records are immutable and timestamped"

**Status: GAP**

Schema field exists but:
- No consent recording endpoint (POST with timestamp, IP, policy version)
- No consent withdrawal endpoint
- No consent log table (who consented, when, to what version)
- No re-consent mechanism when privacy policy changes
- `dsgvo_consent_version` is a single TEXT field — insufficient for audit trail

---

## Art. 8 — Conditions Applicable to Child's Consent (HARD BLOCK)

**Requirement:** Where consent is the legal basis, for information society services offered directly to a child, processing is lawful only where the child is at least 16 years old (Germany's threshold). Below 16: consent must be given or authorised by the holder of parental responsibility.

**Implementation:**
- `age_group` field in users table
- FR-033 specifies three-tier age gate: under 14 (blocked), 14-15 (parental consent), 16+ (self-consent)

**Evidence:**
- `backend/migrations/000002_users_up.sql:9` — `age_group TEXT`
- `docs/features/FR-033-datenschutz-minors.md` — complete age gate specification

**Status: GAP (HARD BLOCK)**

- Schema field `age_group` exists but is **never written** — no age gate endpoint
- No parental consent flow (email, token, confirmation)
- No under-14 block mechanism
- No limited-access mode for 14-15 waiting for parental consent
- **This is the single most critical gap.** Art. 8 compliance is a hard prerequisite for any deployment serving under-16 users.

---

## Art. 12 — Transparent Information and Communication

**Requirement:** Information provided to data subjects must be concise, transparent, intelligible, easily accessible, and in clear and plain language — particularly when addressed to a child.

**Implementation:**
- FR-033 specifies two privacy policy versions: teen-friendly and legal
- Target audience is 14+ — text must be understandable for teenagers

**Evidence:**
- `docs/features/FR-033-datenschutz-minors.md` — "Transparency in age-appropriate language" section

**Status: GAP**

No privacy policy text exists in the codebase (neither teen nor legal version). No route serves a privacy policy page.

---

## Art. 13 — Information to Be Provided Where Personal Data Are Collected

**Requirement:** At the time of data collection, provide: controller identity, DPO contact, purposes, legal basis, recipients, retention periods, rights (access, rectification, erasure, portability, complaint to supervisory authority).

**Implementation:**
- Must be part of the Datenschutzerklaerung (privacy policy)

**Status: GAP**

No Datenschutzerklaerung exists. Required content is defined in FR-033 but not yet implemented.

---

## Art. 14 — Information Where Data Not Obtained from Data Subject

**Requirement:** When data is obtained from sources other than the data subject, additional information must be provided.

**Implementation:**
- Not applicable in current scope — all personal data is directly provided by the user or generated from their interactions
- Endorsements come from third parties but involve separate consent

**Status: PASS (N/A)**

---

## Art. 15 — Right of Access

**Requirement:** Data subject has the right to obtain confirmation of processing and access to their personal data.

**Implementation:**
- `GET /api/v1/portfolio/profile/export` provides profile data export
- All user data is accessible through existing API endpoints (sessions, reflections, evidence, etc.)

**Evidence:**
- `backend/internal/server/routes.go:38` — `v1.GET("/portfolio/profile/export", deps.Profile.Export)`
- All v1 endpoints return user's own data

**Status: PARTIAL**

Profile export exists. **Gap:** No single "download all my data" endpoint that covers ALL data categories (sessions, interactions, reflections, evidence, endorsements, artifacts, journal, engagement, prompt logs). Art. 15 requires access to ALL personal data, not just the profile.

---

## Art. 17 — Right to Erasure ("Right to Be Forgotten")

**Requirement:** Data subject has the right to obtain erasure of personal data without undue delay. Strengthened for data collected from children (Art. 17(1)(f)).

**Implementation:**
- ON DELETE CASCADE on all personal data tables linked to `users(id)`
- Tables with CASCADE: sessions (003), interactions (004), portfolio_entries (005), endorsements (006), external_artifacts (007), reflections (008), skill_profiles (009), analytics_user_events (012)

**Evidence:**
- Grep for CASCADE in migrations:
  - `000003_sessions_up.sql:3` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000004_interactions_up.sql:3` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000005_portfolio_entries_up.sql:3` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000006_endorsements_up.sql:3,18` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000007_external_artifacts_up.sql:3` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000008_reflections_up.sql:3` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000009_skill_profiles_up.sql:3` — `REFERENCES users(id) ON DELETE CASCADE`
  - `000012_analytics_user_events_up.sql:16` — `REFERENCES users(id) ON DELETE CASCADE`

**Status: PARTIAL**

CASCADE is correctly configured — deleting a user row cascades to all linked personal data. **Gap:** No deletion API endpoint (`DELETE /api/v1/account`) exists. No self-service deletion UI. The CASCADE mechanism works at the database level but there is no trigger (no endpoint to call `DELETE FROM users WHERE id = $1`).

Also missing: deletion of Firebase Auth account (must be done via Firebase Admin SDK alongside PostgreSQL deletion).

---

## Art. 20 — Right to Data Portability

**Requirement:** Data subject has the right to receive their personal data in a structured, commonly used, machine-readable format.

**Implementation:**
- `GET /api/v1/portfolio/profile/export` returns profile data

**Evidence:**
- `backend/internal/server/routes.go:38` — export endpoint registered

**Status: PARTIAL**

Profile export exists. **Gap:** Export must cover ALL personal data (not just profile) — sessions, interactions, reflections, evidence, endorsements, artifacts, journal entries, engagement data. Must return as JSON (machine-readable).

---

## Art. 25 — Data Protection by Design and by Default

**Requirement:** Implement appropriate technical and organisational measures for data protection. By default, only personal data necessary for each specific purpose is processed.

**Implementation:**
- Minimal data schema (Art. 5(1)(c))
- User-scoped queries (each user sees only their data)
- No data shared with third parties by default
- No matching/commercial features active without separate consent
- Distroless container, nonroot, secrets in env vars

**Evidence:**
- All `*Store` methods filter by `user_id`
- `backend/migrations/000002_users_up.sql` — minimal schema
- `Dockerfile` — distroless, nonroot
- FR-033 — privacy by design principles

**Status: PASS**

Architecture follows privacy-by-design principles. User data isolation is enforced at the query level. Default data exposure is minimal.

---

## Art. 32 — Security of Processing

**Requirement:** Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including encryption, pseudonymisation, resilience, and regular testing.

**Implementation:**
- TLS in transit (Cloud Run enforces HTTPS)
- PostgreSQL connection should use `sslmode=require`
- Firebase JWT auth
- Parameterized SQL
- Distroless container, nonroot
- Rate limiting (implemented, not wired)

**Evidence:**
- See OWASP inspection for full security analysis
- `backend/internal/config/config.go:31` — `DATABASE_URL` loaded from env (sslmode must be in the value)
- Cloud Run enforces TLS termination

**Status: PARTIAL**

Strong security controls exist. **Gaps:** Security headers missing, rate limiter not wired, auth middleware not wired in main.go, no regular security testing in CI (`govulncheck`, `gosec`).

---

## Art. 35 — Data Protection Impact Assessment (DPIA)

**Requirement:** Where processing is likely to result in a high risk to the rights and freedoms of natural persons, a DPIA must be carried out. Processing of children's data is explicitly listed as a trigger for DPIA.

**Implementation:**
- No DPIA document exists

**Evidence:**
- No file matching `DPIA*` or `dpia*` in the repository

**Status: GAP**

A DPIA is **required** because:
1. Processing personal data of children (Art. 35(3) combined with Art. 8)
2. Systematic profiling (skill/interest profiles based on AI analysis)
3. Large-scale processing of special categories (educational assessment)

The DPIA must cover: description of processing, necessity/proportionality assessment, risk assessment, mitigation measures. Should be prepared before production deployment.

---

## BDSG — Bundesdatenschutzgesetz (German Federal Data Protection Act)

### BDSG §26 — Data Processing in Employment Context

**Requirement:** Specific rules for processing employee data.

**Status: PASS (N/A)**

Not applicable — Future SkillR processes student data, not employee data.

### BDSG §22 — Processing of Special Categories

**Requirement:** Additional safeguards for special category data (health, biometric, etc.).

**Implementation:**
- Future SkillR does not process special category data
- Skill profiles are interest-based, not health or biometric data
- No racial, ethnic, political, religious, or health data collected

**Status: PASS (N/A)**

---

## JMStV — Jugendmedienschutz-Staatsvertrag (Youth Media Protection)

### JMStV §5 — Content Assessment

**Requirement:** Content directed at minors must not include harmful material.

**Implementation:**
- AI-generated content targets 14+ audience
- Gemini model generates educational content about skills and interests
- No explicit content, violence, or harmful material in the product

**Evidence:**
- `backend/internal/ai/vertexai.go` — VertexAI integration
- System instructions (prompts) should include age-appropriate guidelines

**Status: PARTIAL**

Content is inherently educational. **Gap:** No VertexAI safety settings configured in `vertexai.go`. The `genai.GenerativeModel` does not set `SafetySettings` to block harmful content. While Gemini has default safety filters, explicit configuration for a minors-targeted product is required.

### JMStV §6 — Commercial Content Separation

**Requirement:** Commercial content directed at minors must be clearly labeled and separated from editorial content.

**Implementation:**
- No sponsored content in current MVP
- FR-028 (Sponsored Content) specifies labeling requirements for future implementation

**Status: PASS (N/A for current MVP)**

---

## TTDSG — Telekommunikation-Telemedien-Datenschutz-Gesetz

### TTDSG §25 — Cookie and Tracking Consent

**Requirement:** Storing information on or accessing information from a user's terminal equipment requires consent, unless technically necessary for the service.

**Implementation:**
- No third-party tracking cookies
- No Google Analytics, Facebook Pixel, or similar
- Firebase Auth uses essential cookies/localStorage for session management (technically necessary → no consent required)

**Evidence:**
- `frontend/package.json` — no analytics SDKs
- `frontend/services/firebase.ts` — Firebase SDK only (essential for auth)
- FR-033: "No tracking beyond the product"

**Status: PASS**

No non-essential cookies or tracking. Firebase session management is technically necessary and exempt from TTDSG §25 consent requirement. **Verification needed:** Confirm no tracking cookies appear in the live system (B-16).

---

## Summary Table

| Article/Law | Requirement | Status | Critical Gap |
|-------------|-------------|--------|--------------|
| Art. 5(1)(a) | Lawfulness, transparency | **PARTIAL** | No consent recording endpoint |
| Art. 5(1)(b) | Purpose limitation | **PASS** | — |
| Art. 5(1)(c) | Data minimisation | **PASS** | — |
| Art. 5(1)(d) | Accuracy | **PASS** | — |
| Art. 5(1)(e) | Storage limitation | **PARTIAL** | No automated data retention |
| Art. 5(1)(f) | Integrity, confidentiality | **PARTIAL** | Security gaps (see OWASP) |
| Art. 6 | Lawfulness of processing | **PARTIAL** | No consent recording flow |
| Art. 7 | Consent conditions | **GAP** | No consent recording, withdrawal, or audit |
| **Art. 8** | **Child consent** | **GAP (HARD BLOCK)** | **No age gate, no parental consent flow** |
| Art. 12 | Transparent information | **GAP** | No privacy policy text |
| Art. 13 | Information at collection | **GAP** | No Datenschutzerklaerung |
| Art. 14 | Indirect data collection | **PASS (N/A)** | — |
| Art. 15 | Right of access | **PARTIAL** | Export covers profile only, not all data |
| Art. 17 | Right to erasure | **PARTIAL** | CASCADE works, no deletion endpoint |
| Art. 20 | Data portability | **PARTIAL** | Export covers profile only |
| Art. 25 | Privacy by design | **PASS** | — |
| Art. 32 | Security of processing | **PARTIAL** | Missing headers, unwired controls |
| Art. 35 | DPIA | **GAP** | No DPIA document |
| BDSG §22/26 | Special categories / employment | **PASS (N/A)** | — |
| JMStV §5 | Content for minors | **PARTIAL** | No VertexAI safety settings |
| JMStV §6 | Commercial separation | **PASS (N/A)** | — |
| TTDSG §25 | Cookie/tracking consent | **PASS** | Verify no tracking cookies live |

---

## Priority Remediation Order

1. **Art. 8 — Age gate + parental consent** (HARD BLOCK — implement FR-033)
2. **Art. 7 — Consent recording system** (consent log table, API endpoints, withdrawal)
3. **Art. 17 — Deletion endpoint** (`DELETE /api/v1/account` with Firebase + PostgreSQL CASCADE)
4. **Art. 12/13 — Privacy policy** (teen + legal versions, served as page/endpoint)
5. **Art. 35 — DPIA document** (required before production)
6. **Art. 15/20 — Complete data export** (all data categories, not just profile)
7. **Art. 32 — Security hardening** (wire auth, rate limiter, add headers)
8. **JMStV §5 — VertexAI safety settings** (explicit harm category blocks)

---

## Related Documents

- TC-021 (Security Inspection Framework)
- `docs/security/OWASP-inspection.md`
- `docs/security/gate-checklist.md`
- FR-033 (Datenschutz for Minors)
