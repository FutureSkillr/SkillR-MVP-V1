import type { IntroState, CoachId } from '../types/intro';
import type { ChatMessage } from '../types/chat';
import { createInitialIntroState } from '../types/intro';

const STORAGE_KEY = 'skillr-intro';

// L17: Basic obfuscation for localStorage data to prevent casual reading
function encodeData(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return data;
  }
}

function decodeData(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    // Fallback: try reading as plain JSON (backwards compat)
    return encoded;
  }
}

// L18: Runtime schema validation for localStorage data
function isValidIntroState(data: unknown): data is IntroState {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.coachId !== null && typeof obj.coachId !== 'string') return false;
  if (typeof obj.startedAt !== 'number') return false;
  if (!Array.isArray(obj.messages)) return false;
  if (typeof obj.smalltalkComplete !== 'boolean') return false;
  if (typeof obj.demoComplete !== 'boolean') return false;
  if (!Array.isArray(obj.interests)) return false;
  if (typeof obj.earnedXP !== 'number') return false;
  return true;
}

export function loadIntroState(): IntroState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(decodeData(stored));
    // L18: Validate schema before trusting localStorage data
    if (!isValidIntroState(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveIntroState(state: IntroState): void {
  try {
    // L17: Encode data before storing
    localStorage.setItem(STORAGE_KEY, encodeData(JSON.stringify(state)));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function clearIntroState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function updateIntroCoach(coachId: CoachId): IntroState {
  const existing = loadIntroState();
  const state: IntroState = existing || createInitialIntroState();
  state.coachId = coachId;
  state.startedAt = Date.now();
  saveIntroState(state);
  return state;
}

export function updateIntroMessages(messages: ChatMessage[]): void {
  const state = loadIntroState();
  if (!state) return;
  state.messages = messages;
  saveIntroState(state);
}

export function markSmalltalkComplete(interests: string[]): void {
  const state = loadIntroState();
  if (!state) return;
  state.smalltalkComplete = true;
  state.interests = interests;
  state.smalltalkCompletedAt = Date.now();
  saveIntroState(state);
}

export function markDemoComplete(): void {
  const state = loadIntroState();
  if (!state) return;
  state.demoComplete = true;
  state.earnedXP = 25;
  state.demoCompletedAt = Date.now();
  state.completedAt = Date.now();
  saveIntroState(state);
}

export function markFastForward(): void {
  const state = loadIntroState();
  if (!state) return;
  state.fastForward = true;
  state.completedAt = Date.now();
  saveIntroState(state);
}

export interface IntroTransferResult {
  earnedXP: number;
  interests: string[];
  coachId: CoachId | null;
}

export function transferIntroToProfile(): IntroTransferResult | null {
  const state = loadIntroState();
  if (!state || !state.demoComplete) return null;

  const result: IntroTransferResult = {
    earnedXP: state.earnedXP,
    interests: state.interests,
    coachId: state.coachId,
  };

  clearIntroState();
  return result;
}
