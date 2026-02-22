package reflection

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, r *ReflectionResult) error
	List(ctx context.Context, params ListParams) ([]ReflectionResult, int, error)
	GetAggregatedCapabilities(ctx context.Context, userID uuid.UUID) (*CapabilityScores, error)
}
