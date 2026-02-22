package profile

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	GetLatest(ctx context.Context, userID uuid.UUID) (*SkillProfile, error)
	Create(ctx context.Context, p *SkillProfile) error
	GetHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]SkillProfile, int, error)
	GetPublic(ctx context.Context, userID uuid.UUID) (*PublicProfile, error)
}
