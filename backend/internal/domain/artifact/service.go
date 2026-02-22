package artifact

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

func (s *Service) List(ctx context.Context, learnerID uuid.UUID, artifactType *string, limit, offset int) ([]ExternalArtifact, int, error) {
	return s.repo.List(ctx, learnerID, artifactType, limit, offset)
}

func (s *Service) Upload(ctx context.Context, learnerID uuid.UUID, artifactType, description string, skillDimensions map[string]float64, storageRef *string) (*ExternalArtifact, error) {
	if description == "" {
		return nil, fmt.Errorf("description is required")
	}

	a := &ExternalArtifact{
		ID:              uuid.New(),
		LearnerID:       learnerID,
		ArtifactType:    artifactType,
		Description:     description,
		SkillDimensions: skillDimensions,
		StorageRef:      storageRef,
		UploadedAt:      time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, a); err != nil {
		return nil, fmt.Errorf("create artifact: %w", err)
	}
	return a, nil
}

func (s *Service) Get(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*ExternalArtifactDetailed, error) {
	return s.repo.GetDetailedByID(ctx, id, learnerID)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) error {
	return s.repo.Delete(ctx, id, learnerID)
}

func (s *Service) LinkEndorsement(ctx context.Context, id uuid.UUID, learnerID uuid.UUID, endorsementID uuid.UUID) (*ExternalArtifactDetailed, error) {
	return s.repo.LinkEndorsement(ctx, id, learnerID, endorsementID)
}
