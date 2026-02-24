CREATE TABLE IF NOT EXISTS learner_portfolio_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'project',
    visibility  TEXT NOT NULL DEFAULT 'public',
    tags        TEXT[] NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learner_portfolio_entries_user ON learner_portfolio_entries(user_id);
CREATE INDEX idx_learner_portfolio_entries_visibility ON learner_portfolio_entries(user_id, visibility);

CREATE TRIGGER set_learner_portfolio_entries_updated_at
    BEFORE UPDATE ON learner_portfolio_entries
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
