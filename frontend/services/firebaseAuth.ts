import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type AuthProvider as FirebaseAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirebaseAuth,
  getGoogleProvider,
  getAppleProvider,
  getFacebookProvider,
} from './firebase';
import { getFirebaseErrorMessage } from './firebaseErrors';
import type { AuthUser, AuthProvider, UserRole } from '../types/auth';

const SESSION_KEY = 'skillr-session';
const TOKEN_KEY = 'skillr-token';

async function storeFirebaseToken(fbUser: FirebaseUser): Promise<void> {
  const token = await fbUser.getIdToken();
  localStorage.setItem(TOKEN_KEY, token);
}

async function firebaseUserToAuthUser(
  fbUser: FirebaseUser,
  provider: AuthProvider
): Promise<AuthUser> {
  let role: UserRole = 'user';
  try {
    const tokenResult = await fbUser.getIdTokenResult(true);
    if (tokenResult.claims.role === 'admin') {
      role = 'admin';
    }
  } catch {
    // If token fetch fails, default to 'user'
  }

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || 'Nutzer',
    role,
    authProvider: provider,
    photoURL: fbUser.photoURL || undefined,
    createdAt: Date.now(),
  };
}

function getProviderInstance(provider: AuthProvider): FirebaseAuthProvider {
  switch (provider) {
    case 'google': return getGoogleProvider();
    case 'apple': return getAppleProvider();
    case 'facebook': return getFacebookProvider();
    default: throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function firebaseLoginWithProvider(provider: AuthProvider): Promise<AuthUser> {
  try {
    const auth = getFirebaseAuth();
    const providerInstance = getProviderInstance(provider);
    const result = await signInWithPopup(auth, providerInstance);
    const authUser = await firebaseUserToAuthUser(result.user, provider);
    await storeFirebaseToken(result.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function firebaseRegister(
  email: string,
  displayName: string,
  password: string
): Promise<AuthUser> {
  try {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    // Re-fetch user to pick up the updated displayName
    const authUser = await firebaseUserToAuthUser(result.user, 'email');
    // Override displayName since the token may not reflect it yet
    authUser.displayName = displayName;
    await storeFirebaseToken(result.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function firebaseLogin(email: string, password: string): Promise<AuthUser> {
  try {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    const authUser = await firebaseUserToAuthUser(result.user, 'email');
    await storeFirebaseToken(result.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function firebaseLogout(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await signOut(auth);
  } catch {
    // Ignore sign-out errors
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Force-refresh the Firebase ID token and return an updated AuthUser
 * with the current role from custom claims.
 * Returns null if no user is signed in.
 */
export async function refreshAuthUser(): Promise<AuthUser | null> {
  try {
    const auth = getFirebaseAuth();
    const fbUser = auth.currentUser;
    if (!fbUser) return null;

    const tokenResult = await fbUser.getIdTokenResult(true);
    localStorage.setItem(TOKEN_KEY, tokenResult.token);
    const role: UserRole = tokenResult.claims.role === 'admin' ? 'admin' : 'user';

    // Read existing session to preserve provider info
    let provider: AuthProvider = 'email';
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.authProvider) provider = parsed.authProvider;
      }
    } catch {
      // ignore
    }

    const authUser: AuthUser = {
      id: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || 'Nutzer',
      role,
      authProvider: provider,
      photoURL: fbUser.photoURL || undefined,
      createdAt: Date.now(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  } catch {
    return null;
  }
}
