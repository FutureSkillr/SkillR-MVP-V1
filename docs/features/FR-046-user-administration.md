# FR-046: User Administration

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-18

## Problem
There is no authentication or user management. The app is open to anyone without login. Admins need to manage registered users.

## Solution
Implement localStorage-based authentication with:
1. **Login page**: Email + password login form
2. **Registration**: Email + display name + password registration
3. **User Admin panel**: Table of all users with role change and delete actions
4. **Session management**: Login persists via localStorage session token

Password hashing uses SHA-256 (MVP placeholder; Firebase Auth planned for production).

## Acceptance Criteria
- [ ] Login page is shown when no session exists
- [ ] Users can register with email, name, and password
- [ ] Users can log in with email and password
- [ ] Invalid credentials show error message
- [ ] Duplicate email registration is prevented
- [ ] Admin can see list of all registered users
- [ ] Admin can change user roles
- [ ] Admin can delete users (except themselves)
- [ ] Logout clears session and returns to login page
- [ ] Auth state persists across page reloads

## Dependencies
- FR-044 (Role Management)
- FR-043 (Admin Panel)

## Notes
SHA-256 client-side hashing is an MVP placeholder. Production will use Firebase Auth with proper server-side password handling.
