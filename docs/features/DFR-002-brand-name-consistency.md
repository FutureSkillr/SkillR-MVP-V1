# DFR-002: Brand Name Consistency — "Future SkillR"

**Status:** done
**Priority:** must
**Created:** 2026-02-22

## Problem
The codebase uses "Future Skiller" (lowercase 'r') inconsistently. The correct brand name is "Future SkillR" (capital R). This appears in frontend components, HTML landing pages, backend log messages, config files, and documentation.

## Solution
Rename all occurrences of "Future Skiller" to "Future SkillR" across:
- Frontend source files (TSX/TS components, AI prompts)
- HTML files (index.html, landing pages, ops deployment pages)
- Backend source (Go log messages)
- Config files (Makefile, .env.example)
- Documentation (README.md, all concept/feature/arch docs)

## Acceptance Criteria
- [x] `grep -r "Future Skiller" frontend/` returns 0 results
- [x] `grep -r "Future Skiller" backend/` returns 0 results
- [x] `grep -r "Future Skiller" docs/` returns 0 results
- [x] `grep -r "Future Skiller" concepts/` returns 0 results
- [x] Page title reads "Future SkillR - Bist Du ein SkillR?"
- [x] PWA manifest name is "Future SkillR"

## Dependencies
- DFR-001 (icon integration — title tag shared update)

## Notes
Infrastructure slugs like `future-skillr` (hyphenated lowercase) are already correct and not in scope for this change.
