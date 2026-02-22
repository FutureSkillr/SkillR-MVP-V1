# FR-045: Meta Kurs Editor (Prompt & Journey Manager)

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-18

## Problem
All AI prompts, journey definitions, and station configurations are hardcoded in TypeScript constants. To iterate on content, educators and admins currently need developer access and code changes.

## Solution
Build a Meta Kurs Editor within the Admin Console that allows editing:
1. **System Prompts**: Edit the AI system prompts for onboarding, VUCA station, entrepreneur station, and self-learning station
2. **Journey Definitions**: Edit journey metadata (title, subtitle, description, icon, dimensions) and add new journeys from templates
3. **Station Definitions**: Edit station metadata (title, description, setting, character)

All edits are stored as overrides in localStorage. A content resolver layer checks for overrides before falling back to hardcoded defaults.

## Acceptance Criteria
- [ ] Admin can edit all 4 system prompts (onboarding, VUCA, entrepreneur, self-learning)
- [ ] Edited prompts are used when starting new journeys
- [ ] Admin can edit journey titles, subtitles, descriptions, and icons
- [ ] Admin can add new journeys via "Add Journey" button
- [ ] Admin can edit station titles, descriptions, settings, and characters
- [ ] "Reset to Default" restores original hardcoded values per section
- [ ] "Reset All" restores all sections at once
- [ ] Export/Import JSON for backup and sharing configurations
- [ ] Changes persist across browser sessions (localStorage)

## Dependencies
- FR-043 (Admin Panel)

## Notes
The content resolver pattern (`getPrompts()`, `getJourneys()`, `getStations()`) allows seamless migration to a server-side storage later. Components call resolver functions instead of importing constants directly.
