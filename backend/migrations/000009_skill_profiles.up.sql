CREATE TABLE skill_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_categories JSONB NOT NULL DEFAULT '[]',
    top_interests TEXT[] DEFAULT '{}',
    top_strengths TEXT[] DEFAULT '{}',
    completeness NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    evidence_summary JSONB DEFAULT '{}',
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_profiles_user ON skill_profiles(user_id);
CREATE INDEX idx_skill_profiles_latest ON skill_profiles(user_id, last_computed_at DESC);
