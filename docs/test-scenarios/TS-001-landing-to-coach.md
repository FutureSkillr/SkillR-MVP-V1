# TS-001: Landing to Coach Select

**Status:** active
**Stakeholder:** Student
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Purpose
Validates that a new visitor can load the landing page, verify backend health, retrieve configuration, and re-check health as a keep-alive probe before selecting a coach.

## FR Coverage
- FR-054: Intro Sequence — landing page loads and presents coach selection
- FR-068: Health Check — backend responds to health probe

## Scenario Steps
1. GET `/api/health` → 200 with `status` field (backend alive check)
2. User reads landing page (think time)
3. GET `/api/config` → 200 with Firebase configuration present
4. GET `/api/health` → 200 (background keep-alive re-check)
5. User browses coaches and selects one (think time)

## Configuration
| Parameter | Value |
|-----------|-------|
| VUs | 10 |
| Duration | 1m |

## Thresholds
| Metric | Threshold |
|--------|-----------|
| p(95) | < 200ms |
| Error rate | < 1% |

## Run
```bash
make k6-student  # or: k6 run --env BASE_URL=http://localhost:9090 k6/scenarios/student/ts-001-landing-to-coach.js
```

## Dependencies
- Requires: `make local-up` running
