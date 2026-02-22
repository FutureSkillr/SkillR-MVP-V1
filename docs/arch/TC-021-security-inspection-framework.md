# TC-021: Security Inspection Framework (OWASP + DSGVO Gate)

**Status:** accepted
**Created:** 2026-02-19
**Entity:** SkillR

## Context

Future SkillR processes personal data of minors (14+) in Germany. The V1.0 Go backend is now implemented with 75 Go files, 30 SQL migrations, Firebase JWT auth, VertexAI integration, and PostgreSQL storage. Before any production deployment, a systematic security validation and DSGVO compliance check is required — not ad-hoc, but at industry level against OWASP Top 10 2021 and German data protection law.

**Current security posture (confirmed by code analysis):**

| Control | Status | Evidence |
|---------|--------|----------|
| Firebase JWT auth middleware | Implemented | `backend/internal/middleware/auth.go` — `FirebaseAuth()` verifies Bearer tokens |
| Admin role check | Implemented but not wired | `RequireAdmin()` exists in `auth.go` but not applied in `main.go` routes |
| Parameterized SQL | All queries use pgx/v5 | `backend/internal/postgres/*.go` — no string concatenation found |
| Error suppression | Implemented | `backend/internal/middleware/errorhandler.go` — 500s return generic message |
| Distroless container | Confirmed | `Dockerfile` — `gcr.io/distroless/static-debian12:nonroot`, `USER nonroot:nonroot` |
| Secrets management | All via env vars | `backend/internal/config/config.go` — `os.Getenv()` for all secrets |
| ON DELETE CASCADE | All personal data tables | Migrations 003-009, 012 — verified CASCADE on `users(id)` FK |
| Data export endpoint | Partial | `GET /api/v1/portfolio/profile/export` exists |
| Rate limiter | Implemented but not wired | `backend/internal/redis/ratelimiter.go` — sliding window, not connected to routes |
| CORS | Configured from env | `backend/internal/server/server.go:26` — `AllowedOrigins` from config |

**Gaps identified:**

1. No HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
2. Rate limiter not wired to any routes in `main.go`
3. `RequireAdmin()` not applied to admin routes (`/api/v1/prompts/*`, `/api/v1/agents/*`)
4. No age gate / consent recording (FR-033 specified but not implemented)
5. No user deletion endpoint (Art. 17 trigger missing)
6. No DPIA screening document
7. No dependency vulnerability scanning in CI
8. No VertexAI safety settings configured in `backend/internal/ai/vertexai.go`

## Decision

Establish a two-part security gate as a **blocking prerequisite** for production deployment. No release to production may occur until all gate items pass or have signed exceptions.

### Gate Structure

**Part A — Static Analysis (17 items, runs in CI before build)**
Covers: access control verification, injection scanning, dependency audit, DSGVO data handling checks. All items are verifiable by automated tools or deterministic grep/review against the source code.

**Part B — Live System Checks (17 items, runs post-staging-deployment)**
Covers: authentication enforcement, TLS/HTTPS, rate limiting, header inspection, DSGVO rights verification (export, deletion, age gate). All items are verifiable by curl probes against the staging URL.

### Gate Verdict Rules

- ALL Part A items must be `[x]` or `[EXCEPTION]` with sign-off
- ALL Part B items must be `[x]` or `[EXCEPTION]` with sign-off
- Maximum 3 `[EXCEPTION]` items in Part B
- **Art. 8 (B-13) is a hard block** — cannot be excepted if under-16 users are in deployment scope
- Sign-off required from: Lead Developer, QA, Product Owner

### Exception Protocol

Any item marked `[EXCEPTION]` must include:
- Named owner responsible for remediation
- Written risk statement describing exposure
- Target remediation date (max 30 days)
- Approval from all three sign-off roles

### Document Locations

| Document | Path | Purpose |
|----------|------|---------|
| OWASP Inspection | `docs/security/OWASP-inspection.md` | Category-by-category OWASP Top 10 2021 checklist with code refs, tool commands, probes |
| DSGVO Inspection | `docs/security/DSGVO-inspection.md` | Article-by-article DSGVO compliance with PASS/PARTIAL/GAP status |
| Gate Checklist | `docs/security/gate-checklist.md` | Combined Part A + Part B pass/fail checklist with sign-off table |

### Integration with Release Process

Section 16 of `docs/ops/release-checklist.md` references this gate. The gate checklist supersedes individual security items in section 16b — the gate is the authoritative source for security sign-off.

## Consequences

**Positive:**
- Systematic, auditable security validation before production
- Clear accountability via sign-off table and exception protocol
- Aligns with OWASP and DSGVO requirements simultaneously
- Provides concrete remediation roadmap for identified gaps
- Reusable for future releases (run Part B against any deployment)

**Negative:**
- Blocks production deployment until all items pass (by design)
- Requires tooling setup (gosec, govulncheck) in CI pipeline
- Exception protocol adds process overhead

**Trade-offs:**
- Chose 17+17 items (comprehensive) over a shorter checklist — justified by minors-data scope
- Chose hard-block on Art. 8 rather than exception-eligible — non-negotiable for under-16 data processing

## Alternatives Considered

1. **Ad-hoc security review.** Rejected — insufficient for DSGVO audit trail.
2. **External penetration test only.** Rejected — too late in the cycle, doesn't catch architectural gaps.
3. **DSGVO-only gate (no OWASP).** Rejected — OWASP Top 10 overlaps with Art. 32 (security of processing) requirements.

## Related

- FR-033 (Datenschutz for Minors — the DSGVO reference spec)
- TC-016 (Gemini Server Proxy — API key protection)
- TC-018 (Agentic Backend VertexAI — AI safety settings)
- `docs/security/OWASP-inspection.md`
- `docs/security/DSGVO-inspection.md`
- `docs/security/gate-checklist.md`
- `docs/ops/release-checklist.md` (Section 16)
