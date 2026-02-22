# FR-003: Firebase User Data Persistence

**Status:** draft
**Priority:** must
**Created:** 2026-02-17

## Scope
Store all personal user data in Google Firebase (Firestore). This includes authentication state, profile data, journey progress, and dialogue history. Data is scoped to the authenticated user — each user can only access their own data. Non-personal data (content templates, config) lives outside Firebase.

## Intent
The skill profile is the user's property — it must persist reliably across sessions and devices. Firebase provides the managed data layer so we can focus on product logic, not infrastructure. Personal data stays in one place for GDPR traceability.

## Dependencies
- FR-001 (Google OAuth) or FR-002 (Email login) for authentication context
