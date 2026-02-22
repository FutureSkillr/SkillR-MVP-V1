#!/usr/bin/env bash
# Future SkillR — Health Check (FR-068)
# Usage:
#   ./scripts/health-check.sh                          # Cloud Run mode (needs gcloud)
#   SERVICE_URL=http://localhost:8080 ./scripts/health-check.sh  # Local mode
# Requires: curl, jq.  Cloud Run mode also needs gcloud CLI.
# Reads .env.deploy for project config and HEALTH_CHECK_TOKEN for detailed health.
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Load config ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [[ -f "$PROJECT_ROOT/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env.deploy"
fi

HEALTH_TOKEN="${HEALTH_CHECK_TOKEN:-}"
LOCAL_MODE=false

# ── Helper functions ─────────────────────────────────────────────────
status_dot() {
  case "$1" in
    ok)             printf "${GREEN}●${NC}" ;;
    degraded)       printf "${YELLOW}●${NC}" ;;
    not_configured) printf "${DIM}○${NC}" ;;
    *)              printf "${RED}●${NC}" ;;
  esac
}

format_uptime() {
  local secs=$1
  local days=$((secs / 86400))
  local hours=$(( (secs % 86400) / 3600 ))
  local mins=$(( (secs % 3600) / 60 ))
  local s=$(( secs % 60 ))
  if [[ $days -gt 0 ]]; then
    printf "%dd %dh %dm %ds" "$days" "$hours" "$mins" "$s"
  elif [[ $hours -gt 0 ]]; then
    printf "%dh %dm %ds" "$hours" "$mins" "$s"
  else
    printf "%dm %ds" "$mins" "$s"
  fi
}

# ── Determine service URL ────────────────────────────────────────────
if [[ -n "${SERVICE_URL:-}" ]]; then
  # Local mode — skip all gcloud calls
  SVC_URL="$SERVICE_URL"
  LOCAL_MODE=true
  SERVICE="local"
  REVISION="–"
  DEPLOY_TIME="–"
  MAX_INSTANCES="–"
  ERROR_COUNT="–"
  echo ""
  printf "${BOLD}Checking local service at %s ...${NC}\n" "$SVC_URL"
else
  PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0456368718}"
  REGION="${GCP_REGION:-europe-west3}"
  SERVICE="${CLOUD_RUN_SERVICE:-future-skillr}"

  echo ""
  printf "${BOLD}Fetching Cloud Run service info...${NC}\n"

  SVC_JSON=$(gcloud run services describe "$SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format json 2>/dev/null) || {
    printf "${RED}ERROR: Could not describe Cloud Run service '%s'${NC}\n" "$SERVICE"
    printf "  Project: %s  Region: %s\n" "$PROJECT_ID" "$REGION"
    printf "\n  ${DIM}Tip: For local testing, run:${NC}\n"
    printf "  ${BOLD}SERVICE_URL=http://localhost:8080 make health${NC}\n\n"
    exit 1
  }

  SVC_URL=$(echo "$SVC_JSON" | jq -r '.status.url // "unknown"')
  REVISION=$(echo "$SVC_JSON" | jq -r '.status.latestReadyRevisionName // "unknown"')
  DEPLOY_TIME=$(echo "$SVC_JSON" | jq -r '.status.conditions[] | select(.type=="Ready") | .lastTransitionTime // empty' | head -1)
  MAX_INSTANCES=$(echo "$SVC_JSON" | jq -r '.spec.template.metadata.annotations["autoscaling.knative.dev/maxScale"] // "?"')

  # Query recent errors
  ERROR_COUNT=$(gcloud logging read \
    "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE}\" AND severity>=ERROR AND timestamp>=\"$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo '2026-01-01T00:00:00Z')\"" \
    --project "$PROJECT_ID" \
    --limit 100 \
    --format="value(timestamp)" 2>/dev/null | wc -l | tr -d ' ')
fi

# ── Call /api/health (public) ────────────────────────────────────────
BASIC_RESP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SVC_URL}/api/health" 2>/dev/null || echo "000")

# ── Call /api/health/detailed (token-gated) ──────────────────────────
DETAILED=""
DETAILED_HTTP=""
if [[ -n "$HEALTH_TOKEN" ]]; then
  DETAILED_HTTP_BODY=$(curl -s --max-time 10 -w "\n%{http_code}" "${SVC_URL}/api/health/detailed?token=${HEALTH_TOKEN}" 2>/dev/null || echo -e "\n000")
  DETAILED_HTTP=$(echo "$DETAILED_HTTP_BODY" | tail -1)
  DETAILED=$(echo "$DETAILED_HTTP_BODY" | sed '$d')
fi

# ── Display ──────────────────────────────────────────────────────────
echo ""
printf "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${CYAN}║${NC}  ${BOLD}Future SkillR — Health Check${NC}                                ${CYAN}║${NC}\n"
printf "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}\n"

printf "${CYAN}║${NC}  Service:     %-45s ${CYAN}║${NC}\n" "$SERVICE"
printf "${CYAN}║${NC}  URL:         %-45s ${CYAN}║${NC}\n" "$SVC_URL"

if [[ "$BASIC_RESP" == "200" ]]; then
  printf "${CYAN}║${NC}  Status:      $(status_dot ok) ${GREEN}OK${NC}%-40s ${CYAN}║${NC}\n" ""
elif [[ "$BASIC_RESP" == "503" ]]; then
  printf "${CYAN}║${NC}  Status:      $(status_dot degraded) ${YELLOW}DEGRADED${NC}%-36s ${CYAN}║${NC}\n" ""
else
  printf "${CYAN}║${NC}  Status:      $(status_dot down) ${RED}DOWN (HTTP ${BASIC_RESP})${NC}%-27s ${CYAN}║${NC}\n" ""
fi

printf "${CYAN}║${NC}  Revision:    %-45s ${CYAN}║${NC}\n" "$REVISION"
printf "${CYAN}║${NC}  Deployed:    %-45s ${CYAN}║${NC}\n" "${DEPLOY_TIME:-unknown}"

# Detailed health data
if [[ -n "$DETAILED" && "$DETAILED_HTTP" == "200" ]]; then
  VERSION=$(echo "$DETAILED" | jq -r '.version // "?"')
  UPTIME_S=$(echo "$DETAILED" | jq -r '.uptimeSeconds // 0')
  UPTIME_FMT=$(format_uptime "$UPTIME_S")

  PG_STATUS=$(echo "$DETAILED" | jq -r '.components.postgres.status // "?"')
  PG_LATENCY=$(echo "$DETAILED" | jq -r '.components.postgres.latencyMs // "–"')
  REDIS_STATUS=$(echo "$DETAILED" | jq -r '.components.redis.status // "?"')
  REDIS_LATENCY=$(echo "$DETAILED" | jq -r '.components.redis.latencyMs // "–"')
  AI_STATUS=$(echo "$DETAILED" | jq -r '.components.ai.status // "?"')

  GOROUTINES=$(echo "$DETAILED" | jq -r '.runtime.goroutines // "?"')
  HEAP_MB=$(echo "$DETAILED" | jq -r '.runtime.heapMB // "?"')

  printf "${CYAN}║${NC}  Uptime:      %-45s ${CYAN}║${NC}\n" "$UPTIME_FMT"
  printf "${CYAN}║${NC}  Version:     %-45s ${CYAN}║${NC}\n" "$VERSION"
  printf "${CYAN}╠──────────────────────────────────────────────────────────────╣${NC}\n"
  printf "${CYAN}║${NC}  ${BOLD}Components${NC}                                                   ${CYAN}║${NC}\n"

  printf "${CYAN}║${NC}  PostgreSQL:  $(status_dot "$PG_STATUS") %-4s" "$(echo "$PG_STATUS" | tr '[:lower:]' '[:upper:]')"
  if [[ "$PG_LATENCY" != "–" && "$PG_LATENCY" != "null" ]]; then
    printf " (%sms)" "$PG_LATENCY"
  fi
  printf "%-35s ${CYAN}║${NC}\n" ""

  printf "${CYAN}║${NC}  Redis:       $(status_dot "$REDIS_STATUS") %-4s" "$(echo "$REDIS_STATUS" | tr '[:lower:]' '[:upper:]')"
  if [[ "$REDIS_LATENCY" != "–" && "$REDIS_LATENCY" != "null" ]]; then
    printf " (%sms)" "$REDIS_LATENCY"
  fi
  printf "%-35s ${CYAN}║${NC}\n" ""

  printf "${CYAN}║${NC}  AI Service:  $(status_dot "$AI_STATUS") %-43s ${CYAN}║${NC}\n" "$(echo "$AI_STATUS" | tr '[:lower:]' '[:upper:]')"

  printf "${CYAN}╠──────────────────────────────────────────────────────────────╣${NC}\n"
  printf "${CYAN}║${NC}  Errors (1h): %-45s ${CYAN}║${NC}\n" "$ERROR_COUNT"
  if [[ "$LOCAL_MODE" == "false" ]]; then
    printf "${CYAN}║${NC}  Instances:   %-45s ${CYAN}║${NC}\n" "active / ${MAX_INSTANCES} max"
  fi
  printf "${CYAN}║${NC}  Memory:      %-45s ${CYAN}║${NC}\n" "${HEAP_MB} MB heap"
  printf "${CYAN}║${NC}  Goroutines:  %-45s ${CYAN}║${NC}\n" "$GOROUTINES"
elif [[ -z "$HEALTH_TOKEN" ]]; then
  printf "${CYAN}╠──────────────────────────────────────────────────────────────╣${NC}\n"
  printf "${CYAN}║${NC}  ${DIM}Set HEALTH_CHECK_TOKEN for detailed component status${NC}        ${CYAN}║${NC}\n"
  if [[ "$LOCAL_MODE" == "false" ]]; then
    printf "${CYAN}║${NC}  Errors (1h): %-45s ${CYAN}║${NC}\n" "$ERROR_COUNT"
  fi
else
  printf "${CYAN}╠──────────────────────────────────────────────────────────────╣${NC}\n"
  printf "${CYAN}║${NC}  ${YELLOW}Detailed health unavailable (HTTP ${DETAILED_HTTP})${NC}%-18s ${CYAN}║${NC}\n" ""
  if [[ "$LOCAL_MODE" == "false" ]]; then
    printf "${CYAN}║${NC}  Errors (1h): %-45s ${CYAN}║${NC}\n" "$ERROR_COUNT"
  fi
fi

printf "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo ""
