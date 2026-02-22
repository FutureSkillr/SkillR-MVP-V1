# TS-034: Input Validation

**Status:** active
**Stakeholder:** Security
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates that the Go backend AI handler properly rejects malformed, oversized, and malicious input on `/api/v1/ai/chat`. Tests message size limits, empty messages, invalid history roles, oversized system instructions, and XSS payloads.

## FR Coverage
- FR-058: Input Validation — server-side validation for message size limits, role validation, system instruction limits, and XSS prevention

## Scenario Steps
1. POST `/api/v1/ai/chat` with message > 10,000 characters → 400 Bad Request
2. Verify response indicates message too long, no info leaked
3. POST `/api/v1/ai/chat` with empty message (`""`) → 400 Bad Request
4. Verify response indicates message required, no info leaked
5. POST `/api/v1/ai/chat` with invalid role in history (`"hacker"` instead of `"user"` or `"model"`) → 400 (or handler skips gracefully)
6. Verify no internal information leaked in response
7. POST `/api/v1/ai/chat` with system_instruction > 5,000 characters → 400 (or passes through to AI)
8. Verify no internal information leaked in response
9. POST `/api/v1/ai/chat` with `<script>alert("XSS")</script>` in message field → verify XSS payload is NOT reflected in response body
10. POST `/api/v1/ai/chat` with `<img src=x onerror=alert(1)>` in history content → verify XSS payload is NOT reflected in response body

## Request Body Format
```json
{
  "message": "string (required, max 10000 chars)",
  "history": [{"role": "user|model", "content": "string"}],
  "system_instruction": "string (optional, max 5000 chars)"
}
```

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 1 |
| Duration | 30s |
| Iterations | 1 |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| Checks | > 99% |

## Run
```bash
make k6-security  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/security/ts-034-input-validation.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `BASE_URL`

## Notes
- The Go backend validates: message required (non-empty), message max 10000 chars, role must be "user" or "model", system_instruction max 5000 chars.
- The `coachId` and `stationId` fields do not exist in the Go backend request body.
- For invalid role and oversized system_instruction, the handler may return 400 strictly or may handle gracefully (skip/pass through). The test checks both outcomes.
