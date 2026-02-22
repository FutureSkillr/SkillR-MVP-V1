# TS-008: Full Student Lifecycle

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
End-to-end composite validating the complete student journey from landing to profile generation, using the Go backend exclusively. Covers the happy path from anonymous visitor to fully-profiled student across 5 phases.

## FR Coverage
- FR-054: Intro Sequence — landing and intro chat
- FR-005: Gemini Dialogue — AI chat across journey
- FR-008: Skill Profile Generation — profile pipeline
- FR-056: Auth & Sessions — registration and login

## Scenario Steps

### Phase 1: Landing (health + config)
1. GET `/api/health` → 200 with `status` field
2. GET `/api/config` → 200 with Firebase configuration

### Phase 2: Intro Chat (3 messages via AI)
3. For each of 3 messages:
   a. Compose body via `chatRequestBody(message, history)`
   b. POST `/api/v1/ai/chat` → 200 with AI response (or mock)
   c. Append user + model messages to history `[{role, content}]`

### Phase 3: Registration
4. Register + login via `registerAndLogin(email, displayName, password)`:
   a. POST `/api/auth/register` with `{email, displayName, password}` → 200/201
   b. POST `/api/auth/login` with `{email, password}` → 200 with auth token

### Phase 4: Profile Generation
5. POST `/api/v1/ai/extract` with `extractRequestBody(chatHistory(6))` + auth → 200
   - Body: `{messages, context: {extract_type: 'interests'}}`
   - Response: `{result: {...}, prompt_id, prompt_version}`
6. POST `/api/v1/ai/generate` with `generateCurriculumBody(goal)` + auth → 200
   - Body: `{parameters: {goal}, context: {generate_type: 'curriculum'}}`
   - Response: `{result: {modules: [...]}, prompt_id, prompt_version}`

### Phase 5: Portfolio (probe and skip)
7. Probe `/api/v1/portfolio/profile` via `routeExists()` → skip if 404
8. If available: POST reflections, GET reflections list
9. If not available: log warning and return (expected in current Go backend)

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 2 |
| Duration | 5m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 2s overall |
| Error rate | < 5% |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-008-full-student-journey.js
```

## Dependencies
- Requires: `make local-up` running
- Env: `K6_LIVE_AI=true` for real Gemini via Go backend
