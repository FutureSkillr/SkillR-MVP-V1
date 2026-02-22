package profile

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

func (s *Service) Get(ctx context.Context, userID uuid.UUID) (*SkillProfile, error) {
	return s.repo.GetLatest(ctx, userID)
}

func (s *Service) Compute(ctx context.Context, userID uuid.UUID) (*SkillProfile, error) {
	// Stub computation — will use VertexAI Profile Computation Agent in Phase 4
	profile := &SkillProfile{
		ID:     uuid.New(),
		UserID: userID,
		SkillCategories: []SkillCategory{
			{Key: "hard-skills", Label: "Fachkompetenzen", Score: 0, ContributingDimensions: []string{"analytical-thinking", "problem-solving"}},
			{Key: "soft-skills", Label: "Sozialkompetenzen", Score: 0, ContributingDimensions: []string{"teamwork", "communication"}},
			{Key: "future-skills", Label: "Zukunftskompetenzen", Score: 0, ContributingDimensions: []string{"creativity", "initiative"}},
			{Key: "resilience", Label: "Resilienz", Score: 0, ContributingDimensions: []string{"resilience", "persistence"}},
		},
		Completeness:   0,
		LastComputedAt: time.Now().UTC(),
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, profile); err != nil {
		return nil, fmt.Errorf("save computed profile: %w", err)
	}
	return profile, nil
}

func (s *Service) History(ctx context.Context, userID uuid.UUID, limit, offset int) ([]SkillProfile, int, error) {
	return s.repo.GetHistory(ctx, userID, limit, offset)
}

func (s *Service) Public(ctx context.Context, userID uuid.UUID) (*PublicProfile, error) {
	return s.repo.GetPublic(ctx, userID)
}

func (s *Service) Export(ctx context.Context, userID uuid.UUID, format string) (*SkillProfile, error) {
	// For now, just return JSON format. PDF generation to be added later.
	return s.repo.GetLatest(ctx, userID)
}
