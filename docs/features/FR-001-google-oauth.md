# FR-001: Social Login (Google, Apple, Meta)

**Status:** draft
**Priority:** must
**Created:** 2026-02-17
**Updated:** 2026-02-18

## Scope
Primary authentication via social login providers. Firebase Auth handles the OAuth flow and token management for all three providers. Users choose their preferred login:

| Provider | Firebase Auth Provider | Why Offered |
|---|---|---|
| **Google** | `GoogleAuthProvider` | Default for Android users, school Google accounts (Google Workspace for Education) |
| **Apple** | `OAuthProvider('apple.com')` | Required by Apple for App Store (if future native app), preferred by iOS users, strong privacy stance |
| **Meta (Facebook)** | `FacebookAuthProvider` | Wide adoption among parents and older teens, family account linking |

All three providers produce a Firebase Auth token — the downstream system treats them identically. The user's provider choice does not affect functionality.

## Intent
Lower the barrier to entry. A 14-year-old should be able to start the journey in under 30 seconds with an account they already have. Offering three providers ensures coverage across device ecosystems (Android/Google, iOS/Apple) and social contexts (Meta).

## Datenschutz for Minors (Critical)

Since our users are 14+, German DSGVO rules for minors apply. See FR-033 for the full compliance framework. Key implications for social login:

- **Age gate at registration:** Before completing login, the user must confirm their age. Users under 16 trigger the parental consent flow.
- **Minimal data from provider:** We request only: email, display name, profile photo (optional). We do NOT request friend lists, contacts, or any social graph data from any provider.
- **No social sharing without consent:** Login with Meta does NOT mean we post to Facebook. The Meta login is authentication only — zero social features are activated without explicit, separate consent.
- **Apple's privacy requirements:** Apple Sign In provides a "Hide My Email" option. Our system must work with relay email addresses.
- **Provider-specific age policies:** Google restricts accounts under 13 (Family Link), Apple under 13, Meta under 13. Our own age gate (16 for independent use, 14-15 with parental consent) is STRICTER than all three providers.

## Acceptance Criteria

- [ ] User can sign in with Google OAuth 2.0
- [ ] User can sign in with Apple Sign In
- [ ] User can sign in with Meta (Facebook) Login
- [ ] All three providers produce a unified Firebase Auth identity
- [ ] Only email and display name are requested from providers (minimal scope)
- [ ] Age gate appears before first login completes (FR-033)
- [ ] Apple relay email addresses work correctly
- [ ] Login works in mobile browsers (Chrome, Safari) — no app store required

## Dependencies
- FR-002 (Email login — fallback provider)
- FR-003 (Firebase user data persistence)
- FR-033 (Datenschutz for Minors — parental consent flow)
