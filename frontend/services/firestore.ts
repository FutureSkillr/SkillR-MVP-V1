import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { getFirebaseApp, isFirebaseConfigured } from './firebase';
import { getFirebaseAuth } from './firebase';
import { userKey as buildUserKey } from './userStorage';

let db: Firestore | null = null;

function getDB(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

function getCurrentUid(): string | null {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  return auth.currentUser?.uid ?? null;
}

// Debounce helper
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedWrite(key: string, fn: () => Promise<void>, delayMs = 500): void {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(key, setTimeout(() => {
    debounceTimers.delete(key);
    fn().catch((err) => console.warn(`[firestore] write failed for ${key}:`, err));
  }, delayMs));
}

// Save state to Firestore (or localStorage fallback)
export async function saveUserState(key: string, data: unknown): Promise<void> {
  const uid = getCurrentUid();
  const localKey = buildUserKey(`skillr-${key}`, uid ?? undefined);

  // Always save to localStorage as cache
  try {
    localStorage.setItem(localKey, JSON.stringify(data));
  } catch { /* ignore */ }

  const firestore = getDB();
  if (!firestore || !uid) return;

  debouncedWrite(`${uid}/${key}`, async () => {
    const ref = doc(firestore, 'users', uid, 'state', key);
    await setDoc(ref, { data: JSON.stringify(data), updatedAt: Date.now() });
  });
}

// Load state from Firestore (or localStorage fallback)
export async function loadUserState<T>(key: string, fallback: T): Promise<T> {
  const firestore = getDB();
  const uid = getCurrentUid();
  const localKey = buildUserKey(`skillr-${key}`, uid ?? undefined);

  if (firestore && uid) {
    try {
      const ref = doc(firestore, 'users', uid, 'state', key);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const raw = snap.data().data;
        const parsed = JSON.parse(raw) as T;
        // Update localStorage cache
        try { localStorage.setItem(localKey, JSON.stringify(parsed)); } catch { /* ignore */ }
        return parsed;
      }
    } catch (err) {
      console.warn(`[firestore] load failed for ${key}, falling back to localStorage:`, err);
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(localKey);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }

  return fallback;
}

// Migrate localStorage data to Firestore on first login
export async function migrateLocalStorageToFirestore(): Promise<void> {
  const firestore = getDB();
  const uid = getCurrentUid();
  if (!firestore || !uid) return;

  const keys = ['state', 'vuca-state', 'voice-enabled'];
  const localKeyMap: Record<string, string> = {
    'state': 'skillr-state',
    'vuca-state': 'skillr-vuca-state',
    'voice-enabled': 'skillr-voice-enabled',
  };

  for (const key of keys) {
    try {
      const ref = doc(firestore, 'users', uid, 'state', key);
      const snap = await getDoc(ref);
      if (snap.exists()) continue; // Firestore already has data, don't overwrite

      const localData = localStorage.getItem(localKeyMap[key]);
      if (localData) {
        await setDoc(ref, { data: localData, updatedAt: Date.now() });
      }
    } catch (err) {
      console.warn(`[firestore] migration failed for ${key}:`, err);
    }
  }
}

// Clear anonymous cache keys (on logout).
// User-keyed data (e.g. skillr-state-{uid}) is preserved for next login.
export function clearLocalState(): void {
  const keys = ['skillr-state', 'skillr-vuca-state', 'skillr-voice-enabled'];
  for (const key of keys) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
