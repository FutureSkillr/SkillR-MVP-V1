# FR-129: Password Reset Flow

**Status:** draft
**Priority:** must
**Created:** 2026-02-24

## Problem

Users who registered with Email-Login have no way to reset a forgotten password. The `LoginPage.tsx` login form shows "E-Mail oder Passwort falsch." when credentials are wrong but offers no recovery path. For a 14+ target audience, forgotten passwords are extremely common.

## Solution

### Flow Overview

```
LoginPage
  |
  +-- "Passwort vergessen?" link
        |
        +-- ForgotPasswordPage
              |  - Email input
              |  - "Zuruecksetzen" button
              |
              +-- Backend sends reset email
              |
              +-- Confirmation: "E-Mail gesendet! Pruefe dein Postfach."
              |
              +-- User clicks link in email
                    |
                    +-- ResetPasswordPage (or Firebase hosted action)
                          |  - New password input (2x for confirmation)
                          |  - "Passwort aendern" button
                          |
                          +-- Success: "Passwort geaendert. Du kannst dich jetzt anmelden."
```

### Firebase Path (primary)

Firebase Auth provides password reset out of the box:

1. **Trigger**: Call `sendPasswordResetEmail(auth, email)` from Firebase SDK
2. **Email**: Firebase sends a branded reset email (configurable in Firebase Console under Authentication > Templates)
3. **Reset page**: Firebase hosts the password reset page by default, or a custom `actionCodeSettings.url` can redirect to the SkillR app
4. **Completion**: User sets new password on the Firebase-hosted page, then returns to SkillR login

**Implementation steps:**
- Add "Passwort vergessen?" link below the password field in `LoginPage.tsx`
- Create `ForgotPasswordPage.tsx` with an email input and submit button
- On submit: call `sendPasswordResetEmail(auth, email)` from `firebase/auth`
- Show success message regardless of whether the email exists (prevents email enumeration)
- Error handling: rate limiting message if Firebase returns `auth/too-many-requests`

### Local Auth Path (backend-only, no Firebase)

For environments without Firebase, the backend implements its own reset flow:

1. **`POST /api/auth/forgot-password`** — accepts `{ "email": "..." }`
   - Generates a secure random token (32 bytes, hex-encoded)
   - Stores token + expiry (1 hour) in `password_reset_tokens` table
   - Sends email via configured SMTP/transactional provider
   - Always returns HTTP 200 (prevent email enumeration)

2. **`POST /api/auth/reset-password`** — accepts `{ "token": "...", "password": "..." }`
   - Validates token exists and has not expired
   - Hashes new password with bcrypt
   - Updates user's password
   - Deletes the token
   - Returns HTTP 200

3. **Database migration** (e.g., `000029_password_reset_tokens`):
   ```sql
   CREATE TABLE password_reset_tokens (
       id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       token      TEXT NOT NULL UNIQUE,
       expires_at TIMESTAMPTZ NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
   ```

**Note:** The local auth path requires an email-sending capability which is not yet configured. This part is deferred until an SMTP provider is set up. The Firebase path covers the primary deployment.

### UI Components

**`ForgotPasswordPage.tsx`** (new):
- Header: "Passwort vergessen?"
- Subtext: "Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zuruecksetzen."
- Email input (`type="email"`, validated per FR-128)
- "Zuruecksetzen" button
- Success state: "E-Mail gesendet! Pruefe dein Postfach und deinen Spam-Ordner."
- "Zurueck zur Anmeldung" link
- Error state: "Etwas ist schiefgelaufen. Versuche es spaeter noch einmal."

**`LoginPage.tsx`** (modified):
- Add "Passwort vergessen?" link between password field and submit button
- Link triggers navigation to `ForgotPasswordPage` (or inline mode toggle, like login/register)

### App.tsx Integration

Add a new `ViewState` value `'forgot-password'` and render `ForgotPasswordPage` for that view. The "Passwort vergessen?" link in `LoginPage` calls a callback that sets the view.

## Acceptance Criteria

- [ ] "Passwort vergessen?" link visible on login form
- [ ] `ForgotPasswordPage` component with email input and submit
- [ ] Firebase path: `sendPasswordResetEmail()` called on submit
- [ ] Success message shown after submit (regardless of email existence)
- [ ] Rate limiting error handled gracefully ("Zu viele Anfragen. Bitte warte kurz.")
- [ ] "Zurueck zur Anmeldung" link returns to login form
- [ ] Local auth path: API endpoints specified (implementation deferred until SMTP is configured)
- [ ] All user-facing text is in German
- [ ] Unit test for `ForgotPasswordPage` rendering and submit behavior

## Dependencies

- FR-128 (Email Validation) — email format must be validated before sending reset
- Firebase Auth SDK (`sendPasswordResetEmail`)
- Firebase Console email template configuration (optional customization)

## Notes

- Firebase's default reset email is in English. To send German emails, configure the template language in Firebase Console > Authentication > Templates > Password reset > Edit template > Language.
- The success message must not reveal whether the email exists in the system. Always show the same message: "Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link geschickt."
- Consider adding a "Passwort aendern" option in the profile page (authenticated) for users who know their current password — this is a separate FR.
