#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# setup-secrets.sh — Store GCP credentials in Secret Manager (FR-069)
#
# One-time setup: uploads the local SA key to Secret Manager and grants
# the Cloud Run service account access to read it.
#
# Usage:
#   ./scripts/setup-secrets.sh                    # uses defaults from .env.deploy
#   ./scripts/setup-secrets.sh path/to/key.json   # specify key file
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
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
REGION="${GCP_REGION:-europe-west3}"
SERVICE="${CLOUD_RUN_SERVICE:-skillr}"
SECRET_NAME="vertexai-sa-key"
KEY_FILE="${1:-$PROJECT_ROOT/credentials/vertexai-sa.json}"

# ── Validate ────────────────────────────────────────────────────────
if [[ -z "$PROJECT_ID" ]]; then
  err "GCP_PROJECT_ID not set. Run ./scripts/gcp-onboard.sh first or set in .env.deploy."
  exit 1
fi

if [[ ! -f "$KEY_FILE" ]]; then
  err "Key file not found: $KEY_FILE"
  echo ""
  echo "  Generate one with:"
  echo "    gcloud iam service-accounts keys create credentials/vertexai-sa.json \\"
  echo "      --iam-account=<SA_EMAIL>"
  exit 1
fi

echo ""
info "Setting up Secret Manager for ${BOLD}$SERVICE${NC}"
echo "  Project:    $PROJECT_ID"
echo "  Secret:     $SECRET_NAME"
echo "  Key file:   $KEY_FILE"
echo ""

# ── Enable Secret Manager API ───────────────────────────────────────
info "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com \
  --project "$PROJECT_ID" --quiet 2>/dev/null
ok "Secret Manager API enabled"

# Wait for API propagation (can take up to 60s)
info "Waiting for API propagation..."
for i in 1 2 3 4 5 6; do
  if gcloud secrets list --project "$PROJECT_ID" --limit=1 >/dev/null 2>&1; then
    break
  fi
  if [[ $i -eq 6 ]]; then
    err "Secret Manager API not ready after 60s. Please retry in a minute."
    exit 1
  fi
  sleep 10
done
ok "API ready"

# ── Create or update the secret ─────────────────────────────────────
if gcloud secrets describe "$SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
  info "Secret '$SECRET_NAME' exists — adding new version..."
  gcloud secrets versions add "$SECRET_NAME" \
    --project "$PROJECT_ID" \
    --data-file="$KEY_FILE" \
    --quiet
  ok "New secret version added"
else
  info "Creating secret '$SECRET_NAME'..."
  gcloud secrets create "$SECRET_NAME" \
    --project "$PROJECT_ID" \
    --replication-policy="automatic" \
    --quiet
  gcloud secrets versions add "$SECRET_NAME" \
    --project "$PROJECT_ID" \
    --data-file="$KEY_FILE" \
    --quiet
  ok "Secret created and version added"
fi

# ── Grant Cloud Run SA access to the secret ─────────────────────────
# Cloud Run uses the default compute service account unless overridden.
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

info "Granting ${COMPUTE_SA} access to secret..."
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --project "$PROJECT_ID" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet >/dev/null 2>&1
ok "IAM binding set"

# ── Persist secret name in .env.deploy ──────────────────────────────
ENV_DEPLOY="$PROJECT_ROOT/.env.deploy"
if [[ -f "$ENV_DEPLOY" ]]; then
  if grep -q "^VERTEXAI_SECRET_NAME=" "$ENV_DEPLOY" 2>/dev/null; then
    # Update existing line
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^VERTEXAI_SECRET_NAME=.*|VERTEXAI_SECRET_NAME=${SECRET_NAME}|" "$ENV_DEPLOY"
    else
      sed -i "s|^VERTEXAI_SECRET_NAME=.*|VERTEXAI_SECRET_NAME=${SECRET_NAME}|" "$ENV_DEPLOY"
    fi
  else
    echo "" >> "$ENV_DEPLOY"
    echo "# ── Secret Manager (FR-069) ──" >> "$ENV_DEPLOY"
    echo "VERTEXAI_SECRET_NAME=${SECRET_NAME}" >> "$ENV_DEPLOY"
  fi
  ok "VERTEXAI_SECRET_NAME written to .env.deploy"
fi

echo ""
ok "Setup complete. Deploy with: ${BOLD}make ship${NC}"
echo ""
echo "  The deploy script will mount the secret as:"
echo "    /app/credentials/vertexai-sa.json"
echo ""
echo "  To verify after deploy:"
echo "    make health"
echo ""
