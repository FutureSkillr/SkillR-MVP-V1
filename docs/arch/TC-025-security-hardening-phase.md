# TC-025: Security Hardening Phase

**Status:** accepted
**Created:** 2026-02-20
**Entity:** SkillR

## Context

A full-codebase security inspection (2026-02-20) against OWASP Top 10 (2021) and DSGVO requirements identified **76 findings**: 6 critical, 14 high, 24 medium, 18 low, 14 informational. The critical findings include unauthenticated admin APIs, hardcoded credentials, missing session management, and unprotected user management routes — all immediately exploitable.

MVP3 ("Sicher unterwegs") focuses on the API gateway and secret-key isolation. It does **not** address the broader authentication, authorization, and hardening gaps found in the inspection. These must be resolved before the app URL is shared publicly or before any real user data enters the system.

**Source:** `sec-report/00-executive-summary.md` through `sec-report/04-remediation-tracker.md`

## Decision

Insert a dedicated **hardening phase (MVP3+)** between MVP3 and V1.0. This phase has one purpose: close all critical and high security findings and implement the medium-priority controls needed for a safe public beta.

### Phase structure

| Work Package | FR | Severity Coverage | Est. Effort |
|---|---|---|---|
| Server-Side Auth & Session Management | FR-056 | C3, C4, C5, H6, H8, H11 | 6 hrs |
| Admin Access Control & Credential Hygiene | FR-057 | C1, C2, C6, H10 | 2 hrs |
| API Input Validation & AI Prompt Security | FR-058 | H2, H12, M2, M3, M7, M13, M14 | 3.5 hrs |
| Security Headers, CORS & Error Handling | FR-059 | H1, H5, H14, M1, M4, M6, M12, M23 | 2 hrs |
| Rate Limiting & Abuse Prevention | FR-060 | H4, H7, H9, M15, M22, M24 | 5 hrs |
| Infrastructure & Supply Chain Hardening | FR-061 | H13, M10, M18, M19, L1, L2, L10 | 2 hrs |

**Total estimated effort:** ~20.5 hours (3 developer-days)

### Gating rule

MVP3+ is a **deployment gate**: no public URL sharing, no real user data, and no IHK pilot until all critical and high items are verified closed. Medium items must be closed before V1.0 production launch.

### What stays in V1.0

- DSGVO compliance (FR-033) — requires legal review and parental consent UX
- DPIA document (Art. 35)
- Data export and deletion endpoints (Art. 15/17/20)
- Full Firestore security rules audit

## Consequences

- Adds ~1 week between MVP3 and V1.0
- Forces auth refactoring in both frontend Express server and Go backend before new V1.0 features
- Establishes a security baseline that V1.0 features (DSGVO, parent dashboard) can build on
- The hardcoded admin seed removal (C2, C6) requires env-var-based seeding, which changes the local dev setup

## Alternatives Considered

1. **Fold into MVP3** — Rejected. MVP3 scope (API gateway + staging) is well-defined and nearly complete. Adding auth refactoring would delay it.
2. **Fold into V1.0** — Rejected. V1.0 already has 12 FRs. Security work would compete with feature work and likely get deprioritized.
3. **Fix only criticals, defer highs** — Rejected. Several high findings (path traversal H3, error leakage H5, endorsement spam H9) are directly exploitable once the URL is public.

## MVP4 Pod Security (FR-076, FR-077, FR-078)

The Solid Pod integration (MVP4) introduces 5 new API endpoints under `/api/v1/pod/*`. Security measures applied:

| Control | Implementation |
|---------|----------------|
| **Authentication** | Pod routes are within the v1 group with `FirebaseAuthMiddleware`. Handler uses `middleware.GetUserInfo(c)` — consistent with all other handlers. |
| **SSRF prevention** | `ConnectRequest.Validate()` blocks cloud metadata IPs (`169.254.169.254`), private networks (RFC 1918), and `metadata.google.internal`. Only HTTP/HTTPS schemes allowed. |
| **Input validation** | Provider enum validated. Pod URL max 512 chars, valid URL format. Sync request bounds: XP 0–1M, level 0–100, streak 0–10K, title max 100 chars, max 20 journey types. |
| **Error handling** | Generic error messages returned to client (`"failed to connect pod"`). Internal details logged server-side via `log.Printf`. No `err.Error()` leakage. |
| **Rate limiting** | Inherits v1 auth-based rate limiting. Per-endpoint sync rate limiting deferred to V1.0. |
| **Data isolation** | Pod writes are user-scoped via `userInfo.UID`. One-way sync only (App → Pod). No Pod-to-App data flow. |

### Pod-specific tests

- `handler_test.go`: 13 tests covering auth enforcement, SSRF blocking, input validation, error non-leakage
- `client_test.go`: 10 tests for HTTP client
- `service_test.go`: 9 tests for business logic
- `serializer_test.go`: 8 tests for Turtle output

## Related

- `sec-report/00-executive-summary.md` — Full findings overview
- `sec-report/04-remediation-tracker.md` — Prioritized checklist
- FR-051 (API Gateway) — MVP3 prerequisite
- FR-033 (DSGVO) — V1.0, builds on auth baseline from this phase
- FR-076, FR-077, FR-078 (Solid Pod) — MVP4, security controls documented above
