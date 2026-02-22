CREATE TABLE endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endorser_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endorser_name TEXT NOT NULL,
    endorser_role endorser_role NOT NULL,
    endorser_verified BOOLEAN NOT NULL DEFAULT false,
    skill_dimensions JSONB DEFAULT '{}',
    statement TEXT NOT NULL,
    context TEXT,
    artifact_refs UUID[] DEFAULT '{}',
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE endorsement_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endorser_email TEXT NOT NULL,
    endorser_role endorser_role NOT NULL,
    invitation_token TEXT NOT NULL UNIQUE,
    message TEXT,
    skill_dimensions TEXT[] DEFAULT '{}',
    status endorsement_invite_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_endorsements_learner ON endorsements(learner_id);
CREATE INDEX idx_endorsements_visible ON endorsements(learner_id) WHERE visible = true;
CREATE INDEX idx_endorsement_invites_learner ON endorsement_invites(learner_id);
CREATE INDEX idx_endorsement_invites_token ON endorsement_invites(invitation_token);
CREATE INDEX idx_endorsement_invites_status ON endorsement_invites(status);
