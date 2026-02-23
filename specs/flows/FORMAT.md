# Flow Companion Format

> Convention for documenting UI flow sequencing alongside Allium behavioural specs.

## Purpose

Allium specs define **what** the system does: entities, rules, preconditions, postconditions, and surface contracts. Flow companion docs define **how the user experiences it**: screen sequencing, decision points, error recovery, and navigation between surfaces.

Together they form a complete picture:

```
Allium spec (skill-wallet.allium)     Flow companion (specs/flows/*.md)
─────────────────────────────────     ─────────────────────────────────
What data is visible                  In what order the user sees it
What actions are available            What sequence of steps collects the inputs
What preconditions must hold          What the user sees when they don't hold
What triggers fire                    Which button/gesture fires the trigger
```

## File naming

```
specs/flows/{surface-name-kebab-case}.md
```

One file per Allium surface. Cross-surface journeys (spanning multiple surfaces) get their own file prefixed with `journey-`:

```
specs/flows/journey-minor-onboarding.md
specs/flows/journey-share-and-verify.md
```

## Document structure

Every flow companion doc follows this template:

```markdown
# Flow: {Surface Name}

**Surface:** `{SurfaceName}` in `{spec-file}.allium`
**Actor:** {who interacts}
**Entry point:** {how the user arrives here}

## Context

One paragraph: what this surface is for, in the user's language.

## Preconditions

- What must be true before this surface is reachable
- Maps to Allium `context` and `requires` clauses

## Main Flow

Step-by-step happy path. Each step is one of:

| Step type    | Format |
|-------------|--------|
| View        | `[VIEW]` — user sees data (maps to `exposes`) |
| Input       | `[INPUT]` — user provides data |
| Action      | `[ACTION]` — user triggers something (maps to `provides`) |
| Navigate    | `[NAV]` — transition to another surface |
| System      | `[SYSTEM]` — background processing after trigger fires |

Format:

1. `[VIEW]` User sees {what}
   - `exposes: {field reference from Allium}`
2. `[INPUT]` User enters {what}
3. `[ACTION]` User taps "{button label}"
   - `triggers: {AlliumTriggerName(params)}`
   - `requires: {precondition from Allium rule}`
4. `[SYSTEM]` System {does what}
   - `rule: {RuleName}`
5. `[NAV]` Navigate to {SurfaceName}
   - `navigates_to: {reference}`

## Alternative Flows

Named branches from the main flow:

### ALT-1: {Name}

> Branches from step {N} when {condition}.

Steps...

### ALT-2: {Name}

> Branches from step {N} when {condition}.

Steps...

## Error Flows

Named error paths:

### ERR-1: {Name}

> Occurs at step {N} when `requires: {condition}` fails.

What the user sees, what they can do to recover.

## State Transitions

Table showing what states the surface cares about:

| Entity | From | To | Trigger |
|--------|------|----|---------|
| ... | ... | ... | ... |

## Navigation Map

Where users can go from here (maps to `navigates_to` and `related`):

- {SurfaceName} — when {condition}
- Back to {SurfaceName}

## Localisation Notes

User-facing text in German (product language).
Key labels, button text, status messages.
```

## Conventions

1. **Every `[ACTION]` step must reference an Allium trigger.** If you can't name the trigger, the Allium spec is missing a rule.
2. **Every `[VIEW]` step should reference `exposes` fields.** If you're showing data not in `exposes`, the surface contract is incomplete.
3. **Error flows map 1:1 to `requires` failures.** For each `requires` clause in the triggered rule, there should be an error flow describing what the user sees.
4. **German labels in quotes.** Button text, headings, and status messages use the product language.
5. **No pixel-level layout.** Describe information hierarchy, not CSS. "User sees X above Y" is fine. "X is in a 3-column grid with 16px padding" is not.
6. **Reference config values, not magic numbers.** "Duration limited to `config.max_grant_duration`" not "Duration limited to 365 days".
