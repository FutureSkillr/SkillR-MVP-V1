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

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  vi.resetModules();
});

describe('firebase service', () => {
  it('isFirebaseConfigured returns false before init', async () => {
    const { isFirebaseConfigured } = await import('./firebase');
    expect(isFirebaseConfigured()).toBe(false);
  });

  it('initFirebase fetches config from /api/config', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        firebase: {
          apiKey: 'test-key',
          authDomain: 'test.firebaseapp.com',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123',
          appId: '1:123:web:abc',
        },
      }),
    });

    const { initFirebase, isFirebaseConfigured } = await import('./firebase');
    await initFirebase();

    expect(mockFetch).toHaveBeenCalledWith('/api/config');
    expect(isFirebaseConfigured()).toBe(true);
  });

  it('initFirebase handles missing config gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        firebase: { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' },
      }),
    });

    const { initFirebase, isFirebaseConfigured } = await import('./firebase');
    await initFirebase();

    expect(isFirebaseConfigured()).toBe(false);
  });

  it('initFirebase throws on network error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { initFirebase } = await import('./firebase');
    await expect(initFirebase()).rejects.toThrow('Failed to fetch config: 500');
  });
});
