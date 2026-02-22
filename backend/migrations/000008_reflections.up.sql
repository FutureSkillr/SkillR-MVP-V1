CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    response TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    capability_scores JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reflections_user ON reflections(user_id);
CREATE INDEX idx_reflections_station ON reflections(station_id);
CREATE INDEX idx_reflections_scores ON reflections USING GIN (capability_scores);
