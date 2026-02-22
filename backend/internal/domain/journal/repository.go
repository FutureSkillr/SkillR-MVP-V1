package journal

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, i *Interaction) error
	List(ctx context.Context, params ListParams) ([]Interaction, int, error)
	ListByStation(ctx context.Context, userID uuid.UUID, stationID string) ([]Interaction, int, error)
	ListByDimension(ctx context.Context, userID uuid.UUID, dimension string) ([]Interaction, int, error)
}
