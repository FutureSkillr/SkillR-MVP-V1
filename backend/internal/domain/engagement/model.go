package engagement

import (
	"github.com/google/uuid"
)

type EngagementState struct {
	CurrentStreak        int    `json:"current_streak"`
	LongestStreak        int    `json:"longest_streak"`
	TotalXP              int    `json:"total_xp"`
	WeeklyXP             int    `json:"weekly_xp"`
	Level                int    `json:"level"`
	LevelTitle           string `json:"level_title"`
	LastActiveDate       string `json:"last_active_date"`
	StreakFreezeAvailable bool   `json:"streak_freeze_available"`
}

type AwardXPRequest struct {
	Action  string                 `json:"action"`
	Context map[string]interface{} `json:"context,omitempty"`
}

type LeaderboardEntry struct {
	Rank        int       `json:"rank"`
	UserID      uuid.UUID `json:"user_id"`
	DisplayName string    `json:"display_name"`
	TotalXP     int       `json:"total_xp"`
	Level       int       `json:"level"`
	LevelTitle  string    `json:"level_title"`
}

// XP values per action
var XPValues = map[string]int{
	"onboarding_complete":  100,
	"station_complete":     50,
	"station_start":        10,
	"vuca_module_complete": 25,
	"quiz_correct":         15,
	"daily_login":          5,
}

// Level thresholds and titles
var Levels = []struct {
	MinXP int
	Title string
}{
	{0, "Entdecker"},
	{100, "Pfadfinder"},
	{500, "Abenteurer"},
	{1500, "Globetrotter"},
	{5000, "Weltenbummler"},
}
