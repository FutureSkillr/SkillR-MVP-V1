---
name: audit-tests
description: Audit all Test Scenarios for coverage gaps against FRs, TCs, and implementation code
allowed-tools: Read, Glob, Grep, Task
---

# Test Scenario Audit

Run a systematic audit of test coverage across the project.

## Procedure

### Phase 1: Test Scenario Inventory
1. Glob `docs/test-scenarios/TS-*.md` — read and catalog every test scenario
2. For each TS: extract which FR(s) and TC(s) it covers (from its Related/Dependencies section)

### Phase 2: Coverage Matrix
Build a coverage matrix:
1. List every FR with status `done` or `in-progress`
2. For each FR, check: is there at least one TS that references it?
3. List every TC with status `accepted`
4. For each TC, check: is there at least one TS that references it?
5. Flag any FR or TC without test scenario coverage

### Phase 3: Implementation Coverage
1. Glob `backend/**/*_test.go` and `frontend/**/*.test.ts` — list all actual test files
2. For each Go source file (`*.go`, excluding `*_test.go`), check if a corresponding `*_test.go` exists
3. For each frontend service/component, check if a corresponding `.test.ts` exists
4. Flag source files without unit tests

### Phase 4: Staleness Check
1. For each TS, check if the FR it covers has changed status since the TS was written
2. If an FR moved to `done` but its TS still references old acceptance criteria, flag as **stale test**

## Output Format

```
## Test Scenario Audit Report — {date}

### Coverage Summary
- Total Test Scenarios: N
- FRs covered: N / M (percentage)
- TCs covered: N / M (percentage)

### Missing Test Coverage (FRs without TS)
- FR-NNN: {title} — Status: {status}, no test scenario found

### Missing Test Coverage (TCs without TS)
- TC-NNN: {title} — Status: {status}, no test scenario found

### Missing Unit Tests (source files without test files)
- backend/path/file.go — no file_test.go
- frontend/path/file.ts — no file.test.ts

### Stale Test Scenarios
- TS-NNN: covers FR-NNN but FR has changed since TS was written
```

Do NOT create or modify any files. This is a read-only audit.
