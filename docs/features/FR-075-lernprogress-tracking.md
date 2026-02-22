# FR-075: Lernprogress Tracking

**Status:** in-progress
**Priority:** must
**Gate:** env:dev
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY | maindfull.LEARNING

## Problem

When a user completes tasks within a Lernreise, the backend must submit the completion to Honeycomb, log the progress event locally, and award XP via the engagement system. Users also need to view their progress history.

## Solution

Implement task submission and progress tracking endpoints that coordinate between Honeycomb (task state), PostgreSQL (event log), and the engagement system (XP).

### Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/v1/lernreise/instances/:id/submit` | SubmitTask | Submit task to Honeycomb, log progress, award XP |
| `GET /api/v1/lernreise/instances/:id/progress` | GetProgress | Progress event history for an instance |

### Progress Event Model

```go
type Progress struct {
    ID         uuid.UUID
    InstanceID uuid.UUID
    ModuleID   string
    TaskID     string
    OldState   string  // "open" | "in progress" | "done"
    NewState   string
    ProgressP  int     // course-level progress after this event
    CreatedAt  time.Time
}
```

### XP Awards

| Action | XP | Trigger |
|--------|-----|---------|
| `lernreise_started` | 15 | First task submitted in an instance |
| `lernreise_task_complete` | 20 | Any task submitted |
| `lernreise_module_complete` | 75 | Module reaches 100% progress |
| `lernreise_complete` | 200 | Course reaches 100% progress |

### Submit Flow

```
1. Validate instance belongs to user
2. Call Honeycomb POST /honeycomb/{ctx_id}/data/{data_id}/{module_id}/{task_id}/submit
3. Compare old vs new state from Honeycomb response
4. Log Progress event in PostgreSQL
5. Update instance progress_percent and progress_label
6. Award XP based on state transitions
7. Return updated course data
```

## Acceptance Criteria

- [x] Task submission calls Honeycomb submit endpoint
- [x] Progress events logged in `lernreise_progress` table
- [x] Instance `progress_percent` and `progress_label` updated from Honeycomb response
- [x] XP awarded for task completion, module completion, and course completion
- [x] Instance status transitions to "completed" when progress reaches 100%
- [x] Progress history endpoint returns chronological event list
- [x] Unit tests for service logic with mocked dependencies
- [x] All endpoints require Firebase authentication

## Dependencies

- FR-072: Honeycomb service configuration
- FR-073: User context synchronization
- FR-074: Lernreise catalog and selection
- TC-028: Lernreise tracking concept

## Notes

Honeycomb returns the full `HoneycombData` response after task submission, which includes updated `progress_p` and per-module progress. The backend extracts state changes from this response.
