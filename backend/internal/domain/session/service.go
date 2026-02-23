package session

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

// SetRepo replaces the repository (used for lazy DB injection after startup).
func (s *Service) SetRepo(repo Repository) {
	s.repo = repo
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID, req CreateSessionRequest) (*Session, error) {
	sess := &Session{
		ID:          uuid.New(),
		UserID:      userID,
		SessionType: req.SessionType,
		JourneyType: req.JourneyType,
		StationID:   req.StationID,
		StartedAt:   time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, sess); err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}
	return sess, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Session, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *Service) GetDetailed(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*SessionDetailed, error) {
	return s.repo.GetDetailedByID(ctx, id, userID)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Session, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateSessionRequest) (*Session, error) {
	sess, err := s.repo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	if req.EndedAt != nil {
		sess.EndedAt = req.EndedAt
	}
	if req.StationID != nil {
		sess.StationID = req.StationID
	}

	if err := s.repo.Update(ctx, sess); err != nil {
		return nil, fmt.Errorf("update session: %w", err)
	}
	return sess, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}
