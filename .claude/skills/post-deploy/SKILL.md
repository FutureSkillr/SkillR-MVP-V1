---
name: post-deploy
description: Post-deployment verification — health checks, version, logs, smoke tests
allowed-tools: Read, Glob, Grep, Bash, WebFetch
---

# Post-Deploy — Deployment Verification

Verify a deployment is healthy after `./scripts/deploy.sh` completes. Complements `/pre-deploy`.

## When to Run

Immediately after a successful `./scripts/deploy.sh` invocation.

## Procedure

### 1. Detect Deployment Target

Check the latest deployment log to determine the target URL:

```bash
ls -t docs/ops/deployments/deploy-*.html | head -1
```

Extract the Cloud Run service URL. If not found, ask the user for the deployment URL.

Default URLs:
- **Production:** `https://skillr-backend-<hash>.run.app`
- **Staging:** Check `gcloud run services describe skillr-backend --region=europe-west3 --format='value(status.url)'`

### 2. Health Check

```bash
curl -sf "${DEPLOY_URL}/api/health" | python3 -m json.tool
```

- **PASS**: Returns `{"status":"ok"}` with HTTP 200
- **FAIL**: Connection refused, timeout, or non-200 status

### 3. Detailed Health (if token available)

```bash
curl -sf -H "Authorization: Bearer ${HEALTH_TOKEN}" "${DEPLOY_URL}/api/health/detailed" | python3 -m json.tool
```

Check that all components report healthy:
- PostgreSQL: connected
- Redis: connected
- Firebase: configured
- AI: initialized

### 4. Version Check

```bash
# Compare deployed version with local HEAD
LOCAL_SHA=$(git rev-parse --short HEAD)
curl -sf "${DEPLOY_URL}/api/health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','unknown'))"
```

- **PASS**: Deployed version matches local HEAD
- **WARN**: Version mismatch (old deployment or build cache)

### 5. Smoke Tests

Hit key public endpoints:

```bash
# Config endpoint (returns Firebase config)
curl -sf "${DEPLOY_URL}/api/config" -o /dev/null -w "%{http_code}"

# Pod readiness (should return JSON regardless of pod config)
curl -sf "${DEPLOY_URL}/api/v1/pod/readiness" -o /dev/null -w "%{http_code}"

# Static assets (frontend served)
curl -sf "${DEPLOY_URL}/" -o /dev/null -w "%{http_code}"
```

Each should return 200.

### 6. Cloud Run Logs (last 5 minutes)

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skillr-backend AND severity>=WARNING" --limit=10 --format="table(timestamp,severity,textPayload)" --freshness=5m 2>/dev/null
```

- **PASS**: No ERROR or CRITICAL entries
- **WARN**: WARNING entries present (report them)
- **FAIL**: ERROR/CRITICAL entries found

### 7. Generate Report

```
# Post-Deploy Report — {YYYY-MM-DD HH:MM}

**Target:** {URL}

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Health endpoint | PASS/FAIL | {status} |
| 2 | Component health | PASS/WARN | {details} |
| 3 | Version | PASS/WARN | deployed={sha} local={sha} |
| 4 | Smoke tests | PASS/FAIL | config={code} pod={code} static={code} |
| 5 | Cloud Run logs | PASS/WARN/FAIL | {error count} |

## Verdict: HEALTHY / UNHEALTHY

{If all PASS: "Deployment verified. All systems operational."}
{If any FAIL: "Deployment issues detected. Investigate before routing traffic."}
```
