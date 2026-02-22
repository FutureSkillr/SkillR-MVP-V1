# FR-055: Local Development TLS/HTTPS Support

**Status:** done
**Priority:** must
**Created:** 2026-02-19
**Entity:** SkillR

## Problem

The Web Speech API (`navigator.mediaDevices.getUserMedia`) requires a secure context (HTTPS) to access the microphone. In local development, the servers run on HTTP by default, which means voice input features do not work during development and testing.

## Solution

Add automatic TLS/HTTPS support to both the Vite dev server and the Express API gateway when local certificates are available.

### Components

1. **Certificate generation script** (`scripts/generate-dev-cert.sh`)
   - Prefers `mkcert` (adds to system trust store, no browser warnings)
   - Falls back to `openssl` (self-signed, browser will warn)
   - Outputs to `.certs/localhost-key.pem` and `.certs/localhost.pem`

2. **Vite dev server** (`frontend/vite.config.ts`)
   - `loadDevCerts()` helper checks for certs in `../.certs/`
   - When found: enables HTTPS on port 3000
   - Proxy target switches to `https://localhost:3001` with `secure: false`

3. **Express API gateway** (`frontend/server/index.ts`)
   - Checks for certs in `../../.certs/` at startup
   - When found: uses `https.createServer()` instead of `app.listen()`
   - Logs TLS status and hint to generate certs if missing

4. **`.gitignore`** — `.certs/` directory excluded from version control

### Usage

```bash
# One-time setup
./scripts/generate-dev-cert.sh

# Then start dev servers as usual
npm run dev:all
# Both servers now use HTTPS automatically
```

## Acceptance Criteria

- [x] `scripts/generate-dev-cert.sh` generates valid TLS certificates
- [x] Vite dev server serves on HTTPS when certs exist
- [x] Express API gateway serves on HTTPS when certs exist
- [x] Proxy from Vite to Express works over HTTPS
- [x] `getUserMedia` (microphone) works in the browser
- [x] `.certs/` is git-ignored
- [x] Servers fall back to HTTP gracefully when no certs are present
- [x] Console output indicates TLS status clearly

## Dependencies

- FR-054: Intro Sequence (voice input in pre-login chat)
- FR-032: Transit Audio Mode (TTS requires secure context for some browsers)

## Notes

- `mkcert` is recommended for the best developer experience (no browser warnings): `brew install mkcert`
- Self-signed certificates from `openssl` will trigger browser warnings — click "Advanced" → "Proceed" to continue
- Certificates are valid for `localhost`, `127.0.0.1`, and `::1`
