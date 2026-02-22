package engagement

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	GetState(ctx context.Context, userID uuid.UUID) (*EngagementState, error)
	UpsertState(ctx context.Context, userID uuid.UUID, state *EngagementState) error
	GetLeaderboard(ctx context.Context, period string, limit int) ([]LeaderboardEntry, error)
	GetUserRank(ctx context.Context, userID uuid.UUID, period string) (int, error)
}
