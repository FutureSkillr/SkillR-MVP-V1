package endorsement

import (
	"time"

	"github.com/google/uuid"
)

type Endorsement struct {
	ID               uuid.UUID          `json:"id"`
	LearnerID        uuid.UUID          `json:"learner_id"`
	EndorserID       *uuid.UUID         `json:"endorser_id,omitempty"`
	EndorserName     string             `json:"endorser_name"`
	EndorserRole     string             `json:"endorser_role"`
	EndorserVerified bool               `json:"endorser_verified"`
	SkillDimensions  map[string]float64 `json:"skill_dimensions,omitempty"`
	Statement        string             `json:"statement"`
	Context          *string            `json:"context,omitempty"`
	ArtifactRefs     []uuid.UUID        `json:"artifact_refs,omitempty"`
	Visible          bool               `json:"visible"`
	CreatedAt        time.Time          `json:"created_at"`
}

type EndorsementInvite struct {
	ID            uuid.UUID `json:"id"`
	LearnerID     uuid.UUID `json:"learner_id"`
	EndorserEmail string    `json:"endorser_email"`
	EndorserRole  string    `json:"endorser_role"`
	Status        string    `json:"status"`
	InviteURL     string    `json:"invite_url,omitempty"`
	QRCodeURL     string    `json:"qr_code_url,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}

type SubmitEndorsementRequest struct {
	InvitationToken string             `json:"invitation_token"`
	EndorserName    string             `json:"endorser_name"`
	EndorserRole    string             `json:"endorser_role"`
	SkillDimensions map[string]float64 `json:"skill_dimensions"`
	Statement       string             `json:"statement"`
	Context         *string            `json:"context,omitempty"`
}

type EndorsementInviteRequest struct {
	EndorserEmail   string   `json:"endorser_email"`
	EndorserRole    string   `json:"endorser_role"`
	Message         *string  `json:"message,omitempty"`
	SkillDimensions []string `json:"skill_dimensions,omitempty"`
}

type VisibilityRequest struct {
	Visible bool `json:"visible"`
}
