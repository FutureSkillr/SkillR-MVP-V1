# FR-052: Docker Compose Local Staging

**Status:** done
**Priority:** must
**Gate:** env:all
**Created:** 2026-02-19
**Entity:** SkillR

## Problem

There is no way to test the full production stack locally. The current development workflow uses `npm run dev` (Vite dev server), which differs significantly from the production setup:

- Dev server uses Vite's HMR and dev middleware; production uses compiled static files + Express
- Dev server does not run the API gateway (FR-051) in production mode
- Environment variables are handled differently (`.env` files vs. Cloud Run runtime vars)
- The Dockerfile is only tested during `make deploy` — issues are caught late

Developers need a "production-like" local environment that mirrors exactly what Cloud Run runs, so gateway routes, Firebase config injection, and static serving can be verified before deploying.

## Solution

A `docker-compose.yml` at the project root that builds and runs the same `Dockerfile` used for Cloud Run, injecting environment variables from a local `.env` file.

### docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "9090:8080"
    env_file: .env.local
    environment:
      - PORT=8080
```

### Environment File

`.env.local` (gitignored) contains all gateway env vars:

```bash
GEMINI_API_KEY=AIza...
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

A `.env.example` (committed) documents the required variables without values.

### Makefile Target

```makefile
local-stage:
	docker compose up --build
```

### What This Validates

| Concern | Dev Server | Local Staging |
|---------|-----------|---------------|
| Static file serving | Vite HMR | `express.static` (production) |
| API gateway routes | Not running | Full `/api/*` gateway |
| Firebase config | Hardcoded in source | Injected via `/api/config` |
| Dockerfile correctness | Not tested | Built and running |
| Environment variables | `.env` via Vite | `.env.local` via Docker |
| Port binding | 5173 (Vite default) | 9090 host → 8080 container |

## Acceptance Criteria

- [ ] `docker-compose.yml` exists at project root
- [ ] `make local-stage` builds and starts the container
- [ ] App is accessible at `http://localhost:9090`
- [ ] All `/api/gemini/*` proxy routes work through the container
- [ ] `GET /api/config` returns Firebase config from env vars
- [ ] `GET /api/health` returns 200
- [ ] `.env.example` documents all required variables
- [ ] `.env.local` is in `.gitignore`
- [ ] Container uses the same `Dockerfile` as Cloud Run deployment
- [ ] `docker compose down` cleanly stops the container

## Dependencies

- FR-051: Secure API Gateway (the gateway being tested)
- FR-040: Docker & Cloud Run (the Dockerfile being reused)
- TC-016: Secure API Gateway Architecture (architecture decision)

## Notes

- This is intentionally simple — a single service, no sidecar containers, no local Firebase emulator (yet).
- The Firebase emulator suite could be added as a second service in V1.0 for offline development.
- Developers still use `npm run dev` for fast iteration on frontend code. `make local-stage` is for integration testing the full stack before deploying.
- This is **MVP3** priority — should be implemented alongside FR-051.
