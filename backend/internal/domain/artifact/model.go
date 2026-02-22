package artifact

import (
	"time"

	"github.com/google/uuid"
)

type ExternalArtifact struct {
	ID              uuid.UUID          `json:"id"`
	LearnerID       uuid.UUID          `json:"learner_id"`
	ArtifactType    string             `json:"artifact_type"`
	Description     string             `json:"description"`
	SkillDimensions map[string]float64 `json:"skill_dimensions,omitempty"`
	StorageRef      *string            `json:"storage_ref,omitempty"`
	EndorsementIDs  []uuid.UUID        `json:"endorsement_ids,omitempty"`
	UploadedAt      time.Time          `json:"uploaded_at"`
}

type ExternalArtifactDetailed struct {
	ExternalArtifact
	Endorsements []interface{} `json:"endorsements,omitempty"`
}

type LinkEndorsementRequest struct {
	EndorsementID uuid.UUID `json:"endorsement_id"`
}
