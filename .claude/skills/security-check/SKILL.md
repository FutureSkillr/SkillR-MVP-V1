---
name: security-check
description: Run OWASP + DSGVO security inspection against current codebase and flag regressions
allowed-tools: Read, Glob, Grep, Bash, Task
---

# Security Check

Run an OWASP Top 10 + DSGVO compliance check against the current codebase. This surfaces security regressions when new features land.

## Procedure

### Phase 1: Static Code Analysis (OWASP)

Inspect against the gate checklist in `docs/security/gate-checklist.md`.

1. **A01 — Broken Access Control**
   - Grep `backend/cmd/server/main.go` and `backend/internal/server/routes.go` for `RequireAdmin`, `FirebaseAuth`, `v1.Use`
   - Verify all admin routes have `RequireAdmin()` middleware
   - Verify all `/api/v1` routes have `FirebaseAuth` middleware
   - Grep `backend/internal/postgres/` for user-scoped queries (`WHERE user_id`)

2. **A02 — Cryptographic Failures**
   - Grep for secrets in source: `AIza`, `password\s*=\s*"`, `BEGIN.*PRIVATE` in `*.go` and `*.ts` files
   - Check `.env.example` — no actual secret values, only placeholders

3. **A03 — Injection**
   - Grep `backend/internal/` for raw SQL string concatenation (unparameterized queries)
   - Check for XSS vectors: `dangerouslySetInnerHTML` in frontend components

4. **A04 — Rate Limiting**
   - Verify rate limiter middleware is applied to AI and auth endpoints
   - Grep for `RateLimit`, `rateLim` in route wiring

5. **A05 — Security Headers**
   - Grep for `X-Frame-Options`, `Strict-Transport`, `X-Content-Type`, `Content-Security-Policy` in backend middleware
   - Grep for CORS wildcard (`"*"` in AllowOrigins) — flag if found

6. **A06 — Vulnerable Components**
   - Check if `go.sum` or `package-lock.json` has changed since last audit
   - Flag if `govulncheck` or `npm audit` should be run

7. **A09 — Logging**
   - Verify auth failures are logged (grep for logging on 401/403 paths)

### Phase 2: DSGVO Compliance

Check against `docs/security/DSGVO-inspection.md`.

1. **Art. 5 — Data Minimization**
   - Review any NEW database fields or API endpoints added since last audit
   - Flag fields that collect personal data without documented legal basis

2. **Art. 7/8 — Consent & Age Gate**
   - Verify age gate logic exists (grep `age_group`, `AgeGroup`, `age-gate`)
   - Verify consent recording endpoint exists
   - Verify consent version is tracked

3. **Art. 17 — Right to Erasure**
   - Verify deletion endpoint exists (grep `DELETE.*account`, `DeleteUser`)
   - Check that deletion cascades to child tables

4. **Art. 20 — Data Portability**
   - Verify export endpoint exists and covers all data types

5. **Art. 25 — Data Protection by Design**
   - No third-party tracking scripts (grep for `gtag`, `analytics`, `fbq`, `pixel`)
   - No unnecessary cookies (check cookie middleware)

6. **Art. 32 — Security of Processing**
   - Database connections use SSL (`sslmode=require` or `sslmode=verify-full`)
   - Sensitive data encrypted at rest or in transit

### Phase 3: New Feature Scan

1. Glob `docs/features/FR-*.md` — identify FRs with status `in-progress` or recently moved to `done`
2. For each recent FR:
   - Does it introduce new personal data fields? If yes, check Art. 5 compliance
   - Does it introduce new API endpoints? If yes, check auth middleware coverage
   - Does it handle user input? If yes, check for injection/XSS vectors
   - Does it introduce new dependencies? If yes, flag for vulnerability scan

### Phase 4: Diff-Based Regression Check

1. Read the gate checklist `docs/security/gate-checklist.md`
2. Compare current status against checklist — have any previously-passing items regressed?
3. Flag any new routes/endpoints that bypass auth middleware

## Output Format

```
## Security Inspection Report — {date}

### Summary
- OWASP checks: N passed / M total
- DSGVO checks: N passed / M total
- New feature risks: N items flagged

### Critical (must fix before deploy)
- {item}: {description} — OWASP {category} / DSGVO Art. {N}

### Warnings (should fix)
- {item}: {description}

### New Feature Security Notes
- FR-NNN: {security observation}

### Regression Alerts
- {item}: was passing, now failing because {reason}

### Recommendations
- {actionable recommendation}
```

Do NOT create or modify any files. This is a read-only audit.
