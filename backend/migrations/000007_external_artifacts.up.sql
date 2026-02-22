CREATE TABLE external_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artifact_type artifact_type NOT NULL,
    description TEXT NOT NULL,
    skill_dimensions JSONB DEFAULT '{}',
    storage_ref TEXT,
    endorsement_ids UUID[] DEFAULT '{}',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artifacts_learner ON external_artifacts(learner_id);
CREATE INDEX idx_artifacts_type ON external_artifacts(artifact_type);
