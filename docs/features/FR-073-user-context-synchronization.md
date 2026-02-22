# FR-073: User Context Synchronization

**Status:** in-progress
**Priority:** must
**Gate:** env:dev
**Created:** 2026-02-21
**Entity:** SkillR

## Problem

Honeycomb uses a cross-service identifier (`ctx_id`) that differs from our Firebase UID. On first Lernreise interaction, we must register the user with the Memory service to obtain their `ctx_id`, then cache the mapping locally to avoid repeated lookups.

## Solution

Implement a Memory service client that calls `POST /user/access` with the Firebase user's UID, display name, and email. The returned `ctx_id` is stored in a new `honeycomb_ctx_id` column on the `users` table. Subsequent requests use the cached mapping.

### Identity Flow

```
1. User hits any /api/v1/lernreise/* endpoint
2. Backend extracts Firebase UID from auth context
3. Check users.honeycomb_ctx_id — if set, use it
4. Otherwise call Memory POST /user/access {uid, given_name, family_name, email}
5. Store returned ctx_id in users.honeycomb_ctx_id
6. Proceed with Honeycomb API call using ctx_id
```

### Memory Client Interface

```go
type Client interface {
    RegisterUser(ctx context.Context, uid, givenName, familyName, email string) (ctxID string, err error)
    Ping(ctx context.Context) error
}
```

## Acceptance Criteria

- [x] Memory client implements `POST /user/access` per `memory-services.yml` spec
- [x] `X-API-KEY` header sent on all requests
- [x] Returned `ctx_id` is cached in PostgreSQL (`users.honeycomb_ctx_id`)
- [x] Unit tests with httptest mock server
- [x] Ping method for health check integration

## Dependencies

- FR-072: Honeycomb service configuration
- TC-028: Lernreise tracking concept

## Notes

The Memory service OpenAPI spec is at `integrations/api-spec/memory-services.yml`. The `UserAccessResponse` schema returns `ctx_id` (string) and `tier` (string).
