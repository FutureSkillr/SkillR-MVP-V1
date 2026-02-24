---
name: pre-deploy
description: Pre-deployment checklist — tests, build, migrations, uncommitted changes, deploy readiness gate
allowed-tools: Read, Glob, Grep, Bash, Task
---

# Pre-Deploy — Deployment Readiness Gate

Run all pre-deployment checks and produce a pass/fail report before deploying to staging or production.

## When to Run

Before every `./scripts/deploy.sh` invocation. This skill is the gate — if it fails, do not deploy.

## Procedure

Run all checks in parallel where possible, then produce the report.

### 1. Uncommitted Changes Check

```bash
git status --porcelain
```

- **PASS**: No output (clean working tree)
- **WARN**: Untracked files only (new files not yet committed)
- **FAIL**: Modified tracked files (uncommitted changes would not be deployed)

### 2. Go Build

```bash
cd backend && go build ./cmd/server
```

- **PASS**: Exit code 0, no output
- **FAIL**: Compilation errors

### 3. Go Unit Tests

```bash
cd backend && go test ./... -count=1 -timeout=120s
```

- **PASS**: All packages pass
- **FAIL**: Any test failure (report which package failed)

### 4. Frontend Type Check

```bash
cd frontend && npx tsc --noEmit 2>&1 || true
```

- **PASS**: No errors
- **WARN**: Type errors found (report count)

### 5. Migration Check

Verify that all SQL migration files exist and are sequential:

```bash
ls backend/migrations/*.up.sql | sort -V
```

Check that the latest migration version matches what the code expects. Grep for `pod_url`, `pod_provider`, `pod_webid` columns to verify Pod-related migrations exist.

### 6. Environment Config Check

Verify `.env.deploy` exists and contains required variables:

```bash
test -f .env.deploy && grep -c 'GCP_PROJECT_ID\|DATABASE_URL\|GEMINI_API_KEY' .env.deploy
```

- **PASS**: File exists with all 3 required keys
- **FAIL**: Missing file or missing keys

### 7. Docker Build Test (optional, slow)

Only run if the user requests `--full`:

```bash
docker build -t skillr-test .
```

### 8. Generate Report

Output the report in this format:

```
# Pre-Deploy Report — {YYYY-MM-DD HH:MM}

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Uncommitted changes | PASS/WARN/FAIL | {details} |
| 2 | Go build | PASS/FAIL | {details} |
| 3 | Go unit tests | PASS/FAIL | {N} packages, {M} tests |
| 4 | Frontend types | PASS/WARN | {details} |
| 5 | Migrations | PASS/WARN | Latest: {version} |
| 6 | Environment config | PASS/FAIL | {details} |

## Verdict: DEPLOY / DO NOT DEPLOY

{If all checks PASS: "All checks passed. Safe to deploy."}
{If any FAIL: "Blocking issues found. Fix before deploying."}
{If only WARN: "Warnings present but non-blocking. Deploy with caution."}
```

### 9. Decision

- If verdict is **DEPLOY**: Tell the user they can run `./scripts/deploy.sh` or `./scripts/deploy.sh staging`
- If verdict is **DO NOT DEPLOY**: List the failing checks and suggest fixes
