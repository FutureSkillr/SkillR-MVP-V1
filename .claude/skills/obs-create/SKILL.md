---
name: obs-create
description: Scaffold a new OBS bug report with auto-detected number, template, and cross-references
allowed-tools: Read, Glob, Grep, Bash, Write, AskUserQuestion
---

# OBS Create — Bug Report Scaffolding

Create a new `docs/ops/obs-NNN-<slug>.md` file with the correct next number and full template.

## Procedure

### 1. Detect Next OBS Number

```bash
ls docs/ops/obs-*.md | sort -V | tail -1
```

Extract the highest OBS number (e.g. `obs-010` → next is `011`). Zero-pad to 3 digits.

### 2. Gather Information

Ask the user for the following (use AskUserQuestion):

- **Title**: One-line summary of the bug (e.g. "Pod Connect Returns 500 Locally")
- **Severity**: `blocking` / `high` / `medium` / `low`
- **Component**: Which system component is affected (e.g. "Solid Pod integration (FR-076)")

### 3. Auto-Detect Context

Before writing the file, gather context automatically:

- Run `git diff --name-only HEAD~5` to find recently changed files
- Check if the user mentioned specific files, endpoints, or error codes
- Search `docs/features/FR-*.md` and `docs/arch/TC-*.md` for related documents based on the component

### 4. Generate Slug

Convert the title to a lowercase slug:
- Lowercase, replace spaces with `-`, remove special characters
- Truncate to max 40 characters
- Example: "Pod Connect Returns 500 Locally" → `pod-connect-returns-500-locally`

### 5. Write the OBS File

**File:** `docs/ops/obs-{NNN}-{slug}.md`

Use this template:

```markdown
# OBS-{NNN}: {Title}

**Status:** open
**Severity:** {severity}
**Created:** {YYYY-MM-DD}
**Updated:** {YYYY-MM-DD}
**Component:** {component}

## Symptom

{Describe what the user/developer observes. Include console output, HTTP status codes, or error messages if known.}

## Root Causes

### 1. {First suspected cause}

{Analysis of the root cause. Reference specific files and line numbers.}

**Fix:** {Describe the fix or mark as "TBD".}

## Betroffene Dateien

| File | Role |
|------|------|
| `{file}` | {what this file does in the context of the bug} |

## Fixes Applied

_None yet._

## Verwandte Dokumente

- {List related FR-NNN, TC-NNN, or OBS-NNN references}

## Verification

1. {Step to verify the bug is reproduced}
2. {Step to verify the fix works}
```

### 6. Report

Tell the user:
- File path created
- OBS number assigned
- Remind them to fill in the Symptom and Root Causes sections with actual observations
