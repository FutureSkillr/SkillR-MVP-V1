package evidence

import (
	"context"
	"crypto/rand"
	"encoding/hex"
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

func (s *Service) Create(ctx context.Context, userID uuid.UUID, req CreateEvidenceRequest) (*PortfolioEntry, error) {
	if req.Summary == "" {
		return nil, fmt.Errorf("summary is required")
	}
	if req.EvidenceType == "" {
		return nil, fmt.Errorf("evidence_type is required")
	}

	confidence := 0.5
	if req.Confidence != nil {
		confidence = *req.Confidence
	}

	token := generateToken()

	entry := &PortfolioEntry{
		ID:                   uuid.New(),
		UserID:               userID,
		SourceInteractionIDs: req.SourceInteractionIDs,
		SkillDimensions:      req.SkillDimensions,
		EvidenceType:         req.EvidenceType,
		Summary:              req.Summary,
		Confidence:           confidence,
		Context:              req.Context,
		VerificationToken:    &token,
		CreatedAt:            time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, entry); err != nil {
		return nil, fmt.Errorf("create evidence: %w", err)
	}
	return entry, nil
}

func (s *Service) Get(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*PortfolioEntryDetailed, error) {
	return s.repo.GetDetailedByID(ctx, id, userID)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]PortfolioEntry, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) ByDimension(ctx context.Context, userID uuid.UUID, dim string) ([]PortfolioEntry, int, error) {
	return s.repo.ListByDimension(ctx, userID, dim)
}

func (s *Service) Verify(ctx context.Context, id uuid.UUID, token string) (*VerificationResult, error) {
	entry, err := s.repo.GetByVerificationToken(ctx, id, token)
	if err != nil {
		return nil, err
	}
	return &VerificationResult{
		Verified:        true,
		EvidenceID:      entry.ID,
		Summary:         entry.Summary,
		SkillDimensions: entry.SkillDimensions,
		CreatedAt:       &entry.CreatedAt,
	}, nil
}

func generateToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
