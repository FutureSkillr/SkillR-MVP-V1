#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# setup-firebase.sh — Set up Firebase Authentication (FR-001)
#
# Enables Firebase APIs, creates a web app, enables auth providers
# (Email/Password + Google), and writes the config to env files.
#
# Idempotent: safe to re-run. Skips steps that are already done.
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - GCP project with billing enabled
#   - .env.deploy with GCP_PROJECT_ID (from gcp-onboard.sh)
#
# Usage:
#   ./scripts/setup-firebase.sh
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
step()  { echo -e "\n${BOLD}── Step $1 ──${NC}"; }

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
if [[ -z "$PROJECT_ID" ]]; then
  err "GCP_PROJECT_ID not set. Run ./scripts/gcp-onboard.sh first."
  exit 1
fi

# Web app display name
APP_NAME="Future SkillR Web"

echo ""
info "Setting up Firebase Authentication for ${BOLD}${PROJECT_ID}${NC}"
echo ""

# Helper: get access token for REST API calls
get_token() {
  gcloud auth print-access-token 2>/dev/null
}

# Helper: Firebase REST API call (includes required quota project header)
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

# Helper: extract JSON field via python3
json_get() {
  python3 -c "import sys,json; v=json.load(sys.stdin).get('$1',''); print('' if v is None else v)" 2>/dev/null || echo ""
}

# Helper: wait for a Firebase operation to complete
wait_op() {
  local op_name="$1" label="$2" max_wait="${3:-60}"
  if [[ -z "$op_name" || "$op_name" == "None" || "$op_name" == "" ]]; then
    return 0
  fi
  info "Waiting for ${label}..."
  local elapsed=0
  while [[ $elapsed -lt $max_wait ]]; do
    sleep 5
    elapsed=$((elapsed + 5))
    local done_val
    done_val=$(fb_api GET "https://firebase.googleapis.com/v1beta1/${op_name}" | json_get done)
    if [[ "$done_val" == "True" ]]; then
      return 0
    fi
  done
  warn "Operation did not complete within ${max_wait}s (may still be running)"
}

# ═════════════════════════════════════════════════════════════════════
step "1/6: Enable required APIs"
# ═════════════════════════════════════════════════════════════════════

APIS=(
  firebase.googleapis.com
  identitytoolkit.googleapis.com
  firebaseauth.googleapis.com
  firestore.googleapis.com
  apikeys.googleapis.com
)

for api in "${APIS[@]}"; do
  info "Enabling $api ..."
  gcloud services enable "$api" --project "$PROJECT_ID" --quiet 2>/dev/null || true
done
ok "APIs enabled"

# Brief pause for propagation
sleep 3

# ═════════════════════════════════════════════════════════════════════
step "2/6: Add Firebase to GCP project"
# ═════════════════════════════════════════════════════════════════════

FB_CHECK=$(fb_api GET "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}")
FB_STATUS=$(echo "$FB_CHECK" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if 'error' in d:
    print('not_found')
elif d.get('projectId'):
    print('ok')
else:
    print('unknown')
" 2>/dev/null || echo "unknown")

if [[ "$FB_STATUS" == "ok" ]]; then
  ok "Firebase already enabled for project"
else
  info "Adding Firebase to project..."
  OP_RESULT=$(fb_api POST "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}:addFirebase")
  OP_NAME=$(echo "$OP_RESULT" | json_get name)
  wait_op "$OP_NAME" "Firebase provisioning" 60
  ok "Firebase added to project"
fi

# ═════════════════════════════════════════════════════════════════════
step "3/6: Create Firebase web app"
# ═════════════════════════════════════════════════════════════════════

# List existing web apps
EXISTING_APPS=$(fb_api GET "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps")

APP_ID=$(echo "$EXISTING_APPS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
apps = data.get('apps', [])
for app in apps:
    dn = app.get('displayName', '')
    if dn == '${APP_NAME}':
        print(app.get('appId', ''))
        sys.exit(0)
# If no match by name, return first app if any
if apps:
    print(apps[0].get('appId', ''))
else:
    print('')
" 2>/dev/null || echo "")

if [[ -n "$APP_ID" ]]; then
  ok "Web app already exists: $APP_ID"
else
  info "Creating web app '${APP_NAME}'..."
  CREATE_RESULT=$(fb_api POST \
    "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps" \
    -d "{\"displayName\": \"${APP_NAME}\"}")

  OP_NAME=$(echo "$CREATE_RESULT" | json_get name)

  if [[ -n "$OP_NAME" && "$OP_NAME" != "" ]]; then
    wait_op "$OP_NAME" "web app creation" 60
  fi

  # Fetch the app ID — either from operation result or by re-listing
  sleep 2
  EXISTING_APPS=$(fb_api GET "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps")
  APP_ID=$(echo "$EXISTING_APPS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
apps = data.get('apps', [])
for app in apps:
    dn = app.get('displayName', '')
    if dn == '${APP_NAME}':
        print(app.get('appId', ''))
        sys.exit(0)
if apps:
    print(apps[0].get('appId', ''))
else:
    print('')
" 2>/dev/null || echo "")

  if [[ -n "$APP_ID" ]]; then
    ok "Web app created: $APP_ID"
  else
    err "Failed to create web app."
    err "Create manually: Firebase Console > Project Settings > Add app > Web"
    err "Then re-run this script."
    exit 1
  fi
fi

# ═════════════════════════════════════════════════════════════════════
step "4/6: Fetch Firebase web app config"
# ═════════════════════════════════════════════════════════════════════

CONFIG_JSON=$(fb_api GET \
  "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps/${APP_ID}/config")

# Extract config values
FIREBASE_API_KEY=$(echo "$CONFIG_JSON" | json_get apiKey)
FIREBASE_AUTH_DOMAIN=$(echo "$CONFIG_JSON" | json_get authDomain)
FIREBASE_PROJECT_ID=$(echo "$CONFIG_JSON" | json_get projectId)
FIREBASE_STORAGE_BUCKET=$(echo "$CONFIG_JSON" | json_get storageBucket)
FIREBASE_MESSAGING_SENDER_ID=$(echo "$CONFIG_JSON" | json_get messagingSenderId)
FIREBASE_APP_ID=$(echo "$CONFIG_JSON" | json_get appId)

if [[ -z "$FIREBASE_API_KEY" ]]; then
  err "Could not fetch Firebase config. Response:"
  echo "$CONFIG_JSON" | python3 -m json.tool 2>/dev/null || echo "$CONFIG_JSON"
  exit 1
fi

echo "  apiKey:            ${FIREBASE_API_KEY:0:12}..."
echo "  authDomain:        $FIREBASE_AUTH_DOMAIN"
echo "  projectId:         $FIREBASE_PROJECT_ID"
echo "  storageBucket:     $FIREBASE_STORAGE_BUCKET"
echo "  messagingSenderId: $FIREBASE_MESSAGING_SENDER_ID"
echo "  appId:             ${FIREBASE_APP_ID:0:20}..."
ok "Config fetched"

# ═════════════════════════════════════════════════════════════════════
step "5/6: Enable auth providers"
# ═════════════════════════════════════════════════════════════════════

# Enable Email/Password provider
info "Enabling Email/Password sign-in..."
fb_api PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email" \
  -d '{
    "signIn": {
      "email": {
        "enabled": true,
        "passwordRequired": true
      }
    }
  }' >/dev/null 2>&1 && ok "Email/Password enabled" || warn "Email/Password may need manual enablement"

# Enable Google sign-in
info "Enabling Google sign-in..."
# Try creating the provider config (POST), fall back to updating (PATCH)
fb_api POST \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=google.com" \
  -d "{
    \"idpId\": \"google.com\",
    \"enabled\": true,
    \"displayName\": \"Google\"
  }" >/dev/null 2>&1 || \
fb_api PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com?updateMask=enabled,displayName" \
  -d '{
    "enabled": true,
    "displayName": "Google"
  }' >/dev/null 2>&1 || true

ok "Google sign-in enabled"

echo ""
info "${DIM}Apple and Meta providers require developer accounts.${NC}"
info "${DIM}Enable them in Firebase Console > Authentication > Sign-in method.${NC}"

# ═════════════════════════════════════════════════════════════════════
step "6/6: Write config to env files"
# ═════════════════════════════════════════════════════════════════════

# Helper: update or add a key=value line in a file
set_env_value() {
  local file="$1" key="$2" value="$3"
  if [[ ! -f "$file" ]]; then
    echo "${key}=${value}" >> "$file"
    return
  fi
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  elif grep -q "^# *${key}=" "$file" 2>/dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^# *${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^# *${key}=.*|${key}=${value}|" "$file"
    fi
  else
    echo "${key}=${value}" >> "$file"
  fi
}

FB_VARS=(
  "FIREBASE_API_KEY:${FIREBASE_API_KEY}"
  "FIREBASE_AUTH_DOMAIN:${FIREBASE_AUTH_DOMAIN}"
  "FIREBASE_PROJECT_ID:${FIREBASE_PROJECT_ID}"
  "FIREBASE_STORAGE_BUCKET:${FIREBASE_STORAGE_BUCKET}"
  "FIREBASE_MESSAGING_SENDER_ID:${FIREBASE_MESSAGING_SENDER_ID}"
  "FIREBASE_APP_ID:${FIREBASE_APP_ID}"
)

# Files to update
ENV_FILES=(
  "$PROJECT_ROOT/.env.local"
  "$PROJECT_ROOT/.env.deploy"
  "$PROJECT_ROOT/frontend/.env.local"
)

for env_file in "${ENV_FILES[@]}"; do
  if [[ -f "$env_file" ]]; then
    for kv in "${FB_VARS[@]}"; do
      key="${kv%%:*}"
      value="${kv#*:}"
      set_env_value "$env_file" "$key" "$value"
    done
    ok "Updated $(basename "$env_file") ($(dirname "$env_file"))"
  else
    warn "Skipped $env_file (not found)"
  fi
done

# ═════════════════════════════════════════════════════════════════════
echo ""
printf "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${GREEN}║${NC}  ${BOLD}Firebase Authentication Setup Complete${NC}                      ${GREEN}║${NC}\n"
printf "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}\n"
printf "${GREEN}║${NC}  Project:      %-44s ${GREEN}║${NC}\n" "$PROJECT_ID"
printf "${GREEN}║${NC}  Web App:      %-44s ${GREEN}║${NC}\n" "$APP_NAME ($APP_ID)"
printf "${GREEN}║${NC}  Auth Domain:  %-44s ${GREEN}║${NC}\n" "$FIREBASE_AUTH_DOMAIN"
printf "${GREEN}║${NC}  Providers:    %-44s ${GREEN}║${NC}\n" "Email/Password, Google"
printf "${GREEN}╠──────────────────────────────────────────────────────────────╣${NC}\n"
printf "${GREEN}║${NC}  ${DIM}Remaining manual steps:${NC}                                     ${GREEN}║${NC}\n"
printf "${GREEN}║${NC}    1. Add authorized domains in Firebase Console            ${GREEN}║${NC}\n"
printf "${GREEN}║${NC}       (your Cloud Run URL + localhost)                       ${GREEN}║${NC}\n"
printf "${GREEN}║${NC}    2. Enable Apple/Meta providers if needed                  ${GREEN}║${NC}\n"
printf "${GREEN}║${NC}       (requires Apple Developer / Meta Business accounts)    ${GREEN}║${NC}\n"
printf "${GREEN}╠──────────────────────────────────────────────────────────────╣${NC}\n"
printf "${GREEN}║${NC}  ${BOLD}Next:${NC}  make local-stage-down && make local-stage                           ${GREEN}║${NC}\n"
printf "${GREEN}║${NC}         Then open http://localhost:9090                       ${GREEN}║${NC}\n"
printf "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo ""
