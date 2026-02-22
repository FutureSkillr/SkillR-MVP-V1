import { describe, it, expect, vi, beforeEach } from 'vitest';
import { awardXP, getXPForNextLevel, computeLevel } from './engagement';
import { createInitialEngagement } from '../types/engagement';
import type { EngagementState } from '../types/engagement';

// Mock firestore to avoid real persistence in tests
vi.mock('./firestore', () => ({
  saveUserState: vi.fn(),
  loadUserState: vi.fn().mockResolvedValue(null),
}));

function makeState(overrides: Partial<EngagementState> = {}): EngagementState {
  return { ...createInitialEngagement(), ...overrides };
}

// Fix date for deterministic tests
function mockToday(dateStr: string) {
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    () =>
      ({
        format: () => dateStr,
        resolvedOptions: () => ({ locale: 'sv-SE' }),
      }) as unknown as Intl.DateTimeFormat
  );
}

describe('awardXP', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('awards correct XP for onboarding_complete', () => {
    mockToday('2026-02-19');
    const state = makeState();
    const updated = awardXP(state, 'onboarding_complete');
    // 50 (onboarding) + 20 (daily login bonus, first action of day)
    expect(updated.totalXP).toBe(70);
  });

  it('awards station_start XP', () => {
    mockToday('2026-02-19');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 70, currentStreak: 1 });
    const updated = awardXP(state, 'station_start');
    // 10 (station_start), no daily bonus (already active today)
    expect(updated.totalXP).toBe(80);
  });

  it('awards station_complete XP', () => {
    mockToday('2026-02-19');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 80, currentStreak: 1 });
    const updated = awardXP(state, 'station_complete');
    expect(updated.totalXP).toBe(180);
  });

  it('awards quiz_correct XP', () => {
    mockToday('2026-02-19');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 50, currentStreak: 1 });
    const updated = awardXP(state, 'quiz_correct');
    expect(updated.totalXP).toBe(60);
  });

  it('awards daily_login bonus on first action of new day', () => {
    mockToday('2026-02-20');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 100, currentStreak: 1 });
    const updated = awardXP(state, 'station_start');
    // 10 (station_start) + 20 (daily login bonus)
    expect(updated.totalXP).toBe(130);
  });

  it('does NOT double-count daily_login action', () => {
    mockToday('2026-02-20');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 100, currentStreak: 1 });
    const updated = awardXP(state, 'daily_login');
    // daily_login action XP is 0 (avoided double-count) + 20 (daily bonus)
    expect(updated.totalXP).toBe(120);
  });

  it('does not award daily bonus twice on same day', () => {
    mockToday('2026-02-19');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 100, currentStreak: 1 });
    const updated = awardXP(state, 'profile_view');
    // 5 (profile_view), no daily bonus
    expect(updated.totalXP).toBe(105);
  });
});

describe('streak logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts streak at 1 on first activity', () => {
    mockToday('2026-02-19');
    const state = makeState();
    const updated = awardXP(state, 'station_start');
    expect(updated.currentStreak).toBe(1);
    expect(updated.lastActiveDate).toBe('2026-02-19');
  });

  it('increments streak on consecutive day', () => {
    mockToday('2026-02-20');
    const state = makeState({ lastActiveDate: '2026-02-19', currentStreak: 3 });
    const updated = awardXP(state, 'station_start');
    expect(updated.currentStreak).toBe(4);
  });

  it('halves streak on missed day (gap > 1)', () => {
    mockToday('2026-02-22');
    const state = makeState({ lastActiveDate: '2026-02-19', currentStreak: 6 });
    const updated = awardXP(state, 'station_start');
    // Math.floor(6/2) = 3, +1 for today = 4
    expect(updated.currentStreak).toBe(4);
  });

  it('uses streak freeze when gap is exactly 2 days and freeze is available', () => {
    mockToday('2026-02-21');
    const state = makeState({
      lastActiveDate: '2026-02-19',
      currentStreak: 7,
      streakFreezeAvailable: true,
    });
    const updated = awardXP(state, 'station_start');
    expect(updated.currentStreak).toBe(8);
    expect(updated.streakFreezeAvailable).toBe(false);
  });

  it('does not use freeze when gap > 2', () => {
    mockToday('2026-02-23');
    const state = makeState({
      lastActiveDate: '2026-02-19',
      currentStreak: 8,
      streakFreezeAvailable: true,
    });
    const updated = awardXP(state, 'station_start');
    // 4-day gap, freeze not used. Math.floor(8/2) = 4, +1 = 5
    expect(updated.currentStreak).toBe(5);
    expect(updated.streakFreezeAvailable).toBe(false);
  });

  it('updates longestStreak when current exceeds it', () => {
    mockToday('2026-02-20');
    const state = makeState({
      lastActiveDate: '2026-02-19',
      currentStreak: 5,
      longestStreak: 5,
    });
    const updated = awardXP(state, 'station_start');
    expect(updated.longestStreak).toBe(6);
  });

  it('does not change streak when already active today', () => {
    mockToday('2026-02-19');
    const state = makeState({ lastActiveDate: '2026-02-19', currentStreak: 3 });
    const updated = awardXP(state, 'station_start');
    expect(updated.currentStreak).toBe(3);
  });

  it('grants streak freeze at 7-day streak', () => {
    mockToday('2026-02-20');
    const state = makeState({
      lastActiveDate: '2026-02-19',
      currentStreak: 6,
      streakFreezeAvailable: false,
    });
    const updated = awardXP(state, 'station_start');
    expect(updated.currentStreak).toBe(7);
    expect(updated.streakFreezeAvailable).toBe(true);
  });
});

describe('level computation', () => {
  it('level 1 at 0 XP', () => {
    expect(computeLevel(0)).toEqual({ level: 1, title: 'Entdecker' });
  });

  it('level 2 at 100 XP', () => {
    expect(computeLevel(100)).toEqual({ level: 2, title: 'Reisender' });
  });

  it('level 3 at 300 XP', () => {
    expect(computeLevel(300)).toEqual({ level: 3, title: 'Abenteurer' });
  });

  it('level 4 at 600 XP', () => {
    expect(computeLevel(600)).toEqual({ level: 4, title: 'Wegbereiter' });
  });

  it('level 5 at 1000 XP', () => {
    expect(computeLevel(1000)).toEqual({ level: 5, title: 'Weltenbummler' });
  });

  it('stays level 2 at 299 XP', () => {
    expect(computeLevel(299)).toEqual({ level: 2, title: 'Reisender' });
  });

  it('updates level in awardXP result', () => {
    mockToday('2026-02-19');
    const state = makeState({ lastActiveDate: '2026-02-19', totalXP: 95, currentStreak: 1 });
    const updated = awardXP(state, 'quiz_correct');
    // 95 + 10 = 105 → level 2
    expect(updated.level).toBe(2);
    expect(updated.levelTitle).toBe('Reisender');
  });
});

describe('getXPForNextLevel', () => {
  it('returns progress within level 1', () => {
    const result = getXPForNextLevel(50);
    expect(result.current).toBe(0);
    expect(result.next).toBe(100);
    expect(result.progress).toBe(0.5);
  });

  it('returns progress at level boundary', () => {
    const result = getXPForNextLevel(100);
    expect(result.current).toBe(100);
    expect(result.next).toBe(300);
    expect(result.progress).toBe(0);
  });

  it('returns full progress at max level', () => {
    const result = getXPForNextLevel(1500);
    expect(result.progress).toBe(1);
  });

  it('returns partial progress in level 3', () => {
    const result = getXPForNextLevel(450);
    // Range: 300 to 600 = 300, progress = 150/300 = 0.5
    expect(result.progress).toBe(0.5);
  });
});

describe('weekly XP reset', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resets weekly XP when week changes', () => {
    mockToday('2026-02-24'); // Monday of next week
    const state = makeState({
      lastActiveDate: '2026-02-19',
      currentStreak: 1,
      weeklyXP: 200,
      weekStartDate: '2026-02-17', // Previous Monday
    });
    const updated = awardXP(state, 'station_start');
    // Weekly XP should reset, then get the new XP
    expect(updated.weeklyXP).toBe(30); // 10 (station) + 20 (daily)
  });
});
