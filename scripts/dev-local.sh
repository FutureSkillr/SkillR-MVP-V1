#!/usr/bin/env bash
# ┌──────────────────────────────────────────────┐
# │   _____ _    _ _ _ ____                      │
# │  / ____| | _(_) | |  _ \                     │
# │ | (___ | |/ / | | | |_) |                    │
# │  \___ \|   <| | | |  _ <                     │
# │  ____) | |\ \ | | | | \ \                    │
# │ |_____/|_| \_\_|_|_|_|  \_\                  │
# │                                               │
# │  Local Development — All-in-One               │
# └──────────────────────────────────────────────┘
#
# Starts all infrastructure + local processes:
#   1. Docker services: Postgres, Redis, Solid Pod
#   2. Go backend (native process)
#   3. Frontend: Vite dev server (native process)
#
# Usage: make dev-all   (or directly: ./scripts/dev-local.sh)
# Stop:  Ctrl+C — kills all background processes and stops Docker services.
#
set -euo pipefail

cd "$(dirname "$0")/.."

# ─── Colors ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

SERVICES_COMPOSE="docker compose -f docker-compose.services.yml"

# ─── Cleanup on exit ─────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo -e "${CYAN}Shutting down...${RESET}"

  # Kill background processes
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && echo -e "  ${DIM}Stopped Go backend${RESET}"
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && echo -e "  ${DIM}Stopped frontend${RESET}"

  # Stop Docker services
  $SERVICES_COMPOSE down >/dev/null 2>&1 && echo -e "  ${DIM}Stopped Docker services${RESET}"

  echo -e "${GREEN}Done.${RESET}"
}
trap cleanup EXIT INT TERM

# ─── Step 1: Start Docker services ───────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}[1/4] Starting Docker services (Postgres, Redis, Solid Pod)${RESET}"
$SERVICES_COMPOSE up -d

echo -e "${DIM}  Waiting for Postgres...${RESET}"
until $SERVICES_COMPOSE exec -T postgres pg_isready -U skillr >/dev/null 2>&1; do
  sleep 1
done
echo -e "  ${GREEN}PostgreSQL${RESET}  localhost:5432"
echo -e "  ${GREEN}Redis${RESET}       localhost:6379"
echo -e "  ${GREEN}Solid Pod${RESET}   localhost:3003"

# ─── Step 2: Install frontend deps (if needed) ───────────────────────
echo ""
echo -e "${BOLD}${CYAN}[2/4] Checking frontend dependencies${RESET}"
if [ ! -d frontend/node_modules ]; then
  echo -e "  ${DIM}Installing npm packages...${RESET}"
  (cd frontend && npm install)
else
  echo -e "  ${DIM}node_modules exists — skipping install${RESET}"
fi

# ─── Step 3: Start Go backend ────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}[3/4] Starting Go backend${RESET}"
(cd backend && go run ./cmd/server) &
BACKEND_PID=$!
echo -e "  ${GREEN}Go backend${RESET} PID=$BACKEND_PID (port 8080)"

# Give the backend a moment to start before the frontend proxy needs it
sleep 2

# ─── Step 4: Start frontend ──────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}[4/4] Starting frontend (Vite)${RESET}"
(cd frontend && npm run dev) &
FRONTEND_PID=$!
echo -e "  ${GREEN}Vite${RESET}        localhost:3000 (HMR)"

# ─── Running ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}All services running. Press Ctrl+C to stop.${RESET}"
echo -e "${DIM}  Frontend:  http://localhost:3000"
echo -e "  Backend:   http://localhost:8080"
echo -e "  Postgres:  localhost:5432"
echo -e "  Redis:     localhost:6379"
echo -e "  Solid Pod: localhost:3003${RESET}"
echo ""

# Wait for any background process to exit
wait
