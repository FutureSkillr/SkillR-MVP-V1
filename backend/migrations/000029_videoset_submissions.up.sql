CREATE TABLE IF NOT EXISTS videoset_submissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id          TEXT NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'draft',
    video_a_type     TEXT NOT NULL DEFAULT '',
    video_a_value    TEXT NOT NULL DEFAULT '',
    video_a_envelope JSONB,
    video_b_type     TEXT NOT NULL DEFAULT '',
    video_b_value    TEXT NOT NULL DEFAULT '',
    video_b_envelope JSONB,
    didactics_notes  TEXT NOT NULL DEFAULT '',
    resulting_lr_id  TEXT REFERENCES content_pack_lernreisen(id) ON DELETE SET NULL,
    rejection_reason TEXT NOT NULL DEFAULT '',
    submitted_by     TEXT NOT NULL DEFAULT '',
    submitted_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_videoset_submissions_pack ON videoset_submissions(pack_id);
CREATE INDEX idx_videoset_submissions_status ON videoset_submissions(status);
