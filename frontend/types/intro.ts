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
}

export interface IntroState {
  coachId: CoachId | null;
  messages: ChatMessage[];
  smalltalkComplete: boolean;
  demoComplete: boolean;
  earnedXP: number;
  interests: string[];
  startedAt: number;
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
