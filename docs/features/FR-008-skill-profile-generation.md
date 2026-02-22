# FR-008: Skill / Interest Profile Generation

**Status:** draft
**Priority:** must
**Created:** 2026-02-17

## Scope
From the accumulated dialogue history and user responses, the system derives a personal interest/skill profile. The profile covers dimensions such as Hard Skills, Soft Skills, Future Skills, and Resilience. Every interaction contributes to a "travel journal" that feeds the profile. The profile is not a career recommendation — it is a self-portrait of interests and emerging competencies. The profile updates incrementally as the journey progresses.

## Intent
The profile is the product. Everything else (journey, dialogue, gamification) exists to produce this artifact. A user should look at their profile and say: "Stimmt, das bin ich." The profile must feel like a mirror, not a label. It is the foundation for all future features (matching, certification, portfolio).

## Dependencies
- FR-003 (Firebase — profile data storage)
- FR-005 (Gemini — profile extraction from dialogue)
- FR-007 (VUCA bingo — journey completion triggers final profile)
