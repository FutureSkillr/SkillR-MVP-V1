# FR-048: Journey Progress on Landing Page Cards

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem
When a user has started a journey but not yet completed all stations, there is no visual indication of progress on the landing page cards. The user cannot see which journeys have open goals remaining or how far they have progressed. This makes it hard to decide where to continue.

## Solution
Display station progress on each journey card on the landing page. Each card shows a progress indicator (e.g. "2 / 4 Stationen") representing how many stations the user has completed out of the total available. Journeys with remaining open stations are visually highlighted to encourage continuation.

Clicking a card with open stations takes the user directly back into that journey (reusing the existing direct-entry mechanism from the landing page).

## Acceptance Criteria
- [ ] Each journey card on the landing page shows the number of completed vs. total stations (e.g. "2 / 4 Stationen")
- [ ] Cards with zero progress show no progress indicator (or "Noch nicht gestartet")
- [ ] Cards with partial progress are visually distinct (e.g. highlighted border, progress bar, or badge)
- [ ] Cards with all stations completed show a completion state (e.g. checkmark, "Abgeschlossen")
- [ ] Progress data is read from the persisted user profile (`journeyProgress`)
- [ ] Clicking a card with open stations navigates directly into the journey

## Dependencies
- FR-006 (VUCA navigation)
- FR-012 (Session continuity — persisted progress)
- FR-014 (Interest profile tracking)

## Notes
The landing page cards were recently made clickable (direct entry into stations). This FR extends them with progress visibility so users know where to continue.
