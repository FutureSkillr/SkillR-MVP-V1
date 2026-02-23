DROP INDEX IF EXISTS idx_prompt_logs_method;
DROP INDEX IF EXISTS idx_prompt_logs_session_type;

ALTER TABLE prompt_logs
  DROP COLUMN IF EXISTS method,
  DROP COLUMN IF EXISTS session_type,
  DROP COLUMN IF EXISTS system_prompt,
  DROP COLUMN IF EXISTS user_message,
  DROP COLUMN IF EXISTS chat_history,
  DROP COLUMN IF EXISTS raw_response,
  DROP COLUMN IF EXISTS structured_response,
  DROP COLUMN IF EXISTS retry_count,
  DROP COLUMN IF EXISTS request_timestamp,
  DROP COLUMN IF EXISTS response_timestamp;
