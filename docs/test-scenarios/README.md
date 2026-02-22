# Test Scenarios — K6 Stakeholder-Based Interaction Testing

> End-to-end user interaction tests organized by stakeholder group, each mapped to feature requests for full traceability.

**Target:** Go backend in docker-compose (`make local-up` → `localhost:9090`). Some Node.js-only routes (`/api/gemini/*`, `/api/capacity`, `/api/users`, `/api/analytics/*`) are not available and are gracefully handled (expect 404). Portfolio routes (`/api/v1/portfolio/*`) are probed and skipped if absent. Admin routes (`/api/v1/prompts`, `/api/v1/agents`) require Firebase auth middleware and return 401 in local mode.

---

## Overview

| Group | Scenarios | VUs | Focus |
|-------|-----------|-----|-------|
| Student | TS-001 – TS-008 | 2–10 | Landing, chat, registration, VUCA journey, profile, portfolio (probe), lernreise |
| Admin | TS-010 – TS-013 | 1 | Auth, prompts (401 without Firebase), users (404), analytics (404) |
| Operator | TS-020 – TS-022 | 2–5 | Health, config, endpoint availability |
| Security | TS-030 – TS-037 | 1 | Auth enforcement, rate limits, input validation, headers, escalation |
| Load | TS-040 – TS-042 | 1–50 | Smoke, sustained load, spike |

**Total: 27 scenarios covering 22 feature requests.**

---

## Scenario Index

### Student

| TS | Title | File |
|----|-------|------|
| [TS-001](TS-001-landing-to-coach.md) | Landing to Coach Select | `k6/scenarios/student/ts-001-landing-to-coach.js` |
| [TS-002](TS-002-intro-chat-flow.md) | Intro Chat Flow (5 Questions) | `k6/scenarios/student/ts-002-intro-chat-flow.js` |
| [TS-003](TS-003-registration.md) | Registration After Intro | `k6/scenarios/student/ts-003-registration.js` |
| [TS-004](TS-004-vuca-journey.md) | Authenticated VUCA Journey | `k6/scenarios/student/ts-004-vuca-journey.js` |
| [TS-005](TS-005-profile-generation.md) | Profile Generation Pipeline | `k6/scenarios/student/ts-005-profile-generation.js` |
| [TS-006](TS-006-portfolio-crud.md) | Portfolio CRUD Operations | `k6/scenarios/student/ts-006-portfolio-crud.js` |
| [TS-007](TS-007-lernreise-flow.md) | Lernreise Catalog & Progress | `k6/scenarios/student/ts-007-lernreise-flow.js` |
| [TS-008](TS-008-full-student-journey.md) | Full Student Lifecycle | `k6/scenarios/student/ts-008-full-student-journey.js` |

### Admin

| TS | Title | File |
|----|-------|------|
| [TS-010](TS-010-admin-auth.md) | Admin Auth & Access Control | `k6/scenarios/admin/ts-010-admin-auth.js` |
| [TS-011](TS-011-prompt-management.md) | Prompt Management CRUD | `k6/scenarios/admin/ts-011-prompt-management.js` |
| [TS-012](TS-012-user-management.md) | User Management | `k6/scenarios/admin/ts-012-user-management.js` |
| [TS-013](TS-013-analytics-dashboard.md) | Analytics Dashboard | `k6/scenarios/admin/ts-013-analytics-dashboard.js` |

### Operator

| TS | Title | File |
|----|-------|------|
| [TS-020](TS-020-health-check.md) | Health Check Endpoints | `k6/scenarios/operator/ts-020-health-check.js` |
| [TS-021](TS-021-capacity-monitoring.md) | Public Endpoint Availability | `k6/scenarios/operator/ts-021-capacity-monitoring.js` |
| [TS-022](TS-022-config-reliability.md) | Config Endpoint Reliability | `k6/scenarios/operator/ts-022-config-reliability.js` |

### Security

| TS | Title | File |
|----|-------|------|
| [TS-030](TS-030-auth-enforcement.md) | Auth Enforcement | `k6/scenarios/security/ts-030-auth-enforcement.js` |
| [TS-031](TS-031-rate-limit-anon.md) | Anonymous Rate Limiting | `k6/scenarios/security/ts-031-rate-limit-anon.js` |
| [TS-032](TS-032-rate-limit-auth.md) | Authenticated Rate Limiting | `k6/scenarios/security/ts-032-rate-limit-auth.js` |
| [TS-033](TS-033-brute-force-login.md) | Brute Force Login Protection | `k6/scenarios/security/ts-033-brute-force-login.js` |
| [TS-034](TS-034-input-validation.md) | Input Validation | `k6/scenarios/security/ts-034-input-validation.js` |
| [TS-035](TS-035-security-headers.md) | Security Headers | `k6/scenarios/security/ts-035-security-headers.js` |
| [TS-036](TS-036-session-token.md) | Auth Boundary (Local vs Firebase) | `k6/scenarios/security/ts-036-session-token.js` |
| [TS-037](TS-037-admin-escalation.md) | Admin Escalation Prevention | `k6/scenarios/security/ts-037-admin-escalation.js` |

### Load

| TS | Title | File |
|----|-------|------|
| [TS-040](TS-040-smoke.md) | Baseline Smoke Test | `k6/scenarios/load/ts-040-smoke.js` |
| [TS-041](TS-041-sustained-load.md) | Sustained Realistic Load | `k6/scenarios/load/ts-041-sustained-load.js` |
| [TS-042](TS-042-spike-test.md) | Spike Test | `k6/scenarios/load/ts-042-spike-test.js` |

---

## Traceability Matrix (FR → TS)

| FR | Title | Tested By |
|----|-------|-----------|
| FR-001 | Google OAuth | TS-003 |
| FR-003 | Firebase Persistence | TS-006 |
| FR-005 | Gemini Dialogue Engine | TS-002, TS-004, TS-005, TS-008 |
| FR-008 | Skill Profile Generation | TS-005, TS-008 |
| FR-020 | Level 2 Reflection | TS-006 |
| FR-039 | Prompt Tracking | TS-011 |
| FR-043 | Admin Panel | TS-011 |
| FR-044 | Role Management | TS-012 |
| FR-046 | User Administration | TS-012 |
| FR-049 | Profile + Activity History | TS-006 |
| FR-050 | User Behavior Tracking | TS-013 |
| FR-054 | Intro Sequence | TS-001, TS-002, TS-003, TS-008, TS-022 |
| FR-056 | Auth & Sessions | TS-003, TS-010, TS-030 |
| FR-057 | Admin Access Control | TS-010, TS-011, TS-030, TS-037 |
| FR-058 | Input Validation | TS-002, TS-004, TS-034 |
| FR-059 | Security Headers/CORS | TS-022, TS-035 |
| FR-060 | Rate Limiting | TS-002, TS-004, TS-031, TS-032, TS-033, TS-036, TS-042 |
| FR-062 | Warteraum | TS-021 |
| FR-065 | Flood Detection | TS-013 |
| FR-068 | Health Check | TS-001, TS-020, TS-040 |
| FR-074 | Lernreise Catalog | TS-007 |
| FR-075 | Lernprogress Tracking | TS-007 |

---

## Quick Start

```bash
# Prerequisites
brew install k6              # macOS
# or: https://k6.io/docs/get-started/installation/

# Start local stack
make local-up

# Run tests
make k6-smoke                         # 30s baseline check
make k6-student                       # Student flows (mock AI)
make k6-admin                         # Admin operations
make k6-operator                      # Health/capacity/config
make k6-security                      # Security validations
make k6-all                           # All functional suites
make k6-load                          # 10-min sustained load
make k6-spike                         # 50-VU spike test

# Reports
make k6-report                        # HTML report (requires k6-reporter)
make k6-ci                            # CI pass/fail summary

# Live AI (costs money, slower)
K6_LIVE_AI=true make k6-student
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:9090` | Target server URL |
| `K6_LIVE_AI` | (unset) | Set to `true` for real Gemini API calls |
| `HEALTH_CHECK_TOKEN` | (unset) | Token for detailed health endpoint |
| `ADMIN_EMAIL` | `admin@futureskiller.local` | Admin account email |
| `ADMIN_PASSWORD` | `Admin1local` | Admin account password |

## Mock AI Mode

By default, AI-dependent scenarios use **mock mode** (`K6_LIVE_AI` unset):
- Fast execution (no network latency to Gemini)
- Zero API cost
- Deterministic responses for CI
- Rate limit and security tests always use real endpoints

Set `K6_LIVE_AI=true` to test against real Gemini API.

## Thresholds

| Endpoint Tier | p(95) | p(99) | Error Rate |
|---------------|-------|-------|------------|
| Health/Config | < 200ms | < 500ms | < 1% |
| Auth (register/login) | < 500ms | < 1s | < 2% |
| Portfolio CRUD | < 500ms | < 1.5s | < 5% |
| Admin CRUD | < 1s | < 2s | < 5% |
| Gemini Chat (live) | < 8s | < 15s | < 10% |
| Gemini Extract/Generate (live) | < 10s | < 20s | < 15% |
| Gemini (mock) | < 200ms | < 500ms | < 1% |
| Security validation | N/A | N/A | checks > 99% |
