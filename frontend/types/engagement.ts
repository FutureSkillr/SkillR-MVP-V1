export interface EngagementState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date "2026-02-19"
  streakFreezeAvailable: boolean;

  totalXP: number;
  weeklyXP: number;
  weekStartDate: string;

  level: number;
  levelTitle: string;
}

export interface LevelDefinition {
  level: number;
  title: string;
  xpRequired: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: 'Entdecker', xpRequired: 0 },
  { level: 2, title: 'Reisender', xpRequired: 100 },
  { level: 3, title: 'Abenteurer', xpRequired: 300 },
  { level: 4, title: 'Wegbereiter', xpRequired: 600 },
  { level: 5, title: 'Weltenbummler', xpRequired: 1000 },
];

export type XPAction =
  | 'onboarding_complete'
  | 'station_start'
  | 'station_complete'
  | 'vuca_module_complete'
  | 'quiz_correct'
  | 'daily_login'
  | 'profile_view'
  | 'intro_demo_complete';

export const XP_REWARDS: Record<XPAction, number> = {
  onboarding_complete: 50,
  station_start: 10,
  station_complete: 100,
  vuca_module_complete: 30,
  quiz_correct: 10,
  daily_login: 20,
  profile_view: 5,
  intro_demo_complete: 25,
};

export function createInitialEngagement(): EngagementState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    streakFreezeAvailable: false,
    totalXP: 0,
    weeklyXP: 0,
    weekStartDate: '',
    level: 1,
    levelTitle: 'Entdecker',
  };
}
