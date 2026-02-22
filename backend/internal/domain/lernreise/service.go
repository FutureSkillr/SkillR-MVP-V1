package lernreise

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/FutureSkillr/MVP72/backend/internal/honeycomb"
	"github.com/FutureSkillr/MVP72/backend/internal/memory"
)

// Service orchestrates Lernreise operations across Honeycomb, Memory, and local storage.
type Service struct {
	repo      Repository
	honeycomb honeycomb.Client
	memory    memory.Client
}

// NewService creates a Lernreise service.
func NewService(repo Repository, hc honeycomb.Client, mem memory.Client) *Service {
	return &Service{
		repo:      repo,
		honeycomb: hc,
		memory:    mem,
	}
}

// ResolveCtxID ensures the user has a Honeycomb ctx_id, registering via Memory if needed.
func (s *Service) ResolveCtxID(ctx context.Context, userID uuid.UUID, uid, displayName, email string) (string, error) {
	ctxID, err := s.repo.GetCtxID(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("get ctx_id: %w", err)
	}
	if ctxID != "" {
		return ctxID, nil
	}

	// Parse display name into given/family name (best effort)
	givenName, familyName := splitName(displayName)

	ctxID, err = s.memory.RegisterUser(ctx, uid, givenName, familyName, email)
	if err != nil {
		return "", fmt.Errorf("register user with memory service: %w", err)
	}

	if err := s.repo.SetCtxID(ctx, userID, ctxID); err != nil {
		return "", fmt.Errorf("store ctx_id: %w", err)
	}

	return ctxID, nil
}

// ListCatalog returns available courses from Honeycomb.
func (s *Service) ListCatalog(ctx context.Context, ctxID string) ([]honeycomb.ListEntry, error) {
	return s.honeycomb.ListCourses(ctx, ctxID)
}

// GetCatalogDetail returns course detail from Honeycomb.
func (s *Service) GetCatalogDetail(ctx context.Context, ctxID, dataID string) (*honeycomb.CourseData, error) {
	return s.honeycomb.GetCourseData(ctx, ctxID, dataID)
}

// Select creates a new Lernreise instance for the user.
func (s *Service) Select(ctx context.Context, userID uuid.UUID, ctxID, dataID string) (*Instance, *honeycomb.CourseData, error) {
	// Check for existing active instance
	existing, err := s.repo.GetActiveInstance(ctx, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("check active instance: %w", err)
	}
	if existing != nil {
		return nil, nil, fmt.Errorf("user already has an active Lernreise: %s", existing.ID)
	}

	// Fetch course data from Honeycomb
	data, err := s.honeycomb.GetCourseData(ctx, ctxID, dataID)
	if err != nil {
		return nil, nil, fmt.Errorf("get course data: %w", err)
	}

	now := time.Now()
	inst := &Instance{
		ID:              uuid.New(),
		UserID:          userID,
		CtxID:           ctxID,
		HoneycombDataID: dataID,
		Title:           data.Name,
		Status:          StatusActive,
		ProgressPercent: data.ProgressP,
		ProgressLabel:   data.Progress,
		StartedAt:       now,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := s.repo.CreateInstance(ctx, inst); err != nil {
		return nil, nil, fmt.Errorf("create instance: %w", err)
	}

	return inst, data, nil
}

// GetActive returns the active instance for the user.
func (s *Service) GetActive(ctx context.Context, userID uuid.UUID) (*Instance, error) {
	return s.repo.GetActiveInstance(ctx, userID)
}

// ListInstances returns all instances for the user.
func (s *Service) ListInstances(ctx context.Context, userID uuid.UUID) ([]Instance, error) {
	return s.repo.ListInstances(ctx, userID)
}

// GetInstance returns an instance by ID.
func (s *Service) GetInstance(ctx context.Context, id uuid.UUID) (*Instance, error) {
	return s.repo.GetInstance(ctx, id)
}

// GetInstanceWithData returns an instance plus its Honeycomb course data.
func (s *Service) GetInstanceWithData(ctx context.Context, inst *Instance) (*honeycomb.CourseData, error) {
	return s.honeycomb.GetCourseData(ctx, inst.CtxID, inst.HoneycombDataID)
}

// SubmitTaskResult holds the result of a task submission.
type SubmitTaskResult struct {
	CourseData *honeycomb.CourseData
	Progress   *Progress
	XPAwarded  int
}

// SubmitTask submits a task completion to Honeycomb, logs progress, and calculates XP.
func (s *Service) SubmitTask(ctx context.Context, inst *Instance, moduleID, taskID string) (*SubmitTaskResult, error) {
	// Find current task state before submission
	oldState := "open"
	beforeData, err := s.honeycomb.GetCourseData(ctx, inst.CtxID, inst.HoneycombDataID)
	if err == nil {
		oldState = findTaskState(beforeData, moduleID, taskID)
	}

	// Submit to Honeycomb
	data, err := s.honeycomb.SubmitTask(ctx, inst.CtxID, inst.HoneycombDataID, moduleID, taskID)
	if err != nil {
		return nil, fmt.Errorf("submit task to honeycomb: %w", err)
	}

	newState := findTaskState(data, moduleID, taskID)

	// Log progress event
	now := time.Now()
	prog := &Progress{
		ID:         uuid.New(),
		InstanceID: inst.ID,
		ModuleID:   moduleID,
		TaskID:     taskID,
		OldState:   oldState,
		NewState:   newState,
		ProgressP:  data.ProgressP,
		CreatedAt:  now,
	}
	if err := s.repo.CreateProgress(ctx, prog); err != nil {
		return nil, fmt.Errorf("create progress: %w", err)
	}

	// Update instance
	inst.ProgressPercent = data.ProgressP
	inst.ProgressLabel = data.Progress
	inst.LastSyncedAt = &now
	inst.UpdatedAt = now

	// Check for course completion
	if data.ProgressP >= 100 {
		inst.Status = StatusCompleted
		completedAt := now
		inst.CompletedAt = &completedAt
	}

	if err := s.repo.UpdateInstance(ctx, inst); err != nil {
		return nil, fmt.Errorf("update instance: %w", err)
	}

	// Calculate XP
	xp := s.calculateXP(data, moduleID, inst)

	return &SubmitTaskResult{
		CourseData: data,
		Progress:   prog,
		XPAwarded:  xp,
	}, nil
}

// ListProgress returns progress events for an instance.
func (s *Service) ListProgress(ctx context.Context, instanceID uuid.UUID) ([]Progress, error) {
	return s.repo.ListProgress(ctx, instanceID)
}

func (s *Service) calculateXP(data *honeycomb.CourseData, moduleID string, _ *Instance) int {
	xp := XPLernreiseTaskComplete

	// Check if module is complete
	for _, mod := range data.Modules {
		if mod.ID == moduleID && mod.ProgressP >= 100 {
			xp += XPLernreiseModuleComplete
			break
		}
	}

	// Check if course is complete
	if data.ProgressP >= 100 {
		xp += XPLernreiseComplete
	}

	return xp
}

func findTaskState(data *honeycomb.CourseData, moduleID, taskID string) string {
	for _, mod := range data.Modules {
		if mod.ID == moduleID {
			for _, task := range mod.Tasks {
				if task.ID == taskID {
					return task.State
				}
			}
		}
	}
	return "open"
}

func splitName(displayName string) (string, string) {
	if displayName == "" {
		return "", ""
	}
	for i := len(displayName) - 1; i >= 0; i-- {
		if displayName[i] == ' ' {
			return displayName[:i], displayName[i+1:]
		}
	}
	return displayName, ""
}
