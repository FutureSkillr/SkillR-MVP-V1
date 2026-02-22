# TS-041: Sustained Realistic Load

**Status:** active
**Stakeholder:** Operator
**Created:** 2026-02-21
**Entity:** SkillR

## Purpose
Validates system stability under sustained realistic load with multiple concurrent user archetypes: browsers, chatters, explorers, monitors, and new registrations. Each archetype has its own K6 scenario executor with distinct VU counts and ramp-up profiles.

## FR Coverage
- FR-068: Health Check — continuous monitoring under load
- FR-054: Intro Sequence — config retrieval under concurrency
- FR-005: Gemini Dialogue — AI chat via `/api/v1/ai/chat` under load
- FR-056: Auth & Sessions — registration/login under concurrency
- FR-060: Rate Limiting — rate limiter behavior under sustained traffic

## Scenario Steps
1. **Browsers** (5 VUs, constant): GET `/api/health` → GET `/api/config` → sleep loop
2. **Chatters** (5 VUs, ramping): Register+login → POST `/api/v1/ai/chat` with `chatRequestBody()` loop
3. **Explorers** (5 VUs, constant): Register+login → GET `/api/health` → GET `/api/config` loop (authenticated)
4. **Monitors** (2 VUs, constant): GET `/api/health` every 5s
5. **Registrations** (2 VUs, ramping): Register + login new user each iteration

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 19 total |
| Duration | 10m |
| Ramp | 2m up, 6m sustained, 2m down (chatters); 1m up, 8m sustained, 1m down (registrations) |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 2s |
| Error rate | < 10% |

## Run
```bash
make k6-load  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/load/ts-041-sustained-load.js
```

## Dependencies
- Requires: `make local-up` running
- Env vars: `K6_LIVE_AI=true` for real Gemini (default: mock responses may not be available)

## Notes
- The Go backend does not have `/api/capacity` or `/api/v1/portfolio/*` routes. Explorer flow uses health + config as an authenticated user would during normal navigation.
- Chatter flow sends AI chat requests via `/api/v1/ai/chat` with request body format: `{message, history:[{role,content}], system_instruction}`.
- Registration flow uses `registerUser()` + `loginUser()` helpers to create and authenticate new users each iteration.
- Per-VU state tracks auth tokens so chatters and explorers only register once per VU.
