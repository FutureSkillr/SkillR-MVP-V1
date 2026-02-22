// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveUserState, loadUserState, clearLocalState } from './firestore';

// Mock firebase modules so they don't try to initialize
vi.mock('./firebase', () => ({
  isFirebaseConfigured: () => false,
  getFirebaseApp: () => null,
  getFirebaseAuth: () => ({ currentUser: null }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: () => ({}),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

describe('firestore service (localStorage fallback mode)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveUserState', () => {
    it('saves data to localStorage', async () => {
      await saveUserState('test-key', { hello: 'world' });
      const stored = localStorage.getItem('skillr-test-key');
      expect(stored).toBe(JSON.stringify({ hello: 'world' }));
    });

    it('handles complex objects', async () => {
      const data = { arr: [1, 2, 3], nested: { a: true } };
      await saveUserState('complex', data);
      const stored = JSON.parse(localStorage.getItem('skillr-complex')!);
      expect(stored).toEqual(data);
    });
  });

  describe('loadUserState', () => {
    it('returns fallback when no data exists', async () => {
      const result = await loadUserState('nonexistent', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('returns stored data from localStorage', async () => {
      localStorage.setItem('skillr-stored', JSON.stringify({ saved: true }));
      const result = await loadUserState('stored', { saved: false });
      expect(result).toEqual({ saved: true });
    });

    it('returns fallback for invalid JSON in localStorage', async () => {
      localStorage.setItem('skillr-bad', 'not-json');
      const result = await loadUserState('bad', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });
  });

  describe('clearLocalState', () => {
    it('removes all skillr keys', () => {
      localStorage.setItem('skillr-state', '{}');
      localStorage.setItem('skillr-vuca-state', '{}');
      localStorage.setItem('skillr-voice-enabled', 'true');
      localStorage.setItem('other-key', 'keep');

      clearLocalState();

      expect(localStorage.getItem('skillr-state')).toBeNull();
      expect(localStorage.getItem('skillr-vuca-state')).toBeNull();
      expect(localStorage.getItem('skillr-voice-enabled')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('keep');
    });
  });
});
