import type { JourneyType } from './journey';

export type VoiceDialect =
  | 'hochdeutsch'
  | 'bayerisch'
  | 'schwaebisch'
  | 'berlinerisch'
  | 'saechsisch'
  | 'koelsch';

export interface VoiceDialectOption {
  key: VoiceDialect;
  label: string;
  region: string;
  greeting: string;
  color: string;
}

export const VOICE_DIALECTS: VoiceDialectOption[] = [
  { key: 'hochdeutsch', label: 'Hochdeutsch', region: 'Standard', greeting: 'Hallo! Schoen, dass du da bist. Lass uns deine Reise starten.', color: 'blue' },
  { key: 'bayerisch', label: 'Bayerisch', region: 'Bayern', greeting: 'Servus! Schee, dass d\' da bist. Pack ma\'s, mir starten dei Reis!', color: 'blue' },
  { key: 'schwaebisch', label: 'Schwaebisch', region: 'Baden-Wuerttemberg', greeting: 'Grueß Gott! Schee, dass du do bisch. Komm, mir gangat los!', color: 'orange' },
  { key: 'berlinerisch', label: 'Berlinerisch', region: 'Berlin', greeting: 'Na, Mensch! Jut, datt du da bist. Lass ma loslegen, wa?', color: 'purple' },
  { key: 'saechsisch', label: 'Saechsisch', region: 'Sachsen', greeting: 'Tach! Scheene, dass de da bist. Na, dann gomma los!', color: 'orange' },
  { key: 'koelsch', label: 'Koelsch', region: 'Koeln / Rheinland', greeting: 'Tach! Schoen, dat du do bes. Kumm, mer fange aan!', color: 'purple' },
];

export interface OnboardingInsights {
  interests: string[];
  strengths: string[];
  preferredStyle: 'hands-on' | 'reflective' | 'creative';
  recommendedJourney: JourneyType;
  summary: string;
}

export interface UserProfile {
  name: string;
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
