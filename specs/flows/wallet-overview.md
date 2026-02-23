# Flow: Wallet Overview

**Surface:** `WalletOverview` in `skill-wallet.allium`
**Actor:** Holder (authenticated student with active wallet)
**Entry point:** Main navigation tab "Skill-Wallet" or home screen card

## Context

The central dashboard for the student's Skill-Wallet. Shows identity, credential count, portfolio size, blockchain status, and active access grants at a glance. This is the landing page whenever the student opens their wallet.

## Preconditions

- User is authenticated (Firebase Auth)
- `SkillWallet` exists for this user with `status = active`
- `PodConnection` is connected (`is_connected = true`)

## Main Flow

1. `[VIEW]` User sees wallet identity card
   - `exposes: wallet.did`
   - `exposes: wallet.status`
   - `exposes: wallet.created_at`
   - DID shown as a human-readable short form (e.g., "skillr.de/max")

2. `[VIEW]` User sees summary statistics
   - `exposes: wallet.credential_count`
   - `exposes: wallet.portfolio_item_count`
   - `exposes: wallet.active_grants.count`
   - Three cards: "N Kompetenzen", "N Beweise", "N aktive Freigaben"

3. `[VIEW]` User sees blockchain status
   - `exposes: wallet.blockchain_consent`
   - Shield icon: green (enabled), grey (disabled)
   - Label: "Blockchain-Sicherung aktiv" or "Blockchain-Sicherung inaktiv"

4. `[VIEW]` If minor, user sees guardian status
   - `exposes: wallet.is_minor`
   - `exposes: wallet.has_guardian`
   - Status indicator: green (guardian confirmed), yellow (pending), red (expired)

5. `[ACTION]` User taps blockchain toggle to enable
   - `triggers: HolderEnablesBlockchainConsent(wallet)`
   - `requires: not wallet.blockchain_consent`
   - `requires: not wallet.is_minor or wallet.guardian_link.consent_blockchain`

6. `[SYSTEM]` System enables consent and queues unanchored items
   - `rule: EnableBlockchainConsent`
   - All existing unanchored portfolio items queued for Merkle batch

7. `[NAV]` User taps a summary card to navigate deeper
   - `navigates_to: CredentialList(wallet)` — from "Kompetenzen" card
   - `navigates_to: PortfolioView(wallet)` — from "Beweise" card
   - `navigates_to: AccessGrantManager(wallet)` — from "Freigaben" card

## Alternative Flows

### ALT-1: Disable Blockchain

> Branches from step 5 when blockchain is currently enabled.

5a. `[ACTION]` User taps blockchain toggle to disable
    - `triggers: HolderDisablesBlockchainConsent(wallet)`
    - `requires: wallet.blockchain_consent`

5b. `[VIEW]` Confirmation dialog: "Bestehende Sicherungen bleiben erhalten. Neue Daten werden nicht mehr gesichert."

5c. `[SYSTEM]` System sets `blockchain_consent = false`
    - `rule: DisableBlockchainConsent`
    - Existing anchors remain on-chain (immutable)

### ALT-2: Minor Without Guardian

> Branches from step 4 when `wallet.is_minor` and `not wallet.has_guardian`.

4a. `[VIEW]` Prompt: "Du brauchst die Zustimmung eines Erziehungsberechtigten."

4b. `[NAV]` Navigate to `GuardianConsentView(wallet)`
    - `navigates_to: GuardianConsentView(wallet) when wallet.is_minor`

## Error Flows

### ERR-1: Blockchain Enable Blocked (Minor, No Guardian Consent)

> Occurs at step 5 when `requires: not wallet.is_minor or wallet.guardian_link.consent_blockchain` fails.

User sees: "Dein Erziehungsberechtigter muss der Blockchain-Sicherung zustimmen."
Recovery: Navigate to GuardianConsentView to request updated consent.

### ERR-2: Wallet Suspended

> Occurs before step 1 when `wallet.status = suspended`.

User sees: "Dein Skill-Wallet ist pausiert. Bitte lass die Zustimmung erneuern."
Recovery: System shows link to re-request guardian consent.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| SkillWallet | `blockchain_consent: false` | `blockchain_consent: true` | `HolderEnablesBlockchainConsent` |
| SkillWallet | `blockchain_consent: true` | `blockchain_consent: false` | `HolderDisablesBlockchainConsent` |
| PortfolioItem (batch) | `anchor_status: unanchored` | `anchor_status: pending` | `EnableBlockchainConsent` queues items |

## Navigation Map

- `CredentialList` — always
- `PortfolioView` — always
- `AccessGrantManager` — always
- `GuardianConsentView` — when `wallet.is_minor`
- Back to main app navigation

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | "Dein Skill-Wallet" |
| Credential count | "N Kompetenzen" |
| Portfolio count | "N Beweise" |
| Grant count | "N aktive Freigaben" |
| Blockchain on | "Blockchain-Sicherung aktiv" |
| Blockchain off | "Blockchain-Sicherung inaktiv" |
| Guardian OK | "Erziehungsberechtigter bestaetigt" |
| Guardian missing | "Zustimmung erforderlich" |
| Data sovereignty | "Deine Daten gehoeren dir. Du entscheidest, wer sie sieht." |
