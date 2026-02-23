export type UserEventType =
  | 'page_view'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'journey_select'
  | 'station_start'
  | 'station_complete'
  | 'profile_view'
  | 'chat_message_sent'
  | 'chat_session_end'
  | 'visitor_waiting'
  | 'intro_fast_forward'
  | 'coach_change';

export interface UserEvent {
  event_type: UserEventType;
  browser_session_id: string;
  prompt_session_id?: string;
  timestamp: number;
  properties: Record<string, unknown>;
}

export interface UserEventRow extends UserEvent {
  id: number;
}

export interface ConversionStep {
  label: string;
  count: number;
  dropoff_percent: number;
}

export interface AnalyticsOverview {
  totalEvents: number;
  uniqueSessions: number;
  avgOnboardingDurationMs: number;
  avgStationDurationMs: number;
  eventsByType: Record<string, number>;
  conversionFunnel: ConversionStep[];
  journeyPopularity: Record<string, number>;
  topPaths: { from_view: string; to_view: string; count: number }[];
}
