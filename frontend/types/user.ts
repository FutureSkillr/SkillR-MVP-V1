import type { JourneyType } from './journey';
import type { CoachId } from './intro';

export type VoiceDialect =
  | 'hochdeutsch'
  | 'bayerisch'
  | 'schwaebisch'
  | 'berlinerisch'
  | 'saechsisch'
  | 'koelsch';

/** Maps each coach to their dialect for TTS voice selection. */
const COACH_DIALECT_MAP: Record<CoachId, VoiceDialect> = {
  susi: 'koelsch',
  karlshains: 'schwaebisch',
  rene: 'hochdeutsch',
  heiko: 'berlinerisch',
  andreas: 'bayerisch',
  cloudia: 'saechsisch',
};

/** Derive the voice dialect from the selected coach. */
export function getDialectForCoach(coachId: CoachId | null): VoiceDialect {
  if (!coachId) return 'hochdeutsch';
  return COACH_DIALECT_MAP[coachId] ?? 'hochdeutsch';
}

export interface OnboardingInsights {
  interests: string[];
  strengths: string[];
  preferredStyle: 'hands-on' | 'reflective' | 'creative';
  recommendedJourney: JourneyType;
  summary: string;
}

export interface UserProfile {
  name: string;
  /** Selected coach — determines voice dialect and AI personality. */
  coachId: CoachId | null;
  voiceDialect: VoiceDialect;
  onboardingInsights: OnboardingInsights | null;
  journeyProgress: Record<JourneyType, JourneyProgress>;
  completedStations: string[];
}

export interface JourneyProgress {
  started: boolean;
  stationsCompleted: number;
  dimensionScores: Record<string, number>;
}

export function createInitialProfile(): UserProfile {
  return {
    name: 'Entdecker',
    coachId: null,
    voiceDialect: 'hochdeutsch',
    onboardingInsights: null,
    journeyProgress: {
      vuca: { started: false, stationsCompleted: 0, dimensionScores: {} },
      entrepreneur: { started: false, stationsCompleted: 0, dimensionScores: {} },
      'self-learning': { started: false, stationsCompleted: 0, dimensionScores: {} },
    },
    completedStations: [],
  };
}
