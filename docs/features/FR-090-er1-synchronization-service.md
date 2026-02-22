# FR-090: ER1 Synchronization Service

**Status:** draft
**Priority:** must
**Created:** 2026-02-21

## Problem

The Erinnerungsraum (Memory Space) synchronization currently runs via the Python-based CTM tool (`confluent_topic_manager`). It syncs multimodal items (text, audio, images) from an external Memory Space API into local SQLite storage. This needs to be reimplemented in Go as part of the maindfull.LEARNING engine and provide both CLI and API access.

## Solution

Build a Go-based ER1 synchronization service in `backend/internal/memory/` that replicates the CTM memory-space command group:

### CLI Commands (`lrtool memory`)

| Command | Description | Source (CTM) |
|---------|------------|-------------|
| `lrtool memory add` | Configure Memory Space link (URL + context + tags) | `memory-space add` |
| `lrtool memory sync` | Sync items incrementally | `memory-space sync` |
| `lrtool memory resync` | Full resynchronization | `memory-space resync` |
| `lrtool memory list` | List synchronized items | `memory-space list` |
| `lrtool memory view` | View items (--today, --week, --month) | `memory-space view` |
| `lrtool memory ping` | Health check on Memory Space API | `memory-space ping` |

### Sync Protocol

```
1. Read last_sync_timestamp from local store
2. GET /memory/{context_id}?since={timestamp} → item list
3. For each new/updated item:
   a. Download content (text)
   b. If tagged for media: download audio/image
   c. Upsert into local store
4. Check for deletions (items in store but not in API response)
5. Move deleted items to deleted_items table
6. Update last_sync_timestamp
7. Log operation (items_available, items_synced, status)
```

### Memory Space API Client

```go
type MemorySpaceClient struct {
    BaseURL    string
    APIKey     string
    HTTPClient *http.Client
}

func (c *MemorySpaceClient) ListItems(ctx context.Context, userCtx string, since time.Time) ([]MemoryItem, error)
func (c *MemorySpaceClient) GetItem(ctx context.Context, userCtx string, itemID string) (*MemoryItem, error)
func (c *MemorySpaceClient) GetAudio(ctx context.Context, userCtx string, itemID string) ([]byte, error)
func (c *MemorySpaceClient) GetImage(ctx context.Context, userCtx string, itemID string) ([]byte, error)
func (c *MemorySpaceClient) Ping(ctx context.Context) error
```

### Local Store (SQLite)

```go
type SyncStore interface {
    UpsertItem(ctx context.Context, item *MemoryItem) error
    GetItem(ctx context.Context, id string) (*MemoryItem, error)
    ListItems(ctx context.Context, filter ItemFilter) ([]MemoryItem, error)
    DeleteItem(ctx context.Context, id string) error
    GetSyncState(ctx context.Context, userCtx string) (*SyncState, error)
    UpdateSyncState(ctx context.Context, state *SyncState) error
    LogOperation(ctx context.Context, op *SyncOperation) error
}
```

## Acceptance Criteria

- [ ] `lrtool memory add --url <URL> --user-context <CTX>` configures a link
- [ ] `lrtool memory sync` downloads new items since last sync
- [ ] `lrtool memory sync --force` re-downloads all items
- [ ] `lrtool memory sync --limit N` limits batch size
- [ ] Audio and image media downloaded for tagged items
- [ ] Deleted items tracked (not hard-deleted from local store)
- [ ] Operation log records every sync (timestamp, count, status)
- [ ] `lrtool memory view --today` filters items by creation date
- [ ] `lrtool memory ping` returns API health status
- [ ] All sync logic has unit tests with mock HTTP server
- [ ] Integration test against a real Memory Space API endpoint

## Dependencies

- TC-033: Existing Systems Inventory (CTM analysis)
- TC-034: Backend Toolset Migration Strategy

## Notes

- SQLite via `modernc.org/sqlite` (pure Go, no CGO required)
- HTTP client with retries and timeout configuration
- Auth via `X-API-KEY` header (matching CTM protocol)
- Consider bbolt as alternative to SQLite for simpler key-value patterns
- Sync should be idempotent and resumable after failure
