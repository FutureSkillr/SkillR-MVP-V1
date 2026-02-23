#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# gcp-onboard.sh — Onboard Future SkillR into a new GCP project
#
# First run:  Interactive — asks questions, writes .env.deploy
# Re-run:     Automatic  — reads .env.deploy, skips prompts, deploys
#
# Usage:
#   ./scripts/gcp-onboard.sh              # Auto if .env.deploy exists
#   ./scripts/gcp-onboard.sh --fresh      # Force interactive mode
#   ./scripts/gcp-onboard.sh --no-deploy  # Setup only, skip deploy
#
# Prerequisites:
#   - gcloud CLI installed (brew install google-cloud-sdk)
#   - Docker installed (for local builds)
#   - You have been invited as admin/editor on the target GCP project
#   - The project owner has granted you at minimum:
#       roles/serviceusage.serviceUsageConsumer  (use APIs / set quota project)
#       roles/run.admin                          (deploy to Cloud Run)
#       roles/cloudbuild.builds.editor           (trigger Cloud Build)
#     Or simply: roles/editor for all of the above
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────
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
step()  { echo -e "\n${BOLD}═══ Step $1: $2 ═══${NC}"; }

# ─── Defaults & Flags ───────────────────────────────────────────────
SERVICE_NAME="skillr"
REGION="europe-west3"
ENV_FILE=".env.deploy"
FRESH=false
NO_DEPLOY=false

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_PATH="$PROJECT_ROOT/$ENV_FILE"

for arg in "$@"; do
  case "$arg" in
    --fresh)     FRESH=true ;;
    --no-deploy) NO_DEPLOY=true ;;
  esac
done

# ─── Auto-mode detection ────────────────────────────────────────────
AUTO=false
if [ -f "$ENV_PATH" ] && [ "$FRESH" = false ]; then
  AUTO=true
  info "Found existing ${BOLD}$ENV_FILE${NC} — running in auto mode."
  info "Use ${BOLD}--fresh${NC} to force interactive setup."
  echo ""

  # Load existing config
  set -a
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    [ -n "$key" ] && export "$key=$value"
  done < "$ENV_PATH"
  set +a

  TARGET_PROJECT="${GCP_PROJECT_ID:-}"
  REGION="${GCP_REGION:-$REGION}"
  SERVICE_NAME="${CLOUD_RUN_SERVICE:-$SERVICE_NAME}"
  GEMINI_API_KEY="${GEMINI_API_KEY:-}"
  CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-}"
  CLOUDSQL_CONNECTION_NAME="${CLOUDSQL_CONNECTION_NAME:-}"
  DB_NAME="${DB_NAME:-skillr}"
  DB_USER="${DB_USER:-skillr}"
  DB_PASS="${DB_PASS:-}"
  DATABASE_URL="${DATABASE_URL:-}"
  REDIS_URL="${REDIS_URL:-}"
fi

# ─────────────────────────────────────────────────────────────────────
# Step 0: Preflight checks
# ─────────────────────────────────────────────────────────────────────
step 0 "Preflight checks"

if ! command -v gcloud &>/dev/null; then
  err "gcloud CLI not found. Install it first:"
  echo "  brew install google-cloud-sdk"
  exit 1
fi
ok "gcloud CLI found: $(gcloud --version 2>&1 | head -1)"

if ! command -v docker &>/dev/null; then
  warn "Docker not found — Cloud Build still works, but local docker-build won't."
else
  ok "Docker found: $(docker --version)"
fi

# ─────────────────────────────────────────────────────────────────────
# Step 1: Authenticate
# ─────────────────────────────────────────────────────────────────────
step 1 "Google Cloud Authentication"

CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")

if [ -n "$CURRENT_ACCOUNT" ]; then
  ok "Authenticated as: $CURRENT_ACCOUNT"
  if [ "$AUTO" = false ]; then
    read -rp "Use this account? [Y/n] " USE_CURRENT
    if [[ "${USE_CURRENT:-Y}" =~ ^[Nn] ]]; then
      info "Opening browser for login..."
      gcloud auth login --update-adc
      CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
    fi
  fi
else
  info "Not authenticated. Opening browser for login..."
  gcloud auth login --update-adc
  CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
fi

# ─────────────────────────────────────────────────────────────────────
# Step 2: Select GCP project
# ─────────────────────────────────────────────────────────────────────
step 2 "Select GCP Project"

if [ "$AUTO" = true ] && [ -n "${TARGET_PROJECT:-}" ]; then
  ok "Using project from .env.deploy: $TARGET_PROJECT"
else
  info "Listing projects you have access to..."
  echo ""
  gcloud projects list --format="table(projectId,name,projectNumber)" 2>/dev/null || true
  echo ""

  CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
  if [ -n "$CURRENT_PROJECT" ]; then
    info "Currently configured project: ${BOLD}$CURRENT_PROJECT${NC}"
  fi

  read -rp "Enter the GCP Project ID to deploy to: " TARGET_PROJECT
  if [ -z "$TARGET_PROJECT" ]; then
    err "Project ID cannot be empty."
    exit 1
  fi
fi

# Validate project access
info "Validating access to project: $TARGET_PROJECT ..."
if ! gcloud projects describe "$TARGET_PROJECT" &>/dev/null; then
  err "Cannot access project '$TARGET_PROJECT'."
  exit 1
fi

gcloud config set project "$TARGET_PROJECT" 2>/dev/null
ok "Active project: $TARGET_PROJECT"

# ─── Verify quota-project permissions ────────────────────────────────
info "Setting ADC quota project..."
if gcloud auth application-default set-quota-project "$TARGET_PROJECT" 2>/dev/null; then
  ok "Quota project: $TARGET_PROJECT"
else
  warn "Cannot set quota project — missing serviceusage.services.use permission."
  warn "The project owner must run:"
  echo ""
  echo "  gcloud projects add-iam-policy-binding $TARGET_PROJECT --member=\"user:$CURRENT_ACCOUNT\" --role=\"roles/serviceusage.serviceUsageConsumer\""
  echo ""
  if [ "$AUTO" = true ]; then
    warn "Continuing anyway (auto mode)..."
  else
    read -rp "Continue anyway (deploy may fail)? [y/N] " CONTINUE_ANYWAY
    if [[ ! "${CONTINUE_ANYWAY:-N}" =~ ^[Yy] ]]; then
      exit 1
    fi
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# Step 3: Select region
# ─────────────────────────────────────────────────────────────────────
step 3 "Select Region"

if [ "$AUTO" = true ]; then
  ok "Region: $REGION"
else
  info "Default region: ${BOLD}$REGION${NC} (Frankfurt)"
  read -rp "Use $REGION? [Y/n] " USE_REGION
  if [[ "${USE_REGION:-Y}" =~ ^[Nn] ]]; then
    echo "  europe-west3 (Frankfurt) | europe-west1 (Belgium) | us-central1 (Iowa)"
    read -rp "Enter region: " REGION
  fi
  ok "Region: $REGION"
fi

# ─────────────────────────────────────────────────────────────────────
# Step 4: Enable required GCP APIs
# ─────────────────────────────────────────────────────────────────────
step 4 "Enable Required GCP APIs"

REQUIRED_APIS=(
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "containerregistry.googleapis.com"
  "firestore.googleapis.com"
  "sqladmin.googleapis.com"
  "vpcaccess.googleapis.com"
  "aiplatform.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
  if gcloud services enable "$api" --project="$TARGET_PROJECT" 2>/dev/null; then
    ok "$api"
  else
    warn "Could not enable $api"
  fi
done

# ─────────────────────────────────────────────────────────────────────
# Step 5: Artifact Registry
# ─────────────────────────────────────────────────────────────────────
step 5 "Artifact Registry"

AR_REPO="cloud-run-source-deploy"
if gcloud artifacts repositories describe "$AR_REPO" \
    --location="$REGION" --project="$TARGET_PROJECT" &>/dev/null; then
  ok "Repo '$AR_REPO' exists."
else
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker --location="$REGION" \
    --project="$TARGET_PROJECT" \
    --description="Docker images for Cloud Run" 2>/dev/null || \
  warn "Could not create repo — Cloud Build will create it on first deploy."
fi

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet 2>/dev/null || true
ok "Docker auth configured for ${REGION}-docker.pkg.dev"

# ─────────────────────────────────────────────────────────────────────
# Step 6: Cloud SQL PostgreSQL
# ─────────────────────────────────────────────────────────────────────
step 6 "Cloud SQL PostgreSQL"

CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-skillr-db}"
DB_NAME="${DB_NAME:-skillr}"
DB_USER="${DB_USER:-skillr}"

# Check if instance already exists
if gcloud sql instances describe "$CLOUDSQL_INSTANCE" \
    --project="$TARGET_PROJECT" &>/dev/null; then
  ok "Cloud SQL instance '$CLOUDSQL_INSTANCE' already exists."
  CLOUDSQL_CONNECTION_NAME=$(gcloud sql instances describe "$CLOUDSQL_INSTANCE" \
    --project="$TARGET_PROJECT" --format='value(connectionName)' 2>/dev/null)
  ok "Connection: $CLOUDSQL_CONNECTION_NAME"
else
  if [ "$AUTO" = true ]; then
    warn "Cloud SQL instance '$CLOUDSQL_INSTANCE' not found."
    warn "Run with --fresh to provision it, or create manually."
  else
    echo ""
    info "Cloud SQL provides managed PostgreSQL for the Go backend."
    info "Instance: ${BOLD}$CLOUDSQL_INSTANCE${NC} (PostgreSQL 16, db-f1-micro)"
    info "Estimated cost: ~\$9/month (db-f1-micro, 10 GB storage)"
    echo ""
    read -rp "Provision Cloud SQL instance? [Y/n] " PROVISION_SQL
    if [[ "${PROVISION_SQL:-Y}" =~ ^[Yy] ]]; then
      # Generate a strong random password
      DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)

      info "Creating Cloud SQL instance (this takes 3-5 minutes)..."
      if gcloud sql instances create "$CLOUDSQL_INSTANCE" \
          --project="$TARGET_PROJECT" \
          --database-version=POSTGRES_16 \
          --tier=db-f1-micro \
          --region="$REGION" \
          --storage-size=10GB \
          --storage-auto-increase \
          --backup-start-time=03:00 \
          --availability-type=zonal \
          --quiet 2>&1; then
        ok "Instance created: $CLOUDSQL_INSTANCE"
      else
        err "Failed to create Cloud SQL instance."
        warn "You can create it manually in the Cloud Console."
      fi

      # Create database
      info "Creating database '$DB_NAME'..."
      gcloud sql databases create "$DB_NAME" \
        --instance="$CLOUDSQL_INSTANCE" \
        --project="$TARGET_PROJECT" \
        --quiet 2>/dev/null || \
        warn "Database may already exist (continuing)."

      # Create user with password
      info "Creating database user '$DB_USER'..."
      gcloud sql users create "$DB_USER" \
        --instance="$CLOUDSQL_INSTANCE" \
        --project="$TARGET_PROJECT" \
        --password="$DB_PASS" \
        --quiet 2>/dev/null || \
        warn "User may already exist. Password NOT updated (use Cloud Console to reset)."

      CLOUDSQL_CONNECTION_NAME=$(gcloud sql instances describe "$CLOUDSQL_INSTANCE" \
        --project="$TARGET_PROJECT" --format='value(connectionName)' 2>/dev/null)
      ok "Connection: $CLOUDSQL_CONNECTION_NAME"
      ok "Database: $DB_NAME | User: $DB_USER"
      info "Password saved to .env.deploy (NEVER commit this file)"
    else
      info "Skipping Cloud SQL provisioning."
      info "Set DATABASE_URL in .env.deploy manually before deploying."
    fi
  fi
fi

# Build DATABASE_URL for Cloud Run (uses Unix socket via Cloud SQL Auth Proxy)
if [ -n "${CLOUDSQL_CONNECTION_NAME:-}" ] && [ -n "${DB_PASS:-}" ]; then
  DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CLOUDSQL_CONNECTION_NAME}"
elif [ -n "${DATABASE_URL:-}" ]; then
  ok "Using DATABASE_URL from .env.deploy"
fi

# ─────────────────────────────────────────────────────────────────────
# Step 7: Collect secrets (skip in auto mode)
# ─────────────────────────────────────────────────────────────────────
step 7 "Application Secrets"

if [ "$AUTO" = true ]; then
  ok "Using secrets from .env.deploy"
  # Mask the key for display
  MASKED_KEY="${GEMINI_API_KEY:0:8}...${GEMINI_API_KEY: -4}"
  info "GEMINI_API_KEY: $MASKED_KEY"
else
  echo ""
  info "Secrets will be saved to ${BOLD}$ENV_FILE${NC} (git-ignored)."
  echo ""

  read -rp "GEMINI_API_KEY (from Google AI Studio): " GEMINI_API_KEY
  if [ -z "$GEMINI_API_KEY" ]; then
    warn "No Gemini API key provided. Get one at: https://aistudio.google.com/apikey"
    GEMINI_API_KEY="PLACEHOLDER_SET_ME"
  fi

  echo ""
  info "Firebase config (press Enter to skip any value)."
  echo ""

  read -rp "FIREBASE_API_KEY: " FIREBASE_API_KEY
  read -rp "FIREBASE_AUTH_DOMAIN: " FIREBASE_AUTH_DOMAIN
  read -rp "FIREBASE_PROJECT_ID [$TARGET_PROJECT]: " FIREBASE_PROJECT_ID
  FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-$TARGET_PROJECT}"
  read -rp "FIREBASE_STORAGE_BUCKET: " FIREBASE_STORAGE_BUCKET
  read -rp "FIREBASE_MESSAGING_SENDER_ID: " FIREBASE_MESSAGING_SENDER_ID
  read -rp "FIREBASE_APP_ID: " FIREBASE_APP_ID
fi

# ─────────────────────────────────────────────────────────────────────
# Step 8: Write .env.deploy (skip in auto mode)
# ─────────────────────────────────────────────────────────────────────
step 8 "Write Config Files"

if [ "$AUTO" = false ]; then
  cat > "$ENV_PATH" <<ENVEOF
# ─── Future SkillR — Deploy Configuration ────────────────────────────
# Generated by gcp-onboard.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# This file is git-ignored. NEVER commit it.

# GCP
GCP_PROJECT_ID=$TARGET_PROJECT
GCP_REGION=$REGION
GCP_TTS_REGION=europe-west1
CLOUD_RUN_SERVICE=$SERVICE_NAME

# Cloud SQL PostgreSQL
CLOUDSQL_INSTANCE=${CLOUDSQL_INSTANCE:-}
CLOUDSQL_CONNECTION_NAME=${CLOUDSQL_CONNECTION_NAME:-}
DB_NAME=${DB_NAME:-skillr}
DB_USER=${DB_USER:-skillr}
DB_PASS=${DB_PASS:-}
DATABASE_URL=${DATABASE_URL:-}

# Redis (optional — set REDIS_URL if using Memorystore)
REDIS_URL=${REDIS_URL:-}

# Gemini
GEMINI_API_KEY=$GEMINI_API_KEY

# Firebase
FIREBASE_API_KEY=${FIREBASE_API_KEY:-}
FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-}
FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-}
FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID:-}
FIREBASE_APP_ID=${FIREBASE_APP_ID:-}
ENVEOF
  ok "Written: $ENV_PATH"

  FRONTEND_ENV="$PROJECT_ROOT/frontend/.env.local"
  cat > "$FRONTEND_ENV" <<FEOF
# ─── Local dev environment (generated by gcp-onboard.sh) ────────────
GEMINI_API_KEY=$GEMINI_API_KEY
FIREBASE_API_KEY=${FIREBASE_API_KEY:-}
FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-}
FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-}
FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID:-}
FIREBASE_APP_ID=${FIREBASE_APP_ID:-}
FEOF
  ok "Written: $FRONTEND_ENV"
else
  ok "Config files unchanged (auto mode)."
fi

# ─────────────────────────────────────────────────────────────────────
# Step 9: Deploy to Cloud Run
# ─────────────────────────────────────────────────────────────────────
step 9 "Deploy to Cloud Run"

if [ "$NO_DEPLOY" = true ]; then
  info "Skipping deploy (--no-deploy flag)."
else
  if [ "$AUTO" = false ]; then
    echo ""
    info "Ready to deploy ${BOLD}$SERVICE_NAME${NC} to ${BOLD}$TARGET_PROJECT${NC} / ${BOLD}$REGION${NC}"
    read -rp "Deploy now? [Y/n] " DO_DEPLOY
    if [[ "${DO_DEPLOY:-Y}" =~ ^[Nn] ]]; then
      info "Skipping. Run later with: ./scripts/deploy.sh"
      NO_DEPLOY=true
    fi
  fi

  if [ "$NO_DEPLOY" = false ]; then
    DEPLOY_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    GIT_SHA=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
    GIT_BRANCH=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    GIT_MSG=$(git -C "$PROJECT_ROOT" log -1 --pretty=format:"%s" 2>/dev/null || echo "")

    info "Deploying via Cloud Build + Cloud Run..."
    echo ""

    cd "$PROJECT_ROOT"

    AR_REPO="cloud-run-source-deploy"
    IMAGE_TAG="${REGION}-docker.pkg.dev/${TARGET_PROJECT}/${AR_REPO}/${SERVICE_NAME}:${GIT_SHA}"

    info "Step 1/2: Building image locally..."
    docker build -t "$IMAGE_TAG" . && BUILD_OK=true || BUILD_OK=false

    if [ "$BUILD_OK" = true ]; then
      info "Pushing image to Artifact Registry..."
      docker push "$IMAGE_TAG" && BUILD_OK=true || BUILD_OK=false
    fi

    if [ "$BUILD_OK" = false ]; then
      DEPLOY_STATUS="FAILED"
    else
      info "Step 2/2: Deploying to Cloud Run..."

      # Build Cloud Run deploy command
      DEPLOY_CMD=(gcloud run deploy "$SERVICE_NAME"
        --project "$TARGET_PROJECT"
        --region "$REGION"
        --image "$IMAGE_TAG"
        --allow-unauthenticated
        --max-instances 10
        --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY:-},FIREBASE_API_KEY=${FIREBASE_API_KEY:-},FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-},FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-},FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-},FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID:-},FIREBASE_APP_ID=${FIREBASE_APP_ID:-},RUN_MIGRATIONS=true,STATIC_DIR=/app/static,MIGRATIONS_PATH=/app/migrations"
      )

      # Add database config
      if [ -n "${DATABASE_URL:-}" ]; then
        DEPLOY_CMD+=(--set-env-vars "DATABASE_URL=${DATABASE_URL}")
      fi
      if [ -n "${REDIS_URL:-}" ]; then
        DEPLOY_CMD+=(--set-env-vars "REDIS_URL=${REDIS_URL}")
      fi

      # Add Cloud SQL connection if provisioned
      if [ -n "${CLOUDSQL_CONNECTION_NAME:-}" ]; then
        DEPLOY_CMD+=(--add-cloudsql-instances "$CLOUDSQL_CONNECTION_NAME")
      fi

      DEPLOY_CMD+=(--quiet)

      "${DEPLOY_CMD[@]}" && DEPLOY_STATUS="SUCCESS" || DEPLOY_STATUS="FAILED"
    fi

    echo ""

    DEPLOY_END=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    DEPLOY_URL=""
    REVISION=""

    if [ "$DEPLOY_STATUS" = "SUCCESS" ]; then
      DEPLOY_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --project "$TARGET_PROJECT" --region "$REGION" \
        --format 'value(status.url)' 2>/dev/null || echo "")

      REVISION=$(gcloud run services describe "$SERVICE_NAME" \
        --project "$TARGET_PROJECT" --region "$REGION" \
        --format 'value(status.latestReadyRevisionName)' 2>/dev/null || echo "")

      ok "Deployed: ${BOLD}$DEPLOY_URL${NC}"
    else
      err "Deployment failed. See output above."
    fi

    # ─── Generate HTML deployment report ─────────────────────────────
    REPORTS_DIR="$PROJECT_ROOT/docs/ops/deployments"
    mkdir -p "$REPORTS_DIR"

    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    REPORT_FILE="$REPORTS_DIR/deploy-${TIMESTAMP}.html"

    # Collect recent git log for the report
    GIT_LOG_HTML=$(git -C "$PROJECT_ROOT" log --oneline -10 2>/dev/null | \
      sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g' | \
      sed 's|^\([a-f0-9]*\) \(.*\)$|<tr><td class="mono">\1</td><td>\2</td></tr>|')

    cat > "$REPORT_FILE" <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deployment Report — DEPLOY_TIMESTAMP</title>
<style>
  :root {
    --bg: #0f172a; --surface: #1e293b; --border: #334155;
    --text: #e2e8f0; --muted: #94a3b8; --accent: #38bdf8;
    --green: #4ade80; --red: #f87171; --yellow: #fbbf24;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: var(--bg); color: var(--text); padding: 2rem; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { color: var(--muted); font-size: 0.875rem; margin-bottom: 2rem; }
  .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px;
                  font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
  .status-success { background: #064e3b; color: var(--green); }
  .status-failed  { background: #450a0a; color: var(--red); }
  .card { background: var(--surface); border: 1px solid var(--border);
          border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 1rem; }
  .card h2 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;
             color: var(--muted); margin-bottom: 0.75rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .kv { margin-bottom: 0.5rem; }
  .kv .label { color: var(--muted); font-size: 0.8rem; }
  .kv .value { font-size: 0.95rem; }
  .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85rem; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--border);
       font-size: 0.85rem; }
  td:first-child { width: 80px; color: var(--muted); }
  .quicklinks { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
  .quicklinks a { display: inline-block; padding: 0.4rem 0.75rem; background: #0c4a6e;
                  border-radius: 0.375rem; font-size: 0.8rem; font-weight: 500; }
  .quicklinks a:hover { background: #075985; text-decoration: none; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);
            color: var(--muted); font-size: 0.75rem; text-align: center; }
</style>
</head>
<body>
<div class="container">

<h1>Deployment Report <span class="status-badge DEPLOY_STATUS_CLASS">DEPLOY_STATUS</span></h1>
<p class="subtitle">DEPLOY_TIMESTAMP — Future SkillR</p>

<div class="grid">
  <div class="card">
    <h2>Deployment</h2>
    <div class="kv"><div class="label">Service</div><div class="value">DEPLOY_SERVICE</div></div>
    <div class="kv"><div class="label">Revision</div><div class="value mono">DEPLOY_REVISION</div></div>
    <div class="kv"><div class="label">Project</div><div class="value mono">DEPLOY_PROJECT</div></div>
    <div class="kv"><div class="label">Region</div><div class="value">DEPLOY_REGION</div></div>
    <div class="kv"><div class="label">URL</div><div class="value"><a href="DEPLOY_URL" target="_blank">DEPLOY_URL</a></div></div>
  </div>
  <div class="card">
    <h2>Source</h2>
    <div class="kv"><div class="label">Git SHA</div><div class="value mono">DEPLOY_GIT_SHA</div></div>
    <div class="kv"><div class="label">Branch</div><div class="value mono">DEPLOY_GIT_BRANCH</div></div>
    <div class="kv"><div class="label">Message</div><div class="value">DEPLOY_GIT_MSG</div></div>
    <div class="kv"><div class="label">Deployer</div><div class="value">DEPLOY_ACCOUNT</div></div>
    <div class="kv"><div class="label">Started</div><div class="value mono">DEPLOY_START_TIME</div></div>
    <div class="kv"><div class="label">Finished</div><div class="value mono">DEPLOY_END_TIME</div></div>
  </div>
</div>

<div class="card">
  <h2>Quick Links</h2>
  <div class="quicklinks">
    <a href="DEPLOY_URL" target="_blank">Live App</a>
    <a href="https://console.cloud.google.com/run/detail/DEPLOY_REGION/DEPLOY_SERVICE/revisions?project=DEPLOY_PROJECT" target="_blank">Cloud Run Revisions</a>
    <a href="https://console.cloud.google.com/run/detail/DEPLOY_REGION/DEPLOY_SERVICE/logs?project=DEPLOY_PROJECT" target="_blank">Cloud Run Logs</a>
    <a href="https://console.cloud.google.com/cloud-build/builds?project=DEPLOY_PROJECT" target="_blank">Cloud Build History</a>
    <a href="https://console.cloud.google.com/artifacts/docker/DEPLOY_PROJECT/DEPLOY_REGION/cloud-run-source-deploy?project=DEPLOY_PROJECT" target="_blank">Container Images</a>
    <a href="https://console.firebase.google.com/project/DEPLOY_PROJECT" target="_blank">Firebase Console</a>
  </div>
</div>

<div class="card">
  <h2>Recent Commits</h2>
  <table>
DEPLOY_GIT_LOG
  </table>
</div>

<div class="footer">
  Generated by <code>scripts/deploy.sh</code> — report stored in <code>docs/ops/deployments/</code>
</div>

</div>
</body>
</html>
HTMLEOF

    # Replace placeholders in the HTML
    sed -i '' "s|DEPLOY_TIMESTAMP|$TIMESTAMP|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_STATUS_CLASS|$([ "$DEPLOY_STATUS" = "SUCCESS" ] && echo "status-success" || echo "status-failed")|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_STATUS|$DEPLOY_STATUS|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_SERVICE|$SERVICE_NAME|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_REVISION|${REVISION:-unknown}|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_PROJECT|$TARGET_PROJECT|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_REGION|$REGION|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_URL|${DEPLOY_URL:-N/A}|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_GIT_SHA|$GIT_SHA|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_GIT_BRANCH|$GIT_BRANCH|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_GIT_MSG|$GIT_MSG|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_ACCOUNT|$CURRENT_ACCOUNT|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_START_TIME|$DEPLOY_START|g" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_END_TIME|$DEPLOY_END|g" "$REPORT_FILE"

    # Insert git log rows
    GIT_LOG_ESCAPED=$(echo "$GIT_LOG_HTML" | sed 's|/|\\/|g')
    # Use a temp file approach for multiline replacement
    GIT_LOG_TMPFILE=$(mktemp)
    echo "$GIT_LOG_HTML" > "$GIT_LOG_TMPFILE"
    sed -i '' "/DEPLOY_GIT_LOG/r $GIT_LOG_TMPFILE" "$REPORT_FILE"
    sed -i '' "s|DEPLOY_GIT_LOG||g" "$REPORT_FILE"
    rm -f "$GIT_LOG_TMPFILE"

    ok "Report: ${BOLD}$REPORT_FILE${NC}"

    # ─── Update deployment index ─────────────────────────────────────
    INDEX_FILE="$REPORTS_DIR/index.html"

    # Collect all deployment reports for the index
    ROWS=""
    for f in $(ls -t "$REPORTS_DIR"/deploy-*.html 2>/dev/null); do
      BASENAME=$(basename "$f")
      # Extract timestamp from filename: deploy-YYYYMMDD-HHMMSS.html
      TS="${BASENAME#deploy-}"
      TS="${TS%.html}"
      # Format: YYYY-MM-DD HH:MM:SS
      DISPLAY_TS="${TS:0:4}-${TS:4:2}-${TS:6:2} ${TS:9:2}:${TS:11:2}:${TS:13:2}"
      # Check if SUCCESS or FAILED is in the file
      if grep -q "status-success" "$f" 2>/dev/null; then
        BADGE='<span class="badge-ok">SUCCESS</span>'
      else
        BADGE='<span class="badge-fail">FAILED</span>'
      fi
      ROWS="$ROWS<tr><td class=\"mono\">$DISPLAY_TS</td><td>$BADGE</td><td><a href=\"$BASENAME\">$BASENAME</a></td></tr>"
    done

    cat > "$INDEX_FILE" <<IDXEOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deployment History — Future SkillR</title>
<style>
  :root { --bg: #0f172a; --surface: #1e293b; --border: #334155;
          --text: #e2e8f0; --muted: #94a3b8; --accent: #38bdf8;
          --green: #4ade80; --red: #f87171; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: var(--bg); color: var(--text); padding: 2rem; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { color: var(--muted); font-size: 0.875rem; margin-bottom: 2rem; }
  table { width: 100%; border-collapse: collapse; background: var(--surface);
          border: 1px solid var(--border); border-radius: 0.5rem; overflow: hidden; }
  th { text-align: left; padding: 0.6rem 0.75rem; background: #0f172a;
       font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
       color: var(--muted); border-bottom: 1px solid var(--border); }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
  .mono { font-family: 'SF Mono', 'Fira Code', monospace; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .badge-ok { background: #064e3b; color: var(--green); padding: 0.15rem 0.5rem;
              border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
  .badge-fail { background: #450a0a; color: var(--red); padding: 0.15rem 0.5rem;
                border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
  .footer { margin-top: 2rem; color: var(--muted); font-size: 0.75rem; text-align: center; }
</style>
</head>
<body>
<div class="container">
<h1>Deployment History</h1>
<p class="subtitle">Future SkillR — All Cloud Run deployments</p>
<table>
  <thead><tr><th>Timestamp</th><th>Status</th><th>Report</th></tr></thead>
  <tbody>
$ROWS
  </tbody>
</table>
<div class="footer">Auto-generated by <code>scripts/gcp-onboard.sh</code> and <code>scripts/deploy.sh</code></div>
</div>
</body>
</html>
IDXEOF

    ok "Index: ${BOLD}$INDEX_FILE${NC}"
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# Step 10: Summary
# ─────────────────────────────────────────────────────────────────────
step 10 "Done"

echo ""
echo -e "${GREEN}${BOLD}Complete!${NC}"
echo ""
echo "  Account:    $CURRENT_ACCOUNT"
echo "  Project:    $TARGET_PROJECT"
echo "  Region:     $REGION"
echo "  Service:    $SERVICE_NAME"
if [ -n "${CLOUDSQL_CONNECTION_NAME:-}" ]; then
echo "  Cloud SQL:  $CLOUDSQL_CONNECTION_NAME"
fi
echo ""
echo -e "${BOLD}Commands:${NC}"
echo "  ./scripts/deploy.sh              Deploy to production"
echo "  ./scripts/deploy.sh staging      Deploy to staging"
echo "  make logs                        Tail Cloud Run logs"
echo "  make local-stage                       Local staging (docker-compose)"
echo ""
echo -e "${BOLD}Links:${NC}"
echo "  Cloud Run  : https://console.cloud.google.com/run?project=$TARGET_PROJECT"
echo "  Cloud SQL  : https://console.cloud.google.com/sql?project=$TARGET_PROJECT"
echo "  Builds     : https://console.cloud.google.com/cloud-build?project=$TARGET_PROJECT"
echo "  Firebase   : https://console.firebase.google.com/project/$TARGET_PROJECT"
echo "  Deployments: docs/ops/deployments/index.html"
echo ""
