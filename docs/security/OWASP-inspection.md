# OWASP Top 10 2021 — Security Inspection Checklist

**Project:** Future SkillR MVP3
**Date:** 2026-02-19
**Scope:** Go backend (Echo/pgx), TypeScript frontend, VertexAI integration, Firebase Auth, PostgreSQL, Redis
**Reference:** TC-021 (Security Inspection Framework)

---

## How to Use This Document

For each OWASP category:
1. **Code files to inspect** — actual paths in the repository
2. **Automated tool commands** — runnable commands (gosec, govulncheck, npm audit, grep)
3. **Manual review items** — specific functions, variables, patterns to check
4. **Live system probe commands** — curl-based tests with expected HTTP status codes

Run automated commands from the repository root.

---

## A01:2021 — Broken Access Control

**Risk:** Users act outside their intended permissions — accessing other users' data, admin functions, or modifying access controls.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/middleware/auth.go` | `FirebaseAuth()` middleware — verifies Bearer JWT via Firebase Admin SDK |
| `backend/internal/middleware/auth.go` | `RequireAdmin()` middleware — checks `userInfo.Role == "admin"` |
| `backend/internal/server/routes.go` | Route groups — which routes use auth middleware, which are public |
| `backend/cmd/server/main.go` | Middleware wiring — is `FirebaseAuth` applied to `/api/v1` group? Is `RequireAdmin` on admin routes? |
| `backend/internal/postgres/sessions.go` | User-scoped queries — does every query filter by `user_id`? |
| `backend/internal/postgres/profiles.go` | Profile access — can user A read user B's private profile? |
| `backend/internal/postgres/reflections.go` | Reflection access — user-scoped? |
| `backend/internal/postgres/evidence.go` | Evidence access — user-scoped? |
| `backend/internal/postgres/endorsements.go` | Endorsement access — who can create/read/modify? |
| `backend/internal/postgres/artifacts.go` | Artifact access — user-scoped delete? |

### Automated Tool Commands

```bash
# Verify FirebaseAuth middleware is applied to v1 group
grep -n "FirebaseAuth\|RequireAdmin\|v1.Use\|v1.Group" backend/cmd/server/main.go backend/internal/server/routes.go

# Verify all postgres queries are user-scoped (look for WHERE user_id)
grep -rn "WHERE.*user_id\|AND.*user_id" backend/internal/postgres/

# Look for any route that bypasses auth (direct e.GET/e.POST outside v1 group)
grep -n "e\.GET\|e\.POST\|e\.PUT\|e\.DELETE" backend/internal/server/routes.go | grep -v "v1\."
```

### Manual Review Items

- [ ] `main.go:79` — `server.RegisterRoutes(srv.Echo, deps)` — verify `v1` group has `FirebaseAuth` middleware applied before this call
- [ ] `routes.go:105-121` — Admin routes (`/api/v1/prompts/*`, `/api/v1/agents/*`) — must have `RequireAdmin()` middleware
- [ ] `routes.go:42-43` — Public profile route (`/api/v1/portfolio/profile/public/:userId`) — intentionally public, confirm no private data leaks
- [ ] `routes.go:54-55` — Public evidence verify route — intentionally public, confirm scope is limited
- [ ] `routes.go:66-67` — Public endorsement submit — intentionally public, confirm validation
- [ ] Every `*Store.Get()` and `*Store.List()` method — verify `user_id` parameter is extracted from JWT context, not URL
- [ ] No horizontal privilege escalation: user A cannot pass user B's UUID to access B's data

### Live System Probe Commands

```bash
STAGING_URL="https://staging.future-skillr.example.com"

# B-01: Unauthenticated request to protected endpoint → expect 401
curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/v1/sessions"
# Expected: 401

# B-02: User token on admin route → expect 403
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_TOKEN" "$STAGING_URL/api/v1/prompts"
# Expected: 403

# B-03: Cross-user data isolation — request another user's session → expect 404 (not 403)
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_A_TOKEN" "$STAGING_URL/api/v1/sessions/$USER_B_SESSION_ID"
# Expected: 404

# Public endpoints should work without auth
curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health"
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/config"
# Expected: 200
```

### Current Status: **GAP**

`FirebaseAuth` and `RequireAdmin` are implemented but **not wired** in `main.go`. The `v1` group in `routes.go` does not apply auth middleware. Admin routes (`/prompts/*`, `/agents/*`) have no `RequireAdmin()` guard.

---

## A02:2021 — Cryptographic Failures

**Risk:** Sensitive data exposure through weak/missing encryption, plaintext transmission, hardcoded secrets.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/config/config.go` | All secrets loaded via `os.Getenv()` — no hardcoded values |
| `backend/cmd/server/main.go` | No secret values logged |
| `.gitignore` | `.env`, `.env.local`, credentials files excluded |
| `.env.example` | Contains placeholder values only (no real keys) |
| `Dockerfile` | No `ARG` or `ENV` with secret values at build time |
| `frontend/vite.config.ts` | No secrets embedded in build |
| `frontend/services/firebase.ts` | Firebase config loaded from `/api/config`, not hardcoded |

### Automated Tool Commands

```bash
# Scan for hardcoded secrets (API keys, passwords, tokens)
grep -rn "AIza\|password\s*=\s*\"\|secret\s*=\s*\"\|token\s*=\s*\"" backend/ frontend/ --include="*.go" --include="*.ts" --include="*.tsx" | grep -v "_test\." | grep -v "node_modules" | grep -v ".env.example"

# Verify .gitignore covers secret files
grep -n "\.env" .gitignore

# Check if any secrets are in git history
git log --all --oneline --diff-filter=A -- "*.env" ".env*" "credentials*" "*.key" "*.pem"

# Verify DATABASE_URL pattern includes sslmode
grep -rn "DATABASE_URL" backend/internal/config/ .env.example docker-compose.yml
```

### Manual Review Items

- [ ] `config.go:31` — `DATABASE_URL` is required but no sslmode enforcement — verify production value includes `?sslmode=require`
- [ ] `config.go:48-52` — Firebase client config keys are exposed via `/api/config` endpoint — these are public keys by design (Firebase docs confirm this is safe), but verify no server-side secrets leak
- [ ] `.env.example` — contains only placeholder/example values, no real credentials
- [ ] No API keys visible in the frontend JavaScript bundle after build
- [ ] TLS certificate on production domain is valid and has >30 days until expiry

### Live System Probe Commands

```bash
# B-04: HTTPS enforced (HTTP should redirect)
curl -s -o /dev/null -w "%{http_code}" "http://staging.future-skillr.example.com/"
# Expected: 301 or 308 (redirect to HTTPS)

# B-05: TLS certificate validity
echo | openssl s_client -servername staging.future-skillr.example.com -connect staging.future-skillr.example.com:443 2>/dev/null | openssl x509 -noout -dates
# Expected: notAfter > 30 days from now

# B-06: No API keys in JS bundle
curl -s "$STAGING_URL/assets/" | grep -l "\.js$" | head -5 | while read f; do
  curl -s "$STAGING_URL/$f" | grep -c "AIza"
done
# Expected: 0 matches
```

### Current Status: **PARTIAL**

Secrets management is correct (all via env vars). `.gitignore` covers `.env*`. No hardcoded secrets in source. **Gap:** `DATABASE_URL` sslmode not enforced in config validation. TLS verification requires live system check.

---

## A03:2021 — Injection

**Risk:** SQL injection, NoSQL injection, OS command injection, LDAP injection through untrusted data in queries or commands.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/postgres/sessions.go` | All SQL uses `$1, $2` parameterized queries (pgx/v5) |
| `backend/internal/postgres/users.go` | Parameterized queries for user CRUD |
| `backend/internal/postgres/profiles.go` | Parameterized queries |
| `backend/internal/postgres/reflections.go` | Parameterized queries |
| `backend/internal/postgres/evidence.go` | Parameterized queries |
| `backend/internal/postgres/endorsements.go` | Parameterized queries |
| `backend/internal/postgres/artifacts.go` | Parameterized queries |
| `backend/internal/postgres/journal.go` | Parameterized queries |
| `backend/internal/postgres/engagement.go` | Parameterized queries |
| `backend/internal/postgres/prompt_logs.go` | Parameterized queries |
| `backend/internal/postgres/agent_executions.go` | Parameterized queries |

### Automated Tool Commands

```bash
# gosec: scan for SQL injection patterns
gosec -include=G201,G202 ./backend/...

# Look for string concatenation in SQL (dangerous pattern)
grep -rn 'fmt.Sprintf.*SELECT\|fmt.Sprintf.*INSERT\|fmt.Sprintf.*UPDATE\|fmt.Sprintf.*DELETE' backend/internal/postgres/

# Look for string concatenation with user input near SQL
grep -rn '+ "\|+= "' backend/internal/postgres/ | grep -i "sql\|query\|where"

# Verify all queries use parameterized placeholders
grep -rn '\$[0-9]' backend/internal/postgres/ | wc -l
# Expected: many lines (parameterized queries)
```

### Manual Review Items

- [ ] Every `pool.Query()`, `pool.QueryRow()`, `pool.Exec()` call uses `$N` placeholders, never string interpolation
- [ ] No `fmt.Sprintf` used to build SQL strings
- [ ] User input from `c.Param()`, `c.QueryParam()`, `c.Bind()` is never interpolated into queries
- [ ] Migration files use static DDL only (no dynamic SQL)

### Live System Probe Commands

```bash
# Attempt SQL injection via session name
curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test'\'' OR 1=1 --"}' \
  "$STAGING_URL/api/v1/sessions"
# Expected: 200 (stores literal string) or 400 (validation error), NOT a SQL error
```

### Current Status: **PASS**

All PostgreSQL queries use pgx/v5 parameterized queries (`$1, $2, ...`). No string concatenation SQL patterns found. gosec G201/G202 clean.

---

## A04:2021 — Insecure Design

**Risk:** Missing or ineffective control design — rate limiting, resource limits, abuse prevention.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/redis/ratelimiter.go` | Sliding window rate limiter implementation — correct algorithm |
| `backend/internal/redis/ratelimiter_test.go` | Test coverage for rate limiter |
| `backend/internal/server/server.go:33` | `BodyLimit("10M")` — request size limit |
| `backend/internal/ai/vertexai.go` | No request size/token limits enforced |
| `backend/cmd/server/main.go` | Rate limiter not wired to any route |

### Automated Tool Commands

```bash
# Verify rate limiter exists and is tested
ls -la backend/internal/redis/ratelimiter*.go

# Check if rate limiter middleware is wired in main.go
grep -n "RateLimit\|rateLim" backend/cmd/server/main.go

# Check VertexAI token/request limits
grep -n "MaxOutputTokens\|maxTokens\|limit" backend/internal/ai/vertexai.go
```

### Manual Review Items

- [ ] `ratelimiter.go:29` — `Allow()` implements sliding window correctly (ZREMRANGEBYSCORE + ZCARD + ZADD)
- [ ] Rate limiter gracefully degrades when Redis is unavailable (`client == nil` → allow all, line 30-32)
- [ ] Rate limiter is applied as middleware to `/api/v1/ai/*` routes (currently NOT done)
- [ ] `BodyLimit("10M")` is appropriate for the API (prevents oversized requests)
- [ ] AI endpoints have reasonable token limits to prevent cost abuse

### Live System Probe Commands

```bash
# B-07: Rate limit fires on AI endpoint
for i in $(seq 1 35); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message": "test"}' \
    "$STAGING_URL/api/v1/ai/chat"
done
# Expected: first ~30 return 200, then 429
```

### Current Status: **GAP**

Rate limiter is implemented and tested but **not wired** to any routes. AI endpoints (`/api/v1/ai/*`) have no rate limiting. No per-user cost controls on VertexAI calls.

---

## A05:2021 — Security Misconfiguration

**Risk:** Missing security hardening — default configs, unnecessary features enabled, missing headers, overly permissive CORS.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/server/server.go` | CORS config, middleware stack, error handler |
| `backend/internal/config/config.go` | `AllowedOrigins` default value |
| `backend/internal/middleware/errorhandler.go` | 500 error message suppression |
| `Dockerfile` | Distroless image, nonroot user, no debug tools |
| `docker-compose.yml` | Local staging config — no exposed ports/secrets |

### Automated Tool Commands

```bash
# Check CORS configuration
grep -n "AllowOrigins\|CORS\|AllowedOrigins" backend/internal/server/server.go backend/internal/config/config.go

# Verify no wildcard CORS
grep -n '"\\*"' backend/internal/server/server.go backend/internal/config/config.go

# Check for missing security headers
grep -rn "X-Frame-Options\|X-Content-Type-Options\|Strict-Transport-Security\|Content-Security-Policy\|X-XSS-Protection" backend/

# Verify error handler suppresses internal details
grep -n "internal server error" backend/internal/middleware/errorhandler.go backend/internal/server/server.go

# Check Dockerfile is distroless + nonroot
grep -n "distroless\|nonroot\|USER" Dockerfile
```

### Manual Review Items

- [ ] `server.go:27` — `AllowedOrigins: cfg.AllowedOrigins` — no wildcard `*`, loaded from env with safe defaults
- [ ] `config.go:43` — Default origins are `localhost:5173,localhost:9090` — production must override
- [ ] `server.go:32` — `AllowCredentials: true` with explicit origins (not `*`) — correct per CORS spec
- [ ] No security headers middleware exists (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) — **GAP**
- [ ] `errorhandler.go:27-29` — 500 errors return "internal server error" (never leaks stack trace) — PASS
- [ ] `Dockerfile:28` — `gcr.io/distroless/static-debian12:nonroot` — minimal attack surface
- [ ] `Dockerfile:36` — `USER nonroot:nonroot` — runs as non-root
- [ ] `server.go:20` — `e.HideBanner = true` — no framework version disclosure

### Live System Probe Commands

```bash
# B-08: Security headers in response
curl -s -I "$STAGING_URL/api/health" | grep -i "strict-transport\|x-frame-options\|x-content-type\|content-security-policy"
# Expected: All four headers present

# B-09: CORS rejects unauthorized origin
curl -s -I -H "Origin: https://evil.example.com" "$STAGING_URL/api/v1/sessions" | grep -i "access-control-allow-origin"
# Expected: Header absent or does not contain evil.example.com

# Verify error handler does not leak details
curl -s -X POST "$STAGING_URL/api/v1/nonexistent" | python3 -m json.tool
# Expected: {"error": "..."} with no stack trace
```

### Current Status: **GAP**

CORS is correctly configured (no wildcard, env-driven origins). Error handler suppresses internals. Distroless+nonroot Docker. **Missing:** HTTP security headers middleware (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).

---

## A06:2021 — Vulnerable and Outdated Components

**Risk:** Using components with known vulnerabilities — outdated dependencies, unpatched libraries.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/go.mod` | Go module dependencies and versions |
| `backend/go.sum` | Integrity checksums |
| `frontend/package.json` | npm dependencies |
| `frontend/package-lock.json` | Locked dependency versions |
| `Dockerfile` | Base image versions (node:20-alpine, golang:1.22-alpine, distroless) |

### Automated Tool Commands

```bash
# Go vulnerability scan
cd backend && govulncheck ./... && cd ..

# Go module integrity
cd backend && go mod verify && cd ..

# npm vulnerability audit
cd frontend && npm audit --audit-level=high && cd ..

# Check Go version
go version

# Check for outdated Go dependencies
cd backend && go list -m -u all 2>/dev/null | grep '\[' | head -20 && cd ..

# Check Docker base image versions
grep "^FROM" Dockerfile
```

### Manual Review Items

- [ ] `go.mod` — Go version is 1.22+ (supported, receiving security patches)
- [ ] `govulncheck` reports no known vulnerabilities in used code paths
- [ ] `npm audit` reports no high/critical vulnerabilities
- [ ] `go mod verify` passes (no tampered checksums)
- [ ] Docker base images are recent (node:20-alpine, golang:1.22-alpine, distroless latest)
- [ ] No deprecated or abandoned dependencies

### Live System Probe Commands

No live probes — this is a build-time check only.

### Current Status: **NEEDS VERIFICATION**

No vulnerability scanning has been run. `govulncheck` and `npm audit` must be executed and integrated into CI.

---

## A07:2021 — Identification and Authentication Failures

**Risk:** Weak authentication, session fixation, credential stuffing, missing token validation.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/middleware/auth.go` | JWT verification via Firebase Admin SDK |
| `backend/internal/firebase/client.go` | Firebase client initialization, token verification |
| `backend/internal/firebase/userinfo.go` | UserInfo struct — what claims are extracted |
| `frontend/services/firebase.ts` | Client-side auth — token handling, session management |

### Automated Tool Commands

```bash
# Verify token verification is used (not just token parsing)
grep -rn "VerifyToken\|VerifyIDToken" backend/internal/

# Check for any custom JWT parsing (should use Firebase SDK only)
grep -rn "jwt\.\|ParseToken\|DecodeToken" backend/internal/ | grep -v "_test\."

# Check token expiry handling
grep -rn "expired\|expir\|exp " backend/internal/middleware/
```

### Manual Review Items

- [ ] `auth.go:31` — Token verification via `fbClient.VerifyToken()` — delegates to Firebase Admin SDK (correct, SDK handles expiry/signature)
- [ ] `auth.go:22-28` — Bearer token extraction is correct (SplitN, case-insensitive "bearer")
- [ ] No custom JWT parsing — all verification delegated to Firebase Admin SDK
- [ ] No session tokens in URLs (all in Authorization header)
- [ ] Frontend stores token in memory or secure httpOnly cookie, not localStorage
- [ ] Token refresh is handled by Firebase SDK on the client

### Live System Probe Commands

```bash
# B-10: Expired JWT returns 401
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer expired.jwt.token" "$STAGING_URL/api/v1/sessions"
# Expected: 401

# Malformed JWT returns 401
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer not-a-jwt" "$STAGING_URL/api/v1/sessions"
# Expected: 401

# Missing Bearer prefix returns 401
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: $USER_TOKEN" "$STAGING_URL/api/v1/sessions"
# Expected: 401
```

### Current Status: **PASS**

Firebase Admin SDK handles all JWT verification (signature, expiry, issuer). No custom JWT parsing. Token extraction is correct. **Note:** Depends on A01 (middleware must be wired).

---

## A08:2021 — Software and Data Integrity Failures

**Risk:** Untrusted updates, tampered dependencies, unsigned artifacts, insecure CI/CD.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/go.sum` | Cryptographic checksums for all Go modules |
| `frontend/package-lock.json` | Integrity hashes for all npm packages |
| `.github/workflows/deploy.yml` | CI/CD pipeline — any unsafe steps? |
| `cloudbuild.yaml` | GCP Cloud Build config |
| `Dockerfile` | Multi-stage build, no curl piped to sh |

### Automated Tool Commands

```bash
# Verify Go module checksums
cd backend && go mod verify && cd ..

# Check npm package integrity
cd frontend && npm ci --ignore-scripts 2>&1 | head -20 && cd ..

# Look for unsafe CI patterns (curl | sh, wget | bash)
grep -rn "curl.*sh\|wget.*bash\|pip install.*--trusted-host" .github/ cloudbuild.yaml Dockerfile

# Verify Dockerfile doesn't run untrusted scripts
grep -n "RUN.*curl\|RUN.*wget" Dockerfile
```

### Manual Review Items

- [ ] `go.sum` exists and contains checksums for all imported modules
- [ ] `package-lock.json` exists and contains integrity hashes
- [ ] `go mod verify` passes without errors
- [ ] CI/CD pipeline does not install from untrusted sources
- [ ] Dockerfile uses specific image tags (not `:latest` for build stages)
- [ ] No post-install scripts in npm that download external code

### Live System Probe Commands

No live probes — this is a build-time and supply chain check.

### Current Status: **PASS**

`go.sum` and `package-lock.json` exist with integrity hashes. Dockerfile uses specific versioned images (`node:20-alpine`, `golang:1.22-alpine`). No unsafe `curl | sh` patterns. `go mod verify` needs to be run in CI.

---

## A09:2021 — Security Logging and Monitoring Failures

**Risk:** Insufficient logging of security events — failed logins, access violations, anomalies undetected.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/middleware/auth.go` | Auth failures logged? |
| `backend/internal/middleware/errorhandler.go` | Error responses logged? |
| `backend/internal/server/server.go` | Request logging middleware? |
| `backend/internal/postgres/prompt_logs.go` | AI interaction logging |
| `backend/internal/postgres/agent_executions.go` | Agent execution logging |

### Automated Tool Commands

```bash
# Check for logging on auth failures
grep -rn "log\.\|logger\.\|slog\." backend/internal/middleware/auth.go

# Check for request logging middleware
grep -rn "Logger\|RequestID\|AccessLog" backend/internal/server/server.go

# Verify Cloud Run structured logging
grep -rn "log\.Printf\|log\.Println\|slog\." backend/cmd/server/main.go
```

### Manual Review Items

- [ ] Auth failures (401, 403) are logged with request ID and source IP
- [ ] 500 errors are logged with stack trace server-side (not exposed to client)
- [ ] `server.go:25` — `echomw.RequestID()` is applied — each request gets a correlation ID
- [ ] Cloud Run captures stdout/stderr as structured logs
- [ ] AI interactions are logged to `analytics_prompt_logs` table
- [ ] Agent executions are logged to `analytics_agent_executions` table

### Live System Probe Commands

```bash
# B-11: Auth failure visible in Cloud Run logs
curl -s -H "Authorization: Bearer invalid" "$STAGING_URL/api/v1/sessions"
# Then check: gcloud logging read "resource.type=cloud_run_revision" --limit=5 --format=json | grep -i "401\|unauthorized"

# B-12: Health check accessible
curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health"
# Expected: 200
```

### Current Status: **PARTIAL**

Request IDs are generated (`echomw.RequestID()`). Echo framework logs requests to stdout (Cloud Run captures). AI interactions logged to database. **Gap:** Auth failure events not explicitly logged with user context. No alerting configured.

---

## A10:2021 — Server-Side Request Forgery (SSRF)

**Risk:** Application fetches external resources based on user input, enabling internal network scanning or data exfiltration.

### Code Files to Inspect

| File | What to Check |
|------|---------------|
| `backend/internal/ai/vertexai.go` | VertexAI client — connects to Google API only, no user-controlled URLs |
| `backend/internal/firebase/client.go` | Firebase client — connects to Firebase only, no user-controlled URLs |
| `backend/internal/postgres/*.go` | Database connections — no user-controlled connection strings |

### Automated Tool Commands

```bash
# Look for HTTP client usage with user-controlled URLs
grep -rn "http\.Get\|http\.Post\|http\.NewRequest\|url\.Parse" backend/internal/ | grep -v "_test\."

# Look for any user input used in URL construction
grep -rn "c\.Param\|c\.QueryParam\|c\.FormValue" backend/internal/ | grep -i "url\|host\|endpoint"
```

### Manual Review Items

- [ ] No user-controlled URLs are used in server-side HTTP requests
- [ ] VertexAI client connects only to Google's `generativelanguage.googleapis.com` — no URL override from user input
- [ ] Firebase client connects only to Firebase — no URL override from user input
- [ ] No proxy or redirect functionality that forwards user-supplied URLs

### Live System Probe Commands

No SSRF probes applicable — the application does not accept URL parameters for server-side fetching.

### Current Status: **PASS**

No user-controlled URLs are used in server-side requests. VertexAI and Firebase clients connect to hardcoded Google endpoints. No proxy/redirect functionality exists.

---

## Summary Table

| Category | ID | Status | Blocking Items |
|----------|----|--------|----------------|
| A01 Broken Access Control | A01 | **GAP** | Wire `FirebaseAuth` to v1 group, `RequireAdmin` to admin routes |
| A02 Cryptographic Failures | A02 | **PARTIAL** | Enforce `sslmode=require` in DATABASE_URL, verify TLS live |
| A03 Injection | A03 | **PASS** | None |
| A04 Insecure Design | A04 | **GAP** | Wire rate limiter to `/api/v1/ai/*` |
| A05 Security Misconfiguration | A05 | **GAP** | Add security headers middleware |
| A06 Vulnerable Components | A06 | **NEEDS VERIFICATION** | Run `govulncheck` + `npm audit` in CI |
| A07 Auth Failures | A07 | **PASS** | None (depends on A01 wiring) |
| A08 Integrity Failures | A08 | **PASS** | Run `go mod verify` in CI |
| A09 Logging Failures | A09 | **PARTIAL** | Add explicit auth failure logging |
| A10 SSRF | A10 | **PASS** | None |

---

## Related Documents

- TC-021 (Security Inspection Framework)
- `docs/security/DSGVO-inspection.md`
- `docs/security/gate-checklist.md`
- FR-033 (Datenschutz for Minors)
