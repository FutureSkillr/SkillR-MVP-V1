---
name: bug-triage
description: Triage all OBS bug reports — cross-reference with FRs/TCs, assign priority, produce fix plans and follow-up checklists
allowed-tools: Read, Glob, Grep, Task
---

# Bug Triage — OBS Fehlerbericht-Priorisierung

Read-only audit of all `docs/ops/obs-*.md` bug reports. Cross-references with FRs and TCs, assigns priority, produces fix plans, and generates follow-up checklists.

Do NOT create or modify any files. This is a read-only audit.

## Procedure

### Phase 1: OBS-Inventar

1. Glob for `docs/ops/obs-*.md` to find all OBS files
2. Read each OBS file and extract:
   - **ID** (e.g. OBS-001)
   - **Title**
   - **Beobachtet** (date)
   - **Severity** (`blocking` / `medium` / `low`)
   - **Status** (`open` / `fixed` / `wontfix`)
   - **Affected files** (from "Betroffene Dateien" / "Betroffene Komponenten" tables)
   - **Explicit refs** (from "Verwandte Dokumente" section)
3. Build a structured inventory of all OBS entries

### Phase 2: Feature-Querverbindungen

For each OBS, find cross-references in two ways:

**A. Explicit references:** Parse the "Verwandte Dokumente" section of each OBS for:
- FR-NNN references
- TC-NNN references
- Other OBS-NNN references

**B. Implicit references:** For each affected filename in the OBS:
- Grep `docs/features/FR-*.md` for that filename or its key endpoint paths
- Grep `docs/arch/TC-*.md` for that filename or its key endpoint paths
- Record which FR/TC documents mention the same files/endpoints

Build a cross-reference map: `OBS-NNN → [FR-NNN..., TC-NNN..., OBS-NNN...]`

### Phase 3: Prioritaetszuweisung

Apply these rules in order (first match wins):

| Rule | Condition | Priority |
|------|-----------|----------|
| R1 | Status = `fixed` | **P3** (verification only) |
| R2 | Severity = `blocking` | **P0** |
| R3 | Severity = `medium` AND blocks a `must`-priority FR | **P0** |
| R4 | Severity = `medium` | **P1** |
| R5 | Severity = `low` AND blocks a `must`-priority FR | **P1** |
| R6 | Severity = `low` | **P2** |
| R7 | Fallback | **P2** |

To check "blocks a `must`-priority FR": read the linked FR files from Phase 2 and check their `Priority:` field.

### Phase 4: Fix-Plan

For each OBS that is NOT status `fixed`:

1. Read the affected files listed in the OBS
2. Verify the bug still exists in the current codebase (check if the described condition is present)
3. Summarize:
   - **Files to modify** (list)
   - **Approach** (1-3 sentence description)
   - **Complexity** estimate: `trivial` / `small` / `medium` / `large`
   - **Still present?** yes/no with evidence

For OBS with status `fixed`:
1. Read the affected files
2. Verify the fix is present in the current codebase
3. Note: "Fix verified" or "Fix NOT verified — regression detected"

### Phase 5: Follow-Up-Checkliste

For each OBS, generate a follow-up checklist evaluating:

- [ ] **Redeployment**: Does the fix require staging and/or production redeployment?
- [ ] **Security check**: Is this an auth-related bug? (Check if OBS mentions auth, middleware, tokens, 401, 403, CORS, or Firebase auth)
- [ ] **Test coverage**: Does a unit/integration test exist for the affected code path? If not, note "test needed"
- [ ] **Migration**: Does the fix require a database migration or config change?
- [ ] **Related OBS**: List other OBS that should be re-verified after this fix (from Phase 2 cross-refs)

## Output Format

```
# Bug Triage Report — {date}

## Executive Summary

| OBS | Title | Severity | Status | Priority | Still Present? |
|-----|-------|----------|--------|----------|----------------|
| OBS-001 | ... | blocking | open | P0 | yes/no |
| ... | ... | ... | ... | ... | ... |

**Open issues:** N | **Fixed (verify):** N | **Highest priority:** P{X}

---

## P0 — Critical

### OBS-NNN: {Title}

**Severity:** {severity} | **Status:** {status} | **Beobachtet:** {date}

#### Cross-References
- FRs: {list or "none"}
- TCs: {list or "none"}
- Related OBS: {list or "none"}

#### Priority Rationale
{Which rule R1-R7 applied and why}

#### Fix Plan
- **Files to modify:** {list}
- **Approach:** {description}
- **Complexity:** {trivial/small/medium/large}
- **Still present?** {yes/no + evidence}

#### Follow-Up Checklist
- [ ] Redeployment: {staging/production/both/none}
- [ ] Security check: {required/not required — reason}
- [ ] Test coverage: {covered/test needed — details}
- [ ] Migration: {required/not required — details}
- [ ] Related OBS to re-verify: {list or "none"}

---

## P1 — High
{same structure per OBS}

## P2 — Low
{same structure per OBS}

## P3 — Verification Only
{same structure per OBS, but Fix Plan section is "Verify fix" instead}

---

## Action List (sorted by priority)

| # | Priority | OBS | Action | Complexity | Security? |
|---|----------|-----|--------|------------|-----------|
| 1 | P0 | OBS-NNN | {one-line action} | {complexity} | {yes/no} |
| ... | ... | ... | ... | ... | ... |
```
