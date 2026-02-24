#!/bin/sh
set -e

# Start CSS in background if SOLID_POD_ENABLED is true
if [ "${SOLID_POD_ENABLED}" = "true" ]; then
  echo "[entrypoint] Starting Community Solid Server on port ${CSS_PORT:-3000}..."
  community-solid-server \
    --config /app/solid-config/css-config.json \
    --rootFilePath /app/pod-data \
    --port "${CSS_PORT:-3000}" \
    --baseUrl "${SOLID_POD_URL:-http://localhost:3000}" &
  CSS_PID=$!

  # Wait for CSS to be ready (max 30s)
  # FR-127: If CSS fails to start, continue anyway — the Pod readiness gate
  # will return available=false and the frontend hides the Pod panel.
  echo "[entrypoint] Waiting for CSS to start..."
  CSS_READY=false
  for i in $(seq 1 30); do
    if wget -q -O /dev/null "http://localhost:${CSS_PORT:-3000}/.well-known/openid-configuration" 2>/dev/null; then
      echo "[entrypoint] CSS is ready."
      CSS_READY=true
      break
    fi
    sleep 1
  done

  if [ "$CSS_READY" = "true" ]; then
    # Seed admin account
    /app/seed-pod.sh || echo "[entrypoint] WARNING: Pod seeding failed (may already exist)."
  else
    echo "[entrypoint] WARNING: CSS did not start in 30s — Pod features will be unavailable (FR-127 gate)."
    # Kill the hung CSS process if still running
    kill "$CSS_PID" 2>/dev/null || true
  fi
fi

# Start Go server (foreground)
exec /app/server
