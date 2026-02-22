package engagement

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID) (*EngagementState, error) {
	state, err := s.repo.GetState(ctx, userID)
	if err != nil {
		// Return default state if not found
		return &EngagementState{
			Level:          1,
			LevelTitle:     "Entdecker",
			LastActiveDate: time.Now().Format("2006-01-02"),
		}, nil
	}
	return state, nil
}

func (s *Service) Award(ctx context.Context, userID uuid.UUID, req AwardXPRequest) (*EngagementState, error) {
	xp, ok := XPValues[req.Action]
	if !ok {
		return nil, fmt.Errorf("unknown XP action: %s", req.Action)
	}

	state, _ := s.repo.GetState(ctx, userID)
	if state == nil {
		state = &EngagementState{
			Level:          1,
			LevelTitle:     "Entdecker",
			LastActiveDate: time.Now().Format("2006-01-02"),
		}
	}

	state.TotalXP += xp
	state.WeeklyXP += xp
	state.LastActiveDate = time.Now().Format("2006-01-02")

	// Update level
	for i := len(Levels) - 1; i >= 0; i-- {
		if state.TotalXP >= Levels[i].MinXP {
			state.Level = i + 1
			state.LevelTitle = Levels[i].Title
			break
		}
	}

	// Update streak
	today := time.Now().Format("2006-01-02")
	if state.LastActiveDate != today {
		state.CurrentStreak++
		if state.CurrentStreak > state.LongestStreak {
			state.LongestStreak = state.CurrentStreak
		}
	}

	if err := s.repo.UpsertState(ctx, userID, state); err != nil {
		return nil, fmt.Errorf("update engagement: %w", err)
	}
	return state, nil
}

func (s *Service) Leaderboard(ctx context.Context, period string, limit int, userID uuid.UUID) ([]LeaderboardEntry, int, error) {
	entries, err := s.repo.GetLeaderboard(ctx, period, limit)
	if err != nil {
		return nil, 0, err
	}
	rank, _ := s.repo.GetUserRank(ctx, userID, period)
	return entries, rank, nil
}
