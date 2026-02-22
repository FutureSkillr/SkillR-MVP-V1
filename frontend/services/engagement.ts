import type { EngagementState, XPAction } from '../types/engagement';
import { LEVELS, XP_REWARDS, createInitialEngagement } from '../types/engagement';
import { saveUserState, loadUserState } from './firestore';

const STORAGE_KEY = 'engagement';

function getToday(): string {
  return new Intl.DateTimeFormat('sv-SE').format(new Date()); // "2026-02-19"
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  return new Intl.DateTimeFormat('sv-SE').format(monday);
}

function daysBetween(dateA: string, dateB: string): number {
  if (!dateA || !dateB) return Infinity;
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function computeLevel(totalXP: number): { level: number; title: string } {
  let result = LEVELS[0];
  for (const def of LEVELS) {
    if (totalXP >= def.xpRequired) {
      result = def;
    }
  }
  return { level: result.level, title: result.title };
}

export function getXPForNextLevel(totalXP: number): { current: number; next: number; progress: number } {
  const { level } = computeLevel(totalXP);
  const currentDef = LEVELS.find((l) => l.level === level)!;
  const nextDef = LEVELS.find((l) => l.level === level + 1);
  if (!nextDef) {
    return { current: currentDef.xpRequired, next: currentDef.xpRequired, progress: 1 };
  }
  const range = nextDef.xpRequired - currentDef.xpRequired;
  const progress = range > 0 ? (totalXP - currentDef.xpRequired) / range : 1;
  return { current: currentDef.xpRequired, next: nextDef.xpRequired, progress: Math.min(progress, 1) };
}

function updateStreak(state: EngagementState, today: string): EngagementState {
  if (state.lastActiveDate === today) {
    return state; // Already active today
  }

  const gap = daysBetween(state.lastActiveDate, today);

  if (gap === 1) {
    // Consecutive day
    const newStreak = state.currentStreak + 1;
    return {
      ...state,
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastActiveDate: today,
      streakFreezeAvailable: newStreak >= 7 && !state.streakFreezeAvailable,
    };
  }

  if (gap > 1) {
    // Missed day(s)
    if (state.streakFreezeAvailable && gap === 2) {
      // Use freeze — preserve streak, consume freeze
      const newStreak = state.currentStreak + 1;
      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
        lastActiveDate: today,
        streakFreezeAvailable: false,
      };
    }
    // Halve streak (kinder than zeroing)
    const halved = Math.floor(state.currentStreak / 2);
    return {
      ...state,
      currentStreak: halved > 0 ? halved + 1 : 1, // +1 for today
      lastActiveDate: today,
      streakFreezeAvailable: false,
    };
  }

  // First ever activity (gap is Infinity or 0)
  return {
    ...state,
    currentStreak: 1,
    lastActiveDate: today,
  };
}

function resetWeeklyIfNeeded(state: EngagementState): EngagementState {
  const weekStart = getWeekStart();
  if (state.weekStartDate !== weekStart) {
    return { ...state, weeklyXP: 0, weekStartDate: weekStart };
  }
  return state;
}

export function awardXP(state: EngagementState, action: XPAction): EngagementState {
  const xp = XP_REWARDS[action];
  const today = getToday();

  let updated = { ...state };

  // Update streak
  updated = updateStreak(updated, today);

  // Award daily login XP if first action of the day
  const isFirstToday = state.lastActiveDate !== today;
  const dailyBonus = isFirstToday ? XP_REWARDS.daily_login : 0;

  // Reset weekly if needed
  updated = resetWeeklyIfNeeded(updated);

  // Add XP
  const actionXP = action === 'daily_login' ? 0 : xp; // Don't double-count daily
  updated.totalXP += actionXP + dailyBonus;
  updated.weeklyXP += actionXP + dailyBonus;

  // Recalculate level
  const { level, title } = computeLevel(updated.totalXP);
  updated.level = level;
  updated.levelTitle = title;

  return updated;
}

export async function loadEngagement(): Promise<EngagementState> {
  return loadUserState<EngagementState>(STORAGE_KEY, createInitialEngagement());
}

export async function saveEngagement(state: EngagementState): Promise<void> {
  return saveUserState(STORAGE_KEY, state);
}

// Re-export for convenience
export { computeLevel };
