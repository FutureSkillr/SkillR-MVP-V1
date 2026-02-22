CREATE TABLE prompt_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    prompt_id TEXT NOT NULL,
    prompt_version INTEGER NOT NULL DEFAULT 1,
    model_name TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    status agent_execution_status NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_logs_user ON prompt_logs(user_id);
CREATE INDEX idx_prompt_logs_prompt ON prompt_logs(prompt_id);
CREATE INDEX idx_prompt_logs_created ON prompt_logs(created_at);
CREATE INDEX idx_prompt_logs_status ON prompt_logs(status);
