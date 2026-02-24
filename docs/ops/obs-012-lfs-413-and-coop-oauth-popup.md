# OBS-012: LFS Upload 413 and COOP Blocks Google OAuth Popup

**Status:** open
**Severity:** high
**Created:** 2026-02-24
**Updated:** 2026-02-24
**Component:** Backend server middleware (FR-131, FR-059)

## Symptom

Two issues observed in the browser console after FR-131 deployment:

### 1. LFS Upload returns 413 Request Entity Too Large

```
POST http://localhost:9090/api/lfs/produce 413 (Request Entity Too Large)
```

The conditional body limit middleware (FR-131) uses `c.Path()` to detect the LFS route, but Echo's `c.Path()` returns the **registered route pattern** which is only set **after** route matching. Global middleware runs before route matching, so `c.Path()` is always empty — the 500M limit never activates and the default 10M limit applies to all requests including LFS uploads.

### 2. Cross-Origin-Opener-Policy blocks Firebase Google OAuth popup

```
Cross-Origin-Opener-Policy policy would block the window.closed call.
Cross-Origin-Opener-Policy policy would block the window.close call.
```

Firebase Auth's `signInWithPopup` opens a Google OAuth window. After authentication, Firebase tries to poll `window.closed` and call `window.close()` on the popup. The browser's default COOP policy (`same-origin`) blocks cross-origin popup communication, preventing the OAuth flow from completing cleanly.

### Non-issues (browser extensions)

- `SES Removing unpermitted intrinsics` — from `lockdown-install.js`, a SES lockdown by a browser extension (e.g. MetaMask). Not our code.
- `A listener indicated an asynchronous response by returning true, but the message channel closed` — Chrome extension messaging error. Not our code.

## Root Causes

### 1. `c.Path()` vs `c.Request().URL.Path` in global middleware

In `server.go:53`, the body limit middleware uses `c.Path()` which is empty in global middleware. Must use `c.Request().URL.Path` instead.

**Fix:** Replace `c.Path()` with `c.Request().URL.Path` in the body limit middleware.

### 2. Missing COOP header for OAuth popup compatibility

The security headers middleware (FR-059) does not set `Cross-Origin-Opener-Policy`. The browser default of `same-origin` blocks cross-origin popup communication needed by Firebase Auth popup flow.

**Fix:** Add `Cross-Origin-Opener-Policy: same-origin-allow-popups` to the security headers. This allows popups (like Google OAuth) to communicate back while still protecting against other cross-origin opener attacks.

## Betroffene Dateien

| File | Role |
|------|------|
| `backend/internal/server/server.go` | Body limit middleware (line 53) and security headers (line 60) |
| `frontend/services/firebaseAuth.ts` | Firebase Auth popup flow (affected by COOP) |
| `frontend/services/lfsUpload.ts` | LFS upload XHR (receives 413) |

## Fixes Applied

1. **server.go:53** — Changed `c.Path()` to `c.Request().URL.Path` so body limit detects LFS route in global middleware
2. **server.go:60** — Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` header to allow Firebase OAuth popup communication

## Verwandte Dokumente

- FR-131: Video Upload via LFS-Proxy in Content Pack Editor
- FR-059: Security Headers
- FR-056: Firebase Authentication

## Verification

1. Upload a video file > 10M via Content Pack Editor → should no longer return 413
2. Sign in with Google OAuth popup → popup should close cleanly without COOP errors in console
3. Normal API requests should still be limited to 10M body size
