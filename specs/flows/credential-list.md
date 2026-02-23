# Flow: Credential List

**Surface:** `CredentialList` in `skill-wallet.allium`
**Actor:** Holder (authenticated student with active wallet)
**Entry point:** WalletOverview "Kompetenzen" card, or bottom navigation "Kompetenzen" tab

## Context

A browsable list of all active skill credentials in the student's wallet. Each credential is an Open Badge 3.0 / W3C VC 2.0 representing a verified skill attestation issued by maindset.ACADEMY based on evidence from the SkillR journey.

## Preconditions

- `SkillWallet` exists with `status = active`
- User is the wallet owner

## Main Flow

1. `[VIEW]` User sees credential cards in a scrollable list
   - `exposes: credential.title`
   - `exposes: credential.credential_type`
   - `exposes: credential.issued_at`
   - `exposes: credential.anchor_status`
   - `exposes: credential.portfolio_items.count`
   - Each card shows: title, type badge, date, anchor icon, evidence count

2. `[VIEW]` User sees skill claims preview on each card
   - `exposes: credential.skill_claims`
   - Compact view: top 3 skill dimensions as coloured tags with level indicators
   - e.g., "Kreativitaet 0.8", "Teamfaehigkeit 0.7"

3. `[VIEW]` User sees anchor status per credential
   - `exposes: credential.is_anchored`
   - Anchored: chain-link icon (green) — "Blockchain-gesichert"
   - Pending: clock icon (yellow) — "Wird gesichert..."
   - Unanchored: dash icon (grey) — "Nicht gesichert"

4. `[NAV]` User taps a credential card
   - `navigates_to: CredentialDetail(credential)`

## Alternative Flows

### ALT-1: Empty State

> Branches from step 1 when `wallet.active_credentials.count = 0`.

1a. `[VIEW]` User sees empty state illustration
    - "Du hast noch keine Kompetenzen gesammelt."
    - "Setze deine Reise fort, um deine ersten Skills zu entdecken."

1b. `[NAV]` Link to VUCA journey: "Reise fortsetzen"

### ALT-2: Revoke a Credential

> Branches from step 1 when user long-presses or swipes a credential card.

2a. `[VIEW]` Context menu appears: "Details", "Widerrufen"

2b. `[ACTION]` User taps "Widerrufen"
    - `triggers: HolderRequestsCredentialRevocation(wallet, credential)`
    - `requires: credential.status = active`

2c. `[VIEW]` Confirmation dialog: "Moechtest du diese Kompetenzbestaetigung wirklich widerrufen? Dies kann nicht rueckgaengig gemacht werden."

2d. `[SYSTEM]` System revokes credential
    - `rule: HolderRequestsRevocation` chains to `IssuerRevokesCredential`
    - Credential status → `revoked`
    - If blockchain consent: revocation anchored on-chain

2e. `[VIEW]` Credential card removed from active list with brief animation

### ALT-3: Filter by Type

> Available at any point from step 1.

3a. `[INPUT]` User taps filter chips: "Alle", "Reise-Abschluss", "Skill", "Endorsement", "Meilenstein"
    - Filters map to `credential_type`: `journey_completion | skill_attestation | endorsement_badge | milestone`

3b. `[VIEW]` List updates to show only matching credentials

## Error Flows

### ERR-1: Revocation of Already Revoked Credential

> Occurs at step ALT-2b when `requires: credential.status = active` fails.

User sees: "Diese Kompetenzbestaetigung wurde bereits widerrufen."
Recovery: None needed — credential is already in the desired state.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| SkillCredential | `status: active` | `status: revoked` | `HolderRequestsCredentialRevocation` |

## Navigation Map

- `CredentialDetail(credential)` — on card tap
- `WalletOverview` — back navigation
- VUCA Journey — from empty state

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | "Deine Kompetenzen" |
| Empty state title | "Noch keine Kompetenzen" |
| Empty state body | "Setze deine Reise fort, um deine ersten Skills zu entdecken." |
| Anchor: anchored | "Blockchain-gesichert" |
| Anchor: pending | "Wird gesichert..." |
| Anchor: off | "Nicht gesichert" |
| Revoke confirm | "Moechtest du diese Kompetenzbestaetigung wirklich widerrufen?" |
| Filter: all | "Alle" |
| Filter: journey | "Reise-Abschluss" |
| Filter: skill | "Skill" |
| Filter: endorsement | "Endorsement" |
| Filter: milestone | "Meilenstein" |
