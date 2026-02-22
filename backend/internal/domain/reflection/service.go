package reflection

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Submit(ctx context.Context, userID uuid.UUID, req CreateReflectionRequest) (*ReflectionResult, error) {
	if req.StationID == "" {
		return nil, fmt.Errorf("station_id is required")
	}
	if req.QuestionID == "" {
		return nil, fmt.Errorf("question_id is required")
	}
	if req.Response == "" {
		return nil, fmt.Errorf("response is required")
	}

	result := &ReflectionResult{
		ID:             uuid.New(),
		UserID:         userID,
		StationID:      req.StationID,
		QuestionID:     req.QuestionID,
		Response:       req.Response,
		ResponseTimeMs: req.ResponseTimeMs,
		CapabilityScores: CapabilityScores{
			// Stub scoring — will be replaced by VertexAI analysis in Phase 4
			AnalyticalDepth: 50,
			Creativity:      50,
			Confidence:      50,
			Resilience:      50,
			SelfAwareness:   50,
		},
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, result); err != nil {
		return nil, fmt.Errorf("submit reflection: %w", err)
	}
	return result, nil
}

func (s *Service) List(ctx context.Context, params ListParams) ([]ReflectionResult, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Capabilities(ctx context.Context, userID uuid.UUID) (*CapabilityScores, error) {
	return s.repo.GetAggregatedCapabilities(ctx, userID)
}
