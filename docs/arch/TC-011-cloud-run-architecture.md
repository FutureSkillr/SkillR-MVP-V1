# TC-011: Cloud Run Deployment Architecture

**Status:** accepted
**Created:** 2026-02-18

## Context
The frontend needs to be deployed as a containerized web application on Google Cloud Run. The build must inject the GEMINI_API_KEY at build time (since Vite embeds env vars into the JS bundle), and the runtime must serve static files efficiently with proper caching and SPA routing.

## Decision
Multi-stage Docker build with nginx as the runtime server:

1. **Build stage** (node:20-alpine): Runs `npm ci` + `npm run build`. The GEMINI_API_KEY is passed as a Docker build arg and written to `.env.local` so Vite's `loadEnv` picks it up.

2. **Serve stage** (nginx:1.25-alpine): Copies the `dist/` output and serves it with:
   - `$PORT` injection via `envsubst` (Cloud Run sets PORT=8080)
   - SPA fallback via `try_files`
   - Gzip compression for text/js/css/wasm
   - Immutable cache (1y) for `/assets/` and `.wasm` files
   - No-cache for `index.html`
   - `/_health` endpoint for Cloud Run liveness probes
   - Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

## Consequences
- **Pro:** Minimal image size (~25MB), fast cold starts on Cloud Run
- **Pro:** GEMINI_API_KEY is baked into the JS bundle at build time, not exposed at runtime
- **Pro:** nginx handles SPA routing, caching, and compression without application code
- **Con:** API key changes require a rebuild and redeploy (acceptable for this project)
- **Con:** No SSR — the app is fully client-side rendered

## Alternatives Considered
1. **Node.js serve** — Larger image, slower cold starts, unnecessary runtime overhead for static files
2. **Cloud Storage + CDN** — No SPA routing support without Cloud Functions rewrite rules
3. **Firebase Hosting** — Good option but doesn't align with the Cloud Run infrastructure already in use
