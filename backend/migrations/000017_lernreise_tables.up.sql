-- FR-072/FR-074/FR-075: Lernreise tracking tables

-- Add Honeycomb ctx_id to users table (FR-073)
ALTER TABLE users ADD COLUMN IF NOT EXISTS honeycomb_ctx_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_honeycomb_ctx_id ON users (honeycomb_ctx_id) WHERE honeycomb_ctx_id IS NOT NULL;

-- Lernreise instances: binds a user to a Honeycomb course (FR-074)
CREATE TABLE IF NOT EXISTS lernreise_instances (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ctx_id           TEXT NOT NULL,
    honeycomb_data_id TEXT NOT NULL,
    title            TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    progress_label   TEXT NOT NULL DEFAULT '',
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    last_synced_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lernreise_instances_user_id ON lernreise_instances (user_id);
CREATE INDEX IF NOT EXISTS idx_lernreise_instances_user_status ON lernreise_instances (user_id, status);

-- Lernreise progress events: tracks task-level state changes (FR-075)
CREATE TABLE IF NOT EXISTS lernreise_progress (
    id          UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES lernreise_instances(id) ON DELETE CASCADE,
    module_id   TEXT NOT NULL,
    task_id     TEXT NOT NULL,
    old_state   TEXT NOT NULL DEFAULT 'open',
    new_state   TEXT NOT NULL DEFAULT 'done',
    progress_p  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lernreise_progress_instance_id ON lernreise_progress (instance_id);
