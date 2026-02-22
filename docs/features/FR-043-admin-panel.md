# FR-043: Admin Panel

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-18

## Problem
The application has no admin interface. All content (prompts, journeys, stations) is hardcoded. Administrators need a way to manage users, roles, and content without code changes.

## Solution
Add an Admin Console accessible only to users with the `admin` role. The console provides tabs for User Administration, Role Management, and Meta Kurs Editor.

## Acceptance Criteria
- [ ] Admin Console is accessible via "Admin" button in the header (visible only to admin users)
- [ ] Console has three tabs: Benutzer, Rollen, Meta Kurs Editor
- [ ] Non-admin users cannot see or access the Admin button
- [ ] Admin can navigate back to the main app from the console

## Dependencies
- FR-044 (Role Management)
- FR-045 (Meta Kurs Editor)
- FR-046 (User Administration)
- FR-047 (Management Console)
- TC-001 (Firebase Data Model — future migration from localStorage)

## Notes
MVP implementation uses localStorage for data persistence. Firebase migration planned for production.
