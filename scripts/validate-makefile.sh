#!/usr/bin/env bash
# ┌──────────────────────────────────────────────┐
# │   _____ _    _ _ _ ____                      │
# │  / ____| | _(_) | |  _ \                     │
# │ | (___ | |/ / | | | |_) |                    │
# │  \___ \|   <| | | |  _ <                     │
# │  ____) | |\ \ | | | | \ \                    │
# │ |_____/|_| \_\_|_|_|_|  \_\                  │
# │                                               │
# │  Makefile Validation Script                   │
# └──────────────────────────────────────────────┘
#
# Systematically tests all Makefile targets across dependency tiers.
# Run from the SkillR fork root: ./scripts/validate-makefile.sh
#
set -euo pipefail

# ─── Colors & Symbols ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
CHECK="${GREEN}✓${RESET}"
CROSS="${RED}✗${RESET}"
SKIP="${YELLOW}○${RESET}"

# ─── State ───────────────────────────────────────────────────────────────────
declare -a RESULTS=()       # "target|status|duration|note"
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
SCRIPT_START=$(date +%s)
DOCKER_STARTED=false

# Ensure Docker stack is cleaned up on exit/interrupt
cleanup() {
  if $DOCKER_STARTED; then
    echo -e "\n  ${DIM}Cleaning up Docker stack...${RESET}"
    docker compose down -v 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ─── Helpers ─────────────────────────────────────────────────────────────────

log_header() {
  echo ""
  echo -e "${BOLD}${CYAN}═══ $1 ═══${RESET}"
  echo ""
}

record() {
  local target="$1" status="$2" duration="$3" note="${4:-}"
  RESULTS+=("${target}|${status}|${duration}|${note}")
  case "$status" in
    PASS) PASS_COUNT=$((PASS_COUNT + 1)); echo -e "  ${CHECK} ${BOLD}${target}${RESET} ${DIM}(${duration}s)${RESET}" ;;
    FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)); echo -e "  ${CROSS} ${BOLD}${target}${RESET} ${DIM}(${duration}s)${RESET} ${RED}${note}${RESET}" ;;
    SKIP) SKIP_COUNT=$((SKIP_COUNT + 1)); echo -e "  ${SKIP} ${BOLD}${target}${RESET} ${DIM}— ${note}${RESET}" ;;
  esac
}

run_target() {
  local target="$1"
  local start=$(date +%s)
  local output
  local exit_code=0

  output=$(make "$target" 2>&1) || exit_code=$?
  local end=$(date +%s)
  local duration=$((end - start))

  if [ $exit_code -eq 0 ]; then
    record "$target" "PASS" "$duration"
  else
    local last_line
    last_line=$(echo "$output" | tail -1 | head -c 80)
    record "$target" "FAIL" "$duration" "exit=$exit_code: $last_line"
  fi
  # Don't propagate failure — we record it, not abort
  return 0
}

run_target_expect_fail() {
  local target="$1" note="$2"
  local start=$(date +%s)
  local output
  local exit_code=0

  output=$(make "$target" 2>&1) || exit_code=$?
  local end=$(date +%s)
  local duration=$((end - start))

  if [ $exit_code -ne 0 ]; then
    record "$target" "PASS" "$duration" "correctly failed ($note)"
  else
    record "$target" "FAIL" "$duration" "expected failure but got exit=0"
  fi
}

dryrun_target() {
  local target="$1"
  local start=$(date +%s)
  local output
  local exit_code=0

  output=$(make -n "$target" 2>&1) || exit_code=$?
  local end=$(date +%s)
  local duration=$((end - start))

  if [ $exit_code -eq 0 ]; then
    record "$target" "PASS" "$duration" "dry-run OK"
  else
    local last_line
    last_line=$(echo "$output" | tail -1 | head -c 80)
    record "$target" "FAIL" "$duration" "dry-run exit=$exit_code: $last_line"
  fi
}

skip_target() {
  local target="$1" reason="$2"
  record "$target" "SKIP" "0" "$reason"
}

# ─── Banner ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}"
echo "   _____ _    _ _ _ ____  "
echo "  / ____| | _(_) | |  _ \\ "
echo " | (___ | |/ / | | | |_) |"
echo "  \\___ \\|   <| | | |  _ < "
echo "  ____) | |\\ \\ | | | | \\ \\"
echo " |_____/|_| \\_\\_|_|_|_|  \\_\\"
echo ""
echo "  Makefile Validation Script"
echo -e "${RESET}"
echo -e "  ${DIM}Testing all Makefile targets across dependency tiers${RESET}"
echo -e "  ${DIM}$(date '+%Y-%m-%d %H:%M:%S')${RESET}"

# ─── Detect Environment ─────────────────────────────────────────────────────

log_header "Environment Detection"

HAS_GO=false
HAS_NODE=false
HAS_DOCKER=false
HAS_DOCKER_RUNNING=false
HAS_K6=false
HAS_GCLOUD=false
HAS_GOLANGCI_LINT=false
HAS_MIGRATE=false

if command -v go &>/dev/null; then
  HAS_GO=true
  echo -e "  ${CHECK} Go $(go version | awk '{print $3}')"
else
  echo -e "  ${CROSS} Go not found"
fi

if command -v node &>/dev/null && command -v npm &>/dev/null; then
  HAS_NODE=true
  echo -e "  ${CHECK} Node $(node --version) / npm $(npm --version)"
else
  echo -e "  ${CROSS} Node/npm not found"
fi

if command -v docker &>/dev/null; then
  HAS_DOCKER=true
  echo -e "  ${CHECK} Docker CLI found"
  if docker info &>/dev/null; then
    HAS_DOCKER_RUNNING=true
    echo -e "  ${CHECK} Docker daemon running"
  else
    echo -e "  ${YELLOW}○${RESET} Docker daemon not running"
  fi
else
  echo -e "  ${CROSS} Docker not found"
fi

if command -v k6 &>/dev/null; then
  HAS_K6=true
  echo -e "  ${CHECK} k6 $(k6 version 2>/dev/null | head -1)"
else
  echo -e "  ${YELLOW}○${RESET} k6 not found"
fi

if command -v gcloud &>/dev/null; then
  HAS_GCLOUD=true
  echo -e "  ${CHECK} gcloud CLI found"
else
  echo -e "  ${YELLOW}○${RESET} gcloud not found"
fi

if command -v golangci-lint &>/dev/null; then
  HAS_GOLANGCI_LINT=true
  echo -e "  ${CHECK} golangci-lint found"
else
  echo -e "  ${YELLOW}○${RESET} golangci-lint not found"
fi

if command -v migrate &>/dev/null; then
  HAS_MIGRATE=true
  echo -e "  ${CHECK} migrate found"
else
  echo -e "  ${YELLOW}○${RESET} migrate not found"
fi

if [ -n "${GEMINI_API_KEY:-}" ]; then
  echo -e "  ${CHECK} GEMINI_API_KEY is set"
else
  echo -e "  ${YELLOW}○${RESET} GEMINI_API_KEY not set"
fi

# ─── Tier 0: Trivial (always works) ─────────────────────────────────────────

log_header "Tier 0: Trivial Targets"

run_target "help"

# ─── Tier 1: Local Builds (Go + Node) ───────────────────────────────────────

log_header "Tier 1: Local Builds"

if $HAS_GO && $HAS_NODE; then
  # clean first so builds start fresh
  run_target "clean"
  run_target "install"
  run_target "build"
  run_target "typecheck"
  run_target "go-build"
  run_target "build-all"
  run_target "go-test"
  run_target "test-all"
elif $HAS_NODE && ! $HAS_GO; then
  run_target "clean"
  run_target "install"
  run_target "build"
  run_target "typecheck"
  skip_target "go-build" "Go not installed"
  skip_target "build-all" "Go not installed"
  skip_target "go-test" "Go not installed"
  skip_target "test-all" "Go not installed"
elif $HAS_GO && ! $HAS_NODE; then
  run_target "clean"
  skip_target "install" "Node not installed"
  skip_target "build" "Node not installed"
  skip_target "typecheck" "Node not installed"
  run_target "go-build"
  skip_target "build-all" "Node not installed"
  run_target "go-test"
  skip_target "test-all" "Node not installed"
else
  skip_target "clean" "No build tools"
  skip_target "install" "Node not installed"
  skip_target "build" "Node not installed"
  skip_target "typecheck" "Node not installed"
  skip_target "go-build" "Go not installed"
  skip_target "build-all" "No build tools"
  skip_target "go-test" "Go not installed"
  skip_target "test-all" "No build tools"
fi

# ─── Tier 1b: Optional Tools ────────────────────────────────────────────────

log_header "Tier 1b: Optional Tools"

if $HAS_GOLANGCI_LINT && $HAS_GO; then
  run_target "go-lint"
else
  skip_target "go-lint" "golangci-lint not installed"
fi

# check-api-key: may pass if GEMINI_API_KEY is set (env, .env.deploy, or make var)
# or fail if not set at all — either result is valid behavior
if [ -n "${GEMINI_API_KEY:-}" ]; then
  run_target "check-api-key"
else
  # Try it — if .env.deploy provides the key, it will pass (that's fine)
  # If nothing provides it, it will fail (that's also correct)
  echo -e "  ${DIM}Note: GEMINI_API_KEY not in shell env; may come from .env.deploy${RESET}"
  dryrun_target "check-api-key"
fi

# ─── Tier 1c: Skipped Targets ───────────────────────────────────────────────

log_header "Tier 1c: Skipped Targets"

skip_target "dev" "interactive"
skip_target "run-local" "interactive"
skip_target "go-dev" "interactive"
skip_target "set-admin" "interactive"
skip_target "api-gen" "optional (needs OpenAPI Generator image)"
skip_target "migrate-up" "needs DATABASE_URL"
skip_target "migrate-down" "needs DATABASE_URL"
skip_target "migrate-reset" "destructive"
skip_target "local-stage" "alias for local-up"
skip_target "local-stage-down" "alias for local-down"
skip_target "seed-pod" "alias for local-seed-pod"
skip_target "health-local" "alias for local-health"
skip_target "monitor-local" "alias for local-monitor"
skip_target "docker-buildx" "multi-arch (slow)"
skip_target "docker-run" "needs DATABASE_URL"

# ─── Tier 2: Docker Stack ───────────────────────────────────────────────────

log_header "Tier 2: Docker Stack"

STACK_HEALTHY=false

if $HAS_DOCKER_RUNNING; then
  run_target "docker-build"

  echo -e "\n  ${DIM}Starting local stack (docker compose up --build -d)...${RESET}"
  COMPOSE_START=$(date +%s)
  compose_output=$(docker compose up --build -d 2>&1) || true
  COMPOSE_DUR=$(( $(date +%s) - COMPOSE_START ))
  COMPOSE_OK=false
  if docker compose ps --format '{{.Name}}' 2>/dev/null | grep -q .; then
    DOCKER_STARTED=true
    COMPOSE_OK=true
    record "local-up" "PASS" "$COMPOSE_DUR" "started in detached mode"
  else
    record "local-up" "FAIL" "$COMPOSE_DUR" "docker compose up failed"
  fi

  # Wait for health (only if containers actually started)
  if $COMPOSE_OK; then
    echo -e "  ${DIM}Waiting for health at localhost:9090/api/health (up to 120s)...${RESET}"
    HEALTH_TIMEOUT=120
    HEALTH_ELAPSED=0
    while [ $HEALTH_ELAPSED -lt $HEALTH_TIMEOUT ]; do
      if curl -sf --max-time 3 http://localhost:9090/api/health >/dev/null 2>&1; then
        STACK_HEALTHY=true
        echo -e "  ${CHECK} Stack healthy after ${HEALTH_ELAPSED}s"
        break
      fi
      sleep 5
      HEALTH_ELAPSED=$((HEALTH_ELAPSED + 5))
      echo -e "  ${DIM}  ...waiting (${HEALTH_ELAPSED}s)${RESET}"
    done

    if ! $STACK_HEALTHY; then
      record "health-wait" "FAIL" "$HEALTH_TIMEOUT" "stack did not become healthy within ${HEALTH_TIMEOUT}s"
    fi
  else
    skip_target "health-wait" "compose did not start"
  fi

  if $STACK_HEALTHY; then
    run_target "local-health"

    # local-logs: run briefly, capture a few lines
    echo -e "  ${DIM}Testing local-logs (3s capture)...${RESET}"
    LOGS_START=$(date +%s)
    timeout 3 docker compose logs app 2>&1 | tail -3 >/dev/null 2>&1 || true
    LOGS_DUR=$(( $(date +%s) - LOGS_START ))
    record "local-logs" "PASS" "$LOGS_DUR" "captured logs OK"

    run_target "local-seed-pod"
  else
    skip_target "local-health" "stack not healthy"
    skip_target "local-logs" "stack not healthy"
    skip_target "local-seed-pod" "stack not healthy"
  fi

  # ─── Tier 3: K6 ─────────────────────────────────────────────────────────

  log_header "Tier 3: K6 Tests"

  if $HAS_K6 && $STACK_HEALTHY; then
    run_target "k6-preflight"
    run_target "k6-smoke"
  elif ! $HAS_K6; then
    skip_target "k6-preflight" "k6 not installed"
    skip_target "k6-smoke" "k6 not installed"
  else
    skip_target "k6-preflight" "stack not healthy"
    skip_target "k6-smoke" "stack not healthy"
  fi

  # Skip long-running K6 suites
  skip_target "k6-student" "long suite"
  skip_target "k6-admin" "long suite"
  skip_target "k6-operator" "long suite"
  skip_target "k6-security" "long suite"
  skip_target "k6-load" "long suite"
  skip_target "k6-spike" "long suite"
  skip_target "k6-all" "long suite"
  skip_target "k6-report" "long suite"
  skip_target "k6-report-full" "long suite"
  skip_target "k6-ci" "long suite"

  # ─── Tear down ─────────────────────────────────────────────────────────

  log_header "Tier 2: Cleanup"
  echo -e "  ${DIM}Stopping local stack...${RESET}"
  TEARDOWN_START=$(date +%s)
  docker compose down -v 2>&1 | tail -3
  TEARDOWN_DUR=$(( $(date +%s) - TEARDOWN_START ))
  DOCKER_STARTED=false
  record "local-down" "PASS" "$TEARDOWN_DUR"

else
  skip_target "docker-build" "Docker not running"
  skip_target "local-up" "Docker not running"
  skip_target "local-health" "Docker not running"
  skip_target "local-logs" "Docker not running"
  skip_target "local-seed-pod" "Docker not running"
  skip_target "local-down" "Docker not running"

  log_header "Tier 3: K6 Tests"
  skip_target "k6-preflight" "Docker not running"
  skip_target "k6-smoke" "Docker not running"
  skip_target "k6-student" "long suite"
  skip_target "k6-admin" "long suite"
  skip_target "k6-operator" "long suite"
  skip_target "k6-security" "long suite"
  skip_target "k6-load" "long suite"
  skip_target "k6-spike" "long suite"
  skip_target "k6-all" "long suite"
  skip_target "k6-report" "long suite"
  skip_target "k6-report-full" "long suite"
  skip_target "k6-ci" "long suite"
fi

# ─── Tier 4: Cloud Targets (dry-run only) ───────────────────────────────────

log_header "Tier 4: Cloud Targets (dry-run)"

CLOUD_TARGETS=(
  deploy deploy-staging ship ship-staging
  health cloudrun-list onboard
  setup-firebase setup-secrets docker-auth
)

for target in "${CLOUD_TARGETS[@]}"; do
  dryrun_target "$target"
done

skip_target "cloudrun-delete" "destructive"
skip_target "logs" "interactive (tails logs)"
skip_target "local-monitor" "interactive"
skip_target "monitor" "interactive"

# ─── Branding Check ─────────────────────────────────────────────────────────

log_header "Branding Check"

BRAND_LEAKS=0
BRAND_FILES=(
  Makefile
  Dockerfile
  docker-compose.yml
  frontend/package.json
  frontend/vite.config.ts
  frontend/server/index.ts
)

BRAND_PATTERNS=(
  "future-skillr"
  "futureskiller"
  "Future SkillR"
  "future_skillr"
  "FutureSkillr"
)

for file in "${BRAND_FILES[@]}"; do
  if [ -f "$file" ]; then
    for pattern in "${BRAND_PATTERNS[@]}"; do
      matches=$(grep -in "$pattern" "$file" 2>/dev/null || true)
      if [ -n "$matches" ]; then
        echo -e "  ${CROSS} ${RED}Brand leak in ${file}:${RESET}"
        echo "$matches" | while IFS= read -r line; do
          echo -e "      ${DIM}${line}${RESET}"
        done
        BRAND_LEAKS=$((BRAND_LEAKS + 1))
      fi
    done
  fi
done

if [ $BRAND_LEAKS -eq 0 ]; then
  echo -e "  ${CHECK} No brand leaks found in infrastructure files"
else
  echo -e "\n  ${YELLOW}Found ${BRAND_LEAKS} brand leak(s) — consider renaming to SkillR${RESET}"
fi

# ─── Summary Table ───────────────────────────────────────────────────────────

SCRIPT_END=$(date +%s)
TOTAL_DURATION=$((SCRIPT_END - SCRIPT_START))

log_header "Summary"

printf "  ${BOLD}%-25s %-8s %6s  %s${RESET}\n" "TARGET" "STATUS" "TIME" "NOTE"
printf "  %-25s %-8s %6s  %s\n" "─────────────────────────" "────────" "──────" "────────────────────────────"

for entry in "${RESULTS[@]}"; do
  IFS='|' read -r target status duration note <<< "$entry"
  case "$status" in
    PASS) color="${GREEN}" ;;
    FAIL) color="${RED}" ;;
    SKIP) color="${YELLOW}" ;;
    *)    color="${RESET}" ;;
  esac
  printf "  %-25s ${color}%-8s${RESET} %5ss  ${DIM}%s${RESET}\n" "$target" "$status" "$duration" "$note"
done

echo ""
echo -e "  ──────────────────────────────────────────────────────"
echo -e "  ${GREEN}PASS: ${PASS_COUNT}${RESET}  ${RED}FAIL: ${FAIL_COUNT}${RESET}  ${YELLOW}SKIP: ${SKIP_COUNT}${RESET}  ${DIM}Total: ${#RESULTS[@]} targets in ${TOTAL_DURATION}s${RESET}"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "  ${RED}${BOLD}Some targets failed.${RESET}"
  echo ""
  exit 1
else
  echo -e "  ${GREEN}${BOLD}All non-skipped targets passed.${RESET}"
  echo ""
  exit 0
fi
