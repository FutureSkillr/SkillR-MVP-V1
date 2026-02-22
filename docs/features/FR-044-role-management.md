# FR-044: Role Management

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-18

## Problem
The application has no user roles. All users have the same access level. Administrators need to be distinguished from regular users to control access to management features.

## Solution
Implement a role system with two roles: `admin` and `user`. The first registered user automatically receives the `admin` role. All subsequent users receive the `user` role by default. Admins can promote/demote users through the Role Manager interface.

## Acceptance Criteria
- [ ] Two roles exist: `admin` and `user`
- [ ] First registered user is automatically assigned `admin` role
- [ ] Subsequent users are assigned `user` role by default
- [ ] Admins can change any other user's role
- [ ] Admins cannot demote themselves
- [ ] Role changes take effect immediately
- [ ] Role Manager shows users grouped by role with quick toggle

## Dependencies
- FR-043 (Admin Panel)
- FR-046 (User Administration)

## Notes
Role data is stored in localStorage as part of the UserRecord. Admin self-demotion is prevented to avoid lockout scenarios.
