#!/usr/bin/env bash
# Future SkillR — Availability Monitor (FR-067)
# Usage: ./scripts/health-monitor.sh [interval_seconds]
# Default: polls every 30s. Ctrl+C to stop — prints summary and writes JSON log.
# Requires: curl, jq
set -euo pipefail

INTERVAL="${1:-30}"

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

# Determine service URL
if [[ -n "${SERVICE_URL:-}" ]]; then
  SVC_URL="$SERVICE_URL"
else
  PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0456368718}"
  REGION="${GCP_REGION:-europe-west3}"
  SERVICE="${CLOUD_RUN_SERVICE:-future-skillr}"
  SVC_URL=$(gcloud run services describe "$SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format='value(status.url)' 2>/dev/null) || {
    printf "${RED}ERROR: Could not determine service URL.${NC}\n"
    printf "  Set SERVICE_URL env var or configure .env.deploy.\n"
    printf "\n  ${DIM}Tip: For local testing, run:${NC}\n"
    printf "  ${BOLD}SERVICE_URL=http://localhost:8080 make monitor${NC}\n\n"
    exit 1
  }
fi

# Build health URL
if [[ -n "$HEALTH_TOKEN" ]]; then
  HEALTH_URL="${SVC_URL}/api/health/detailed?token=${HEALTH_TOKEN}"
  DETAILED=true
else
  HEALTH_URL="${SVC_URL}/api/health"
  DETAILED=false
fi

# ── Counters ─────────────────────────────────────────────────────────
TOTAL=0
SUCCESS=0
DEGRADED=0
FAILURES=0
TOTAL_RESPONSE_MS=0
START_TIME=$(date +%s)
LOG_FILE=""

# ── Cleanup on exit ──────────────────────────────────────────────────
cleanup() {
  echo ""
  printf "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
  printf "${BOLD}Monitoring Summary${NC}\n"

  local elapsed=$(( $(date +%s) - START_TIME ))
  local duration
  if [[ $elapsed -ge 3600 ]]; then
    duration="$(( elapsed / 3600 ))h $(( (elapsed % 3600) / 60 ))m"
  elif [[ $elapsed -ge 60 ]]; then
    duration="$(( elapsed / 60 ))m $(( elapsed % 60 ))s"
  else
    duration="${elapsed}s"
  fi

  local uptime_pct="0.0"
  if [[ $TOTAL -gt 0 ]]; then
    uptime_pct=$(awk "BEGIN { printf \"%.1f\", ($SUCCESS / $TOTAL) * 100 }")
  fi

  local avg_ms="0"
  if [[ $SUCCESS -gt 0 ]]; then
    avg_ms=$(awk "BEGIN { printf \"%.0f\", $TOTAL_RESPONSE_MS / $SUCCESS }")
  fi

  printf "  Duration:     %s\n" "$duration"
  printf "  Total checks: %d\n" "$TOTAL"
  printf "  Successes:    ${GREEN}%d${NC}\n" "$SUCCESS"
  printf "  Degraded:     ${YELLOW}%d${NC}\n" "$DEGRADED"
  printf "  Failures:     ${RED}%d${NC}\n" "$FAILURES"
  printf "  Uptime:       ${BOLD}%s%%${NC}\n" "$uptime_pct"
  printf "  Avg response: %sms\n" "$avg_ms"

  # Write JSON log
  mkdir -p "$PROJECT_ROOT/logs"
  LOG_FILE="$PROJECT_ROOT/logs/health-monitor-$(date +%Y%m%d-%H%M%S).json"
  cat > "$LOG_FILE" <<LOGJSON
{
  "service": "$SVC_URL",
  "started": "$(date -u -r "$START_TIME" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "@$START_TIME" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo unknown)",
  "ended": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "durationSeconds": $elapsed,
  "intervalSeconds": $INTERVAL,
  "totalChecks": $TOTAL,
  "successes": $SUCCESS,
  "degraded": $DEGRADED,
  "failures": $FAILURES,
  "uptimePercent": $uptime_pct,
  "avgResponseMs": $avg_ms
}
LOGJSON

  printf "  Log written:  %s\n" "$LOG_FILE"
  printf "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ── Banner ───────────────────────────────────────────────────────────
echo ""
printf "${BOLD}Future SkillR — Availability Monitor${NC}\n"
printf "  URL:      %s\n" "$SVC_URL"
printf "  Interval: %ss\n" "$INTERVAL"
printf "  Detailed: %s\n" "$DETAILED"
printf "  Press Ctrl+C to stop and see summary.\n"
echo ""

# ── Polling loop ─────────────────────────────────────────────────────
while true; do
  TOTAL=$(( TOTAL + 1 ))
  TIMESTAMP=$(date +%H:%M:%S)

  # Measure response time
  RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo -e "\n000\n0")

  BODY=$(echo "$RESPONSE" | sed -n '1p')
  HTTP_CODE=$(echo "$RESPONSE" | sed -n '2p')
  TIME_TOTAL=$(echo "$RESPONSE" | sed -n '3p')
  RESPONSE_MS=$(awk "BEGIN { printf \"%.0f\", ${TIME_TOTAL:-0} * 1000 }")

  if [[ "$HTTP_CODE" == "200" ]]; then
    SUCCESS=$(( SUCCESS + 1 ))
    TOTAL_RESPONSE_MS=$(( TOTAL_RESPONSE_MS + RESPONSE_MS ))

    if [[ "$DETAILED" == "true" && -n "$BODY" ]]; then
      STATUS=$(echo "$BODY" | jq -r '.status // "?"' 2>/dev/null || echo "?")
      UPTIME=$(echo "$BODY" | jq -r '.uptimeSeconds // 0' 2>/dev/null || echo "0")
      PG=$(echo "$BODY" | jq -r '"\(.components.postgres.status)(\(.components.postgres.latencyMs // "–")ms)"' 2>/dev/null || echo "?")
      RD=$(echo "$BODY" | jq -r '"\(.components.redis.status)(\(.components.redis.latencyMs // "–")ms)"' 2>/dev/null || echo "?")
      AI=$(echo "$BODY" | jq -r '.components.ai.status // "?"' 2>/dev/null || echo "?")

      # Format uptime
      local_up=""
      if [[ $UPTIME -ge 3600 ]]; then
        local_up="$(( UPTIME / 3600 ))h$(( (UPTIME % 3600) / 60 ))m"
      else
        local_up="$(( UPTIME / 60 ))m"
      fi

      printf "[%s] ${GREEN}●${NC} %-8s %4sms  up=%-8s pg=%-12s redis=%-12s ai=%s\n" \
        "$TIMESTAMP" "OK" "$RESPONSE_MS" "$local_up" "$PG" "$RD" "$AI"
    else
      printf "[%s] ${GREEN}●${NC} OK       %4sms\n" "$TIMESTAMP" "$RESPONSE_MS"
    fi
  elif [[ "$HTTP_CODE" == "503" ]]; then
    DEGRADED=$(( DEGRADED + 1 ))
    SUCCESS=$(( SUCCESS + 1 ))  # degraded counts as "up" for uptime %
    TOTAL_RESPONSE_MS=$(( TOTAL_RESPONSE_MS + RESPONSE_MS ))
    printf "[%s] ${YELLOW}●${NC} DEGRADED %4sms\n" "$TIMESTAMP" "$RESPONSE_MS"
  else
    FAILURES=$(( FAILURES + 1 ))
    printf "[%s] ${RED}●${NC} DOWN     (HTTP %s)\n" "$TIMESTAMP" "$HTTP_CODE"
  fi

  # Status bar
  uptime_pct="0.0"
  if [[ $TOTAL -gt 0 ]]; then
    uptime_pct=$(awk "BEGIN { printf \"%.1f\", (($SUCCESS) / $TOTAL) * 100 }")
  fi
  avg_ms="0"
  if [[ $SUCCESS -gt 0 ]]; then
    avg_ms=$(awk "BEGIN { printf \"%.0f\", $TOTAL_RESPONSE_MS / $SUCCESS }")
  fi
  printf "${DIM}Monitoring %s | Checks: %d | Uptime: %s%% | Avg: %sms${NC}\r" \
    "$SVC_URL" "$TOTAL" "$uptime_pct" "$avg_ms"

  sleep "$INTERVAL"
  # Clear status bar
  printf "\033[2K"
done
