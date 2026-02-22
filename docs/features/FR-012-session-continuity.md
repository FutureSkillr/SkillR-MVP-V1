# FR-012: Session Continuity

**Status:** draft
**Priority:** must
**Created:** 2026-02-17

## Scope
When a user returns to the app, their journey resumes exactly where they left off. Dialogue history, journey position, VUCA bingo progress, and profile state are all persisted and restored. There is no "start over" — every visit builds on the last. The travel journal accumulates across sessions.

## Intent
The skill profile is a long-term artifact. If progress is lost, trust is lost. Continuity also enables the core promise: a profile that grows over time. Without persistence, the journey is a toy; with it, it becomes a tool.

## Dependencies
- FR-003 (Firebase — state persistence)
- FR-007 (VUCA bingo matrix — progress tracking)
- FR-008 (Skill profile — incremental updates)
