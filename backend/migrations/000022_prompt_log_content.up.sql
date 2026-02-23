-- Add dialog content columns to prompt_logs so full request/response data is persisted.
ALTER TABLE prompt_logs
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS session_type TEXT,
  ADD COLUMN IF NOT EXISTS system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS user_message TEXT,
  ADD COLUMN IF NOT EXISTS chat_history TEXT,
  ADD COLUMN IF NOT EXISTS raw_response TEXT,
  ADD COLUMN IF NOT EXISTS structured_response TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS request_timestamp BIGINT,
  ADD COLUMN IF NOT EXISTS response_timestamp BIGINT;

CREATE INDEX IF NOT EXISTS idx_prompt_logs_method ON prompt_logs(method);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_session_type ON prompt_logs(session_type);
