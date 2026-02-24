/**
 * User-keyed localStorage utility.
 *
 * Isolates per-user state so that switching accounts on the same browser
 * never leaks one user's profile into another's session (OBS-011).
 */

const USER_SPECIFIC_KEYS = [
  'skillr-state',
  'skillr-vuca-state',
  'skillr-voice-enabled',
];

let currentUserId: string | null = null;

export function setCurrentUserId(id: string | null): void {
  currentUserId = id;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Build a user-scoped localStorage key.
 *   userKey('skillr-state', 'abc123') → 'skillr-state-abc123'
 *   userKey('skillr-state')           → 'skillr-state'  (anonymous fallback)
 */
export function userKey(baseKey: string, userId?: string): string {
  const id = userId ?? currentUserId;
  return id ? `${baseKey}-${id}` : baseKey;
}

export function loadUserData<T>(baseKey: string, fallback: T, userId?: string): T {
  try {
    const stored = localStorage.getItem(userKey(baseKey, userId));
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  return fallback;
}

export function saveUserData(baseKey: string, data: unknown, userId?: string): void {
  try {
    localStorage.setItem(userKey(baseKey, userId), JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * Migrate anonymous (un-keyed) data to user-keyed storage on first login.
 * Only copies if the user-keyed slot does not already exist.
 * Deletes the anonymous key after migration to prevent stale data.
 */
export function migrateAnonymousToUser(userId: string): void {
  for (const baseKey of USER_SPECIFIC_KEYS) {
    const userScopedKey = `${baseKey}-${userId}`;
    // Skip if user-keyed data already exists
    if (localStorage.getItem(userScopedKey) !== null) continue;

    const anonymous = localStorage.getItem(baseKey);
    if (anonymous !== null) {
      localStorage.setItem(userScopedKey, anonymous);
      localStorage.removeItem(baseKey);
    }
  }
}

/**
 * Clear React-relevant anonymous keys on logout.
 * Does NOT delete user-keyed data — that is preserved for next login.
 */
export function clearCurrentSession(): void {
  for (const baseKey of USER_SPECIFIC_KEYS) {
    try { localStorage.removeItem(baseKey); } catch { /* ignore */ }
  }
}
