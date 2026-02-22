# FR-026: Micro-Session UX (5-Minuten-Modus)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Problem
Children and youth primarily use the app in short bursts — "im Bus sitzen und 5 Minuten was machen" (transcript). The current dialogue model assumes extended sessions. If the app doesn't support meaningful micro-interactions, users will abandon it because every interaction feels too long to start.

## Solution
Design all interactions to be meaningful within 5 minutes or less, with instant resume capability.

### Micro-Session Principles
1. **Instant Resume**: App opens exactly where the user left off. No "loading your journey" — immediate continuation of the last dialogue/station.
2. **Bite-Sized Interactions**: Each station/exploration step is self-contained and completable in 2-5 minutes.
3. **Progress Persistence**: Every micro-session contributes to the profile and VUCA bingo — no interaction is wasted, even if cut short.
4. **Quick-Start Options**: If a new session starts, offer 2-3 quick options: "Continue where you left off", "Explore something new", "Quick reflection".
5. **Graceful Interruption**: If the user closes the app mid-interaction, the next session picks up naturally — "Hey, wir waren gerade bei..." — without losing context.

### Technical Requirements
- Frontend state is persisted locally (offline-capable for read-only content)
- Dialogue state is saved after every message exchange, not just at session end
- Profile updates happen incrementally after each meaningful interaction, not in batch
- Loading time from app open to interactive state: < 2 seconds on mobile

### Session Types
| Type | Duration | Content |
|---|---|---|
| Micro | 2-5 min | Single exploration step, one reflection question, quick fact |
| Standard | 10-20 min | Full station visit with multiple interactions |
| Deep | 30+ min | Extended exploration, Level 2 reflection, portfolio review |

The app should accommodate all three without forcing any.

## Acceptance Criteria
- [ ] App resumes within 2 seconds to the last interaction state
- [ ] A single exploration step is completable in under 5 minutes
- [ ] Closing the app mid-interaction loses no data
- [ ] The next session picks up naturally from where the user left off
- [ ] Every micro-session contributes to profile and VUCA bingo progress
- [ ] Quick-start options available for new sessions
- [ ] Works on mobile browser with typical 4G latency

## Dependencies
- FR-012 (Session Continuity — persistence foundation)
- FR-019 (Multimodal Storage Layer — incremental saves)
- FR-005 (Gemini Dialogue Engine — fast response times)
- FR-013 (Web App Deployment — mobile optimization)

## Notes
- This is a "should" priority because without micro-session support, the target audience (bus-riding teenagers) won't engage regularly
- The 5-minute constraint also forces good content design — no bloated interactions
- Consider offline-first for reading last session summary (even without connectivity)
