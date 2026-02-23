---
name: readme-sync
description: Regenerate README.md to reflect current project state — run at end of each working day
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---

# README Sync — End-of-Day README Regeneration

Audit the current project state and update README.md so that a new team member always finds accurate, complete onboarding information.

## When to Run

At the end of each working day, or whenever significant structural changes have been made (new directories, new specs, new services, changed Makefile targets, changed environment variables).

## Procedure

### Step 1: Gather Current State

Read the following files to understand what has changed:

1. **`Makefile`** — scan for all `.PHONY` targets. Compare with the README's "Make targets" section. Flag any new or removed targets.

2. **`.env.example`** — scan all environment variables. Compare with the README's "Environment" table. Flag any new or removed variables.

3. **`specs/*.allium`** — list all Allium spec files. Compare with the README's "Allium specs" table. Flag any new or removed specs.

4. **`specs/flows/*.md`** — list all flow companion docs. Flag any new or removed flows.

5. **`docker-compose.yml`** and **`docker-compose.services.yml`** — check if services have changed (new containers, changed ports).

6. **`docs/features/`** — count total FRs. No need to list them all, but note the range.

7. **`docs/arch/`** — count total TCs. Note the range.

8. **`backend/migrations/`** — find the highest migration number. Note if it changed.

9. **`frontend/package.json`** — check for major dependency changes.

10. **Project structure** — run a directory listing of the top two levels. Compare with the README's "Project Structure" tree. Flag any new or removed top-level directories.

11. **`concepts/`** — check for new concept directories or document ranges.

12. **`SCOPE-MATRIX.md`** — check if the scope tags or phase structure changed.

13. **`frontend/public/icons/app-icon.png`** — verify the icon still exists and is referenced in README.

### Step 2: Identify Drift

Compare gathered state against the current README.md. Produce a drift report:

```
## README Drift Report — {date}

### New (not in README)
- {item}: {description}

### Removed (in README but gone)
- {item}: {description}

### Changed (in README but outdated)
- {item}: was {old}, now {new}

### Unchanged
- Everything else is current.
```

If the drift report shows **no changes**, output the drift report and stop. Do not rewrite the README for no reason.

### Step 3: Update README.md

If drift was found, update **only the sections that drifted**. Use the Edit tool for surgical edits — do NOT rewrite the entire file.

Preserve:
- The app icon at the top (`frontend/public/icons/app-icon.png`)
- The centered header layout
- The navigation links under the title
- The "What is SkillR?" section (only change if the product description changed)
- The "Entity Context" section (only change if entities changed)
- The "What SkillR V1.0 deliberately does NOT do" section
- The "Domain Glossary" section (add new terms, don't remove existing ones)

Update:
- **Quick Start** — if prerequisites, env vars, or startup commands changed
- **Architecture / Tech Stack** — if stack components changed
- **Project Structure** — if directories were added/removed
- **Development / Make targets** — if Makefile targets changed
- **Testing** — if test commands or K6 suites changed
- **Deployment** — if deployment process changed
- **Specifications** — if Allium specs or flow docs were added/removed
- **Key Documents** — if important docs were added/removed

### Step 4: Validate

After editing, read the updated README.md back and verify:
1. The app icon renders (path exists)
2. All referenced files exist (spot-check 5 paths)
3. No broken markdown links
4. Make targets mentioned in README are actual Makefile targets
5. Env vars mentioned in README exist in .env.example

### Step 5: Report

Output a summary of what was updated:

```
## README Sync Complete — {date}

### Changes Made
- {section}: {what changed}

### Verified
- App icon: OK
- File references: N/N checked, all exist
- Makefile targets: N/N verified
- Env vars: N/N verified

### No Changes Needed
- {sections that were already current}
```

## Rules

- **Surgical edits only.** Use Edit, not Write, for updates. Never rewrite the full file.
- **Don't invent content.** Only reflect what actually exists in the repo.
- **Keep it onboarding-focused.** A new member should be able to go from clone to running app in under 10 minutes using only the README.
- **German product text stays German.** The "What is SkillR?" section and domain glossary terms stay in their original language.
- **English for everything else.** Technical docs, commands, and code references are in English.
