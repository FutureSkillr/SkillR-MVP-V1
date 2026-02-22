package session

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	SessionType string     `json:"session_type"`
	JourneyType *string    `json:"journey_type,omitempty"`
	StationID   *string    `json:"station_id,omitempty"`
	StartedAt   time.Time  `json:"started_at"`
	EndedAt     *time.Time `json:"ended_at,omitempty"`
}

type SessionDetailed struct {
	Session
	Interactions     []Interaction `json:"interactions,omitempty"`
	InteractionCount int           `json:"interaction_count"`
}

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

type CreateSessionRequest struct {
	SessionType string  `json:"session_type"`
	JourneyType *string `json:"journey_type,omitempty"`
	StationID   *string `json:"station_id,omitempty"`
}

type UpdateSessionRequest struct {
	EndedAt   *time.Time `json:"ended_at,omitempty"`
	StationID *string    `json:"station_id,omitempty"`
}

type ListParams struct {
	Limit       int
	Offset      int
	JourneyType *string
	StationID   *string
	From        *time.Time
	To          *time.Time
	UserID      uuid.UUID
}
