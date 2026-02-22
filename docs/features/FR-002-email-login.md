# FR-002: Email-Password Login

**Status:** draft
**Priority:** should
**Created:** 2026-02-17
**Updated:** 2026-02-18

## Scope
Fallback authentication via email and password, managed through Firebase Auth. Covers users who cannot or prefer not to use social login (FR-001) — e.g., users without Google/Apple/Meta accounts, institutional contexts where social login is blocked, or parents who prefer a standalone account.

## Intent
Ensure no potential user is locked out. Some schools block social sign-in. Some parents distrust Meta. Email login keeps the door open for everyone without compromising the authentication architecture.

## Datenschutz for Minors

- **Email verification required** — Firebase Auth sends a verification email. For users under 16, the verification email goes to the PARENT's email address (see FR-033).
- **Password requirements** — minimum 8 characters, enforced by Firebase Auth. No additional complexity rules (keep it simple for teenagers).
- **No marketing emails** — the email address is used ONLY for authentication and critical notifications (password reset, parental consent). Never for marketing. This is both a legal requirement (DSGVO Art. 6) and a trust decision.

## Dependencies
- FR-001 (Social login — primary providers)
- FR-003 (Firebase user data persistence)
- FR-033 (Datenschutz for Minors — parental consent flow for under-16)
