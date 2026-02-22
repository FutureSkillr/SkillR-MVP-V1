package journal

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

func (s *Service) List(ctx context.Context, params ListParams) ([]Interaction, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) ByStation(ctx context.Context, userID uuid.UUID, stationID string) ([]Interaction, int, error) {
	return s.repo.ListByStation(ctx, userID, stationID)
}

func (s *Service) ByDimension(ctx context.Context, userID uuid.UUID, dimension string) ([]Interaction, int, error) {
	return s.repo.ListByDimension(ctx, userID, dimension)
}

func (s *Service) Record(ctx context.Context, userID uuid.UUID, req CreateInteractionRequest) (*Interaction, error) {
	if req.SessionID == uuid.Nil {
		return nil, fmt.Errorf("session_id is required")
	}
	if req.Modality == "" {
		return nil, fmt.Errorf("modality is required")
	}

	interaction := &Interaction{
		ID:                uuid.New(),
		UserID:            userID,
		SessionID:         req.SessionID,
		Modality:          req.Modality,
		UserInput:         req.UserInput,
		AssistantResponse: req.AssistantResponse,
		Timing:            req.Timing,
		Context:           req.Context,
		Timestamp:         time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, interaction); err != nil {
		return nil, fmt.Errorf("record interaction: %w", err)
	}
	return interaction, nil
}
