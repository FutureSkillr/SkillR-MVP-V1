# Journey: Share and Verify

**Surfaces crossed:** `CredentialDetail` → `AccessGrantManager` → `VerificationView`
**Actors:** Holder (student), Verifier (employer, school, institution)
**Trigger:** Student wants to share credentials for a job application, school enrolment, or internship

## Context

The core value proposition of the Skill-Wallet: a student proves their skills to a third party without revealing everything, with blockchain-backed tamper-resistance. The student chooses what to share, for how long, and for what purpose. The verifier checks the credentials independently — no trust in SkillR required.

## End-to-End Flow

### Phase 1: Student Prepares (CredentialDetail)

1. `[VIEW]` Student reviews a credential they want to share
   - Opens CredentialDetail from CredentialList
   - Checks that portfolio items (evidence) are attached
   - Verifies blockchain anchor status is "anchored"

2. `[ACTION]` Student taps "Teilen"
   - `navigates_to: AccessGrantManager` with credential pre-selected

### Phase 2: Student Creates Grant (AccessGrantManager)

3. `[VIEW]` Grant wizard opens with pre-selected credential
   - Scope pre-set to `selected_credentials`
   - The originating credential already checked

4. `[INPUT]` Student optionally adds more credentials
   - Multi-select from `wallet.active_credentials`
   - e.g., adds "Teamfaehigkeit" credential alongside "Kreativitaet"

5. `[INPUT]` Student enters verifier details
   - Name: "Berliner Stadtbibliothek"
   - Email: "hr@bibliothek.berlin.de" (optional)

6. `[INPUT]` Student sets purpose
   - Selects "Bewerbung" from presets
   - Or types custom purpose

7. `[INPUT]` Student sets duration
   - Slider: 30 days (default)
   - For time-sensitive applications, maybe 7 days

8. `[VIEW]` Student reviews summary:
   - "Zugriff fuer: Berliner Stadtbibliothek"
   - "Zweck: Bewerbung"
   - "Umfang: 2 Kompetenzen (Kreativitaet, Teamfaehigkeit)"
   - "Gueltig bis: 25.03.2026"

9. `[ACTION]` Student taps "Zugriff erteilen"
   - `triggers: HolderGrantsAccess(wallet, "Berliner Stadtbibliothek", "hr@bibliothek.berlin.de", selected_credentials, [cred1_id, cred2_id], [], "Bewerbung", 30.days)`

10. `[SYSTEM]` System creates grant
    - `rule: GrantAccess`
    - Generates access token and link

11. `[VIEW]` Student sees sharing options:
    - QR code (for in-person sharing)
    - Shareable link (for email/messaging)
    - "Per E-Mail senden" button (sends to verifier email)
    - "Link kopieren" button

12. `[ACTION]` Student shares link with verifier
    - Via system share sheet, copy-paste, email, or QR code

### Phase 3: Verifier Checks (VerificationView)

13. `[VIEW]` Verifier receives link (via email, message, or QR scan)
    - Opens in browser — no app install, no account needed

14. `[VIEW]` Verifier sees student's shared credentials
    - "Skill-Wallet von Max Mustermann"
    - "Geteilt fuer: Bewerbung"
    - Two credential cards with skill claims and anchor badges

15. `[ACTION]` Verifier taps "Verifizieren" on first credential
    - `triggers: VerifierRequestsVerification(access_token, cred1_id)`

16. `[SYSTEM]` System verifies against blockchain
    - `rule: VerifyCredential`
    - Recomputes hash, checks Merkle proof against on-chain root

17. `[VIEW]` Verifier sees result:
    - "Verifiziert — Daten unveraendert seit 15.02.2026"
    - "Ausgestellt von: maindset.ACADEMY"
    - Skill claims: "Kreativitaet: 0.82"
    - Evidence: 3 portfolio items attached

18. `[VIEW]` Verifier expands portfolio items
    - Thumbnail of project photo
    - PDF of reflection document
    - Video clip of presentation

19. `[ACTION]` Verifier taps "Beweis verifizieren" on the project photo
    - `triggers: VerifierRequestsItemVerification(access_token, item_id)`

20. `[SYSTEM]` System verifies portfolio item
    - `rule: VerifyPortfolioItem`
    - Fetches file from student's Pod, recomputes SHA-256, compares

21. `[VIEW]` Verifier sees: "Beweis unveraendert und blockchain-gesichert seit 12.02.2026"

22. `[ACTION]` Verifier repeats for second credential
    - Same flow: verify credential → verify items

23. `[VIEW]` Verifier is satisfied — closes browser
    - The verification is complete
    - No data was stored on the verifier's side
    - Access count incremented on the grant

### Phase 4: Student Monitors (AccessGrantManager)

24. `[VIEW]` Student opens AccessGrantManager
    - Grant for "Berliner Stadtbibliothek" shows "2x aufgerufen"
    - Student knows the verifier checked their credentials

25. `[ACTION]` After the application process, student revokes access
    - `triggers: HolderRevokesAccess(wallet, grant)`
    - Link becomes invalid immediately

## Alternative Journeys

### ALT-A: In-Person Verification (QR Code)

> Student is at a job interview or school meeting.

A1. Student opens WalletOverview on phone
A2. Navigates to CredentialDetail → "Teilen" → creates short-duration grant (1 day)
A3. Shows QR code on phone screen
A4. Verifier scans QR code with their phone
A5. VerificationView opens in verifier's browser
A6. Real-time verification happens face-to-face

### ALT-B: Full Wallet Share

> School requests complete profile for enrolment.

B1. Student creates grant with `scope: full_wallet`
B2. Verifier sees all active credentials and all portfolio items
B3. Comprehensive skill overview for enrolment decision

### ALT-C: Unanchored Credentials

> Student has blockchain consent disabled.

C1. Verifier sees credentials without "Verifizieren" button
C2. Credentials show: "Nicht blockchain-gesichert"
C3. Issuer signature (maindset.ACADEMY) provides basic trust
C4. Verifier can still review skill claims and portfolio items
C5. Less trust but still useful

### ALT-D: Verifier Downloads JSON-LD

> Technical verifier wants machine-readable credential for their HR system.

D1. Verifier taps "Als JSON-LD herunterladen" on credential
D2. Downloads W3C VC 2.0 / Open Badge 3.0 document
D3. Imports into their credential verification tool
D4. Independent verification without SkillR website

## Error Recovery Through the Journey

| Phase | Failure | What happens |
|-------|---------|-------------|
| Phase 2 | Minor without sharing consent | Student directed to GuardianConsentView |
| Phase 2 | Grant limit reached | Student must revoke an old grant first |
| Phase 3 | Token expired | Verifier sees "Link abgelaufen" — student must reshare |
| Phase 3 | Access count exceeded | Verifier sees "Zugriffe aufgebraucht" — student reshares |
| Phase 3 | Credential revoked between sharing and verification | Verifier sees "Nicht mehr gueltig" |
| Phase 3 | Pod offline during item verification | "Speicher nicht erreichbar" — retry later |
| Phase 3 | Hash mismatch (tampered file) | Red warning — legitimate integrity failure |

## Trust Model

```
Student                     Verifier
───────                     ────────
Creates credential ──┐
Uploads evidence ────┤
Hash anchored ───────┤
                     │
Creates grant ───────┼──> Receives link
                     │    Opens page
                     │    Sees credentials
                     │    Taps "Verifizieren"
                     │         │
                     │         ▼
                     │    System recomputes hash
                     │    Compares with blockchain
                     │    Returns: match or mismatch
                     │         │
                     │         ▼
                     │    TRUST DECISION:
                     │    ✓ maindset.ACADEMY issued it (issuer DID)
                     │    ✓ Data unchanged since issuance (blockchain hash)
                     │    ✓ Evidence files unmodified (SHA-256 match)
                     │    ✓ Student chose to share it (access grant)
                     │
                     │    No trust in SkillR platform required.
                     │    Verification is independently reproducible.
```

## Timing Expectations

| Action | Expected duration |
|--------|-------------------|
| Grant creation | < 30 seconds (wizard) |
| Link delivery (email) | < 1 minute |
| Page load for verifier | < 2 seconds |
| Credential verification | < 5 seconds (includes chain query) |
| Item verification | < 10 seconds (includes Pod fetch + hash computation) |
| Full verification (2 credentials, 3 items) | < 1 minute |
