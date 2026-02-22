export interface PromptLogSession {
  session_id: string;
  session_type: 'onboarding' | 'vuca-station' | 'entrepreneur-station' | 'self-learning-station';
  station_id: string | null;
  journey_type: string | null;
  started_at: number;
  ended_at: number | null;
}

export interface PromptLogEntry {
  request_id: string;
  session_id: string;
  method: 'chat' | 'extractInsights' | 'extractStationResult' | 'generateCurriculum' | 'generateCourse';
  session_type: string;
  model_name: string;
  system_prompt: string;
  user_message: string;
  chat_history: string;
  raw_response: string;
  structured_response: string;
  status: 'success' | 'error';
  error_message: string | null;
  latency_ms: number;
  retry_count: number;
  request_timestamp: number;
  response_timestamp: number;
  token_count_estimate: number;
}

export interface PromptLogStats {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  totalTokenEstimate: number;
}
