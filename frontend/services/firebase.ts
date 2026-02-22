import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseConfig() {
  return {
    apiKey: (globalThis as any).process?.env?.FIREBASE_API_KEY || '',
    authDomain: (globalThis as any).process?.env?.FIREBASE_AUTH_DOMAIN || '',
    projectId: (globalThis as any).process?.env?.FIREBASE_PROJECT_ID || '',
    storageBucket: (globalThis as any).process?.env?.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: (globalThis as any).process?.env?.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: (globalThis as any).process?.env?.FIREBASE_APP_ID || '',
  };
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return !!(config.apiKey && config.authDomain && config.projectId);
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    auth.languageCode = 'de';
  }
  return auth;
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  return provider;
}

export function getAppleProvider(): OAuthProvider {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return provider;
}

export function getFacebookProvider(): FacebookAuthProvider {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  return provider;
}
