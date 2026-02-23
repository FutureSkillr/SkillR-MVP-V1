# FR-117: Console Error Cleanup — Unauthenticated API Calls & Direct SDK Usage

**Status:** in-progress
**Priority:** should
**Created:** 2026-02-23

## Problem

The browser console during the VUCA onboarding chat shows three categories of errors that confuse developers and mask real issues:

1. **`POST /api/sessions 405 (Method Not Allowed)`** — `db.ts` fires session-logging calls without auth headers during the unauthenticated intro flow. The backend requires `FirebaseAuthMiddleware`.
2. **`POST /api/prompt-logs 401 (Unauthorized)`** — Same root cause: `insertPromptLog()` sends no Bearer token.
3. **`[TTS] Gemini TTS failed: Gemini API key not configured`** — `useSpeechSynthesis` calls `geminiService.textToSpeech()` which uses the Google AI SDK directly from the browser. No browser-side API key exists; TTS should route through the backend `/api/v1/ai/tts` endpoint.

## Solution

### Fix 1: `frontend/services/db.ts` — Auth headers + silent degradation
- Import `getAuthHeaders()` from `auth.ts`
- All fetch calls include auth headers when a token exists
- Write operations (`insertSession`, `endSession`, `insertPromptLog`) skip entirely when no token is available (unauthenticated intro flow)
- Wrap write operations in try/catch to suppress network errors

### Fix 2: `frontend/services/gemini.ts` + `frontend/hooks/useSpeechSynthesis.ts` — Backend TTS
- Add `backendChatService.textToSpeech()` that calls `/api/v1/ai/tts`
- `useSpeechSynthesis` hook uses `backendChatService.textToSpeech()` instead of `geminiService.textToSpeech()`
- Browser `speechSynthesis` fallback remains for when the backend is unreachable

## Acceptance Criteria
- [ ] No 405 errors for `/api/sessions` during unauthenticated flows
- [ ] No 401 errors for `/api/prompt-logs` during unauthenticated flows
- [ ] TTS routes through backend; no "API key not configured" errors
- [ ] Browser speechSynthesis fallback still works when backend TTS fails
- [ ] Logged-in users still get session/prompt-log tracking

## Dependencies
- Backend `/api/v1/ai/tts` endpoint (already exists)
- Backend `/api/sessions` route registration (requires `deps.Session != nil` — 405 may indicate the Session handler is not initialized in local dev)

## Notes
- The `ajaxRequestInterceptor.ps.js` in stack traces is a browser extension interceptor, not our code.
- `SES Removing unpermitted intrinsics` is from a MetaMask-style browser extension (Secure EcmaScript), not our app.
