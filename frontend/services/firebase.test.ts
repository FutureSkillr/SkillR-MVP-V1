import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/app and firebase/auth before importing the module under test
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ languageCode: null })),
  GoogleAuthProvider: vi.fn(() => ({ addScope: vi.fn() })),
  OAuthProvider: vi.fn(() => ({ addScope: vi.fn() })),
  FacebookAuthProvider: vi.fn(() => ({ addScope: vi.fn() })),
}));

beforeEach(() => {
  vi.resetModules();
});

describe('firebase service', () => {
  it('isFirebaseConfigured returns false when env vars are empty', async () => {
    const { isFirebaseConfigured } = await import('./firebase');
    expect(isFirebaseConfigured()).toBe(false);
  });

  it('getFirebaseApp returns an app instance', async () => {
    const { getFirebaseApp } = await import('./firebase');
    const app = getFirebaseApp();
    expect(app).toBeDefined();
    expect(app).toHaveProperty('name', 'mock-app');
  });

  it('getFirebaseAuth returns an auth instance', async () => {
    const { getFirebaseAuth } = await import('./firebase');
    const auth = getFirebaseAuth();
    expect(auth).toBeDefined();
  });

  it('getGoogleProvider returns a provider with scopes', async () => {
    const { getGoogleProvider } = await import('./firebase');
    const provider = getGoogleProvider();
    expect(provider).toBeDefined();
    expect(provider.addScope).toHaveBeenCalledWith('email');
    expect(provider.addScope).toHaveBeenCalledWith('profile');
  });
});
