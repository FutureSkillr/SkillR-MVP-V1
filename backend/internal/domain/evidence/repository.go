package evidence

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, e *PortfolioEntry) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*PortfolioEntry, error)
	GetDetailedByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*PortfolioEntryDetailed, error)
	List(ctx context.Context, params ListParams) ([]PortfolioEntry, int, error)
	ListByDimension(ctx context.Context, userID uuid.UUID, dimension string) ([]PortfolioEntry, int, error)
	GetByVerificationToken(ctx context.Context, id uuid.UUID, token string) (*PortfolioEntry, error)
}
