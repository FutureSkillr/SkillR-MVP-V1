# Flow: Access Grant Manager

**Surface:** `AccessGrantManager` in `skill-wallet.allium`
**Actor:** Holder (authenticated student with active wallet)
**Entry point:** WalletOverview "Freigaben" card, or via "Teilen" from CredentialDetail

## Context

This is where the student controls who can see their credentials and portfolio items. Every access grant is time-bounded, purpose-limited, and scope-controlled. The student can revoke any grant at any time. For minors, guardian consent for data sharing is required before any grant can be created.

## Preconditions

- `SkillWallet` exists with `status = active`
- For minors: `guardian_link.consent_data_sharing = true`

## Main Flow

1. `[VIEW]` User sees list of active access grants
   - `exposes: grant.grantee_name`
   - `exposes: grant.purpose`
   - `exposes: grant.scope`
   - `exposes: grant.granted_at`
   - `exposes: grant.expires_at`
   - `exposes: grant.access_count`
   - `exposes: grant.days_remaining`
   - Each grant as a card: name, purpose, expiry countdown, access counter

2. `[VIEW]` User sees grant scope summary per card
   - "Gesamtes Wallet" / "3 Kompetenzen" / "5 Beweise"
   - Access count: "2x aufgerufen"

3. `[ACTION]` User taps "Zugriff teilen" to create new grant
   - Opens grant creation wizard (steps 4-10)

4. `[INPUT]` Step 1 of wizard: Choose scope
   - Three options as selectable cards:
     - "Gesamtes Wallet" (`scope: full_wallet`)
     - "Bestimmte Kompetenzen" (`scope: selected_credentials`)
     - "Bestimmte Beweise" (`scope: selected_items`)

5. `[INPUT]` Step 2 (conditional): Select items
   - If `selected_credentials`: show credential picker from `wallet.active_credentials`
   - If `selected_items`: show portfolio item picker from `wallet.portfolio_items`
   - If `full_wallet`: skip this step
   - Multi-select with checkboxes

6. `[INPUT]` Step 3: Enter grantee details
   - Grantee name (required): "Wer soll Zugriff bekommen?"
   - Grantee email (optional): "E-Mail-Adresse (optional)"

7. `[INPUT]` Step 4: Set purpose
   - Purpose (required): free text or selectable presets
   - Presets: "Bewerbung", "Schulanmeldung", "Praktikum", "Stipendium", "Anderes"

8. `[INPUT]` Step 5: Set duration
   - Duration slider: 1 day to `config.max_grant_duration` (365 days)
   - Default: `config.default_grant_duration` (30 days)
   - Show calculated expiry date

9. `[VIEW]` Step 6: Review summary
   - "Zugriff fuer: {grantee_name}"
   - "Zweck: {purpose}"
   - "Umfang: {scope description}"
   - "Gueltig bis: {expiry date}"

10. `[ACTION]` User taps "Zugriff erteilen"
    - `triggers: HolderGrantsAccess(wallet, grantee_name, grantee_email?, scope, credential_ids, item_ids, purpose, duration)`
    - `requires: wallet.status = active`
    - `requires: wallet.active_grants.count < config.max_active_grants`
    - `requires: duration <= config.max_grant_duration`
    - `requires: not wallet.is_minor or wallet.guardian_link.consent_data_sharing`

11. `[SYSTEM]` System creates access grant
    - `rule: GrantAccess`
    - Generates one-time access token

12. `[VIEW]` User sees share options
    - Access link (copyable)
    - QR code for the link
    - "Per E-Mail senden" (if email provided)
    - "Link kopieren"

13. `[NAV]` Return to grant list — new grant appears at top

## Alternative Flows

### ALT-1: Revoke an Existing Grant

> Available from step 1 on any active grant card.

1a. `[ACTION]` User swipes grant card or taps "Widerrufen"
    - `triggers: HolderRevokesAccess(wallet, grant)`
    - `requires: grant.wallet = wallet`
    - `requires: grant.status = active`

1b. `[VIEW]` Confirmation: "Zugriff fuer {grantee_name} widerrufen? Der Link wird sofort ungueltig."

1c. `[SYSTEM]` System revokes grant
    - `rule: RevokeAccess`
    - `grant.status = revoked`, `grant.revoked_at = now`

1d. `[VIEW]` Grant card moves to "Abgelaufen" section with "Widerrufen" badge

### ALT-2: Pre-selected Credential (from CredentialDetail)

> When navigated from CredentialDetail "Teilen" action.

3a. Wizard opens at step 4 with:
    - `scope` pre-set to `selected_credentials`
    - The originating credential pre-selected in step 5
    - User can add more credentials or proceed

### ALT-3: View Expired/Revoked Grants

> Available below the active grants list.

E1. `[VIEW]` Collapsed section "Vergangene Freigaben" with count badge

E2. `[ACTION]` User expands section
    - Shows expired and revoked grants
    - Each with status badge: "Abgelaufen" / "Widerrufen"
    - Shows total access count: "Wurde N-mal aufgerufen"

## Error Flows

### ERR-1: Grant Limit Reached

> Occurs at step 10 when `requires: wallet.active_grants.count < config.max_active_grants` fails.

User sees: "Du hast die maximale Anzahl aktiver Freigaben erreicht ({config.max_active_grants}). Widerrufe eine bestehende Freigabe, um eine neue zu erstellen."
Recovery: User revokes an existing grant, then retries.

### ERR-2: Duration Exceeds Maximum

> Occurs at step 8 when user somehow exceeds the slider maximum.

User sees: "Maximale Gueltigkeitsdauer: {config.max_grant_duration} Tage."
Recovery: User adjusts the slider.

### ERR-3: Minor Without Data Sharing Consent

> Occurs at step 10 when `requires: not wallet.is_minor or wallet.guardian_link.consent_data_sharing` fails.

User sees: "Dein Erziehungsberechtigter muss dem Teilen von Daten zustimmen, bevor du Zugriff erteilen kannst."
Recovery: Navigate to GuardianConsentView to request updated consent with `consent_data_sharing = true`.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| AccessGrant | (new) | `status: active` | `HolderGrantsAccess` |
| AccessGrant | `status: active` | `status: revoked` | `HolderRevokesAccess` |
| AccessGrant | `status: active` | `status: expired` | `AccessGrantExpires` (temporal) |

## Navigation Map

- Grant creation wizard — multi-step overlay or sheet
- `CredentialList` — from credential picker in step 5
- `PortfolioView` — from item picker in step 5
- `GuardianConsentView` — from ERR-3 recovery
- `WalletOverview` — back navigation

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | "Zugriff verwalten" |
| Create button | "Zugriff teilen" |
| Revoke button | "Widerrufen" |
| Confirm grant | "Zugriff erteilen" |
| Scope: full | "Gesamtes Wallet" |
| Scope: credentials | "Bestimmte Kompetenzen" |
| Scope: items | "Bestimmte Beweise" |
| Purpose presets | "Bewerbung", "Schulanmeldung", "Praktikum", "Stipendium", "Anderes" |
| Duration label | "Gueltigkeitsdauer" |
| Expiry label | "Gueltig bis: {date}" |
| Access count | "{N}x aufgerufen" |
| Days remaining | "Noch {N} Tage gueltig" |
| Revoke confirm | "Zugriff fuer {name} widerrufen? Der Link wird sofort ungueltig." |
| Limit reached | "Maximale Anzahl aktiver Freigaben erreicht." |
| Expired section | "Vergangene Freigaben" |
| Share: copy | "Link kopieren" |
| Share: email | "Per E-Mail senden" |
| Share: QR | QR code (no label needed) |
| Minor blocked | "Dein Erziehungsberechtigter muss dem Teilen von Daten zustimmen." |
