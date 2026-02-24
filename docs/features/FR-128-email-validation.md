# FR-128: Email Validation for Email-Login

**Status:** draft
**Priority:** must
**Created:** 2026-02-24

## Problem

The Email-Login registration flow (`LoginPage.tsx`, mode `'register'`) accepts any string as an email address. The email input field uses `type="text"` (not `type="email"`) and there is no server-side or client-side email format validation beyond "field is required". This means:

1. Users can register with invalid email addresses (e.g., "test", "abc@", "admin")
2. There is no email verification step — the app cannot confirm the user actually owns the email
3. Password recovery (FR-129) is impossible without a verified email
4. For Firebase auth: Firebase itself validates email format, but the local auth path (`/api/auth/register`) does not

## Solution

### 1. Client-side: Input type and format check

**`LoginPage.tsx`**: Change the email input from `type="text"` to `type="email"` and add a basic format regex check before submission:

```
- Input type: "email" (browser-native validation)
- Pattern: basic RFC 5322 subset (user@domain.tld)
- Error message: "Bitte gib eine gueltige E-Mail-Adresse ein."
```

### 2. Server-side: Email format validation

**Backend `/api/auth/register`**: Validate email format before creating the user. Reject with HTTP 400 and a clear German error message:

```
{
  "error": "Ungueltige E-Mail-Adresse."
}
```

Validation rules:
- Must contain exactly one `@`
- Domain part must contain at least one `.`
- Local part must be non-empty
- Maximum 254 characters (RFC 5321)
- No spaces

### 3. Firebase path: Email verification (optional, recommended)

When Firebase is configured, use Firebase's built-in email verification:

1. After `createUserWithEmailAndPassword()`, call `sendEmailVerification(user)`
2. Show an intermediate screen: "Wir haben dir eine E-Mail geschickt. Bitte bestaetigen, um fortzufahren."
3. On next login, check `user.emailVerified` — if `false`, show a reminder with a "Erneut senden" button
4. Do **not** block the app entirely — allow limited access but show a banner

### 4. Local auth path: Verification email (future)

For the local auth backend (no Firebase), email verification requires:
- A verification token stored in the database
- An email-sending service (SMTP or transactional email provider)
- A `/api/auth/verify-email?token=...` endpoint

This is deferred to a future sprint. For now, only format validation is applied on the local auth path.

## Acceptance Criteria

- [ ] Email input field uses `type="email"` in `LoginPage.tsx`
- [ ] Client-side shows "Bitte gib eine gueltige E-Mail-Adresse ein." for malformed emails
- [ ] Backend `/api/auth/register` rejects invalid email formats with HTTP 400
- [ ] Firebase path: `sendEmailVerification()` called after registration
- [ ] Firebase path: Verification reminder shown on login if `emailVerified` is false
- [ ] Firebase path: "Erneut senden" button available on the reminder
- [ ] Local auth path: Email format validated server-side (no verification email yet)
- [ ] Existing users with unverified emails are not locked out
- [ ] Unit tests for email validation regex (frontend + backend)

## Dependencies

- FR-129 (Password Reset) — requires verified email to send reset links
- Firebase Auth SDK (`sendEmailVerification`, `emailVerified`)

## Notes

- The email input `placeholder="admin"` in `LoginPage.tsx:113` should also be changed to `placeholder="name@beispiel.de"` to guide users toward entering an actual email.
- Target audience is 14+ German-speaking youth — error messages must be in German and simple.
