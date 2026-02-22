package journal

import (
	"time"

	"github.com/google/uuid"
)

type Interaction struct {
	ID                uuid.UUID              `json:"id"`
	UserID            uuid.UUID              `json:"user_id"`
	SessionID         uuid.UUID              `json:"session_id"`
	Modality          string                 `json:"modality"`
	UserInput         *string                `json:"user_input,omitempty"`
	AssistantResponse *string                `json:"assistant_response,omitempty"`
	Timing            map[string]interface{} `json:"timing,omitempty"`
	Context           map[string]interface{} `json:"context,omitempty"`
	ProfileImpact     map[string]interface{} `json:"profile_impact,omitempty"`
	Timestamp         time.Time              `json:"timestamp"`
}

type CreateInteractionRequest struct {
	SessionID         uuid.UUID              `json:"session_id"`
	Modality          string                 `json:"modality"`
	UserInput         *string                `json:"user_input,omitempty"`
	AssistantResponse *string                `json:"assistant_response,omitempty"`
	Timing            map[string]interface{} `json:"timing,omitempty"`
	Context           map[string]interface{} `json:"context,omitempty"`
}

type ListParams struct {
	Limit  int
	Offset int
	From   *time.Time
	To     *time.Time
	UserID uuid.UUID
}
