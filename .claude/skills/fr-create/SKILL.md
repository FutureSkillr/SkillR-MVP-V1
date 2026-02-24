---
name: fr-create
description: Scaffold a new Feature Request with auto-detected number, template, and scope classification
allowed-tools: Read, Glob, Grep, Bash, Write, AskUserQuestion
---

# FR Create — Feature Request Scaffolding

Create a new `docs/features/FR-NNN-<slug>.md` file with the correct next number and full template.

## Procedure

### 1. Detect Next FR Number

```bash
ls docs/features/FR-*.md | sort -V | tail -1
```

Extract the highest FR number (e.g. `FR-130` → next is `131`). Zero-pad to 3 digits.

### 2. Gather Information

Ask the user for the following (use AskUserQuestion):

- **Title**: One-line summary (e.g. "Email Validation on Registration")
- **Priority**: `must` / `should` / `could` / `wont`
- **Scope**: `[CORE]` / `[SELECT]` — whether this ships in V1.0

### 3. Auto-Detect Context

Before writing the file, gather context:

- Run `git diff --name-only HEAD~5` to find recently changed files
- Search existing FRs for related features based on the title keywords
- Check `SCOPE-MATRIX.md` for similar entries

### 4. Generate Slug

Convert the title to a lowercase slug:
- Lowercase, replace spaces with `-`, remove special characters
- Truncate to max 40 characters
- Example: "Email Validation on Registration" → `email-validation`

### 5. Write the FR File

**File:** `docs/features/FR-{NNN}-{slug}.md`

Use this template:

```markdown
# FR-{NNN}: {Title}

**Status:** draft
**Priority:** {priority}
**Entity:** SkillR
**Created:** {YYYY-MM-DD}

## Problem

{What problem does this solve? Leave a placeholder for the user to fill in.}

## Solution

{What do we build? Leave a placeholder for the user to fill in.}

## Acceptance Criteria

- [ ] {Criterion 1 — suggest based on the title if possible}
- [ ] {Criterion 2}

## Dependencies

- {List related FRs if detected, otherwise "None identified yet."}

## Notes

{Additional context.}
```

### 6. Update SCOPE-MATRIX.md

If the user specified a scope tag, add a line to `SCOPE-MATRIX.md`:

```
| FR-{NNN} | {Title} | {[CORE]/[SELECT]} |
```

Append it to the appropriate section (find the last FR line and add after it).

### 7. Report

Tell the user:
- File path created
- FR number assigned
- Scope tag added to SCOPE-MATRIX.md (if applicable)
- Remind them to fill in Problem and Solution sections
