# FR-120: Partner Content Pack Admin

**Status:** specified
**Priority:** should
**Created:** 2026-02-23

## Problem
Partners and SkillR admins need an interface to manage partner-specific content packs, brand configuration, and preview links. Currently, brand config can only be managed through the general BrandConfigEditor, with no partner-scoped admin view.

## Solution
A URL-parameter-driven admin page accessible via `?partner-admin=slug`. Requires admin role (checked in App.tsx before rendering). The page provides:

1. **Brand Config panel** — edit brand name, short name, tagline, contact email, primary/accent colors
2. **Content Pack panel** — shows packs linked to this partner with their Lernreisen list and activation status
3. **Preview link** — generates `?partner=slug` URL with copy-to-clipboard functionality
4. **Save** — updates brand config via `PUT /api/brand/:slug`

## Acceptance Criteria
- [ ] `?partner-admin=space-service-intl` renders admin page when logged in as admin
- [ ] Brand config fields are editable and saveable
- [ ] Content pack 003 "Abenteuer Weltraum" shown with 3 Lernreisen
- [ ] Preview URL copyable to clipboard
- [ ] Non-admin users see "Zugriff verweigert" message
- [ ] Unauthenticated users see "Zugriff verweigert" message

## Dependencies
- FR-119: Partner Preview Page
- FR-086*: Partner Branding (brand system)
- FR-044: Role Management

## Notes
- Uses `getAuthHeaders()` from `services/auth.ts` for authenticated API calls
- Reuses Field component pattern from BrandConfigEditor
