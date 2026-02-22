# FR-049: Profile Page with Activity History

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem
The current profile view (CombinedProfile) is only reachable after completing a station or from the journey selector. There is no way to open the profile directly from the landing page or main navigation. Additionally, the profile only shows aggregated skill scores — it does not display the user's activity history (inputs, selections, AI questions, dialogue turns).

## Solution
Create a directly accessible profile page that shows:

1. **Skill/Interest Profile** — the existing radar chart and dimension scores (as in CombinedProfile)
2. **Activity History** — a chronological log of all persisted user activities:
   - User text inputs and selections during dialogues
   - AI coach questions and responses
   - Station entries and completions
   - Onboarding insights captured
   - Journey progress milestones
3. **Direct Access** — the profile is reachable from the landing page (e.g. a profile icon/button in the header or a dedicated card) without requiring a completed station first

## Acceptance Criteria
- [ ] Profile page is accessible directly from the landing page or top navigation
- [ ] Profile shows the existing skill/interest visualization (radar chart, dimension scores)
- [ ] Profile shows a chronological activity history with all user interactions
- [ ] Each history entry displays: timestamp, type (input/question/selection/milestone), and content
- [ ] History includes AI coach questions alongside user responses
- [ ] History is filterable or groupable by journey/station
- [ ] Activity data is read from persisted storage (localStorage or Firebase)
- [ ] Empty state is shown when the user has no history yet

## Dependencies
- FR-008 (Skill profile generation)
- FR-009 (Profile visualization)
- FR-012 (Session continuity)
- FR-039 (Prompt log SQLite — may serve as history data source)

## Notes
The Travel Journal concept (DC domain) aligns with this feature — the activity history is effectively the user's personal travel journal across all journeys. The existing `stationResults` and `promptLog` data structures may already contain much of the needed data; the main work is surfacing it in a readable, navigable UI.
