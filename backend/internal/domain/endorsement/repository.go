package endorsement

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, e *Endorsement) error
	List(ctx context.Context, learnerID uuid.UUID, limit, offset int) ([]Endorsement, int, error)
	GetByID(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*Endorsement, error)
	UpdateVisibility(ctx context.Context, id uuid.UUID, learnerID uuid.UUID, visible bool) (*Endorsement, error)
	CreateInvite(ctx context.Context, inv *EndorsementInvite) error
	GetInviteByToken(ctx context.Context, token string) (*EndorsementInvite, error)
	ListPendingInvites(ctx context.Context, learnerID uuid.UUID) ([]EndorsementInvite, int, error)
	MarkInviteCompleted(ctx context.Context, token string) error
}
