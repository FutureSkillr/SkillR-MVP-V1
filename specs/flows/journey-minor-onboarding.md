# Journey: Minor Onboarding

**Surfaces crossed:** `WalletOverview` → `GuardianConsentView` → `WalletOverview`
**Actors:** MinorHolder (student under 16), Guardian (parent/legal guardian)
**Trigger:** Student completes first VUCA milestone or explicitly creates a wallet

## Context

A student aged 14-15 wants to create a Skill-Wallet. German DSGVO Art. 8 sets the consent threshold at 16. The system must obtain verifiable parental consent before the wallet becomes fully active. This journey involves two actors across two surfaces, connected by an email-based verification flow.

## End-to-End Flow

### Phase 1: Student Initiates (WalletOverview)

1. `[ACTION]` Student taps "Skill-Wallet erstellen" in the app
   - `triggers: UserCreatesWallet(user)`
   - `requires: user.age < config.adult_age_threshold` → `rule: CreateWalletForMinor`
   - Wallet created with `status = suspended`

2. `[VIEW]` Student sees: "Dein Wallet ist fast fertig! Wir brauchen die Zustimmung deines Erziehungsberechtigten."

3. `[INPUT]` Student enters guardian details:
   - Name des Erziehungsberechtigten
   - E-Mail-Adresse
   - Beziehung: "Elternteil" / "Gesetzlicher Vormund" / "Schulbehoerde"

4. `[ACTION]` Student taps "Einladung senden"
   - `triggers: RequestGuardianConsent(wallet, guardian_name, guardian_email, relationship)`
   - `requires: wallet.is_minor`
   - `requires: not exists GuardianLink{wallet, status: confirmed}`

5. `[SYSTEM]` System creates GuardianLink and sends email
   - `rule: RequestGuardianConsent`
   - Email sent to guardian with one-time verification link

6. `[VIEW]` Student sees waiting state:
   - "Einladung gesendet an {guardian_email}."
   - "Dein Wallet wird aktiviert, sobald die Zustimmung vorliegt."
   - Timer showing how long ago the email was sent

### Phase 2: Guardian Consents (GuardianConsentView)

7. `[VIEW]` Guardian receives email with subject: "Zustimmung fuer {Name}s Skill-Wallet"
   - Email contains: explanation, one-time link, expiry notice

8. Guardian opens link → enters `GuardianConsentView`
   - (Full flow documented in `specs/flows/guardian-consent.md`, steps 1-10)

9. `[ACTION]` Guardian taps "Zustimmung erteilen"
   - `triggers: GuardianConfirms(token, consent_blockchain, consent_credentials, consent_sharing)`

10. `[SYSTEM]` System activates wallet
    - `rule: GuardianConfirmsConsent` → `link.status = confirmed`
    - `rule: ActivateWalletAfterGuardianConsent` → `wallet.status = active`

### Phase 3: Student Returns (WalletOverview)

11. `[VIEW]` Student opens app — wallet is now active
    - WalletOverview loads with `status = active`
    - Guardian status: green "Erziehungsberechtigter bestaetigt"
    - All features unlocked (scoped by guardian's consent choices)

12. `[VIEW]` If guardian did not consent to blockchain:
    - Blockchain toggle is greyed out
    - Tooltip: "Dein Erziehungsberechtigter hat der Blockchain-Sicherung nicht zugestimmt."

13. `[VIEW]` If guardian did not consent to data sharing:
    - "Zugriff teilen" button is disabled
    - Tooltip: "Dein Erziehungsberechtigter hat dem Teilen von Daten nicht zugestimmt."

## Alternative Journeys

### ALT-A: Guardian Does Not Respond

> Guardian ignores the email. Token expires after `config.guardian_consent_expiry`.

A1. `[SYSTEM]` Token expires → `rule: GuardianConsentExpires`
    - `link.status = expired`

A2. `[VIEW]` Student sees: "Die Einladung ist abgelaufen."

A3. `[ACTION]` Student taps "Erneut einladen"
    - New `RequestGuardianConsent` with same or different email

### ALT-B: Guardian Declines

> Guardian opens the link but doesn't check any boxes.

B1. (See `guardian-consent.md` ALT-1)
    - Wallet remains `suspended`

B2. `[VIEW]` Student sees: "Dein Erziehungsberechtigter hat noch keine Zustimmung erteilt."
    - Option to send reminder or new invitation

### ALT-C: Student Turns 16

> Student's age crosses `config.adult_age_threshold` while wallet is suspended.

C1. `[SYSTEM]` On next login, system detects `user.age >= 16`
    - `wallet.is_minor` becomes `false`
    - Student can self-activate wallet without guardian

C2. `[VIEW]` Student sees: "Du bist jetzt alt genug, um dein Wallet selbst zu verwalten."

C3. `[ACTION]` Student taps "Wallet aktivieren"
    - Wallet transitions to `active` without guardian

### ALT-D: Consent Renewal (Annual)

> 11 months after initial consent, approaching `config.guardian_consent_expiry`.

D1. `[SYSTEM]` `rule: RenewGuardianConsent` fires when `needs_renewal` becomes true
    - Guardian receives renewal email

D2. Guardian opens link → simplified consent renewal
    - Current choices pre-checked
    - Can modify any choice

D3. `[SYSTEM]` Consent renewed → `expires_at` extended

D4. If guardian does not renew:
    - `rule: GuardianConsentExpires` → `link.status = expired`
    - `rule: SuspendWalletOnGuardianExpiry` → `wallet.status = suspended`
    - Student notified: "Dein Wallet ist pausiert. Bitte lass die Zustimmung erneuern."

## Timing

| Event | When |
|-------|------|
| Email sent to guardian | Immediately after step 4 |
| Token expires (if unused) | `config.guardian_consent_expiry` after step 4 |
| Renewal reminder email | `config.guardian_renewal_warning` before expiry |
| Consent expires | `config.guardian_consent_expiry` after confirmation |
| Wallet suspended on expiry | Immediately after consent expires |

## Data Flow

```
Student (app)          System                Guardian (email/web)
─────────────          ──────                ─────────────────────
Create wallet ──────>  Wallet(suspended)
Enter guardian ─────>  GuardianLink(pending)
                       Send email ─────────> Receives email
                                              Opens link
                                              Fills consent form
                       <──────────────────── GuardianConfirms(...)
                       Link(confirmed)
                       Wallet(active)
Student opens app <──  WalletOverview(active)
```

## Error Recovery Summary

| Failure | Recovery |
|---------|----------|
| Guardian email bounces | Student enters correct email, sends new invitation |
| Token expires | Student sends new invitation |
| Guardian declines | Student talks to guardian, sends new invitation with explanation |
| Guardian loses email | Student sends new invitation (old token invalidated) |
| Consent expires (annual) | System sends renewal, guardian re-confirms |
| Student turns 16 | Self-activation, no guardian needed |
