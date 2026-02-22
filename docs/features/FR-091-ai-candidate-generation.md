# FR-091: AI Candidate Generation Service

**Status:** draft
**Priority:** should
**Created:** 2026-02-21

## Problem

The hoc-stage Python tool provides LLM-powered task candidate generation: trainers write a draft description, the system retrieves semantically similar content via RAG, and an LLM generates structured task suggestions. This workflow needs to be available in Go as part of the maindfull.LEARNING engine.

## Solution

Implement an AI candidate generation pipeline in `backend/internal/aitools/`:

### Workflow

```
1. Trainer provides draft text (e.g., "Create a task about networking basics")
2. Generate embedding for draft via external API (OpenAI embeddings endpoint)
3. Search vector index for semantically similar existing modules/tasks
4. Construct LLM prompt with draft + retrieved context
5. Call LLM (OpenAI-compatible API) for structured JSON response
6. Parse response into Candidate struct
7. Store candidate with status=pending for review
8. Trainer accepts → creates real Task in learning_paths/
9. Trainer rejects → records reason for feedback loop
```

### CLI Commands (`lrtool llm`)

| Command | Description |
|---------|------------|
| `lrtool llm build-index` | Index course content into vector store |
| `lrtool llm suggest-task "<draft>"` | Generate task suggestion |
| `lrtool llm list-candidates` | List pending candidates |
| `lrtool llm accept <id>` | Accept candidate as new task |
| `lrtool llm reject <id> [--reason "..."]` | Reject with feedback |

### Data Model

```go
type Candidate struct {
    ID            string    `json:"id"`
    Draft         string    `json:"draft"`
    SuggestedModule string  `json:"suggested_module"`
    TaskTitle     string    `json:"task_title"`
    TaskDescription string  `json:"task_description"`
    Confidence    float64   `json:"confidence"`
    Status        string    `json:"status"`  // pending, accepted, rejected
    RejectReason  string    `json:"reject_reason,omitempty"`
    CreatedAt     time.Time `json:"created_at"`
}
```

## Acceptance Criteria

- [ ] `lrtool llm build-index` indexes all tasks/modules into vector store
- [ ] `lrtool llm suggest-task` generates a structured candidate from draft text
- [ ] Candidates include: suggested module, task title, description, confidence score
- [ ] `lrtool llm accept` creates a new task markdown file in the correct module
- [ ] `lrtool llm reject` records the reason for future prompt tuning
- [ ] All LLM calls logged with prompt, response, and token usage
- [ ] Works with any OpenAI-compatible API endpoint (configurable)

## Dependencies

- FR-089: Lernreise Content CLI Tool (content access)
- TC-034: Backend Toolset Migration Strategy

## Notes

- Embedding via OpenAI API (`text-embedding-ada-002` or newer)
- Vector search via LanceDB Go bindings or external service
- LLM prompt templates stored as markdown files in `prompts/` directory
- Consider caching embeddings to avoid redundant API calls
