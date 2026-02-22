package reflection

import (
	"time"

	"github.com/google/uuid"
)

type ReflectionResult struct {
	ID               uuid.UUID        `json:"id"`
	UserID           uuid.UUID        `json:"user_id"`
	StationID        string           `json:"station_id"`
	QuestionID       string           `json:"question_id"`
	Response         string           `json:"response"`
	ResponseTimeMs   int              `json:"response_time_ms"`
	CapabilityScores CapabilityScores `json:"capability_scores"`
	CreatedAt        time.Time        `json:"created_at"`
}

type CapabilityScores struct {
	AnalyticalDepth float64 `json:"analytical_depth"`
	Creativity      float64 `json:"creativity"`
	Confidence      float64 `json:"confidence"`
	Resilience      float64 `json:"resilience"`
	SelfAwareness   float64 `json:"self_awareness"`
}

type CreateReflectionRequest struct {
	StationID      string `json:"station_id"`
	QuestionID     string `json:"question_id"`
	Response       string `json:"response"`
	ResponseTimeMs int    `json:"response_time_ms"`
}

type ListParams struct {
	Limit     int
	Offset    int
	StationID *string
	UserID    uuid.UUID
}
