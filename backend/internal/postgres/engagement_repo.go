package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/FutureSkillr/MVP72/backend/internal/domain/engagement"
)

type EngagementRepository struct {
	pool *pgxpool.Pool
}

func NewEngagementRepository(pool *pgxpool.Pool) *EngagementRepository {
	return &EngagementRepository{pool: pool}
}

func (r *EngagementRepository) GetState(ctx context.Context, userID uuid.UUID) (*engagement.EngagementState, error) {
	s := &engagement.EngagementState{}
	err := r.pool.QueryRow(ctx,
		`SELECT current_streak, longest_streak, total_xp, weekly_xp, level, level_title, last_active_date, streak_freeze_available
		 FROM engagement_state WHERE user_id = $1`,
		userID,
	).Scan(&s.CurrentStreak, &s.LongestStreak, &s.TotalXP, &s.WeeklyXP, &s.Level, &s.LevelTitle, &s.LastActiveDate, &s.StreakFreezeAvailable)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("no engagement state found")
		}
		return nil, fmt.Errorf("get engagement: %w", err)
	}
	return s, nil
}

func (r *EngagementRepository) UpsertState(ctx context.Context, userID uuid.UUID, state *engagement.EngagementState) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO engagement_state (user_id, current_streak, longest_streak, total_xp, weekly_xp, level, level_title, last_active_date, streak_freeze_available)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 ON CONFLICT (user_id) DO UPDATE SET
			current_streak = $2, longest_streak = $3, total_xp = $4, weekly_xp = $5,
			level = $6, level_title = $7, last_active_date = $8, streak_freeze_available = $9, updated_at = NOW()`,
		userID, state.CurrentStreak, state.LongestStreak, state.TotalXP, state.WeeklyXP,
		state.Level, state.LevelTitle, state.LastActiveDate, state.StreakFreezeAvailable,
	)
	if err != nil {
		return fmt.Errorf("upsert engagement: %w", err)
	}
	return nil
}

func (r *EngagementRepository) GetLeaderboard(ctx context.Context, period string, limit int) ([]engagement.LeaderboardEntry, error) {
	query := `SELECT u.id, u.display_name, e.total_xp, e.level, e.level_title
		 FROM engagement_state e JOIN users u ON e.user_id = u.id
		 ORDER BY e.total_xp DESC LIMIT $1`

	if period == "weekly" {
		query = `SELECT u.id, u.display_name, e.weekly_xp AS total_xp, e.level, e.level_title
			 FROM engagement_state e JOIN users u ON e.user_id = u.id
			 ORDER BY e.weekly_xp DESC LIMIT $1`
	}

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("get leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []engagement.LeaderboardEntry
	rank := 1
	for rows.Next() {
		var e engagement.LeaderboardEntry
		var displayName *string
		if err := rows.Scan(&e.UserID, &displayName, &e.TotalXP, &e.Level, &e.LevelTitle); err != nil {
			return nil, fmt.Errorf("scan leaderboard: %w", err)
		}
		e.Rank = rank
		if displayName != nil {
			e.DisplayName = *displayName
		}
		rank++
		entries = append(entries, e)
	}
	return entries, nil
}

func (r *EngagementRepository) GetUserRank(ctx context.Context, userID uuid.UUID, period string) (int, error) {
	query := `SELECT COUNT(*) + 1 FROM engagement_state WHERE total_xp > (SELECT COALESCE(total_xp, 0) FROM engagement_state WHERE user_id = $1)`
	if period == "weekly" {
		query = `SELECT COUNT(*) + 1 FROM engagement_state WHERE weekly_xp > (SELECT COALESCE(weekly_xp, 0) FROM engagement_state WHERE user_id = $1)`
	}
	var rank int
	if err := r.pool.QueryRow(ctx, query, userID).Scan(&rank); err != nil {
		return 0, nil
	}
	return rank, nil
}
