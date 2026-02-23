import type { UserEvent, UserEventType, UserEventRow, AnalyticsOverview } from '../types/analytics';
import { getStoredUTM } from './campaignAttribution';
import { getAuthHeaders } from './auth';

// --- Browser session ID (one per tab) ---

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let _browserSessionId: string | null = null;

export function getBrowserSessionId(): string {
  if (_browserSessionId) return _browserSessionId;
  try {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      _browserSessionId = stored;
      return stored;
    }
  } catch { /* SSR or private browsing */ }
  const id = generateUUID();
  _browserSessionId = id;
  try {
    sessionStorage.setItem('analytics_session_id', id);
  } catch { /* ignore */ }
  return id;
}

// --- Event queue with batched flush ---

const FLUSH_INTERVAL_MS = 2000;
let eventQueue: UserEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function enqueue(event: UserEvent): void {
  eventQueue.push(event);
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

function flush(): void {
  flushTimer = null;
  if (eventQueue.length === 0) return;

  const batch = eventQueue;
  eventQueue = [];

  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  }).then((res) => {
    if (!res.ok) {
      // Silently drop — analytics failures should not disrupt the user experience
    }
  }).catch(() => {
    // Network error — silently drop
  });
}

// Flush on tab close via sendBeacon
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length === 0) return;
    const batch = eventQueue;
    eventQueue = [];
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    try {
      navigator.sendBeacon(
        '/api/analytics/events',
        new Blob([JSON.stringify(batch)], { type: 'application/json' }),
      );
    } catch {
      // best effort
    }
  });
}

// --- Internal helper ---

function track(eventType: UserEventType, properties: Record<string, unknown> = {}, promptSessionId?: string): void {
  const utm = getStoredUTM();
  enqueue({
    event_type: eventType,
    browser_session_id: getBrowserSessionId(),
    prompt_session_id: promptSessionId,
    timestamp: Date.now(),
    properties: { ...utm, ...properties },
  });
}

// --- Public tracking functions ---

export function trackPageView(fromView: string, toView: string): void {
  track('page_view', { from_view: fromView, to_view: toView });
}

export function trackVisitorWaiting(queuePosition: number): void {
  track('visitor_waiting', { queue_position: queuePosition });
}

export function trackOnboardingStart(): void {
  track('onboarding_start', { started_at: Date.now() });
}

export function trackOnboardingComplete(durationMs: number, messageCount: number): void {
  track('onboarding_complete', { duration_ms: durationMs, message_count: messageCount });
}

export function trackJourneySelect(journeyType: string): void {
  track('journey_select', { journey_type: journeyType });
}

export function trackStationStart(stationId: string, journeyType: string): void {
  track('station_start', { station_id: stationId, journey_type: journeyType });
}

export function trackStationComplete(
  stationId: string,
  journeyType: string,
  durationMs: number,
  dimensionScores: Record<string, number>,
): void {
  track('station_complete', {
    station_id: stationId,
    journey_type: journeyType,
    duration_ms: durationMs,
    dimension_scores: dimensionScores,
  });
}

export function trackProfileView(stationsCompleted: number, journeysStarted: number): void {
  track('profile_view', { stations_completed: stationsCompleted, journeys_started: journeysStarted });
}

export function trackChatMessage(
  messageIndex: number,
  messageLength: number,
  isUser: boolean,
  sessionType: string,
  promptSessionId?: string,
): void {
  track('chat_message_sent', {
    message_index: messageIndex,
    message_length: messageLength,
    is_user: isUser,
    session_type: sessionType,
  }, promptSessionId);
}

export function trackChatSessionEnd(
  totalMessages: number,
  userMessages: number,
  avgMessageLength: number,
  durationMs: number,
  completionStatus: 'completed' | 'aborted',
  sessionType: string,
  promptSessionId?: string,
): void {
  track('chat_session_end', {
    total_messages: totalMessages,
    user_messages: userMessages,
    avg_message_length: Math.round(avgMessageLength),
    duration_ms: durationMs,
    completion_status: completionStatus,
    session_type: sessionType,
  }, promptSessionId);
}

export function trackIntroFastForward(coachId: string, phase: string, messageCount: number, durationMs: number): void {
  track('intro_fast_forward', {
    coach_id: coachId,
    phase_at_skip: phase,
    message_count: messageCount,
    duration_ms: durationMs,
  });
}

export function trackCoachChange(previousCoachId: string | null, newCoachId: string): void {
  track('coach_change', {
    previous_coach_id: previousCoachId,
    new_coach_id: newCoachId,
  });
}

// --- Admin data fetchers ---

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch('/api/analytics/overview', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`analytics overview: ${res.status}`);
  return res.json();
}

export async function getAnalyticsEvents(filters?: {
  event_type?: string;
  browser_session_id?: string;
  from?: number;
  to?: number;
  limit?: number;
}): Promise<UserEventRow[]> {
  const params = new URLSearchParams();
  if (filters?.event_type) params.set('event_type', filters.event_type);
  if (filters?.browser_session_id) params.set('browser_session_id', filters.browser_session_id);
  if (filters?.from) params.set('from', String(filters.from));
  if (filters?.to) params.set('to', String(filters.to));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const res = await fetch(`/api/analytics/events${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`analytics events: ${res.status}`);
  return res.json();
}

export async function getSessionEvents(sessionId: string): Promise<UserEventRow[]> {
  const res = await fetch(`/api/analytics/sessions/${sessionId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`session events: ${res.status}`);
  return res.json();
}

export async function clearAnalytics(): Promise<void> {
  await fetch('/api/analytics/events', { method: 'DELETE', headers: getAuthHeaders() });
}

export async function exportAnalyticsCSV(): Promise<string> {
  const res = await fetch('/api/analytics/export-csv', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`analytics export: ${res.status}`);
  return res.text();
}
