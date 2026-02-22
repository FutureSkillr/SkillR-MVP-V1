# FR-058: API Input Validation & AI Prompt Security

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR | maindfull.LEARNING
**Phase:** MVP3+

## Problem

The Gemini proxy allows clients to override the entire `systemInstruction`, enabling prompt injection that can reveal internal logic or generate harmful content. Neither backend nor frontend validates input lengths — a single large message can trigger excessive Vertex AI token consumption (cost attack). User-supplied values (`journeyType`, `stationId`, `goal`, extracted interests) are interpolated directly into AI prompts without sanitization. Raw AI responses are passed to clients without JSON validation.

**Sec-report findings:** H2, H12, M2, M3, M7, M13, M14

## Solution

### Remove client control of system prompts
1. **Server-side prompt registry** — Define allowed system prompts by key (e.g., `"onboarding"`, `"vuca-station"`, `"reflection"`) on the server. Client sends `promptKey` instead of `systemInstruction`.
2. **Reject client-supplied `systemInstruction`** — If the field is present in the request body, ignore it (or return 400).
3. **Validate `history`** — Ensure each message has `role` (one of `"user"`, `"model"`) and `content` (string, max 2000 chars). Reject invalid entries.

### Input length validation
4. **Frontend Express proxy** — Enforce max lengths:
   - `userMessage`: 2,000 characters
   - `chatHistory`: max 50 messages, 1,000 chars each
   - `text` (TTS): 5,000 characters
   - `audioBase64` (STT): 5 MB
5. **Go backend AI handler** — Enforce max lengths:
   - `Message`: 10,000 characters
   - `Text`: 5,000 characters
   - `Audio`: 5 MB base64

### Prompt interpolation sanitization
6. **Validate controlled-vocabulary fields** — `journeyType` must be one of known journey types. `stationId` must match pattern `[a-zA-Z0-9-]+`. Reject unexpected values.
7. **Sanitize free-text fields** — Strip control characters from `goal`, `transcript`, extracted interests before interpolation.
8. **Interests allowlist** — Extracted interests in `introPrompts.ts` should be validated against a vocabulary list or limited to alphanumeric + spaces.

### Output validation
9. **Validate AI JSON** — In `handler.go:179`, call `json.Valid()` before wrapping in `json.RawMessage`. Return structured error if invalid.
10. **Remove `rawText`** from Gemini proxy responses in production.
11. **Suppress error details** in admin prompt test endpoint — Log full error server-side, return generic "test failed" message.

## Acceptance Criteria

- [x] Client cannot override `systemInstruction` — field is ignored or rejected
- [x] `userMessage` longer than 2,000 chars returns 400 from Express proxy
- [x] `chatHistory` with >50 messages returns 400
- [x] `Message` longer than 10,000 chars returns 400 from Go backend
- [x] `journeyType` must be one of known values, else 400
- [x] Invalid JSON from AI model returns structured error, not raw text
- [x] `rawText` is not present in production Gemini proxy responses
- [x] Admin prompt test endpoint does not leak internal error details
- [x] Unit tests for each validation rule

### Pod endpoint validation (MVP4)
12. **ConnectRequest validation** — `provider` must be `"managed"` or `"external"`. `podUrl` must be a valid HTTP/HTTPS URL, max 512 characters. SSRF prevention blocks cloud metadata endpoints (`169.254.169.254`), private RFC 1918 ranges (`10.x`, `172.16-31.x`, `192.168.x`), and `metadata.google.internal`.
13. **SyncRequest validation** — `engagement.totalXP` range 0–1,000,000. `engagement.level` range 0–100. `engagement.streak` range 0–10,000. `engagement.title` max 100 chars. `journeyProgress` max 20 journey types, max 50 dimension scores per type.
14. **Pod handler auth pattern** — Uses `middleware.GetUserInfo(c)` (request context value) consistent with all other v1 handlers. Never returns internal error details to client.

## Dependencies

- FR-051 (API Gateway) — prompt registry lives in the gateway
- FR-076 (Solid Pod Connection) — Pod endpoint validation
- TC-025 (Security Hardening Phase)

## Notes

- The prompt registry can start simple: a `Map<string, string>` loaded from config or DB. The Meta Kurs editor (FR-045) can manage prompts through this registry in V1.0.
- Cost monitoring on the Gemini API should be set up as a complementary control.
