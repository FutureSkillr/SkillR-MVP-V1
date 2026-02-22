# FR-047: Management Console

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-18

## Problem
There is no central place for administrators to manage the application. Admin functions (user management, role management, content editing) need a unified interface.

## Solution
Create a Management Console component that serves as the top-level container for all admin functionality. The console:
1. Shows the current admin user and their role
2. Provides tab navigation between: Users, Roles, Meta Kurs Editor
3. Is accessible only to users with `admin` role
4. Can be entered via the "Admin" button in the app header
5. Provides a "Back to App" button to return to normal use

## Acceptance Criteria
- [ ] Management Console is only accessible to admin-role users
- [ ] Console displays current admin user info
- [ ] Tab navigation works between Users, Roles, and Meta Kurs Editor
- [ ] "Back to App" returns to the landing page
- [ ] Console uses the same visual design language as the main app (glass, gradients)

## Dependencies
- FR-043 (Admin Panel)
- FR-044 (Role Management)
- FR-045 (Meta Kurs Editor)
- FR-046 (User Administration)

## Notes
The Management Console is a view state in the main App component (`view: 'admin'`), rendered inside the Layout with full header/footer chrome.
