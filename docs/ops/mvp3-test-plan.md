# MVP3 Test Plan — Secure API Gateway

**Created:** 2026-02-19
**Scope:** FR-051, FR-052, TC-016

---

## 1. Unit Tests (vitest)

Run all frontend unit tests including 3 new gateway test suites.

```bash
cd frontend && npm test
```

### New test files

| File | Count | What's tested |
|------|-------|---------------|
| `services/gemini.test.ts` | 7 | All proxy endpoints via mocked fetch, 429 handling, error handling |
| `services/firebase.test.ts` | 4 | `/api/config` fetch, init lifecycle, missing config, network error |
| `services/rateLimit.test.ts` | 5 | Sliding window algorithm: limits, reset, per-key isolation, retryAfter |

### Existing tests (regression)

All pre-existing tests must still pass. Key risk areas:
- `services/firestore.test.ts` — already mocks Firebase, should be unaffected
- `services/engagement.test.ts` — no Firebase dependency
- `types/*.test.ts` — pure logic, no risk

---

## 2. TypeScript Compilation

```bash
cd frontend && npx tsc --noEmit                 # Frontend types
cd frontend && npx tsc -p tsconfig.server.json   # Server compilation → server-dist/
```

**Pass criteria:** Zero errors from both commands.

---

## 3. Build Verification

```bash
cd frontend && npm run build            # Vite frontend → dist/
cd frontend && npm run build:server     # Server TypeScript → server-dist/
```

### Post-build checks

| Check | Command | Expected |
|-------|---------|----------|
| No API key in bundle | `grep -r "AIza" frontend/dist/` | No matches |
| No Firebase config in bundle | `grep -r "firebaseapp.com" frontend/dist/` | No matches |
| Server compiled | `ls frontend/server-dist/index.js` | File exists |
| Server routes compiled | `ls frontend/server-dist/routes/gemini.js` | File exists |
| Middleware compiled | `ls frontend/server-dist/middleware/rateLimit.js` | File exists |

---

## 4. Docker Build

```bash
make docker-build
```

**Pass criteria:** Image builds successfully with no errors. No `--build-arg` needed.

---

## 5. Local Staging (docker-compose)

**Prerequisite:** `.env.local` at project root with valid keys.

```bash
make local-stage
```

### Smoke tests against `http://localhost:9090`

| Test | Command | Expected |
|------|---------|----------|
| Health check | `curl -s localhost:9090/api/health` | `{"status":"ok"}` |
| Config endpoint | `curl -s localhost:9090/api/config` | JSON with `firebase` key containing 6 fields |
| Config has values | `curl -s localhost:9090/api/config \| jq .firebase.projectId` | Non-empty string |
| Agents 501 | `curl -s localhost:9090/api/agents/test` | `{"error":"Agent API not implemented...","code":"NOT_IMPLEMENTED"}` |
| SPA fallback | `curl -s localhost:9090/nonexistent \| head -1` | `<!DOCTYPE html>` |
| Static assets | `curl -s -o /dev/null -w '%{http_code}' localhost:9090/` | `200` |
| Gemini chat (live) | `curl -s -X POST localhost:9090/api/gemini/chat -H 'Content-Type: application/json' -d '{"systemInstruction":"Test","history":[],"userMessage":"Hallo"}'` | JSON with `text` field |
| Rate limit header | Send 31 rapid requests to `/api/gemini/chat` | 429 with `Retry-After` header |

### Cleanup

```bash
docker compose down
```

---

## 6. Security Verification

| Check | Method | Expected |
|-------|--------|----------|
| No secrets in JS bundle | `grep -rE "AIza\|firebaseapp\.com" frontend/dist/` | No matches |
| No secrets in Docker image layers | `docker history $(docker images -q future-skillr:latest)` | No `--build-arg` with keys |
| `.env.local` gitignored | `git check-ignore .env.local` | Listed |
| `server-dist/` gitignored | `git check-ignore frontend/server-dist/` | Listed |

---

## 7. Regression: Dev Mode

After all changes, dev mode must still work:

```bash
cd frontend && npm run dev:all
```

- Vite dev server on port 3000
- Express dev server on port 3001
- `/api` calls proxied from 3000 → 3001
- Gateway routes (`/api/gemini/*`, `/api/config`, `/api/agents/*`) reachable
- Existing routes (`/api/auth/*`, `/api/users/*`, etc.) still work

---

## Pass/Fail Summary

| Phase | Status |
|-------|--------|
| 1. Unit tests | [ ] |
| 2. TypeScript compilation | [ ] |
| 3. Build verification | [ ] |
| 4. Docker build | [ ] |
| 5. Local staging smoke tests | [ ] |
| 6. Security verification | [ ] |
| 7. Dev mode regression | [ ] |
