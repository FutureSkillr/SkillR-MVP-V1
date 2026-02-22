import { describe, it, expect } from 'vitest';
import { createInitialProfile } from './user';

describe('createInitialProfile', () => {
  it('creates a profile with default values', () => {
    const profile = createInitialProfile();
    expect(profile.name).toBe('Entdecker');
    expect(profile.voiceDialect).toBe('hochdeutsch');
    expect(profile.onboardingInsights).toBeNull();
    expect(profile.completedStations).toEqual([]);
  });

  it('initializes all three journey types', () => {
    const profile = createInitialProfile();
    expect(profile.journeyProgress.vuca).toBeDefined();
    expect(profile.journeyProgress.entrepreneur).toBeDefined();
    expect(profile.journeyProgress['self-learning']).toBeDefined();
  });

  it('all journeys start with zero progress', () => {
    const profile = createInitialProfile();
    for (const key of ['vuca', 'entrepreneur', 'self-learning'] as const) {
      const jp = profile.journeyProgress[key];
      expect(jp.started).toBe(false);
      expect(jp.stationsCompleted).toBe(0);
      expect(jp.dimensionScores).toEqual({});
    }
  });

  it('returns a new object each call', () => {
    const a = createInitialProfile();
    const b = createInitialProfile();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
