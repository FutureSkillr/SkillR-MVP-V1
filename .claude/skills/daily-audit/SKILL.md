---
name: daily-audit
description: Run all three audits (FR, Tests, Security) in parallel and produce a combined health report
allowed-tools: Read, Glob, Grep, Bash, Task
---

# Daily Audit — Combined Health Report

Run all three audit skills in parallel and produce a single combined health report for the project.

## Procedure

### Step 1: Run All Audits in Parallel

Launch three Task subagents simultaneously:

1. **FR Audit** — Follow the full procedure from `.claude/skills/audit-fr/SKILL.md`:
   - Inventory all FRs, check fields, acceptance criteria, cross-references, test coverage, staleness

2. **Test Scenario Audit** — Follow the full procedure from `.claude/skills/audit-tests/SKILL.md`:
   - Inventory all TSs, build coverage matrix, check implementation coverage, staleness

3. **Security Check** — Follow the full procedure from `.claude/skills/security-check/SKILL.md`:
   - OWASP static analysis, DSGVO compliance, new feature scan, regression check

### Step 2: Combine Results

After all three audits complete, produce a single combined report.

## Output Format

```
# Daily Audit Report — {date}

## Executive Summary

| Audit | Status | Critical | Warnings |
|-------|--------|----------|----------|
| Feature Requests | {PASS/WARN/FAIL} | N | N |
| Test Scenarios | {PASS/WARN/FAIL} | N | N |
| Security | {PASS/WARN/FAIL} | N | N |

**Overall: {HEALTHY / NEEDS ATTENTION / ACTION REQUIRED}**

---

## 1. Feature Request Audit
{Full FR audit report from audit-fr}

---

## 2. Test Scenario Audit
{Full test audit report from audit-tests}

---

## 3. Security Inspection
{Full security report from security-check}

---

## Action Items (Prioritized)

### Immediate (block deployment)
1. {item}

### This Week
1. {item}

### Backlog
1. {item}
```

### Verdict Rules

- **HEALTHY**: Zero critical issues across all three audits
- **NEEDS ATTENTION**: Warnings exist but no critical issues
- **ACTION REQUIRED**: One or more critical issues found

Do NOT create or modify any files. This is a read-only audit.
