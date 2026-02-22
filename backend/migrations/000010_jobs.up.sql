CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    required_dimensions JSONB DEFAULT '{}',
    location TEXT,
    source TEXT,
    external_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_active ON job_postings(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_dimensions ON job_postings USING GIN (required_dimensions);

CREATE TRIGGER set_jobs_updated_at
    BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
