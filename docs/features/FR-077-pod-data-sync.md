# FR-077: Pod Data Sync

**Status:** done
**Priority:** should
**Created:** 2026-02-21
**Entity:** SkillR
**Gate:** MVP4

## Problem
Once a Pod is connected, users need a way to push their current app state to the Pod so the transparency mirror stays up to date.

## Solution
Provide a manual sync mechanism that serializes 5 entity types from the app backend into Turtle format and writes them to the user's Pod.

### Synced Entities
| Entity | Pod Path | Source |
|--------|----------|--------|
| User Profile | `/profile/state` | PG `users` table |
| Skill Profile | `/profile/skill-profile` | PG `skill_profiles` table |
| Journey Progress | `/journey/vuca-state` | Frontend state (request body) |
| Engagement | `/profile/engagement` | Frontend state (request body) |
| Reflections | `/journal/reflections/{id}` | PG `reflections` table |

### Pod Container Structure
```
/{username}/
  profile/
    card            # WebID Profile (foaf:Person)
    state           # UserProfile
    skill-profile   # SkillProfile
    engagement      # EngagementState
  journey/
    vuca-state      # Journey progress
  journal/
    reflections/
      {id}          # Individual reflections
```

### Serialization
Data serialized as Turtle using TC-019's `fs:` namespace (`https://vocab.maindset.academy/ns/`).

### API Endpoint
- `POST /api/v1/pod/sync` — Trigger manual sync (App -> Pod)

### Sync Flow
1. Frontend sends POST with engagement + journey data
2. Backend reads user profile, skill profile, reflections from PostgreSQL
3. Backend serializes each entity to Turtle
4. Backend PUTs each resource to the Pod
5. Backend updates `pod_last_synced_at` and `pod_sync_status`
6. Returns `SyncResult` with count and errors

### Error Handling
- Pod offline: return error status, app continues normally
- Partial failures: continue with remaining entities, collect errors
- Pod is never blocking

## Acceptance Criteria
- [ ] Manual sync pushes 5 entity types to Pod
- [ ] Data serialized in valid Turtle format with fs: namespace
- [ ] Partial sync failures handled gracefully
- [ ] Sync timestamp updated in PostgreSQL
- [ ] Backend unit tests for serializer validate Turtle output

## Dependencies
- FR-076 (Solid Pod Connection)
- TC-019 (Solid Pod Storage Layer)

## Notes
Automatic sync is V2.0 scope. MVP4 is on-demand only (user clicks button).
