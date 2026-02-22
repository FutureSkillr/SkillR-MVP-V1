# FR-017: Job Portal Data Service (Backend)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Scope
Backend service in Go that fetches, normalizes, and caches job data from German job portal APIs (e.g., Bundesagentur fuer Arbeit). Provides an API for the Job-Navigator to query jobs by interest category, find related jobs, and perform Gegensatzsuche (find contrasting job categories). Returns structured job records: title, description, required skills, industry sector.

## Intent
The Moeglichkeitsraum must be grounded in real jobs that actually exist in the market. Without real data, job suggestions are guesswork. This service ensures every job idea the student sees corresponds to an actual career path with real demand.

## Dependencies
- TC-003 (Job portal data integration)
- BC-002 (Job-Navigator)
- US-003 (Job-Navigator and Moeglichkeitsraum)
- DC-002 (Gegensatzsuche)
