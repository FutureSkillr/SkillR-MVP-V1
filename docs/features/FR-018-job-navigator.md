# FR-018: Job-Navigator Engine (Backend)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Scope
Backend logic in Go that implements the Job-Navigator. Takes the student's current interest profile and returns a set of job possibilities — both related and contrasting (Gegensatzsuche). Combines data from the job portal service (FR-017), Wikipedia knowledge service (FR-016), and the interest profile (FR-014) to build the student's Moeglichkeitsraum. The navigator explains each job option in student-friendly language and tracks which options the student explores or dismisses.

## Intent
Open the student's eyes to possibilities they didn't know existed. The Job-Navigator is not a career counselor — it is a possibility engine. By including Gegensatzsuche, it actively fights the filter bubble and ensures the Moeglichkeitsraum is broader than the student's initial assumptions.

## Dependencies
- FR-014 (Interest profile tracking)
- FR-016 (Wikipedia knowledge service)
- FR-017 (Job portal data service)
- BC-002 (Job-Navigator concept)
- DC-002 (Gegensatzsuche)
- DC-003 (Moeglichkeitsraum)
