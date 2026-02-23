import type { ChatMessage } from './chat';

export type CoachId = 'susi' | 'karlshains' | 'rene' | 'heiko' | 'andreas' | 'cloudia';

export interface CoachPersona {
  id: CoachId;
  name: string;
  emoji: string;
  tagline: string;
  setting: string;
  dialect: string;
  color: string;
  /** Second gradient color for avatar ring */
  colorEnd: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  systemPromptFragment: string;
  /** URL to a photographic coach image (square, min 400x400). Falls back to SVG avatar. */
  photoUrl?: string;
}

export interface IntroState {
  coachId: CoachId | null;
  messages: ChatMessage[];
  smalltalkComplete: boolean;
  demoComplete: boolean;
  earnedXP: number;
  interests: string[];
  startedAt: number;
  /** Whether user skipped the intro chat via "Weiter >" */
  fastForward?: boolean;
  /** Timestamp when smalltalk phase completed */
  smalltalkCompletedAt?: number;
  /** Timestamp when demo phase completed */
  demoCompletedAt?: number;
  /** Timestamp when intro flow completed (dialog or fast-forward) */
  completedAt?: number;
}

export function createInitialIntroState(): IntroState {
  return {
    coachId: null,
    messages: [],
    smalltalkComplete: false,
    demoComplete: false,
    earnedXP: 0,
    interests: [],
    startedAt: Date.now(),
  };
}
