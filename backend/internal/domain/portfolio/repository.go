package portfolio

import (
	"context"

	"github.com/google/uuid"
)

// Repository defines data access for portfolio entries.
type Repository interface {
	List(ctx context.Context, userID uuid.UUID) ([]PortfolioEntry, error)
	ListPublic(ctx context.Context, userID uuid.UUID) ([]PortfolioEntry, error)
	Create(ctx context.Context, e *PortfolioEntry) error
	Update(ctx context.Context, e *PortfolioEntry) error
	Delete(ctx context.Context, id, userID uuid.UUID) error
	Count(ctx context.Context, userID uuid.UUID) (int, error)
}
