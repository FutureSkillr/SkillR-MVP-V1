---
name: session-summary
description: End-of-session digest — summarize changes, map to FRs/TCs, list next steps
allowed-tools: Read, Glob, Grep, Bash, Task
---

# Session Summary — Working Session Digest

Generate a structured summary of what was accomplished in the current working session. Useful for handoff between sessions, daily standups, or personal tracking.

## When to Run

At the end of a working session, before closing Claude Code.

## Procedure

### 1. Gather Git State

Run these commands to understand what changed:

```bash
# All uncommitted changes (staged + unstaged + untracked)
git status --short

# Diff of all modified tracked files (summary)
git diff --stat

# Diff of staged files
git diff --cached --stat

# Recent commits (last 10, with timestamps)
git log --oneline --since="8 hours ago" --format="%h %s (%ar)"
```

### 2. Identify Changed Files

From git status and recent commits, build a list of all files touched in this session. Group them by area:

| Area | Pattern |
|------|---------|
| Backend | `backend/**` |
| Frontend | `frontend/**` |
| Docs — Features | `docs/features/FR-*.md` |
| Docs — Architecture | `docs/arch/TC-*.md` |
| Docs — Ops | `docs/ops/**` |
| Config | `Makefile`, `docker-compose*`, `scripts/**`, `terraform/**` |
| Tests | `*_test.go`, `*.test.ts` |

### 3. Map Changes to FRs and TCs

For each changed file, search for references in feature and architecture docs:

```bash
# Find which FRs mention this file
grep -rl "filename" docs/features/ docs/arch/ 2>/dev/null
```

Also extract FR-NNN and TC-NNN references from commit messages and changed file contents.

### 4. Detect New Documents

Check if any new FR, TC, OBS, or concept documents were created:

```bash
git status --short | grep '^??' | grep -E '(FR-|TC-|OBS-|DC-|BC-)'
```

### 5. Summarize Task Progress

If the task list has entries, read it and report:
- Completed tasks
- In-progress tasks
- Pending tasks

### 6. Generate Summary

Output the summary in this format:

```markdown
# Session Summary — {YYYY-MM-DD}

## What Was Done

- {Bullet point summary of each logical change, 1-3 sentences each}
- {Reference FR/TC numbers where applicable}

## Files Changed

### Backend ({N} files)
- `backend/internal/solid/service.go` — {one-line description}
- ...

### Frontend ({N} files)
- `frontend/components/pod/PodConnectModal.tsx` — {one-line description}
- ...

### Docs ({N} files)
- `docs/arch/TC-036-pod-provider-cloud-gate.md` — {one-line description}
- ...

### Tests ({N} files)
- `backend/internal/solid/service_test.go` — {one-line description}
- ...

## Related Documents

| Type | ID | Title | Status |
|------|-----|-------|--------|
| FR | FR-076 | Solid Pod | {status} |
| TC | TC-036 | Pod Provider Cloud Gate | {status} |
| OBS | OBS-010 | Pod Connect 500/400 | {status} |

## Test Results

- Go tests: {PASS/FAIL} ({N} packages)
- Build: {PASS/FAIL}

## Next Steps

- [ ] {Suggested follow-up action based on pending work}
- [ ] {Any TODOs found in the code or task list}
- [ ] {Any failing or skipped tests that need attention}
```

### 7. Do NOT Create Files

This skill only outputs text to the conversation. It does NOT create any files unless the user explicitly asks to save the summary.
