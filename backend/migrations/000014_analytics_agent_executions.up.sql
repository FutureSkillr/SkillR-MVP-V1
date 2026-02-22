CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    prompt_version INTEGER NOT NULL DEFAULT 1,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    trigger_event TEXT,
    input_summary TEXT,
    output_summary TEXT,
    model_name TEXT,
    latency_ms INTEGER,
    token_count INTEGER,
    status agent_execution_status NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_exec_agent ON agent_executions(agent_id);
CREATE INDEX idx_agent_exec_user ON agent_executions(user_id);
CREATE INDEX idx_agent_exec_status ON agent_executions(status);
CREATE INDEX idx_agent_exec_created ON agent_executions(created_at);
CREATE INDEX idx_agent_exec_failed ON agent_executions(agent_id) WHERE status != 'success';
