---
name: audit-fr
description: Audit all Feature Requests for gaps, missing acceptance criteria, broken cross-references, and drift from implementation
allowed-tools: Read, Glob, Grep, Task, WebFetch
---

# Feature Request Audit

Run a systematic audit of all Feature Requests in `docs/features/`.

## Procedure

1. **Inventory**: Glob `docs/features/FR-*.md` and read every FR file
2. **Per-FR checks** (for each file):
   - Does it have all required fields? (Status, Priority, Created, Problem, Solution, Acceptance Criteria, Dependencies)
   - Are acceptance criteria specific and testable (not vague)?
   - If Status is `done` — are ALL acceptance criteria checked `[x]`? If any are `[ ]`, flag as **drift**
   - If Status is `in-progress` — does matching code exist? Grep the codebase for key terms from the FR
   - Do cross-references in Dependencies actually exist? (e.g., if it says "TC-030", does `docs/arch/TC-030-*.md` exist?)
   - Does a corresponding test scenario exist in `docs/test-scenarios/`? If not, flag as **missing test coverage**
3. **Cross-reference check**: For every TC, DC, BC referenced in any FR, verify the file exists
4. **Orphan check**: Are there FRs with status `draft` older than 30 days? Flag as **stale**
5. **Numbering check**: Are FR numbers sequential with no gaps?

## Output Format

Produce a structured report:

```
## FR Audit Report — {date}

### Summary
- Total FRs: N
- Done: N | In-Progress: N | Draft: N | Rejected: N
- Gaps found: N

### Critical Issues (must fix)
- FR-NNN: {issue description}

### Warnings (should fix)
- FR-NNN: {issue description}

### Missing Test Coverage
- FR-NNN: No matching TS-* found

### Stale Drafts (>30 days without progress)
- FR-NNN: Created {date}, still draft

### Cross-Reference Errors
- FR-NNN references TC-099 which does not exist
```

Do NOT create or modify any files. This is a read-only audit.
