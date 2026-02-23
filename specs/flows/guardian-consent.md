# Flow: Guardian Consent

**Surface:** `GuardianConsentView` in `skill-wallet.allium`
**Actor:** Guardian (parent or legal guardian, no SkillR account required)
**Entry point:** Email link with verification token

## Context

When a student under 16 creates a Skill-Wallet, German data protection law (DSGVO Art. 8, age threshold 16) requires verifiable parental consent. The guardian receives an email with a one-time link. The consent page is a simple form — no login, no account creation. The guardian makes three granular consent decisions: blockchain anchoring, credential issuance, and data sharing.

## Preconditions

- `GuardianLink` exists with `status = pending`
- Guardian has received the email with `verification_token`
- Token has not expired (`expires_at > now`)

## Main Flow

1. `[VIEW]` Guardian opens link from email
   - URL contains the `verification_token`
   - Page loads without login prompt

2. `[VIEW]` Guardian sees student identification
   - `exposes: link.wallet.owner.display_name`
   - `exposes: link.relationship`
   - `exposes: link.requested_at`
   - Heading: "{Student-Name} moechte ein Skill-Wallet erstellen"
   - Sub-heading: "Deine Zustimmung als {Erziehungsberechtigter / Elternteil} ist erforderlich"

3. `[VIEW]` Guardian sees explanation of what a Skill-Wallet is
   - Brief, plain-language explanation:
     - "Ein Skill-Wallet sammelt die Kompetenzen und Beweise, die {Name} auf der SkillR-Reise entdeckt."
     - "Die Daten gehoeren {Name}. Du entscheidest mit, was damit passiert."

4. `[VIEW]` Guardian sees three consent checkboxes with explanations
   - `requires: consent_blockchain when link.status = pending`
   - `requires: consent_credentials when link.status = pending`
   - `requires: consent_sharing when link.status = pending`

   **Checkbox 1: Blockchain-Sicherung**
   - "Darf die Integritaet der Kompetenzen durch eine Blockchain gesichert werden?"
   - Explanation: "Dabei werden nur Pruefsummen (keine persoenlichen Daten) in einer oeffentlichen Blockchain gespeichert. Damit kann spaeter nachgewiesen werden, dass die Daten nicht veraendert wurden."

   **Checkbox 2: Kompetenz-Ausstellung**
   - "Darf maindset.ACADEMY digitale Kompetenzbestaetigung fuer {Name} ausstellen?"
   - Explanation: "Kompetenzbestaetigung sind digitale Nachweise im internationalen Open Badge 3.0 Format, die von Schulen und Arbeitgebern ueberprueft werden koennen."

   **Checkbox 3: Daten teilen**
   - "Darf {Name} selbst entscheiden, wem die eigenen Daten gezeigt werden?"
   - Explanation: "Wenn aktiviert, kann {Name} zeitlich begrenzte Zugriffe fuer bestimmte Personen oder Organisationen erteilen — zum Beispiel fuer Bewerbungen."

5. `[VIEW]` Guardian sees DSGVO information notice
   - "Informationen zum Datenschutz" (expandable)
   - Link to full privacy policy
   - Summary: data stored in student's Solid Pod (owned by student), platform processes data per DSGVO, right to withdraw consent at any time

6. `[VIEW]` Guardian sees expiry notice
   - `exposes: link.expires_at`
   - "Diese Zustimmung ist gueltig fuer 1 Jahr und muss dann erneuert werden."

7. `[INPUT]` Guardian checks desired consent boxes
   - At minimum one box must be checked for the wallet to be useful
   - All three can be checked independently

8. `[ACTION]` Guardian taps "Zustimmung erteilen"
   - `triggers: GuardianConfirms(token, consent_blockchain, consent_credentials, consent_sharing)`
   - `requires: link.status = pending`

9. `[SYSTEM]` System processes consent
   - `rule: GuardianConfirmsConsent`
   - `link.status = confirmed`
   - `link.confirmed_at = now`
   - `rule: ActivateWalletAfterGuardianConsent`
   - `wallet.status = active`

10. `[VIEW]` Guardian sees confirmation
    - "Vielen Dank! Deine Zustimmung wurde gespeichert."
    - Summary of what was consented to
    - "Du kannst deine Zustimmung jederzeit widerrufen unter: {link}"

## Alternative Flows

### ALT-1: Guardian Declines All

> Branches from step 7 when guardian unchecks all boxes and still taps submit.

7a. `[VIEW]` Warning: "Ohne Zustimmung kann {Name} kein Skill-Wallet nutzen. Moechtest du wirklich ohne Zustimmung fortfahren?"

7b. `[ACTION]` Guardian taps "Ohne Zustimmung fortfahren"
    - Submits with all consent flags = false
    - Wallet remains suspended

7c. `[VIEW]` "Du hast keine Zustimmung erteilt. {Name} kann das Skill-Wallet derzeit nicht nutzen. Du kannst deine Entscheidung jederzeit aendern."

### ALT-2: Partial Consent

> Branches from step 7 when guardian checks some but not all boxes.

Perfectly valid flow — system respects the granular choices:
- No blockchain consent → credentials issued but not anchored
- No credential consent → wallet active but no credentials can be issued
- No sharing consent → student cannot create access grants

### ALT-3: Consent Renewal

> Triggered when existing consent nears expiry (`needs_renewal = true`).

R1. Guardian receives renewal email (triggered by `rule: RenewGuardianConsent`)
    - "Die Zustimmung fuer {Name}s Skill-Wallet laeuft bald ab."

R2. Guardian opens link — same page but with current consent pre-checked

R3. `[VIEW]` Current consent shown as pre-filled checkboxes
    - Guardian can change any choice

R4. `[ACTION]` Guardian taps "Zustimmung erneuern"
    - Same trigger: `GuardianConfirms(...)`
    - Extends `expires_at` by `config.guardian_consent_expiry`

### ALT-4: Revoke Consent

> Guardian navigates to revocation link (provided in confirmation email).

V1. `[VIEW]` Guardian sees current consent status
    - Which boxes are active, when confirmed, when it expires

V2. `[ACTION]` Guardian taps "Zustimmung widerrufen"
    - `link.status = revoked`, `link.revoked_at = now`
    - Wallet becomes suspended (`rule: SuspendWalletOnGuardianExpiry`)

V3. `[VIEW]` "Deine Zustimmung wurde widerrufen. {Name}s Wallet ist pausiert. Bestehende Kompetenzbestaetigung bleiben gueltig."

## Error Flows

### ERR-1: Token Expired

> Occurs at page load when `link.expires_at <= now` and `link.status = pending`.

User sees: "Dieser Link ist abgelaufen. Bitte {Name} bitten, eine neue Einladung zu senden."
Recovery: Student must trigger a new `RequestGuardianConsent`.

### ERR-2: Token Already Used

> Occurs at page load when `link.status != pending` (already confirmed).

User sees: "Du hast bereits zugestimmt. Deine Zustimmung ist aktiv bis {expires_at}."
Link to: revocation page (if they want to change their mind).

### ERR-3: Invalid Token

> Occurs at page load when no `GuardianLink` matches the token.

User sees: "Dieser Link ist ungueltig. Bitte pruefe, ob du den richtigen Link verwendet hast."
Recovery: Student sends a new invitation.

## State Transitions

| Entity | From | To | Trigger |
|--------|------|----|---------|
| GuardianLink | `status: pending` | `status: confirmed` | `GuardianConfirms` |
| GuardianLink | `status: confirmed` | `status: expired` | `GuardianConsentExpires` (temporal) |
| GuardianLink | `status: confirmed` | `status: revoked` | Guardian revokes |
| SkillWallet | `status: suspended` | `status: active` | `ActivateWalletAfterGuardianConsent` |
| SkillWallet | `status: active` | `status: suspended` | `SuspendWalletOnGuardianExpiry` |

## Navigation Map

- This is a standalone page — no app navigation frame
- Confirmation page with links to:
  - Privacy policy
  - Consent revocation page
  - SkillR website (informational)
- No navigation to app internals (guardian is not a SkillR user)

## Localisation Notes

| Element | German |
|---------|--------|
| Page title | "Zustimmung fuer {Name}s Skill-Wallet" |
| Heading | "{Name} moechte ein Skill-Wallet erstellen" |
| Sub-heading | "Deine Zustimmung als {relationship} ist erforderlich" |
| Blockchain label | "Blockchain-Sicherung" |
| Blockchain detail | "Nur Pruefsummen, keine persoenlichen Daten." |
| Credential label | "Kompetenz-Ausstellung" |
| Credential detail | "Digitale Nachweise im Open Badge 3.0 Format." |
| Sharing label | "Daten teilen" |
| Sharing detail | "{Name} entscheidet selbst, wem die Daten gezeigt werden." |
| DSGVO link | "Informationen zum Datenschutz" |
| Expiry note | "Gueltig fuer 1 Jahr, danach Erneuerung noetig." |
| Submit button | "Zustimmung erteilen" |
| Confirm message | "Vielen Dank! Deine Zustimmung wurde gespeichert." |
| Revoke button | "Zustimmung widerrufen" |
| Expired error | "Dieser Link ist abgelaufen." |
| Used error | "Du hast bereits zugestimmt." |
| Invalid error | "Dieser Link ist ungueltig." |
| Decline warning | "Ohne Zustimmung kann {Name} kein Skill-Wallet nutzen." |
| Renewal email | "Die Zustimmung laeuft bald ab." |
| Renew button | "Zustimmung erneuern" |
