#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# setup-oauth-domains.sh — Add Cloud Run URL to Firebase authorized domains
#
# Automates the post-deploy step of registering the Cloud Run hostname
# as an authorized domain for Firebase Authentication (OAuth popups).
#
# Idempotent: safe to re-run. Skips domains already present.
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - .env.deploy with GCP_PROJECT_ID, GCP_REGION, CLOUD_RUN_SERVICE
#
# Usage:
#   ./scripts/setup-oauth-domains.sh                        # auto-discover URL
#   ./scripts/setup-oauth-domains.sh https://skillr-xxx.run.app  # explicit URL
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Load config ─────────────────────────────────────────────────────
if [[ -f "$PROJECT_ROOT/.env.deploy" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env.deploy"
  set +a
fi

PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-}"
SERVICE="${CLOUD_RUN_SERVICE:-}"

if [[ -z "$PROJECT_ID" ]]; then
  err "GCP_PROJECT_ID not set. Run ./scripts/gcp-onboard.sh first."
  exit 1
fi

# ── Determine Cloud Run URL ─────────────────────────────────────────
CLOUD_RUN_URL="${1:-}"

if [[ -z "$CLOUD_RUN_URL" ]]; then
  if [[ -z "$SERVICE" || -z "$REGION" ]]; then
    err "No URL argument and CLOUD_RUN_SERVICE / GCP_REGION not set in .env.deploy."
    err "Usage: $0 [CLOUD_RUN_URL]"
    exit 1
  fi
  info "Auto-discovering Cloud Run URL for ${BOLD}${SERVICE}${NC} in ${REGION}..."
  CLOUD_RUN_URL=$(gcloud run services describe "$SERVICE" \
    --project "$PROJECT_ID" --region "$REGION" \
    --format 'value(status.url)' 2>/dev/null || echo "")
  if [[ -z "$CLOUD_RUN_URL" ]]; then
    err "Could not discover Cloud Run URL. Is the service deployed?"
    err "Deploy first with: make ship"
    exit 1
  fi
fi

# Extract hostname (strip https://)
CLOUD_RUN_HOST="${CLOUD_RUN_URL#https://}"
CLOUD_RUN_HOST="${CLOUD_RUN_HOST#http://}"
# Strip trailing slash if any
CLOUD_RUN_HOST="${CLOUD_RUN_HOST%/}"

echo ""
info "Adding authorized domain for Firebase Auth"
echo "  Project:  $PROJECT_ID"
echo "  URL:      $CLOUD_RUN_URL"
echo "  Hostname: $CLOUD_RUN_HOST"
echo ""

# ── Helpers ─────────────────────────────────────────────────────────

get_token() {
  gcloud auth print-access-token 2>/dev/null
}

fb_api() {
  local method="$1" url="$2"
  shift 2
  curl -s -X "$method" \
    -H "Authorization: Bearer $(get_token)" \
    -H "x-goog-user-project: ${PROJECT_ID}" \
    -H "Content-Type: application/json" \
    "$@" \
    "$url"
}

# ── Step 1: Read current authorized domains ─────────────────────────

info "Reading current authorized domains..."
CONFIG_JSON=$(fb_api GET \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config")

CURRENT_DOMAINS=$(echo "$CONFIG_JSON" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    domains = data.get('authorizedDomains', [])
    for d in domains:
        print(d)
except Exception:
    pass
" 2>/dev/null || echo "")

if [[ -z "$CURRENT_DOMAINS" ]]; then
  warn "Could not read current domains (empty response or API error)."
  warn "Response:"
  echo "$CONFIG_JSON" | python3 -m json.tool 2>/dev/null || echo "$CONFIG_JSON"
  echo ""
  warn "Proceeding with default domain list..."
  CURRENT_DOMAINS=""
fi

# ── Step 2: Merge domains ───────────────────────────────────────────

# Build merged list: current domains + required defaults + Cloud Run host
MERGED_DOMAINS=$(echo "$CURRENT_DOMAINS" | python3 -c "
import sys

current = set()
for line in sys.stdin:
    d = line.strip()
    if d:
        current.add(d)

# Required defaults
required = {
    'localhost',
    '${PROJECT_ID}.firebaseapp.com',
    '${PROJECT_ID}.web.app',
    '${CLOUD_RUN_HOST}',
}

merged = current | required

# Sort for deterministic output
for d in sorted(merged):
    print(d)
" 2>/dev/null)

# Check if Cloud Run host is already authorized
ALREADY_PRESENT=false
while IFS= read -r domain; do
  if [[ "$domain" == "$CLOUD_RUN_HOST" ]]; then
    ALREADY_PRESENT=true
    break
  fi
done <<< "$CURRENT_DOMAINS"

if [[ "$ALREADY_PRESENT" == "true" ]]; then
  ok "Domain ${BOLD}${CLOUD_RUN_HOST}${NC} is already authorized"
else
  info "Domain ${BOLD}${CLOUD_RUN_HOST}${NC} will be added"
fi

# ── Step 3: PATCH authorized domains ────────────────────────────────

# Build JSON array from merged domains
DOMAINS_JSON=$(echo "$MERGED_DOMAINS" | python3 -c "
import sys, json
domains = [line.strip() for line in sys.stdin if line.strip()]
print(json.dumps(domains))
" 2>/dev/null)

info "Updating authorized domains..."
PATCH_RESULT=$(fb_api PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains" \
  -d "{\"authorizedDomains\": ${DOMAINS_JSON}}")

# Verify the patch worked
PATCHED_DOMAINS=$(echo "$PATCH_RESULT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print('ERROR: ' + data['error'].get('message', 'unknown error'))
    else:
        domains = data.get('authorizedDomains', [])
        for d in domains:
            print(d)
except Exception as e:
    print('ERROR: ' + str(e))
" 2>/dev/null || echo "ERROR: failed to parse response")

if echo "$PATCHED_DOMAINS" | grep -q "^ERROR:"; then
  err "Failed to update authorized domains."
  err "$PATCHED_DOMAINS"
  echo ""
  err "Response:"
  echo "$PATCH_RESULT" | python3 -m json.tool 2>/dev/null || echo "$PATCH_RESULT"
  exit 1
fi

ok "Authorized domains updated:"
echo "$PATCHED_DOMAINS" | while IFS= read -r d; do
  if [[ "$d" == "$CLOUD_RUN_HOST" ]]; then
    echo -e "    ${GREEN}${BOLD}$d${NC}  (Cloud Run)"
  else
    echo "    $d"
  fi
done

# ── Step 4: Update ALLOWED_ORIGINS in .env.deploy ──────────────────

ENV_DEPLOY="$PROJECT_ROOT/.env.deploy"

if [[ -f "$ENV_DEPLOY" ]]; then
  CURRENT_ORIGINS=$(grep "^ALLOWED_ORIGINS=" "$ENV_DEPLOY" 2>/dev/null | head -1 | cut -d= -f2- || echo "")

  # Add Cloud Run URL if not already in ALLOWED_ORIGINS
  if echo "$CURRENT_ORIGINS" | grep -q "$CLOUD_RUN_URL"; then
    ok "ALLOWED_ORIGINS already includes $CLOUD_RUN_URL"
  else
    if [[ -z "$CURRENT_ORIGINS" ]]; then
      NEW_ORIGINS="$CLOUD_RUN_URL"
    else
      NEW_ORIGINS="${CURRENT_ORIGINS},${CLOUD_RUN_URL}"
    fi

    if grep -q "^ALLOWED_ORIGINS=" "$ENV_DEPLOY" 2>/dev/null; then
      if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${NEW_ORIGINS}|" "$ENV_DEPLOY"
      else
        sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${NEW_ORIGINS}|" "$ENV_DEPLOY"
      fi
    elif grep -q "^# *ALLOWED_ORIGINS=" "$ENV_DEPLOY" 2>/dev/null; then
      if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s|^# *ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${NEW_ORIGINS}|" "$ENV_DEPLOY"
      else
        sed -i "s|^# *ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${NEW_ORIGINS}|" "$ENV_DEPLOY"
      fi
    else
      echo "ALLOWED_ORIGINS=${NEW_ORIGINS}" >> "$ENV_DEPLOY"
    fi
    ok "Updated ALLOWED_ORIGINS in .env.deploy"
  fi
else
  warn ".env.deploy not found — skipping ALLOWED_ORIGINS update"
fi

echo ""
ok "OAuth authorized domains configured for ${BOLD}${CLOUD_RUN_HOST}${NC}"
