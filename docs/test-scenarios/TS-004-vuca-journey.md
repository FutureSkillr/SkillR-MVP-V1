# TS-004: Authenticated VUCA Journey

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates authenticated dialogue across VUCA dimensions via the Go backend's `/api/v1/ai/chat` endpoint. Sends 5 messages with growing history, using `chatRequestBody()` for request composition and `authHeaders()` for authentication.

## FR Coverage
- FR-005: Gemini Dialogue — AI responds to student messages with auth context
- FR-058: Input Validation — message content is validated
- FR-060: Rate Limiting — requests are rate-limited per user

## Scenario Steps
1. Register + login via `registerAndLogin(email, displayName, password)` → obtain auth token
2. Build `authHeaders(token)` for authenticated requests
3. For each of 5 messages:
   a. Compose body via `chatRequestBody(message, history)`
   b. POST `/api/v1/ai/chat` with auth headers → 200 with AI response (or use mock)
   c. Append user `{role: 'user', content}` and AI `{role: 'model', content}` to history
4. Verify all responses are non-empty
5. Verify no credential leaks or stack traces in any response

## Request Format
- **Endpoint:** POST `/api/v1/ai/chat`
- **Body:** `{message, history, system_instruction}`
- **Auth:** Bearer token via `authHeaders(token)`
- **History format:** `[{role, content}]` (Go backend format)
- **Mock mode:** Skips real API call, uses canned responses

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 3 |
| Duration | 5m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms (mock) or < 8s (live) |
| Error rate | < 1% (mock) or < 10% (live) |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-004-vuca-journey.js
```

## Dependencies
- Requires: `make local-up` running
- Env: `K6_LIVE_AI=true` for real Gemini via Go backend
