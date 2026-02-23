# Flow: Credential Detail

**Surface:** `CredentialDetail` in `skill-wallet.allium`
**Actor:** Holder (authenticated student with active wallet)
**Entry point:** Tap on credential card in CredentialList

## Context

Full view of a single skill credential — its claims, evidence chain, blockchain verification status, and linked portfolio items. This is where the student understands *why* the system says they have a particular skill, and where they can attach additional proof artefacts.

## Preconditions

- `SkillCredential` exists with `wallet.owner = holder`
- Credential is navigated to from CredentialList

## Main Flow

1. `[VIEW]` User sees credential header
   - `exposes: credential.title`
   - `exposes: credential.description`
   - `exposes: credential.credential_type`
   - `exposes: credential.issued_at`
   - `exposes: credential.expires_at`
   - Type badge, issuer badge ("Ausgestellt von maindset.ACADEMY")

2. `[VIEW]` User sees issuer and proof information
   - `exposes: credential.issuer_did`
   - `exposes: credential.proofs`
   - Issuer shown as trusted entity: "maindset.ACADEMY (verifiziert)"
   - Proof type icons: signature, chain, endorser

3. `[VIEW]` User sees skill claims as radar/spider chart
   - `exposes: credential.skill_claims`
   - Each claim: dimension name, category colour, level bar
   - Radar chart for multi-dimensional credentials
   - Single bar for single-claim credentials

4. `[VIEW]` User sees blockchain verification status
   - `exposes: credential.is_anchored`
   - `exposes: credential.anchor.verification_url` (when anchored)
   - Anchored: "Blockchain-gesichert seit [date]" with verification link
   - QR code generated from `verification_url` for sharing

5. `[VIEW]` User sees linked portfolio items as gallery
   - `exposes: item.file_metadata` for each item
   - `exposes: item.item_type`
   - `exposes: item.description`
   - `exposes: item.is_tamper_evident`
   - Thumbnails for images/videos, file icons for documents
   - Each item shows its own anchor status badge

6. `[ACTION]` User taps "Beweis hinzufuegen" to upload evidence
   - `triggers: UploadPortfolioItem(credential.wallet, file_metadata, file_bytes, credential, item_type, description?, tags, user_upload)`
   - `requires: wallet.status = active`
   - `requires: file_metadata.size_bytes <= config.max_file_size_bytes`
   - `requires: file_metadata.mime_type in config.allowed_mime_types`
   - Opens upload flow (see steps 7-10)

7. `[INPUT]` User selects file from device
   - Camera, gallery, or file picker depending on device

8. `[INPUT]` User optionally adds description and tags
   - Description: free text
   - Tags: selectable chips + custom entry

9. `[INPUT]` User selects item type
   - "Foto", "Video", "Audio", "Dokument", "Code", "Anderes"
   - Auto-detected from MIME type, user can override

10. `[ACTION]` User taps "Hochladen"
    - `triggers: UploadPortfolioItem(...)`

11. `[SYSTEM]` System processes upload
    - `rule: UploadPortfolioItem` — computes SHA-256 hash, stores in Pod
    - `rule: QueuePortfolioItemForAnchoring` — if blockchain consent enabled

12. `[VIEW]` New item appears in gallery with pending anchor status

## Alternative Flows

### ALT-1: Share Verification Link

> Branches from step 4 when credential is anchored.

4a. `[ACTION]` User taps "Teilen" on verification QR code
    - Opens system share sheet with `verification_url`
    - Or: user can tap "Zugriff teilen" to create a formal AccessGrant

4b. `[NAV]` Navigate to `AccessGrantManager` with this credential pre-selected

### ALT-2: Revoke Credential

> Available from overflow menu at any step.

R1. `[ACTION]` User taps overflow menu → "Widerrufen"
    - `triggers: HolderRequestsCredentialRevocation(credential.wallet, credential)`
    - `requires: credential.status = active`

R2. `[VIEW]` Confirmation: "Diese Kompetenzbestaetigung wird unwiderruflich widerrufen. Bestehende Blockchain-Eintraege bleiben als historischer Nachweis erhalten."

R3. `[SYSTEM]` System revokes credential and anchors revocation
    - `rule: HolderRequestsRevocation` → `IssuerRevokesCredential` → `AnchorRevocation`

R4. `[NAV]` Return to CredentialList (credential removed from active list)

### ALT-3: View Portfolio Item Detail

> Branches from step 5 when user taps a portfolio item.

5a. `[VIEW]` Full-screen preview of the item
    - Images: full resolution
    - Videos: inline player
    - PDFs: document viewer
    - Code: syntax-highlighted view
    - Audio: waveform player

5b. `[VIEW]` Item verification badge
    - "Dieser Beweis ist blockchain-gesichert und unveraendert seit [date]."
    - Or: "Dieser Beweis ist noch nicht gesichert."

## Error Flows

### ERR-1: File Too Large

> Occurs at step 10 when `requires: file_metadata.size_bytes <= config.max_file_size_bytes` fails.

User sees: "Die Datei ist zu gross. Maximale Groesse: 50 MB."
Recovery: User selects a smaller file or compresses the original.

### ERR-2: Unsupported File Type

> Occurs at step 10 when `requires: file_metadata.mime_type in config.allowed_mime_types` fails.

User sees: "Dieser Dateityp wird nicht unterstuetzt. Erlaubt: Bilder, Videos, Audio, PDF, Text."
Recovery: User converts file to a supported format.

### ERR-3: Pod Connection Lost

> Occurs at step 11 when Pod write fails.

User sees: "Dein Pod ist nicht erreichbar. Bitte pruefe die Verbindung."
Recovery: Navigate to PodConnectionView to reconnect.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| PortfolioItem | (new) | `anchor_status: unanchored` | `UploadPortfolioItem` |
| PortfolioItem | `anchor_status: unanchored` | `anchor_status: pending` | `QueuePortfolioItemForAnchoring` |
| SkillCredential | `status: active` | `status: revoked` | `HolderRequestsCredentialRevocation` |

## Navigation Map

- `CredentialList` — back navigation
- `AccessGrantManager` — via "Teilen" action
- `PortfolioView` — via "Alle Beweise" link
- Portfolio item full-screen preview — inline

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | credential.title (dynamic) |
| Issuer label | "Ausgestellt von maindset.ACADEMY" |
| Upload button | "Beweis hinzufuegen" |
| Upload confirm | "Hochladen" |
| Share button | "Teilen" |
| Revoke button | "Widerrufen" |
| Anchored label | "Blockchain-gesichert seit {date}" |
| Item types | "Foto", "Video", "Audio", "Dokument", "Code", "Anderes" |
| File too large | "Die Datei ist zu gross. Maximale Groesse: 50 MB." |
| Bad type | "Dieser Dateityp wird nicht unterstuetzt." |
| Pod offline | "Dein Pod ist nicht erreichbar." |
| Verified item | "Dieser Beweis ist blockchain-gesichert und unveraendert seit {date}." |
