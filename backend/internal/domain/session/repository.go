package session

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, s *Session) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Session, error)
	GetDetailedByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*SessionDetailed, error)
	List(ctx context.Context, params ListParams) ([]Session, int, error)
	Update(ctx context.Context, s *Session) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}
