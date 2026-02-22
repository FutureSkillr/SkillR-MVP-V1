# FR-094: Report Generation Pipeline

**Status:** draft
**Priority:** could
**Created:** 2026-02-21

## Problem

The CTM tool generates automated reports (weekly sprint journals, daily reviews, monthly retrospectives) from synchronized memory items using LLM-powered summarization and clustering. This capability supports trainers and administrators in tracking learning progress and extracting knowledge from accumulated Erinnerungsraum content.

## Solution

Implement a Go-based report generation pipeline in `backend/internal/memory/journal.go`:

### Report Types

| Type | Frequency | Source (CTM) | Description |
|------|-----------|-------------|-------------|
| Weekly Journal | Weekly | `journal_config.yaml` | Sprint summary with clusters and narratives |
| Daily Review | Daily | `daily_journal_config.yaml` | Day's activity summary |
| Monthly Report | Monthly | `monthly_journal_config.yaml` | Month retrospective |

### Pipeline Stages

```
1. Data Loading
   - Query synced items by date range (week/day/month)
   - Apply tag filters and blacklists

2. LLM Clustering
   - Group related items by semantic similarity
   - Generate cluster labels

3. LLM Summarization
   - Summarize each cluster
   - Generate overall narrative

4. Rendering
   - Apply Go html/template
   - Generate HTML report
   - Optional: PDF via headless browser or wkhtmltopdf

5. Distribution
   - Save to local filesystem
   - Optional: Upload to Google Drive
   - Optional: Create email draft via Gmail API
```

### CLI Commands (`lrtool memory journal`)

| Command | Description |
|---------|------------|
| `lrtool memory journal --week 2026-W08` | Generate weekly journal |
| `lrtool memory journal --daily --date 2026-02-21` | Generate daily review |
| `lrtool memory journal --monthly --month 2026-02` | Generate monthly report |
| `lrtool memory journal --distribute` | Send via email |
| `lrtool memory journal --gdrive` | Upload to Google Drive |
| `lrtool memory journal --dry-run` | Preview without saving |

### Configuration

```yaml
# journal_config.yaml
report_type: weekly
language: de
model: gpt-4o
schedule: "0 9 * * 1"  # Monday 9am
timezone: Europe/Berlin
recipients:
  - email: trainer@example.com
    name: Max Trainer
tag_blacklist:
  - internal
  - draft
```

## Acceptance Criteria

- [ ] Weekly journal generated from items in a given ISO week
- [ ] Daily review generated from items on a given date
- [ ] Monthly report generated from items in a given month
- [ ] Reports include: item count, clusters, summaries, narrative
- [ ] HTML output rendered via Go templates
- [ ] `--distribute` sends email to configured recipients
- [ ] `--gdrive` uploads HTML to Google Drive folder
- [ ] `--dry-run` shows report preview without side effects
- [ ] Configuration loaded from YAML file
- [ ] Unit tests for data loading, rendering (mock LLM for clustering/summarization)

## Dependencies

- FR-090: ER1 Synchronization Service (provides synced items)
- FR-092: Memory Insights Processor (can enrich reports with insights)

## Notes

- Go `html/template` for HTML rendering (no external dependency)
- PDF generation can be deferred (HTML-only for MVP)
- Google Drive via `google.golang.org/api/drive/v3`
- Gmail via `google.golang.org/api/gmail/v1`
- Consider Go cron library for scheduled generation (e.g., `robfig/cron`)
- Report templates should be customizable (stored alongside config)
