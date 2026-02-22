CREATE TABLE portfolio_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_interaction_ids UUID[] DEFAULT '{}',
    skill_dimensions JSONB DEFAULT '{}',
    evidence_type evidence_type NOT NULL DEFAULT 'auto',
    summary TEXT NOT NULL,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,
    context JSONB DEFAULT '{}',
    verification_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_user_id ON portfolio_entries(user_id);
CREATE INDEX idx_portfolio_type ON portfolio_entries(evidence_type);
CREATE INDEX idx_portfolio_dimensions ON portfolio_entries USING GIN (skill_dimensions);
