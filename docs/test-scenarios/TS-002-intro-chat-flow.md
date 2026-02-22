# TS-002: Intro Chat Flow (5 Questions)

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates pre-auth 5-question intro chat using the Go backend's `/api/v1/ai/chat` endpoint, testing growing message history and AI response quality. In mock mode (default), canned responses are used without making real API calls.

## FR Coverage
- FR-054: Intro Sequence — pre-auth chat flow with 5 questions
- FR-005: Gemini Dialogue — AI responds to student messages
- FR-058: Input Validation — message content is validated
- FR-060: Rate Limiting — requests are rate-limited per user

## Scenario Steps
1. Build german message list for the 5-question intro
2. For each of 5 messages:
   a. Compose request body via `chatRequestBody(message, history)` with `{message, history, system_instruction}`
   b. POST `/api/v1/ai/chat` → 200 with AI response (or use canned mock response)
   c. Append user message `{role: 'user', content}` and AI reply `{role: 'model', content}` to history
3. Verify all 5 responses contain non-empty assistant content
4. Verify no credential leaks or stack traces in responses

## Request Format
- **Endpoint:** POST `/api/v1/ai/chat`
- **Body:** `{message, history, system_instruction}`
- **History format:** `[{role: 'user', content: '...'}, {role: 'model', content: '...'}]`
- **Mock mode:** Skips real API call, uses canned responses via `mockChatResponse()`

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 5 |
| Duration | 3m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms (mock) or < 8s (live) |
| Error rate | < 1% (mock) or < 10% (live) |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-002-intro-chat-flow.js
```

## Dependencies
- Requires: `make local-up` running
- Env: `K6_LIVE_AI=true` for real Gemini via Go backend
