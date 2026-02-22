# Regenerate Interactive Roadmap Report

Regenerate the interactive HTML roadmap report at `docs/ops/roadmap-interactive.html`.

## Steps

1. **Extract FR data** — Run a Python script that reads all `docs/features/FR-*.md` files and extracts: id, title, status, priority, entity, problem, solution, acceptance criteria, dependencies, and notes. Output as compact JSON to `/tmp/fr_compact.json`.

```bash
python3 -c "
import os, json, re

fr_data = []
for fname in sorted(os.listdir('docs/features')):
    if not fname.startswith('FR-') and not fname.startswith('DFR-'):
        continue
    if not fname.endswith('.md'):
        continue
    fpath = os.path.join('docs/features', fname)
    with open(fpath) as f:
        content = f.read()

    frid_m = re.search(r'((?:D?FR)-\d+)', fname)
    if not frid_m:
        continue
    frid = frid_m.group()
    title_m = re.search(r'^# (?:D?FR)-\d+: (.+)', content)
    title = title_m.group(1) if title_m else fname

    status_m = re.search(r'\*\*Status:\*\*\s*(.+)', content)
    fstatus = status_m.group(1).strip() if status_m else ''

    priority_m = re.search(r'\*\*Priority:\*\*\s*(.+)', content)
    fpriority = priority_m.group(1).strip() if priority_m else ''

    entity_m = re.search(r'\*\*Entity:\*\*\s*(.+)', content)
    fentity = entity_m.group(1).strip() if entity_m else ''

    sections = {}
    current = None
    lines = content.split('\n')
    for line in lines:
        if line.startswith('## '):
            current = line[3:].strip()
            sections[current] = []
        elif current:
            sections[current].append(line)

    problem = '\n'.join(sections.get('Problem', [])).strip()[:400]
    solution = '\n'.join(sections.get('Solution', [])).strip()[:400]
    criteria_raw = sections.get('Acceptance Criteria', [])
    criteria = [l.strip().lstrip('- [ ] ').lstrip('- [x] ').lstrip('- ') for l in criteria_raw if l.strip().startswith('- ')]
    deps = '\n'.join(sections.get('Dependencies', [])).strip()[:300]
    notes = '\n'.join(sections.get('Notes', [])).strip()[:300]

    entry = {'id': frid, 'title': title, 'status': fstatus, 'priority': fpriority}
    if fentity: entry['entity'] = fentity
    if problem: entry['problem'] = problem
    if solution: entry['solution'] = solution
    if criteria: entry['criteria'] = criteria
    if deps: entry['deps'] = deps
    if notes: entry['notes'] = notes
    fr_data.append(entry)

with open('/tmp/fr_compact.json', 'w') as f:
    json.dump(fr_data, f, ensure_ascii=False, separators=(',', ':'))
print(f'Extracted {len(fr_data)} feature requests')
"
```

2. **Read ROADMAP.md** — Read `docs/ROADMAP.md` to get the current phase definitions, FR assignments per phase, exit criteria, and their completion status. Update the PHASES array in the HTML template to match the current roadmap.

3. **Assemble HTML** — The interactive roadmap HTML has three parts:
   - **Header** (`<style>` + layout HTML + `const FR_DATA =`)
   - **JSON data** (the extracted FR data from step 1)
   - **Footer** (`;` + PHASES definition + JavaScript logic + `</html>`)

   The template is the existing `docs/ops/roadmap-interactive.html`. Update the PHASES array, the stats counters, and the entity badges to reflect current state.

4. **Write output** — Write the assembled HTML to `docs/ops/roadmap-interactive.html`.

5. **Also regenerate the static report** — Update `docs/ops/roadmap-status-report.html` with the same phase/FR data.

6. **Report** — Tell the user:
   - How many FRs were extracted
   - How many phases, how many complete
   - File path to open: `open docs/ops/roadmap-interactive.html`

## Entity Badges (keep current)

```
SkillR — Kids Education Brand & Sub-Branding Provider
maindset.ACADEMY — New Learning Education Brand
maindfull.LEARNING — New Learning AI Engine (by maindset.ACADEMY)
```

## Key Design Decisions

- Single self-contained HTML file (no external dependencies)
- All FR data embedded as inline JSON
- Clickable FR cards open detail modals (Problem, Solution, Criteria, Dependencies, Notes)
- Filter by status (Done / In Progress / Draft / Must) and full-text search
- Phase cards with progress bars and exit criteria checklists
- Dark theme, responsive, keyboard navigation (Escape to close modal)
- ~160KB total file size
