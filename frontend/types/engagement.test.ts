import { describe, it, expect } from 'vitest';
import {
  LEVELS,
  XP_REWARDS,
  createInitialEngagement,
} from './engagement';
import type { XPAction } from './engagement';

describe('engagement types', () => {
  it('LEVELS are sorted by xpRequired', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
    }
  });

  it('LEVELS start at level 1 with 0 XP', () => {
    expect(LEVELS[0].level).toBe(1);
    expect(LEVELS[0].xpRequired).toBe(0);
  });

  it('all XP actions have positive rewards', () => {
    for (const [action, reward] of Object.entries(XP_REWARDS)) {
      expect(reward).toBeGreaterThan(0);
    }
  });

  it('createInitialEngagement returns valid state', () => {
    const state = createInitialEngagement();
    expect(state.currentStreak).toBe(0);
    expect(state.totalXP).toBe(0);
    expect(state.level).toBe(1);
    expect(state.levelTitle).toBe('Entdecker');
    expect(state.lastActiveDate).toBe('');
    expect(state.streakFreezeAvailable).toBe(false);
  });
});
