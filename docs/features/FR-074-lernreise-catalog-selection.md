# FR-074: Lernreise Catalog and Selection

**Status:** in-progress
**Priority:** must
**Gate:** env:dev
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY | maindfull.LEARNING

## Problem

Users need to browse available learning journeys (Lernreisen) from Honeycomb and select one to start. The backend must proxy the Honeycomb catalog API and manage local instance records that bind a user to a specific course.

## Solution

Implement catalog browsing and selection endpoints that proxy Honeycomb's list/data APIs, plus local instance management in PostgreSQL.

### Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `GET /api/v1/lernreise/catalog` | ListCatalog | List available Lernreisen from Honeycomb |
| `GET /api/v1/lernreise/catalog/:dataId` | GetCatalogDetail | Course detail from Honeycomb |
| `POST /api/v1/lernreise/select` | Select | Create local instance, bind user to course |
| `GET /api/v1/lernreise/active` | GetActive | Current active instance for the user |
| `GET /api/v1/lernreise/instances` | ListInstances | All instances for the user |
| `GET /api/v1/lernreise/instances/:id` | GetInstance | Instance detail + Honeycomb data |

### Honeycomb Client Interface

```go
type Client interface {
    ListCourses(ctx context.Context, ctxID string) ([]ListEntry, error)
    GetCourseData(ctx context.Context, ctxID, dataID string) (*CourseData, error)
    SubmitTask(ctx context.Context, ctxID, dataID, moduleID, taskID string) (*CourseData, error)
    GetModified(ctx context.Context, ctxID, courseID string) (time.Time, error)
    Ping(ctx context.Context) error
}
```

### Instance Model

```go
type Instance struct {
    ID              uuid.UUID
    UserID          uuid.UUID
    CtxID           string
    HoneycombDataID string
    Title           string
    Status          string  // "active" | "paused" | "completed" | "abandoned"
    ProgressPercent int
    ProgressLabel   string
    StartedAt       time.Time
    CompletedAt     *time.Time
    LastSyncedAt    *time.Time
}
```

## Acceptance Criteria

- [x] Honeycomb client implements all 4 Honeycomb API endpoints per `honeycomb-services.yml`
- [x] `X-API-KEY` header sent on all Honeycomb requests
- [x] Types match OpenAPI schema (HoneycombListEntry, HoneycombData, HoneycombModule, HoneycombModuleTask)
- [x] Instance creation stores binding in PostgreSQL
- [x] Only one active instance per user at a time
- [x] Unit tests with httptest mock server
- [x] All endpoints require Firebase authentication

## Dependencies

- FR-072: Honeycomb service configuration
- FR-073: User context synchronization
- TC-028: Lernreise tracking concept

## Notes

Honeycomb API spec at `integrations/api-spec/honeycomb-services.yml`. Types include rich module/task data with localized strings (German labels).
