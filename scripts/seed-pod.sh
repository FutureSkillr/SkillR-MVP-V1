#!/bin/sh
# seed-pod.sh — Create admin account on Community Solid Server v7
# Uses CSS v7 Account API v0.5:
#   1. POST /.account/account/           → create account, get token
#   2. GET  /.account/ (with token)      → get account-specific control URLs
#   3. POST controls.password.create     → register email/password
#   4. POST controls.account.pod         → create pod
set -e

CSS_URL="${SOLID_POD_URL:-http://localhost:3000}"
ADMIN_EMAIL="${SOLID_POD_ADMIN_EMAIL:-admin@skillr.local}"
ADMIN_PASSWORD="${SOLID_POD_ADMIN_PASSWORD:-skillr}"
ADMIN_POD_NAME="admin"

# json_get <field> — extract a field from JSON on stdin using node
json_get() {
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const o=JSON.parse(d);const v=$1;if(v)process.stdout.write(String(v));else process.exit(1)}catch(e){process.exit(1)}})"
}

echo "[seed-pod] Creating admin account on ${CSS_URL}..."

# Step 1: Create account
ACCOUNT_RESP=$(wget -q -O - --post-data '' "${CSS_URL}/.account/account/" 2>/dev/null) || {
  echo "[seed-pod] Failed to create account (may already exist)."
  exit 0
}

TOKEN=$(echo "$ACCOUNT_RESP" | json_get 'o.authorization')
if [ -z "$TOKEN" ]; then
  echo "[seed-pod] No authorization token — account may already exist."
  exit 0
fi
echo "[seed-pod] Account created, token obtained."

# Step 2: Get account-specific control URLs
CONTROLS=$(wget -q -O - --header="Authorization: CSS-Account-Token ${TOKEN}" "${CSS_URL}/.account/" 2>/dev/null) || {
  echo "[seed-pod] Failed to get account controls."
  exit 1
}

PASSWORD_URL=$(echo "$CONTROLS" | json_get 'o.controls.password.create')
POD_URL=$(echo "$CONTROLS" | json_get 'o.controls.account.pod')

if [ -z "$PASSWORD_URL" ] || [ -z "$POD_URL" ]; then
  echo "[seed-pod] Could not extract control URLs."
  exit 1
fi

# Step 3: Register password credentials
wget -q -O /dev/null \
  --header="Authorization: CSS-Account-Token ${TOKEN}" \
  --header="Content-Type: application/json" \
  --post-data "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  "${PASSWORD_URL}" 2>/dev/null || {
  echo "[seed-pod] Failed to set credentials (may already exist)."
}

# Step 4: Create Pod
wget -q -O /dev/null \
  --header="Authorization: CSS-Account-Token ${TOKEN}" \
  --header="Content-Type: application/json" \
  --post-data "{\"name\":\"${ADMIN_POD_NAME}\"}" \
  "${POD_URL}" 2>/dev/null || {
  echo "[seed-pod] Failed to create pod (may already exist)."
}

echo "[seed-pod] Admin account created: ${ADMIN_EMAIL} / pod: ${ADMIN_POD_NAME}"
echo "[seed-pod] Pod URL: ${CSS_URL}/${ADMIN_POD_NAME}/"
