# FR-092: Memory Insights Processor

**Status:** draft
**Priority:** should
**Created:** 2026-02-21

## Problem

The CTM tool provides an insights processor that batch-scans synchronized memory items using LLM to extract actionable content (email drafts, feature requests, decisions, tasks). This capability needs to be available in the Go toolset for automated processing of Erinnerungsraum content.

## Solution

Implement an insights extraction pipeline in `backend/internal/memory/insights.go`:

### Workflow

```
1. Load synchronized memory items from local store
2. For each item (or batch):
   a. Construct LLM prompt with item content
   b. Call LLM for structured classification
   c. Parse response into ActionItem structs
3. Compare with existing action items (change detection)
4. Store/update action items with version tracking
5. Flag substantial changes vs. cosmetic updates
```

### CLI Commands (`lrtool memory insights`)

| Command | Description |
|---------|------------|
| `lrtool memory insights scan` | Scan all items for insights |
| `lrtool memory insights scan --type feature_request` | Scan for specific type |
| `lrtool memory insights scan --force` | Re-scan previously processed items |
| `lrtool memory insights view` | View all extracted insights |
| `lrtool memory insights view --changed-only` | View only changed insights |

### Action Item Types

| Type | Description | Example |
|------|------------|---------|
| `email_draft` | Draft email to send | "Follow up with partner about timeline" |
| `feature_request` | Product feature idea | "Add export to PDF for skill profiles" |
| `decision` | Decision to document | "Decided to use Go for backend rewrite" |
| `task` | Action to take | "Schedule review meeting for next sprint" |
| `follow_up` | Follow-up needed | "Check status of API integration by Friday" |

### Data Model

```go
type ActionItem struct {
    ID             string    `json:"id"`
    SourceItemID   string    `json:"source_item_id"`
    Type           string    `json:"type"`
    Description    string    `json:"description"`
    NextStep       string    `json:"next_step"`
    Status         string    `json:"status"`
    Version        int       `json:"version"`
    IsSubstantial  bool      `json:"is_substantial"`
    CreatedAt      time.Time `json:"created_at"`
    UpdatedAt      time.Time `json:"updated_at"`
}
```

## Acceptance Criteria

- [ ] `lrtool memory insights scan` processes all unscanned items
- [ ] Each item classified into one or more action types
- [ ] Change detection compares new vs. existing insights
- [ ] Version history maintained for all action items
- [ ] `lrtool memory insights view` displays formatted output (table)
- [ ] `--force` flag re-processes already-scanned items
- [ ] `--type` flag filters by action type
- [ ] LLM calls audited (prompt, response, tokens)
- [ ] Unit tests with mock LLM responses

## Dependencies

- FR-090: ER1 Synchronization Service (provides synced items)
- TC-034: Backend Toolset Migration Strategy

## Notes

- Batch processing to minimize LLM API calls
- Configurable LLM model per insight type (e.g., cheaper model for classification)
- Consider parallel processing with Go goroutines for large item sets
