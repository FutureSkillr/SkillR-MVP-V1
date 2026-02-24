# OBS-011: New User Sees Previous User's Profile Data

**Status:** fix-planned
**Decision:** Option B — user-keyed localStorage
**Severity:** critical
**Created:** 2026-02-24
**Updated:** 2026-02-24
**Component:** App state management (App.tsx)

## Symptom

When User A logs out and User B logs in on the same browser, User B sees User A's profile data (onboarding insights, station results, journey progress, coach selection). This is a **data leakage** bug — one user's personal learning data is visible to another user.

## Root Cause

The app state is stored in `localStorage` under a **global, non-user-keyed** key:

```ts
// App.tsx:66
const STORAGE_KEY = 'skillr-state';
```

The `loadState()` function (App.tsx:77) reads this key on mount. When a new user logs in, it loads the previous user's `profile`, `stationResults`, and `journeyProgress` because the key is the same for all users.

The `handleLogout()` function (App.tsx:242-246) only resets the `view` to `'welcome'` but does **not** clear `profile`, `stationResults`, or `journeyProgress`:

```ts
const handleLogout = useCallback(async () => {
    authLogout();
    setAuthUser(null);
    setState((prev) => ({ ...prev, view: 'welcome' }));
    //  ^^^ profile, stationResults etc. survive logout
}, []);
```

Additionally, `authLogout()` in `auth.ts:75-78` only removes `skillr-session` and `skillr-token`, not `skillr-state`.

## Impact

- **Privacy violation**: Personal learning data (interests, strengths, journey progress) is exposed to the next user on the same device.
- **Confusion**: New user sees a pre-filled profile and completed stations they never did.
- **Trust erosion**: Users sharing devices (common in school/family settings for the 14+ target audience) lose confidence in the app.

## Suggested Fix

### Option A: Clear state on logout (minimal change)

Reset the entire `AppState` to defaults when logging out:

```ts
const handleLogout = useCallback(async () => {
    authLogout();
    setAuthUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setState({
        view: 'welcome',
        profile: createInitialProfile(),
        stationResults: [],
        activeJourney: null,
        activeStation: null,
    });
}, []);
```

**Pros:** Simple, one-line fix.
**Cons:** If the same user logs back in, their progress is lost (no server-side state sync yet).

### Option B: User-keyed localStorage (robust)

Key the storage by user ID so each user gets their own persisted state:

```ts
function getStorageKey(userId?: string): string {
    return userId ? `skillr-state-${userId}` : 'skillr-state-anon';
}
```

On login, load the state for the new user. On logout, stop loading state from the old key.

**Pros:** Each user retains their progress across sessions on the same device.
**Cons:** More complex, requires migrating the existing anonymous key.

### Recommendation

**Option A** should be applied immediately as a hotfix. **Option B** can follow as a proper fix once server-side state sync (backend profile persistence) is implemented, so that localStorage is only a cache, not the source of truth.

## Files Involved

| File | Line | Issue |
|------|------|-------|
| `frontend/App.tsx` | 66 | `STORAGE_KEY` is global, not user-scoped |
| `frontend/App.tsx` | 77-108 | `loadState()` loads previous user's data |
| `frontend/App.tsx` | 110-116 | `saveState()` overwrites single global key |
| `frontend/App.tsx` | 242-246 | `handleLogout()` does not clear profile/stationResults |
| `frontend/services/auth.ts` | 75-78 | `logout()` does not remove `skillr-state` |

## Dependencies

- Related to server-side profile persistence (future)
- Affects all users sharing a device (school computers, family tablets)
