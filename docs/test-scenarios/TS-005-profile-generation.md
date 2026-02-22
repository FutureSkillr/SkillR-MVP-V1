# TS-005: Profile Generation Pipeline

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates the complete profile generation pipeline: extract insights from chat history, generate a curriculum, and generate a course. Uses the Go backend's `/api/v1/ai/extract` and `/api/v1/ai/generate` endpoints.

## FR Coverage
- FR-008: Skill Profile Generation — end-to-end profile pipeline
- FR-005: Gemini Dialogue — AI processes conversation history for insights

## Scenario Steps
1. Register + login via `registerAndLogin(email, displayName, password)` → obtain auth token
2. POST `/api/v1/ai/extract` with `extractRequestBody(chatHistory(6))` → 200 with insights
   - Body: `{messages, context: {extract_type: 'interests'}}`
   - Response: `{result: {interests: [...]}, prompt_id, prompt_version}`
3. POST `/api/v1/ai/generate` with `generateCurriculumBody(goal)` → 200 with curriculum
   - Body: `{parameters: {goal}, context: {generate_type: 'curriculum'}}`
   - Response: `{result: {modules: [...]}, prompt_id, prompt_version}`
4. POST `/api/v1/ai/generate` with `generateCourseBody(goal, module)` → 200 with course
   - Body: `{parameters: {goal, module}, context: {generate_type: 'course'}}`
   - Response: `{result: {sections: [...]}, prompt_id, prompt_version}`

## Response Shape
All AI pipeline responses follow the pattern:
```json
{
  "result": { ... },
  "prompt_id": "...",
  "prompt_version": "..."
}
```

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 2 |
| Duration | 3m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms (mock) or < 10s (live) |
| Error rate | < 1% (mock) or < 10% (live) |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-005-profile-generation.js
```

## Dependencies
- Requires: `make local-up` running
- Env: `K6_LIVE_AI=true` for real Gemini via Go backend
