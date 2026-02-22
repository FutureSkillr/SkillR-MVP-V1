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
  echo "[entrypoint] Waiting for CSS to start..."
  for i in $(seq 1 30); do
    if wget -q -O /dev/null "http://localhost:${CSS_PORT:-3000}/.well-known/openid-configuration" 2>/dev/null; then
      echo "[entrypoint] CSS is ready."
      break
    fi
    if [ "$i" = "30" ]; then
      echo "[entrypoint] WARNING: CSS did not start in 30s, continuing anyway."
    fi
    sleep 1
  done

  # Seed admin account
  /app/seed-pod.sh || echo "[entrypoint] WARNING: Pod seeding failed (may already exist)."
fi

# Start Go server (foreground)
exec /app/server
