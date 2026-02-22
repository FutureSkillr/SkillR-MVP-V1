package lernreise

import (
	"context"

	"github.com/google/uuid"
)

// Repository defines the persistence interface for Lernreise data.
type Repository interface {
	// GetCtxID returns the Honeycomb ctx_id for a user, or "" if not set.
	GetCtxID(ctx context.Context, userID uuid.UUID) (string, error)
	// SetCtxID stores the Honeycomb ctx_id for a user.
	SetCtxID(ctx context.Context, userID uuid.UUID, ctxID string) error

	// CreateInstance inserts a new Lernreise instance.
	CreateInstance(ctx context.Context, inst *Instance) error
	// GetInstance returns an instance by ID.
	GetInstance(ctx context.Context, id uuid.UUID) (*Instance, error)
	// GetActiveInstance returns the active instance for a user, or nil.
	GetActiveInstance(ctx context.Context, userID uuid.UUID) (*Instance, error)
	// ListInstances returns all instances for a user.
	ListInstances(ctx context.Context, userID uuid.UUID) ([]Instance, error)
	// UpdateInstance updates an existing instance.
	UpdateInstance(ctx context.Context, inst *Instance) error

	// CreateProgress inserts a progress event.
	CreateProgress(ctx context.Context, p *Progress) error
	// ListProgress returns progress events for an instance, ordered by created_at.
	ListProgress(ctx context.Context, instanceID uuid.UUID) ([]Progress, error)
}
