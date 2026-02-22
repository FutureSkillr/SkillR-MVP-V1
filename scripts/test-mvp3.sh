#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# MVP3 Test Script — Secure API Gateway (FR-051, FR-052, TC-016)
#
# Usage:
#   ./scripts/test-mvp3.sh              # Run all phases
#   ./scripts/test-mvp3.sh unit         # Run only unit tests
#   ./scripts/test-mvp3.sh build        # Run only build checks
#   ./scripts/test-mvp3.sh docker       # Run only Docker build
#   ./scripts/test-mvp3.sh staging      # Run only local staging smoke tests
#   ./scripts/test-mvp3.sh security     # Run only security checks
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
SKIP=0

pass() { echo -e "  ${GREEN}PASS${NC} $1"; ((PASS++)); }
fail() { echo -e "  ${RED}FAIL${NC} $1"; ((FAIL++)); }
skip() { echo -e "  ${YELLOW}SKIP${NC} $1"; ((SKIP++)); }
header() { echo -e "\n${CYAN}── $1 ──${NC}"; }

PHASE="${1:-all}"

# ─── Phase 1: Unit Tests ───────────────────────────────────────────
run_unit() {
  header "Phase 1: Unit Tests (vitest)"

  cd "$FRONTEND_DIR"
  if npm test 2>&1; then
    pass "All unit tests passed"
  else
    fail "Unit tests failed"
  fi
  cd "$ROOT_DIR"
}

# ─── Phase 2: TypeScript Compilation ───────────────────────────────
run_typecheck() {
  header "Phase 2: TypeScript Compilation"

  cd "$FRONTEND_DIR"

  echo "  Checking frontend types..."
  if npx tsc --noEmit 2>&1; then
    pass "Frontend typecheck"
  else
    fail "Frontend typecheck"
  fi

  echo "  Compiling server..."
  if npx tsc -p tsconfig.server.json 2>&1; then
    pass "Server compilation"
  else
    fail "Server compilation"
  fi

  cd "$ROOT_DIR"
}

# ─── Phase 3: Build Verification ──────────────────────────────────
run_build() {
  header "Phase 3: Build Verification"

  cd "$FRONTEND_DIR"

  echo "  Building frontend..."
  if npm run build 2>&1; then
    pass "Vite build"
  else
    fail "Vite build"
    return
  fi

  echo "  Building server..."
  if npm run build:server 2>&1; then
    pass "Server build"
  else
    fail "Server build"
    return
  fi

  # Post-build checks
  if grep -rq "AIza" "$FRONTEND_DIR/dist/" 2>/dev/null; then
    fail "Gemini API key found in JS bundle"
  else
    pass "No Gemini API key in JS bundle"
  fi

  if grep -rq "firebaseapp\.com" "$FRONTEND_DIR/dist/" 2>/dev/null; then
    fail "Firebase config found hardcoded in JS bundle"
  else
    pass "No hardcoded Firebase config in JS bundle"
  fi

  if [ -f "$FRONTEND_DIR/server-dist/index.js" ]; then
    pass "server-dist/index.js exists"
  else
    fail "server-dist/index.js missing"
  fi

  if [ -f "$FRONTEND_DIR/server-dist/routes/gemini.js" ]; then
    pass "server-dist/routes/gemini.js exists"
  else
    fail "server-dist/routes/gemini.js missing"
  fi

  if [ -f "$FRONTEND_DIR/server-dist/middleware/rateLimit.js" ]; then
    pass "server-dist/middleware/rateLimit.js exists"
  else
    fail "server-dist/middleware/rateLimit.js missing"
  fi

  cd "$ROOT_DIR"
}

# ─── Phase 4: Docker Build ────────────────────────────────────────
run_docker() {
  header "Phase 4: Docker Build"

  cd "$ROOT_DIR"

  if ! command -v docker &>/dev/null; then
    skip "Docker not available"
    return
  fi

  echo "  Building Docker image..."
  if docker build -t future-skillr:mvp3-test . 2>&1; then
    pass "Docker image builds"
  else
    fail "Docker image build failed"
    return
  fi

  # Check no build-arg secrets in image history
  if docker history future-skillr:mvp3-test 2>/dev/null | grep -q "GEMINI_API_KEY"; then
    fail "GEMINI_API_KEY found in Docker image history"
  else
    pass "No secrets in Docker image history"
  fi
}

# ─── Phase 5: Local Staging Smoke Tests ───────────────────────────
run_staging() {
  header "Phase 5: Local Staging Smoke Tests"

  cd "$ROOT_DIR"

  if ! command -v docker &>/dev/null; then
    skip "Docker not available"
    return
  fi

  if [ ! -f "$ROOT_DIR/.env.local" ]; then
    skip "No .env.local file — cannot run staging (copy .env.example to .env.local)"
    return
  fi

  echo "  Starting docker-compose..."
  docker compose up --build -d 2>&1

  # Wait for container to be ready
  echo "  Waiting for service to start..."
  local retries=0
  local max_retries=30
  while [ $retries -lt $max_retries ]; do
    if curl -sf http://localhost:9090/api/health >/dev/null 2>&1; then
      break
    fi
    sleep 1
    ((retries++))
  done

  if [ $retries -eq $max_retries ]; then
    fail "Service did not start within ${max_retries}s"
    docker compose logs 2>&1 | tail -20
    docker compose down 2>&1
    return
  fi
  pass "Service started"

  # Health check
  local health
  health=$(curl -sf http://localhost:9090/api/health 2>/dev/null || echo "")
  if echo "$health" | grep -q '"status":"ok"'; then
    pass "GET /api/health → {\"status\":\"ok\"}"
  else
    fail "GET /api/health unexpected response: $health"
  fi

  # Config endpoint
  local config
  config=$(curl -sf http://localhost:9090/api/config 2>/dev/null || echo "")
  if echo "$config" | grep -q '"firebase"'; then
    pass "GET /api/config → has firebase key"
  else
    fail "GET /api/config unexpected response: $config"
  fi

  # Check config has projectId
  if echo "$config" | grep -q '"projectId"'; then
    pass "GET /api/config → has projectId field"
  else
    fail "GET /api/config → missing projectId"
  fi

  # Agents 501
  local agents
  agents=$(curl -sf http://localhost:9090/api/agents/test 2>/dev/null || curl -s http://localhost:9090/api/agents/test 2>/dev/null)
  if echo "$agents" | grep -q 'NOT_IMPLEMENTED'; then
    pass "GET /api/agents/test → 501 NOT_IMPLEMENTED"
  else
    fail "GET /api/agents/test unexpected response: $agents"
  fi

  # SPA fallback
  local spa
  spa=$(curl -sf http://localhost:9090/nonexistent-route 2>/dev/null | head -1)
  if echo "$spa" | grep -q "DOCTYPE\|html"; then
    pass "SPA fallback → serves index.html"
  else
    fail "SPA fallback did not return HTML"
  fi

  # Static assets (root)
  local root_status
  root_status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:9090/ 2>/dev/null)
  if [ "$root_status" = "200" ]; then
    pass "GET / → 200"
  else
    fail "GET / → $root_status (expected 200)"
  fi

  # Gemini chat (only if GEMINI_API_KEY is set)
  if grep -q "GEMINI_API_KEY=." "$ROOT_DIR/.env.local" 2>/dev/null; then
    echo "  Testing Gemini proxy (live API call)..."
    local chat
    chat=$(curl -sf -X POST http://localhost:9090/api/gemini/chat \
      -H 'Content-Type: application/json' \
      -d '{"systemInstruction":"Antworte kurz.","history":[],"userMessage":"Sage nur: Test OK"}' \
      2>/dev/null || echo "")
    if echo "$chat" | grep -q '"text"'; then
      pass "POST /api/gemini/chat → got text response"
    else
      fail "POST /api/gemini/chat unexpected response: $chat"
    fi
  else
    skip "Gemini live test (no GEMINI_API_KEY in .env.local)"
  fi

  # Cleanup
  echo "  Stopping docker-compose..."
  docker compose down 2>&1
  pass "docker-compose down clean"
}

# ─── Phase 6: Security Checks ────────────────────────────────────
run_security() {
  header "Phase 6: Security Verification"

  cd "$ROOT_DIR"

  # .env.local gitignored
  if git check-ignore .env.local >/dev/null 2>&1; then
    pass ".env.local is gitignored"
  else
    fail ".env.local is NOT gitignored"
  fi

  # server-dist gitignored
  if git check-ignore frontend/server-dist/ >/dev/null 2>&1; then
    pass "frontend/server-dist/ is gitignored"
  else
    fail "frontend/server-dist/ is NOT gitignored"
  fi

  # No secrets in vite.config.ts define block
  if grep -q "GEMINI_API_KEY" "$FRONTEND_DIR/vite.config.ts" 2>/dev/null; then
    fail "GEMINI_API_KEY still referenced in vite.config.ts"
  else
    pass "No GEMINI_API_KEY in vite.config.ts"
  fi

  if grep -q "FIREBASE_API_KEY" "$FRONTEND_DIR/vite.config.ts" 2>/dev/null; then
    fail "FIREBASE_API_KEY still referenced in vite.config.ts"
  else
    pass "No FIREBASE_API_KEY in vite.config.ts"
  fi

  # No --build-arg in cloudbuild.yaml
  if grep -q "build-arg" "$ROOT_DIR/cloudbuild.yaml" 2>/dev/null; then
    fail "--build-arg still in cloudbuild.yaml"
  else
    pass "No --build-arg in cloudbuild.yaml"
  fi

  # No ARG in Dockerfile for secrets
  if grep -q "ARG GEMINI" "$ROOT_DIR/Dockerfile" 2>/dev/null; then
    fail "ARG GEMINI_API_KEY still in Dockerfile"
  else
    pass "No secret ARGs in Dockerfile"
  fi
}

# ─── Run Phases ───────────────────────────────────────────────────

case "$PHASE" in
  unit)     run_unit ;;
  typecheck) run_typecheck ;;
  build)    run_build ;;
  docker)   run_docker ;;
  staging)  run_staging ;;
  security) run_security ;;
  all)
    run_unit
    run_typecheck
    run_build
    run_docker
    run_staging
    run_security
    ;;
  *)
    echo "Usage: $0 {all|unit|typecheck|build|docker|staging|security}"
    exit 1
    ;;
esac

# ─── Summary ──────────────────────────────────────────────────────
header "Summary"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}SKIP: $SKIP${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}MVP3 tests FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}MVP3 tests PASSED${NC}"
  exit 0
fi
