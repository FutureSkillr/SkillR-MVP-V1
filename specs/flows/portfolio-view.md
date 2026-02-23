# Flow: Portfolio View

**Surface:** `PortfolioView` in `skill-wallet.allium`
**Actor:** Holder (authenticated student with active wallet)
**Entry point:** WalletOverview "Beweise" card, or bottom navigation "Portfolio" tab

## Context

The portfolio is the student's evidence library — all digital artefacts that prove their skills. Photos from projects, videos of presentations, audio recordings, code repositories, certificates (PDFs), and more. Every item is stored in the student's Solid Pod and optionally hash-anchored on the blockchain for tamper-resistance.

## Preconditions

- `SkillWallet` exists with `status = active`
- `PodConnection` is connected

## Main Flow

1. `[VIEW]` User sees portfolio items as a grid or list
   - `exposes: item.file_metadata`
   - `exposes: item.item_type`
   - `exposes: item.description`
   - `exposes: item.tags`
   - `exposes: item.is_tamper_evident`
   - `exposes: item.anchor_status`
   - `exposes: item.created_at`
   - Grid: thumbnails with type icon overlay
   - List: filename, type, date, anchor badge, linked credential

2. `[VIEW]` User sees linked credential per item (if any)
   - `exposes: item.credential.title` (when credential != null)
   - Linked items show credential title as a sub-label
   - Unlinked items show "Nicht zugeordnet"

3. `[VIEW]` User sees filter bar
   - Filter by item_type: "Alle", "Fotos", "Videos", "Audio", "Dokumente", "Code"
   - Filter by anchor status: "Alle", "Gesichert", "Ausstehend", "Nicht gesichert"
   - Filter by link status: "Alle", "Zugeordnet", "Nicht zugeordnet"

4. `[ACTION]` User taps "Beweis hochladen" (floating action button)
   - `triggers: UploadPortfolioItem(wallet, file_metadata, file_bytes, null, item_type, description?, tags, user_upload)`
   - Item uploaded without credential link (standalone evidence)
   - Opens upload flow (steps 5-9)

5. `[INPUT]` User selects file(s) from device
   - Drag-and-drop area on desktop
   - Camera, gallery, or file picker on mobile
   - Multi-file selection supported (each becomes a separate PortfolioItem)

6. `[INPUT]` User categorises each file
   - Auto-detected item_type from MIME type
   - User can override: "Foto", "Video", "Audio", "Dokument", "Code", "Anderes"

7. `[INPUT]` User optionally adds description and tags per item
   - Description: short free text
   - Tags: selectable chips from common tags + custom entry

8. `[ACTION]` User taps "Hochladen"
   - `triggers: UploadPortfolioItem(wallet, ...)`
   - `requires: wallet.status = active`
   - `requires: file_metadata.size_bytes <= config.max_file_size_bytes`
   - `requires: file_metadata.mime_type in config.allowed_mime_types`

9. `[SYSTEM]` System processes each upload
   - `rule: UploadPortfolioItem` — computes SHA-256, stores in Pod
   - `rule: QueuePortfolioItemForAnchoring` — if blockchain consent
   - Items appear in grid with pending status

10. `[ACTION]` User taps an unlinked item → "Zuordnen"
    - `triggers: LinkItemToCredential(wallet, item, credential)`
    - `requires: item.credential = null`
    - `requires: credential.is_active`

11. `[INPUT]` User selects a credential from picker
    - Shows `wallet.active_credentials` as a list
    - User taps the credential this evidence belongs to

12. `[SYSTEM]` System links item to credential
    - `rule: LinkPortfolioItemToCredential`
    - Item now shows credential title as sub-label

## Alternative Flows

### ALT-1: Empty State

> Branches from step 1 when `wallet.portfolio_items.count = 0`.

1a. `[VIEW]` Empty state with illustration
    - "Dein Portfolio ist noch leer."
    - "Lade Beweise hoch — Fotos, Videos, Dokumente, Code — alles was deine Skills zeigt."

1b. `[ACTION]` Prominent upload button: "Ersten Beweis hochladen"

### ALT-2: Batch Upload

> Branches from step 5 when user selects multiple files.

5a. `[VIEW]` Upload queue showing all selected files
    - Filename, size, auto-detected type per file
    - Total size shown
    - Individual remove buttons

5b. `[INPUT]` User can apply shared tags to all items in batch

5c. `[ACTION]` User taps "Alle hochladen"
    - Each file triggers a separate `UploadPortfolioItem`
    - Progress bar per file

### ALT-3: View Item Detail

> Branches from step 1 when user taps an item.

1a. `[VIEW]` Full-screen item preview
    - Metadata: filename, size, type, upload date
    - Anchor status with verification details
    - Linked credential (if any)
    - Content hash: shown as truncated hex for transparency

1b. `[ACTION]` "Zuordnen" button if unlinked
    - Same as step 10

## Error Flows

### ERR-1: File Too Large

> Occurs at step 8 when `requires: file_metadata.size_bytes <= config.max_file_size_bytes` fails.

User sees: "Die Datei '{filename}' ist zu gross ({size} MB). Maximum: 50 MB."
Recovery: Compress or crop the file and try again.

### ERR-2: Unsupported File Type

> Occurs at step 8 when `requires: file_metadata.mime_type in config.allowed_mime_types` fails.

User sees: "Der Dateityp '{mime_type}' wird nicht unterstuetzt."
Recovery: Convert to a supported format (list shown).

### ERR-3: Pod Storage Full or Unreachable

> Occurs at step 9 when Pod write fails.

User sees: "Dein Pod ist nicht erreichbar oder hat keinen Speicherplatz mehr."
Recovery: Check Pod connection, or free space on Pod.

### ERR-4: Link to Inactive Credential

> Occurs at step 10 when `requires: credential.is_active` fails.

User sees: "Diese Kompetenzbestaetigung ist nicht mehr aktiv."
Recovery: User selects a different credential.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| PortfolioItem | (new) | `anchor_status: unanchored` or `pending` | `UploadPortfolioItem` |
| PortfolioItem | `credential: null` | `credential: X` | `LinkItemToCredential` |
| CredentialAnchor | (new) | `status: pending` | `QueuePortfolioItemForAnchoring` |

## Navigation Map

- Item full-screen preview — inline overlay
- `CredentialDetail(credential)` — via linked credential label
- `WalletOverview` — back navigation

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | "Dein Portfolio" |
| Upload FAB | "Beweis hochladen" |
| Upload confirm | "Hochladen" |
| Batch upload | "Alle hochladen" |
| Empty title | "Dein Portfolio ist noch leer" |
| Empty body | "Lade Beweise hoch — Fotos, Videos, Dokumente, Code — alles was deine Skills zeigt." |
| Linked label | credential.title (dynamic) |
| Unlinked label | "Nicht zugeordnet" |
| Link action | "Zuordnen" |
| Filter: type | "Fotos", "Videos", "Audio", "Dokumente", "Code" |
| Filter: anchor | "Gesichert", "Ausstehend", "Nicht gesichert" |
| Filter: link | "Zugeordnet", "Nicht zugeordnet" |
| Too large | "Die Datei ist zu gross. Maximum: 50 MB." |
| Bad type | "Der Dateityp wird nicht unterstuetzt." |
| Pod error | "Dein Pod ist nicht erreichbar." |
