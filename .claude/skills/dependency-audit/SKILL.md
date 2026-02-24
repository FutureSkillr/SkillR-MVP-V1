---
name: dependency-audit
description: Audit Go modules and npm packages for outdated, vulnerable, or unused dependencies
allowed-tools: Read, Glob, Grep, Bash
---

# Dependency Audit — Supply Chain Health Check

Check Go modules and npm packages for outdated versions, known vulnerabilities, and unused dependencies.

## When to Run

Weekly, before releases, or after adding new dependencies.

## Procedure

### 1. Go Module Audit

#### 1a. List Direct Dependencies

```bash
cd backend && go list -m -json all 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin.read().split('}\n{'):
    line = line.strip().strip('{').strip('}')
    if not line: continue
    try:
        obj = json.loads('{' + line + '}')
        if not obj.get('Indirect') and obj.get('Path','').count('/') > 0:
            print(f\"{obj['Path']}  {obj.get('Version','?')}\")
    except: pass
"
```

#### 1b. Check for Available Updates

```bash
cd backend && go list -m -u -json all 2>/dev/null | python3 -c "
import sys, json
updates = []
for line in sys.stdin.read().split('}\n{'):
    line = line.strip().strip('{').strip('}')
    if not line: continue
    try:
        obj = json.loads('{' + line + '}')
        if obj.get('Update') and not obj.get('Indirect'):
            updates.append(f\"{obj['Path']}  {obj.get('Version','?')} → {obj['Update'].get('Version','?')}\")
    except: pass
for u in sorted(updates): print(u)
"
```

#### 1c. Vulnerability Scan

```bash
cd backend && go install golang.org/x/vuln/cmd/govulncheck@latest 2>/dev/null
cd backend && govulncheck ./... 2>&1 || echo "govulncheck not available"
```

#### 1d. Tidy Check

```bash
cd backend && go mod tidy -diff 2>&1
```

If output is non-empty, `go.mod` or `go.sum` is not tidy.

### 2. NPM Audit

#### 2a. Vulnerability Scan

```bash
cd frontend && npm audit --json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    vulns = data.get('vulnerabilities', {})
    for name, info in sorted(vulns.items()):
        severity = info.get('severity', '?')
        via = ', '.join(v if isinstance(v, str) else v.get('name','?') for v in info.get('via', []))
        print(f'{severity:8s}  {name}  (via {via})')
except: print('npm audit parse failed')
"
```

#### 2b. Outdated Packages

```bash
cd frontend && npm outdated --json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for name, info in sorted(data.items()):
        current = info.get('current', '?')
        wanted = info.get('wanted', '?')
        latest = info.get('latest', '?')
        if current != latest:
            flag = ' ⚠ MAJOR' if current.split('.')[0] != latest.split('.')[0] else ''
            print(f'{name}  {current} → {latest}{flag}')
except: print('npm outdated parse failed')
"
```

#### 2c. Unused Dependencies

Check if any declared dependencies are not imported anywhere:

```bash
cd frontend && for dep in \$(node -e "const p=require('./package.json'); Object.keys(p.dependencies||{}).forEach(d=>console.log(d))"); do
  if ! grep -rq \"from ['\\\"]${dep}\" --include='*.ts' --include='*.tsx' . 2>/dev/null && \
     ! grep -rq \"import ['\\\"]${dep}\" --include='*.ts' --include='*.tsx' . 2>/dev/null; then
    echo "possibly unused: ${dep}"
  fi
done
```

### 3. License Check

```bash
cd backend && go-licenses check ./... 2>/dev/null || echo "go-licenses not installed (optional)"
```

### 4. Generate Report

```
# Dependency Audit Report — {YYYY-MM-DD}

## Go Modules

| Metric | Count |
|--------|-------|
| Direct dependencies | {N} |
| Updates available | {N} |
| Vulnerabilities | {N} |
| Tidy | yes/no |

### Vulnerabilities (if any)
{govulncheck output}

### Available Updates
| Package | Current | Latest |
|---------|---------|--------|
| ... | ... | ... |

## NPM Packages

| Metric | Count |
|--------|-------|
| Dependencies | {N} |
| Vulnerabilities | {critical}/{high}/{moderate}/{low} |
| Outdated | {N} |
| Possibly unused | {N} |

### Vulnerabilities (if any)
| Severity | Package | Via |
|----------|---------|-----|
| ... | ... | ... |

### Outdated (major version changes)
| Package | Current | Latest |
|---------|---------|--------|
| ... | ... | ... |

## Action Items

- [ ] {Fix critical/high vulnerabilities}
- [ ] {Update major version packages (test first)}
- [ ] {Remove unused dependencies}
- [ ] {Run go mod tidy if needed}
```
