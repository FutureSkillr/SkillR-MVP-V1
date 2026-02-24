// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setCurrentUserId,
  getCurrentUserId,
  userKey,
  loadUserData,
  saveUserData,
  migrateAnonymousToUser,
  clearCurrentSession,
} from './userStorage';

describe('userStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUserId(null);
  });

  describe('setCurrentUserId / getCurrentUserId', () => {
    it('defaults to null', () => {
      expect(getCurrentUserId()).toBeNull();
    });

    it('stores and returns a user id', () => {
      setCurrentUserId('user-42');
      expect(getCurrentUserId()).toBe('user-42');
    });

    it('can be reset to null', () => {
      setCurrentUserId('user-42');
      setCurrentUserId(null);
      expect(getCurrentUserId()).toBeNull();
    });
  });

  describe('userKey', () => {
    it('appends userId when provided explicitly', () => {
      expect(userKey('skillr-state', 'abc123')).toBe('skillr-state-abc123');
    });

    it('returns base key when no userId and no current user', () => {
      expect(userKey('skillr-state')).toBe('skillr-state');
    });

    it('uses currentUserId when no explicit userId', () => {
      setCurrentUserId('user-7');
      expect(userKey('skillr-state')).toBe('skillr-state-user-7');
    });

    it('explicit userId takes precedence over currentUserId', () => {
      setCurrentUserId('user-7');
      expect(userKey('skillr-state', 'other')).toBe('skillr-state-other');
    });
  });

  describe('saveUserData / loadUserData', () => {
    it('round-trips data for anonymous user', () => {
      saveUserData('skillr-state', { foo: 'bar' });
      const result = loadUserData('skillr-state', {});
      expect(result).toEqual({ foo: 'bar' });
    });

    it('round-trips data for a specific user', () => {
      setCurrentUserId('u1');
      saveUserData('skillr-state', { user: 'one' });
      setCurrentUserId('u2');
      saveUserData('skillr-state', { user: 'two' });

      // Each user sees their own data
      setCurrentUserId('u1');
      expect(loadUserData('skillr-state', {})).toEqual({ user: 'one' });
      setCurrentUserId('u2');
      expect(loadUserData('skillr-state', {})).toEqual({ user: 'two' });
    });

    it('returns fallback when nothing stored', () => {
      expect(loadUserData('skillr-state', { default: true })).toEqual({ default: true });
    });

    it('returns fallback for corrupt JSON', () => {
      localStorage.setItem('skillr-state', 'not-json');
      expect(loadUserData('skillr-state', { fallback: true })).toEqual({ fallback: true });
    });

    it('accepts explicit userId parameter', () => {
      saveUserData('skillr-state', { explicit: true }, 'u99');
      expect(loadUserData('skillr-state', {}, 'u99')).toEqual({ explicit: true });
    });
  });

  describe('migrateAnonymousToUser', () => {
    it('copies anonymous keys to user-scoped keys', () => {
      localStorage.setItem('skillr-state', '{"migrated":true}');
      localStorage.setItem('skillr-vuca-state', '{"v":1}');
      localStorage.setItem('skillr-voice-enabled', '"true"');

      migrateAnonymousToUser('user-1');

      expect(localStorage.getItem('skillr-state-user-1')).toBe('{"migrated":true}');
      expect(localStorage.getItem('skillr-vuca-state-user-1')).toBe('{"v":1}');
      expect(localStorage.getItem('skillr-voice-enabled-user-1')).toBe('"true"');
    });

    it('deletes anonymous keys after migration', () => {
      localStorage.setItem('skillr-state', '{}');
      migrateAnonymousToUser('user-1');
      expect(localStorage.getItem('skillr-state')).toBeNull();
    });

    it('does not overwrite existing user-keyed data', () => {
      localStorage.setItem('skillr-state', '{"anonymous":"data"}');
      localStorage.setItem('skillr-state-user-1', '{"existing":"data"}');

      migrateAnonymousToUser('user-1');

      expect(localStorage.getItem('skillr-state-user-1')).toBe('{"existing":"data"}');
    });

    it('is a no-op when no anonymous data exists', () => {
      migrateAnonymousToUser('user-1');
      expect(localStorage.getItem('skillr-state-user-1')).toBeNull();
    });
  });

  describe('clearCurrentSession', () => {
    it('removes anonymous keys', () => {
      localStorage.setItem('skillr-state', '{}');
      localStorage.setItem('skillr-vuca-state', '{}');
      localStorage.setItem('skillr-voice-enabled', 'true');
      localStorage.setItem('other-key', 'keep');

      clearCurrentSession();

      expect(localStorage.getItem('skillr-state')).toBeNull();
      expect(localStorage.getItem('skillr-vuca-state')).toBeNull();
      expect(localStorage.getItem('skillr-voice-enabled')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('keep');
    });

    it('does not remove user-keyed data', () => {
      localStorage.setItem('skillr-state-user-1', '{"preserved":true}');
      clearCurrentSession();
      expect(localStorage.getItem('skillr-state-user-1')).toBe('{"preserved":true}');
    });
  });
});
