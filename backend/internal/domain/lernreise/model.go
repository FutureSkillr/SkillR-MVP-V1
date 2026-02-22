package lernreise

import (
	"time"

	"github.com/google/uuid"
)

// Instance represents a user's binding to a specific Honeycomb course.
type Instance struct {
	ID              uuid.UUID  `json:"id"`
	UserID          uuid.UUID  `json:"user_id"`
	CtxID           string     `json:"ctx_id"`
	HoneycombDataID string     `json:"honeycomb_data_id"`
	Title           string     `json:"title"`
	Status          string     `json:"status"` // "active" | "paused" | "completed" | "abandoned"
	ProgressPercent int        `json:"progress_percent"`
	ProgressLabel   string     `json:"progress_label"`
	StartedAt       time.Time  `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
	LastSyncedAt    *time.Time `json:"last_synced_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// Progress represents a single progress event for a Lernreise instance.
type Progress struct {
	ID         uuid.UUID `json:"id"`
	InstanceID uuid.UUID `json:"instance_id"`
	ModuleID   string    `json:"module_id"`
	TaskID     string    `json:"task_id"`
	OldState   string    `json:"old_state"`
	NewState   string    `json:"new_state"`
	ProgressP  int       `json:"progress_p"`
	CreatedAt  time.Time `json:"created_at"`
}

// Valid instance statuses.
const (
	StatusActive    = "active"
	StatusPaused    = "paused"
	StatusCompleted = "completed"
	StatusAbandoned = "abandoned"
)

// XP amounts for Lernreise actions.
const (
	XPLernreiseStarted       = 15
	XPLernreiseTaskComplete  = 20
	XPLernreiseModuleComplete = 75
	XPLernreiseComplete       = 200
)
