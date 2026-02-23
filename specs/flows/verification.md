# Flow: Verification

**Surface:** `VerificationView` in `skill-wallet.allium`
**Actor:** Verifier (school, employer, institution — no SkillR account required)
**Entry point:** Access link or QR code shared by the student

## Context

A verifier wants to check whether a student's skill credentials are genuine and unmodified. They received a link (URL or QR code) from the student, containing an access token. The verification page shows the credentials the student chose to share, with on-chain tamper-resistance verification for each credential and portfolio item. No SkillR account is needed — the page is publicly accessible with a valid token.

## Preconditions

- `AccessGrant` exists with matching `access_token`
- Grant is valid: `status = active`, `expires_at > now`, access count under limit

## Main Flow

1. `[VIEW]` Verifier opens link or scans QR code
   - URL contains the `access_token`
   - Page loads without login prompt

2. `[VIEW]` Verifier sees share context
   - `exposes: wallet.owner.display_name`
   - `exposes: grant.purpose`
   - `exposes: grant.expires_at`
   - Heading: "Skill-Wallet von {Student-Name}"
   - Sub-heading: "Geteilt fuer: {purpose}"
   - Expiry: "Gueltig bis: {date}"

3. `[VIEW]` Verifier sees credential list (scoped by grant)
   - If `grant.scope = full_wallet`: all active credentials
   - If `grant.scope = selected_credentials`: only credentials in `grant.credential_ids`
   - Per credential:
     - `exposes: credential.title`
     - `exposes: credential.skill_claims`
     - `exposes: credential.is_anchored`
     - `exposes: credential.anchor.verification_url` (when anchored)
     - `exposes: credential.portfolio_items.count`

4. `[VIEW]` Verifier sees verification status badges per credential
   - Anchored: green shield "Blockchain-verifizierbar"
   - Not anchored: grey shield "Nicht blockchain-gesichert"
   - Each credential shows skill claims as compact tags

5. `[ACTION]` Verifier taps "Verifizieren" on a credential
   - `triggers: VerifierRequestsVerification(access_token, credential_id)`
   - `requires: grant.is_valid`
   - `requires: credential_id in grant.credential_ids or grant.scope = full_wallet`
   - `requires: credential.is_active`

6. `[SYSTEM]` System verifies credential against blockchain
   - `rule: VerifyCredential`
   - Recomputes hash from current credential data
   - Compares with on-chain anchor via Merkle proof
   - Increments `grant.access_count`

7. `[VIEW]` Verifier sees verification result
   - **Success**: green checkmark
     - "Verifiziert — Daten unveraendert seit {anchor.anchored_at}"
     - "Ausgestellt von: maindset.ACADEMY"
     - "Blockchain: {chain.name}, Tx: {transaction_hash (truncated)}"
     - Link to block explorer for full transparency
   - **Failure**: red warning
     - "Warnung — Datenintegritaet nicht bestaetigbar"
     - "Die aktuellen Daten stimmen nicht mit dem Blockchain-Eintrag ueberein."

8. `[VIEW]` Verifier expands credential to see portfolio items
   - Thumbnails / file icons for each linked item
   - Each item shows its own anchor status

9. `[ACTION]` Verifier taps "Beweis verifizieren" on a portfolio item
   - `triggers: VerifierRequestsItemVerification(access_token, item_id)`
   - `requires: grant.is_valid`
   - `requires: item_id in grant.item_ids or grant.scope in [full_wallet, selected_credentials]`
   - `requires: item.is_tamper_evident`

10. `[SYSTEM]` System verifies portfolio item
    - `rule: VerifyPortfolioItem`
    - Fetches file from student's Pod
    - Recomputes SHA-256 hash of file bytes
    - Compares with stored `content_hash`
    - Verifies anchor against blockchain

11. `[VIEW]` Verifier sees item verification result
    - **Hash match + chain verified**: "Beweis unveraendert und blockchain-gesichert seit {date}"
    - **Hash mismatch**: "Warnung — Der Beweis wurde nach der Sicherung veraendert"
    - **Chain not verified**: "Blockchain-Verifizierung nicht moeglich"

## Alternative Flows

### ALT-1: Full Wallet View

> When `grant.scope = full_wallet`.

All active credentials shown. Verifier gets a complete picture of the student's skill profile. May include a summary radar chart aggregating all skill claims across credentials.

### ALT-2: Selected Items Only

> When `grant.scope = selected_items`.

Only specific portfolio items are visible, without their parent credentials. Useful for sharing specific proof artefacts (e.g., a project video) without revealing the full skill profile.

### ALT-3: Download Credential as JSON-LD

> Available per credential for technical verifiers.

3a. `[ACTION]` Verifier taps "Als JSON-LD herunterladen"
    - Downloads the W3C VC 2.0 / Open Badge 3.0 JSON-LD document
    - Can be independently verified with any VC-compatible tool

### ALT-4: View Without Blockchain (Unanchored Credentials)

> When credential has `anchor_status != anchored`.

5a. `[VIEW]` "Verifizieren" button replaced with info text
    - "Diese Kompetenzbestaetigung ist nicht blockchain-gesichert."
    - "Die Daten werden von maindset.ACADEMY bestaetigt, koennen aber nicht unabhaengig verifiziert werden."
    - Issuer signature still shown as basic trust anchor

## Error Flows

### ERR-1: Invalid or Expired Token

> Occurs at page load when `AccessGrant` not found or `grant.is_valid = false`.

User sees: "Dieser Zugangslink ist ungueltig oder abgelaufen."
Subtext: "Bitte die Person, die den Link geteilt hat, um einen neuen Zugang."
Recovery: Student creates a new AccessGrant.

### ERR-2: Access Count Exceeded

> Occurs when `grant.max_access_count != null and grant.access_count >= grant.max_access_count`.

User sees: "Die maximale Anzahl an Zugriffen fuer diesen Link wurde erreicht."
Recovery: Student creates a new AccessGrant with higher limit.

### ERR-3: Credential No Longer Active

> Occurs at step 5 when `requires: credential.is_active` fails (credential revoked or expired).

User sees: "Diese Kompetenzbestaetigung ist nicht mehr gueltig."
If revoked: "Widerrufen am {revoked_at}. Grund: {revocation_reason}"
If expired: "Abgelaufen am {expires_at}."

### ERR-4: Pod Unreachable During Item Verification

> Occurs at step 10 when file cannot be fetched from student's Pod.

User sees: "Der Beweis konnte nicht abgerufen werden. Der Speicher des Nutzers ist derzeit nicht erreichbar."
Recovery: Verifier can retry later. Credential-level verification (hash-only, no file fetch) still works.

### ERR-5: Hash Mismatch

> Occurs at step 10 when recomputed hash does not match stored `content_hash`.

User sees: "Warnung — Der Beweis wurde nach der Blockchain-Sicherung veraendert. Die aktuelle Version entspricht nicht dem gesicherten Original."
This is a legitimate integrity failure — the file in the Pod was modified after anchoring.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| AccessGrant | `access_count: N` | `access_count: N+1` | `VerifierRequestsVerification` or `VerifierRequestsItemVerification` |

## Navigation Map

- This is a standalone page — no app navigation frame
- Credential detail: expand/collapse inline
- Portfolio item preview: inline or lightbox
- Block explorer link: external (opens in new tab)
- JSON-LD download: file download
- No navigation to app internals (verifier is not a SkillR user)

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | "Skill-Wallet von {Name}" |
| Purpose label | "Geteilt fuer: {purpose}" |
| Expiry label | "Gueltig bis: {date}" |
| Verify button | "Verifizieren" |
| Verify item button | "Beweis verifizieren" |
| Verified | "Verifiziert — Daten unveraendert seit {date}" |
| Issuer label | "Ausgestellt von: maindset.ACADEMY" |
| Chain label | "Blockchain: {chain}, Tx: {hash}" |
| Warning: mismatch | "Warnung — Datenintegritaet nicht bestaetigbar" |
| Warning: item changed | "Der Beweis wurde nach der Sicherung veraendert" |
| Not anchored | "Nicht blockchain-gesichert" |
| Item verified | "Beweis unveraendert und blockchain-gesichert seit {date}" |
| Invalid token | "Zugangslink ist ungueltig oder abgelaufen" |
| Count exceeded | "Maximale Anzahl an Zugriffen erreicht" |
| Credential expired | "Nicht mehr gueltig" |
| Pod offline | "Speicher nicht erreichbar" |
| Download | "Als JSON-LD herunterladen" |
| Unanchored note | "Nicht unabhaengig verifizierbar" |
