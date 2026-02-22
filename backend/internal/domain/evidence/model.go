package evidence

import (
	"time"

	"github.com/google/uuid"
)

type PortfolioEntry struct {
	ID                   uuid.UUID              `json:"id"`
	UserID               uuid.UUID              `json:"user_id"`
	SourceInteractionIDs []uuid.UUID            `json:"source_interaction_ids,omitempty"`
	SkillDimensions      map[string]float64     `json:"skill_dimensions,omitempty"`
	EvidenceType         string                 `json:"evidence_type"`
	Summary              string                 `json:"summary"`
	Confidence           float64                `json:"confidence"`
	Context              map[string]interface{} `json:"context,omitempty"`
	VerificationToken    *string                `json:"-"`
	CreatedAt            time.Time              `json:"created_at"`
}

type PortfolioEntryDetailed struct {
	PortfolioEntry
	SourceInteractions []interface{} `json:"source_interactions,omitempty"`
	LinkedEndorsements []interface{} `json:"linked_endorsements,omitempty"`
}

type CreateEvidenceRequest struct {
	SourceInteractionIDs []uuid.UUID            `json:"source_interaction_ids,omitempty"`
	SkillDimensions      map[string]float64     `json:"skill_dimensions"`
	EvidenceType         string                 `json:"evidence_type"`
	Summary              string                 `json:"summary"`
	Confidence           *float64               `json:"confidence,omitempty"`
	Context              map[string]interface{} `json:"context,omitempty"`
}

type VerificationResult struct {
	Verified         bool               `json:"verified"`
	EvidenceID       uuid.UUID          `json:"evidence_id"`
	Summary          string             `json:"summary,omitempty"`
	SkillDimensions  map[string]float64 `json:"skill_dimensions,omitempty"`
	CreatedAt        *time.Time         `json:"created_at,omitempty"`
	EndorsementCount int                `json:"endorsement_count,omitempty"`
}

type ListParams struct {
	Limit        int
	Offset       int
	EvidenceType *string
	UserID       uuid.UUID
}
