# FR-009: Profile Visualization

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-17

## Scope
The skill/interest profile is displayed visually as a spider/radar diagram with dimensions (Hard Skills, Soft Skills, Future Skills, Resilience, and potentially others). The diagram updates visibly after each dialogue interaction or station visit so the user can watch their profile grow. The visualization must be readable and engaging for a 14-year-old audience.

## Intent
Abstract data becomes real when you can see it. The spider diagram makes the invisible (interests, skills) visible and creates a reward loop — "I did something, and my profile changed." Seeing the profile evolve in real time is core motivation for continuing the journey.

### Coach Selection in Profile

The profile view includes the full coach selection grid (same cards as `intro-coach-select`). The currently selected coach is shown in full color with a checkmark. All other coaches are **dimmed** (grayscale + reduced opacity). On hover, a dimmed card temporarily shows in full color, returning to dimmed when the cursor leaves — unless the user clicks to switch coaches.

Switching coaches:
- Updates `profile.coachId` and derives `profile.voiceDialect` from the new coach
- Fires a `coach_change` analytics event (audit trail with `previous_coach_id` and `new_coach_id`)
- The dialect is no longer independently selectable — it always follows the coach

## Acceptance Criteria

- [x] Spider/radar diagram shows all dimensions with scores from station results
- [x] Responsive sizing: 3-tier (mobile <400px, tablet, desktop)
- [x] Coach selection grid in profile with selected/dimmed states
- [x] Dimmed cards colorize on hover, revert when cursor leaves
- [x] Coach change triggers `coach_change` analytics event
- [x] Dialect is derived from coach (no independent dialect selector)
- [ ] Profile data syncs to backend via API (FR-111)

## Dependencies
- FR-008 (Skill profile generation — data source)
- FR-054 (Intro sequence — initial coach selection)
