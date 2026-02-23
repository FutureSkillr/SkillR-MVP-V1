# FR-050: User Behavior Tracking (Clickstream Analytics)

**Status:** in-progress
**Priority:** should
**Created:** 2026-02-18

## Problem

We have no visibility into how users navigate the app, where they drop off in the journey funnel, or how they interact with the AI chat. Without behavioral data we cannot optimize the VUCA journey flow, identify UX bottlenecks, or measure engagement.

## Solution

Implement client-side clickstream analytics that tracks every meaningful user interaction as timestamped events stored in the existing SQLite dev backend. Events capture navigation patterns, journey lifecycle, and chat interaction metadata — never message content or personal data.

### Event Types

| Event | Trigger | Key Properties |
|-------|---------|----------------|
| `page_view` | Every ViewState transition | `from_view`, `to_view` |
| `onboarding_start` | Click "Reise starten" | `started_at` |
| `onboarding_complete` | Onboarding insights extracted | `duration_ms`, `message_count` |
| `journey_select` | Pick a journey | `journey_type` |
| `station_start` | Station loads | `station_id`, `journey_type` |
| `station_complete` | Station result submitted | `station_id`, `journey_type`, `duration_ms`, `dimension_scores` |
| `profile_view` | View profile | `stations_completed`, `journeys_started` |
| `chat_message_sent` | Each chat message | `message_index`, `message_length`, `is_user`, `session_type` |
| `chat_session_end` | Chat completed/aborted | `total_messages`, `user_messages`, `avg_message_length`, `duration_ms`, `completion_status` |

### Dialog Data Capture (Profile-Scoped)

For all dialog flows (intro chat, journey stations, onboarding), capture the full dialog context as part of the client's profile data. This is separate from anonymous clickstream analytics — it is tied to the user's profile and stored in IntroState / profile storage.

| Data Point | Description | Storage |
|------------|-------------|---------|
| `dialogFlow` | Ordered list of phases completed (`smalltalk`, `demo`, or `fast-forward`) | IntroState / profile |
| `dialogTiming` | Timestamps for phase transitions (`startedAt`, `smalltalkCompletedAt`, `demoCompletedAt`, `completedAt`) | IntroState / profile |
| `conversationContent` | Full message history (role + content + timestamp per message) | IntroState / profile |
| `fastForward` | Boolean — whether user skipped via "Weiter >" | IntroState / profile |
| `messageCount` | Total messages exchanged | IntroState / profile |
| `userMessageCount` | Messages sent by user | IntroState / profile |
| `totalDurationMs` | Time from first message to completion/skip | IntroState / profile |

This data is transferred to the backend profile on registration (see FR-054 intro flow) and enables:
- Personalized follow-up based on conversation content
- Understanding of user engagement depth
- Identification of drop-off points in dialog flows

### Privacy Constraints

- No message content in **anonymous clickstream events** (only metadata: length, index, count)
- Dialog content is stored in **profile data** (tied to authenticated user after registration)
- No user IDs or emails in clickstream
- No API keys or tokens
- `browser_session_id` is a random UUID, not linked to auth identity

## Acceptance Criteria

- [ ] All 9 event types are captured during normal app usage
- [ ] Events are batched client-side (2s flush) with `sendBeacon` on tab close
- [ ] Admin dashboard shows conversion funnel, journey popularity, session replay
- [ ] CSV export works for all events
- [ ] No personal data or message content is stored in anonymous clickstream events
- [x] Dialog flows capture full conversation content, timing, and flow in profile-scoped storage (IntroState)
- [x] `intro-fast-forward` event tracked when user skips intro chat via "Weiter >"
- [ ] TypeScript compiles without errors

## Dependencies

- FR-047: Management Console (admin panel infrastructure)
- TC-012: Clickstream Analytics Architecture

## Notes

This is a development/analytics tool. In production, events would be sent to a proper analytics backend (e.g., BigQuery). The SQLite implementation is suitable for the MVP phase.
