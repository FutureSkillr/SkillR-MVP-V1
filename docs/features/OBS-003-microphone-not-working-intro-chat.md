# OBS-003: Microphone not working in intro chat (Vorstellungsrunde)

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem

Clicking the microphone button in the Vorstellungsrunde (intro chat) does nothing visible. Recording may start/stop, but speech is never transcribed and no text appears in the input field. The same issue affects all chat screens that use `ChatInput` with voice input (onboarding, VUCA stations, etc.).

TTS (coach voice output) is likely broken for the same reason.

## Root Cause

After FR-051 removed secrets from the JS bundle (`vite.config.ts:65-67`, `define: {}`), the client-side Gemini API key is no longer available in the browser.

**Call chain that fails:**

1. User clicks mic → `useSpeechRecognition.ts:22` → `toggle()` → records audio via MediaRecorder
2. User clicks mic again → recording stops → `onstop` handler at line 49
3. Audio converted to WAV base64 → `geminiService.speechToText(wavBase64)` called (line 62)
4. `speechToText()` calls `getAI()` (`gemini.ts:8-14`)
5. `getAI()` reads `(globalThis as any).process?.env?.API_KEY` → evaluates to `''`
6. Throws: `'Gemini API key not configured. AI features are unavailable.'`
7. Error caught silently at `useSpeechRecognition.ts:66-67` → `console.error()` only
8. User sees nothing — no error message, no transcript

**Why text chat works but voice doesn't:**

| Feature | Route | API Key Location | Status |
|---------|-------|------------------|--------|
| Text chat | `backendChatService` → `/api/v1/ai/chat` (Go) | Server-side env var | Works |
| Speech-to-text | `geminiService.speechToText()` → Google AI SDK | Client-side `globalThis` | Broken |
| Text-to-speech | `geminiService.textToSpeech()` → Google AI SDK | Client-side `globalThis` | Broken |

## Fix Options

### Option A: Route STT/TTS through Go backend (Recommended)

Add two new backend endpoints that mirror the client-side calls:

- `POST /api/v1/ai/speech-to-text` — accepts base64 WAV, returns transcript
- `POST /api/v1/ai/text-to-speech` — accepts text + dialect, returns base64 PCM audio

Update `useSpeechRecognition.ts` and `useSpeechSynthesis.ts` to call these endpoints instead of the client-side `geminiService`. This keeps the API key server-side (consistent with FR-051) and matches the pattern already used by text chat.

### Option B: Inject API key at runtime via /api/config

Extend the `/api/config` endpoint to return the Gemini API key, and populate `globalThis.process.env.API_KEY` in `App.tsx` on load. This re-exposes the API key to the browser (visible in DevTools network tab), which contradicts the FR-051 intent.

## Affected Files

- `frontend/hooks/useSpeechRecognition.ts` — STT call on line 62
- `frontend/hooks/useSpeechSynthesis.ts` — TTS calls
- `frontend/services/gemini.ts` — `getAI()` on lines 8-14, `speechToText()`, `textToSpeech()`
- `frontend/components/shared/ChatInput.tsx` — mic button (no change needed, just context)

## Affected Screens

- Vorstellungsrunde (IntroChat.tsx)
- Onboarding chat (OnboardingChat.tsx)
- VUCA Station, Entrepreneur Station, Self-Learning Station
- Any component using `ChatInput` with voice or `useSpeechSynthesis`

## Dependencies

- FR-010 (AI Coach Voice Interaction)
- FR-011 (Text and Voice Mode Switching)
- FR-051 (Runtime config, no secrets in bundle)

## Acceptance Criteria

- [ ] Microphone button records audio and produces a transcript in the input field
- [ ] TTS coach voice plays after assistant messages
- [ ] Gemini API key is NOT exposed in the frontend JS bundle or network requests to external APIs
- [ ] Error states show user-visible feedback (not just console.error)

## Notes

- The mic button renders correctly (isSupported check passes) — the issue is purely at the API call layer.
- The `useGeminiChat` hook already has a `formatError()` function that shows German-language error messages. A similar pattern should be adopted for STT/TTS errors.
- Secondary issue: `useSpeechRecognition.ts:66-67` swallows errors silently. Even before fixing the API key issue, the hook should surface errors to the user (e.g., via an `onError` callback).
