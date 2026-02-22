# Security Gate Checklist — MVP3 Production Release

**Project:** Future SkillR
**Date:** 2026-02-19
**Reference:** TC-021 (Security Inspection Framework)
**Supporting Documents:**
- `docs/security/OWASP-inspection.md` — detailed OWASP Top 10 analysis
- `docs/security/DSGVO-inspection.md` — article-by-article DSGVO compliance

---

## Gate Verdict Rules

- ALL Part A items must be `[x]` or `[EXCEPTION]` with sign-off
- ALL Part B items must be `[x]` or `[EXCEPTION]` with sign-off
- Maximum **3** `[EXCEPTION]` items in Part B
- **B-13 (Art. 8 age gate) is a HARD BLOCK** — cannot be excepted if under-16 users are in deployment scope
- Sign-off required from: **Lead Developer**, **QA**, **Product Owner**

---

## Part A: Static Analysis (CI — Before Build)

> These checks run against the source code before the Docker image is built.
> All are verifiable by automated tools or deterministic inspection.

| ID | OWASP/DSGVO | Check | How to Verify | Status |
|----|-------------|-------|---------------|--------|
| A-01 | A01 | `RequireAdmin()` applied to admin routes (`/api/v1/prompts/*`, `/api/v1/agents/*`) | `grep -n "RequireAdmin" backend/internal/server/routes.go backend/cmd/server/main.go` | [ ] |
| A-02 | A01 | `FirebaseAuth` middleware applied to `/api/v1` group | `grep -n "FirebaseAuth\|v1\.Use" backend/cmd/server/main.go` | [ ] |
| A-03 | A03 | No raw SQL string concatenation in postgres layer | `gosec -include=G201,G202 ./backend/...` — must return 0 findings | [ ] |
| A-04 | A04 | Rate limiter wired to `/api/v1/ai/*` routes | `grep -n "RateLimit\|rateLim" backend/cmd/server/main.go backend/internal/server/routes.go` | [ ] |
| A-05 | A05 | Security headers middleware present (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) | `grep -rn "X-Frame-Options\|Strict-Transport\|X-Content-Type\|Content-Security-Policy" backend/internal/` | [ ] |
| A-06 | A05 | No CORS wildcard (`*`) in allowed origins | `grep -n '"\\*"\|AllowOrigins.*\\*' backend/internal/server/server.go backend/internal/config/config.go` — must return 0 matches | [ ] |
| A-07 | A06 | `govulncheck` clean (no known vulnerabilities in used code) | `cd backend && govulncheck ./...` — must return 0 vulnerabilities | [ ] |
| A-08 | A06 | `npm audit --audit-level=high` clean | `cd frontend && npm audit --audit-level=high` — exit code 0 | [ ] |
| A-09 | A02 | No secrets in source code (API keys, passwords, tokens) | `grep -rn "AIza\|password\s*=\s*\"\|BEGIN.*PRIVATE" backend/ frontend/ --include="*.go" --include="*.ts" --exclude-dir=node_modules` — must return 0 matches | [ ] |
| A-10 | A08 | `go mod verify` passes (no tampered module checksums) | `cd backend && go mod verify` — "all modules verified" | [ ] |
| A-11 | DSGVO Art.8 | Age group write path exists (age gate records age_group at signup) | `grep -rn "age_group\|AgeGroup" backend/internal/` — must show write path (not just schema) | [ ] |
| A-12 | DSGVO Art.7 | Consent version recorded at signup (consent recording endpoint exists) | `grep -rn "dsgvo_consent\|ConsentVersion\|consent" backend/internal/` — must show API handler | [ ] |
| A-13 | DSGVO Art.17 | Deletion endpoint with CASCADE exists (`DELETE /api/v1/account` or equivalent) | `grep -rn "DELETE.*account\|DeleteUser\|deleteAccount" backend/internal/` — must exist | [ ] |
| A-14 | DSGVO Art.5 | No third-party tracking in frontend (no GA, FB Pixel, etc.) | `grep -rn "gtag\|analytics\|fbq\|pixel\|google-analytics\|facebook" frontend/` — must return 0 (excluding internal analytics) | [ ] |
| A-15 | DSGVO Art.20 | Export covers all data types (sessions, interactions, reflections, evidence, endorsements, artifacts, journal, engagement) | Review `backend/internal/handler/profile.go` `Export()` — must query all stores | [ ] |
| A-16 | Art.32 | `DATABASE_URL` includes `sslmode=require` or `sslmode=verify-full` | `grep -n "sslmode" .env.example docker-compose.yml` — production config must enforce SSL | [ ] |
| A-17 | JMStV | VertexAI safety settings configured (harm categories blocked for minors) | `grep -n "SafetySetting\|HarmCategory\|HarmBlockThreshold" backend/internal/ai/vertexai.go` — must show explicit safety config | [ ] |

### Part A Pass Criteria

- All 17 items marked `[x]`
- OR: items marked `[EXCEPTION]` with completed exception record (see below)
- A-11, A-12, A-13 are DSGVO requirements — exceptions require legal risk acceptance

---

## Part B: Live System Checks (Post-Staging-Deployment)

> These checks run against the deployed staging environment.
> All are verifiable by curl commands or manual verification.

| ID | OWASP/DSGVO | Check | Probe Command | Expected | Status |
|----|-------------|-------|---------------|----------|--------|
| B-01 | A01 | Unauthenticated request to protected endpoint returns 401 | `curl -s -o /dev/null -w "%{http_code}" $URL/api/v1/sessions` | 401 | [ ] |
| B-02 | A01 | User token on admin route returns 403 | `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_TOKEN" $URL/api/v1/prompts` | 403 | [ ] |
| B-03 | A01 | Cross-user data isolation (user A cannot see user B's data) | `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_A_TOKEN" $URL/api/v1/sessions/$USER_B_SESSION_ID` | 404 | [ ] |
| B-04 | A02 | HTTPS enforced (HTTP redirects to HTTPS) | `curl -s -o /dev/null -w "%{http_code}" http://$HOST/` | 301 or 308 | [ ] |
| B-05 | A02 | TLS certificate valid >30 days | `echo \| openssl s_client -servername $HOST -connect $HOST:443 2>/dev/null \| openssl x509 -noout -enddate` | notAfter > now+30d | [ ] |
| B-06 | A02 | No API keys in JS bundle | `curl -s $URL/ \| grep -o 'src="[^"]*\.js"' \| while read f; do curl -s "$URL/$(echo $f \| tr -d '"' \| sed 's/src=//')" \| grep -c "AIza"; done` | 0 | [ ] |
| B-07 | A04 | Rate limit fires on AI endpoint (429 after threshold) | `for i in $(seq 1 35); do curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"message":"test"}' $URL/api/v1/ai/chat; done` | 429 after ~30 | [ ] |
| B-08 | A05 | Security headers present in response | `curl -s -I $URL/api/health \| grep -ci "strict-transport-security\|x-frame-options\|x-content-type-options\|content-security-policy"` | >= 4 | [ ] |
| B-09 | A05 | CORS rejects unauthorized origin | `curl -s -I -H "Origin: https://evil.example.com" $URL/api/v1/sessions \| grep -i "access-control-allow-origin"` | Header absent or not evil.example.com | [ ] |
| B-10 | A07 | Expired/invalid JWT returns 401 | `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer expired.jwt.token" $URL/api/v1/sessions` | 401 | [ ] |
| B-11 | A09 | Auth failures visible in Cloud Run logs | `curl -s -H "Authorization: Bearer invalid" $URL/api/v1/sessions && gcloud logging read "resource.type=cloud_run_revision" --limit=5 --format=json` | Log entry with 401 | [ ] |
| B-12 | A09 | Health check accessible | `curl -s -o /dev/null -w "%{http_code}" $URL/api/health` | 200 | [ ] |
| B-13 | **DSGVO Art.8** | **Age gate blocks under-14 signup** | Manual test: attempt signup with age < 14 | Blocked | [ ] |
| B-14 | DSGVO Art.20 | Data export returns valid JSON | `curl -s -H "Authorization: Bearer $TOKEN" $URL/api/v1/portfolio/profile/export \| python3 -m json.tool` | Valid JSON with user data | [ ] |
| B-15 | DSGVO Art.17 | Deletion cascades correctly (delete user, verify child tables empty) | `curl -s -X DELETE -H "Authorization: Bearer $TOKEN" $URL/api/v1/account && curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $URL/api/v1/sessions?user_id=$DELETED_USER` | 200 then empty list | [ ] |
| B-16 | TTDSG §25 | No tracking cookies beyond session | `curl -s -I $URL/ \| grep -i "set-cookie"` | No tracking cookies (only session/essential) | [ ] |
| B-17 | Art.35 | DPIA screening document exists | `ls docs/security/DPIA-screening.md` | File exists | [ ] |

### Part B Pass Criteria

- All 17 items marked `[x]`
- OR: up to 3 items marked `[EXCEPTION]` with completed exception records
- **B-13 (Art. 8) CANNOT be excepted** — it is a hard block if under-16 users are in deployment scope

---

## Exception Protocol

Any item marked `[EXCEPTION]` must have a completed record:

| Field | Value |
|-------|-------|
| **Item ID** | (e.g., A-04) |
| **Description** | What is not yet implemented |
| **Risk Statement** | What exposure this creates |
| **Named Owner** | Person responsible for remediation |
| **Target Date** | When it will be resolved (max 30 days from sign-off) |
| **Approved By** | All three sign-off roles must approve |

### Exception Records

<!-- Add exception records here as needed -->

| Item | Risk Statement | Owner | Target Date | Approved |
|------|----------------|-------|-------------|----------|
| | | | | |
| | | | | |
| | | | | |

---

## Sign-Off Table

| Role | Name | All Part A items reviewed | All Part B items reviewed | Gate verdict: PASS / FAIL | Date | Signature |
|------|------|---------------------------|---------------------------|---------------------------|------|-----------|
| Lead Developer | | [ ] | [ ] | | | |
| QA | | [ ] | [ ] | | | |
| Product Owner | | [ ] | [ ] | | | |

### Gate Verdict

- [ ] **PASS** — All items `[x]` or `[EXCEPTION]` (max 3 Part B exceptions), no hard-block failures
- [ ] **FAIL** — One or more items unresolved without exception, or hard-block (B-13) failed

**Final Decision:** ________________

**Date:** ________________

---

## Current Assessment (2026-02-19)

Based on static code analysis, the following items are expected to **fail** until code changes are made:

### Part A Expected Failures

| Item | Gap | Required Code Change |
|------|-----|---------------------|
| A-01 | `RequireAdmin()` not on admin routes | Wire in `routes.go` or `main.go` |
| A-02 | `FirebaseAuth` not on v1 group | Wire in `main.go` |
| A-04 | Rate limiter not on AI routes | Wire `RateLimiter` middleware in `main.go` |
| A-05 | No security headers middleware | Create `SecurityHeaders()` middleware |
| A-07 | `govulncheck` not run | Install and run in CI |
| A-11 | No age gate write path | Implement FR-033 age gate endpoint |
| A-12 | No consent recording endpoint | Implement consent API |
| A-13 | No deletion endpoint | Implement `DELETE /api/v1/account` |
| A-15 | Export covers profile only | Extend to all data categories |
| A-17 | No VertexAI safety settings | Configure `SafetySettings` on model |

### Part B Expected Failures

| Item | Gap | Depends On |
|------|-----|-----------|
| B-01 | No auth on v1 routes | A-02 |
| B-02 | No RequireAdmin on admin routes | A-01 |
| B-07 | No rate limiting | A-04 |
| B-08 | No security headers | A-05 |
| B-13 | **No age gate (HARD BLOCK)** | A-11 |
| B-15 | No deletion endpoint | A-13 |
| B-17 | No DPIA document | Standalone document creation |

---

## Related Documents

- TC-021 (`docs/arch/TC-021-security-inspection-framework.md`)
- OWASP Inspection (`docs/security/OWASP-inspection.md`)
- DSGVO Inspection (`docs/security/DSGVO-inspection.md`)
- FR-033 (`docs/features/FR-033-datenschutz-minors.md`)
- Release Checklist (`docs/ops/release-checklist.md` — Section 16)
