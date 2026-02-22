import { useEffect, useRef } from 'react';
import { insertSession, endSession } from '../services/db';
import type { PromptLogSession } from '../types/promptlog';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UsePromptLogSessionOptions {
  sessionType: PromptLogSession['session_type'];
  stationId?: string | null;
  journeyType?: string | null;
}

export function usePromptLogSession({
  sessionType,
  stationId = null,
  journeyType = null,
}: UsePromptLogSessionOptions) {
  const sessionIdRef = useRef<string>(generateUUID());

  useEffect(() => {
    const id = sessionIdRef.current;
    insertSession({
      session_id: id,
      session_type: sessionType,
      station_id: stationId ?? null,
      journey_type: journeyType ?? null,
      started_at: Date.now(),
      ended_at: null,
    }).catch((e) => console.warn('Failed to create prompt log session:', e));

    return () => {
      endSession(id).catch((e) => console.warn('Failed to end prompt log session:', e));
    };
  }, [sessionType, stationId, journeyType]);

  return {
    sessionId: sessionIdRef.current,
    sessionType,
  };
}
