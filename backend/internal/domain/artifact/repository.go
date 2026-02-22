package artifact

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, a *ExternalArtifact) error
	GetByID(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*ExternalArtifact, error)
	GetDetailedByID(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*ExternalArtifactDetailed, error)
	List(ctx context.Context, learnerID uuid.UUID, artifactType *string, limit, offset int) ([]ExternalArtifact, int, error)
	Delete(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) error
	LinkEndorsement(ctx context.Context, id uuid.UUID, learnerID uuid.UUID, endorsementID uuid.UUID) (*ExternalArtifactDetailed, error)
}
