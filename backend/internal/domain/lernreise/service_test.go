package lernreise

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/FutureSkillr/MVP72/backend/internal/honeycomb"
)

// ── Mock implementations ────────────────────────────────────────────────────

type mockRepo struct {
	ctxIDs    map[uuid.UUID]string
	instances map[uuid.UUID]*Instance
	progress  map[uuid.UUID][]Progress
}

func newMockRepo() *mockRepo {
	return &mockRepo{
		ctxIDs:    make(map[uuid.UUID]string),
		instances: make(map[uuid.UUID]*Instance),
		progress:  make(map[uuid.UUID][]Progress),
	}
}

func (m *mockRepo) GetCtxID(_ context.Context, userID uuid.UUID) (string, error) {
	return m.ctxIDs[userID], nil
}

func (m *mockRepo) SetCtxID(_ context.Context, userID uuid.UUID, ctxID string) error {
	m.ctxIDs[userID] = ctxID
	return nil
}

func (m *mockRepo) CreateInstance(_ context.Context, inst *Instance) error {
	m.instances[inst.ID] = inst
	return nil
}

func (m *mockRepo) GetInstance(_ context.Context, id uuid.UUID) (*Instance, error) {
	inst, ok := m.instances[id]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	return inst, nil
}

func (m *mockRepo) GetActiveInstance(_ context.Context, userID uuid.UUID) (*Instance, error) {
	for _, inst := range m.instances {
		if inst.UserID == userID && inst.Status == StatusActive {
			return inst, nil
		}
	}
	return nil, nil
}

func (m *mockRepo) ListInstances(_ context.Context, userID uuid.UUID) ([]Instance, error) {
	var result []Instance
	for _, inst := range m.instances {
		if inst.UserID == userID {
			result = append(result, *inst)
		}
	}
	return result, nil
}

func (m *mockRepo) UpdateInstance(_ context.Context, inst *Instance) error {
	m.instances[inst.ID] = inst
	return nil
}

func (m *mockRepo) CreateProgress(_ context.Context, p *Progress) error {
	m.progress[p.InstanceID] = append(m.progress[p.InstanceID], *p)
	return nil
}

func (m *mockRepo) ListProgress(_ context.Context, instanceID uuid.UUID) ([]Progress, error) {
	return m.progress[instanceID], nil
}

type mockHoneycomb struct {
	courses  []honeycomb.ListEntry
	data     map[string]*honeycomb.CourseData
	submitFn func(ctxID, dataID, moduleID, taskID string) (*honeycomb.CourseData, error)
}

func (m *mockHoneycomb) ListCourses(_ context.Context, _ string) ([]honeycomb.ListEntry, error) {
	return m.courses, nil
}

func (m *mockHoneycomb) GetCourseData(_ context.Context, _ string, dataID string) (*honeycomb.CourseData, error) {
	d, ok := m.data[dataID]
	if !ok {
		return nil, fmt.Errorf("course not found: %s", dataID)
	}
	return d, nil
}

func (m *mockHoneycomb) SubmitTask(_ context.Context, ctxID, dataID, moduleID, taskID string) (*honeycomb.CourseData, error) {
	if m.submitFn != nil {
		return m.submitFn(ctxID, dataID, moduleID, taskID)
	}
	return m.data[dataID], nil
}

func (m *mockHoneycomb) GetModified(_ context.Context, _, _ string) (time.Time, error) {
	return time.Now(), nil
}

func (m *mockHoneycomb) Ping(_ context.Context) error { return nil }

type mockMemory struct {
	ctxID string
}

func (m *mockMemory) RegisterUser(_ context.Context, _, _, _, _ string) (string, error) {
	return m.ctxID, nil
}

func (m *mockMemory) Ping(_ context.Context) error { return nil }

// ── Tests ────────────────────────────────────────────────────────────────────

func TestResolveCtxID_Cached(t *testing.T) {
	repo := newMockRepo()
	userID := uuid.New()
	repo.ctxIDs[userID] = "cached-ctx"

	svc := NewService(repo, &mockHoneycomb{}, &mockMemory{ctxID: "new-ctx"})
	ctxID, err := svc.ResolveCtxID(context.Background(), userID, "uid", "Max Mustermann", "m@x.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ctxID != "cached-ctx" {
		t.Errorf("expected cached-ctx, got %s", ctxID)
	}
}

func TestResolveCtxID_RegistersNew(t *testing.T) {
	repo := newMockRepo()
	userID := uuid.New()

	svc := NewService(repo, &mockHoneycomb{}, &mockMemory{ctxID: "new-ctx-123"})
	ctxID, err := svc.ResolveCtxID(context.Background(), userID, "uid", "Anna Schmidt", "a@s.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ctxID != "new-ctx-123" {
		t.Errorf("expected new-ctx-123, got %s", ctxID)
	}
	// Verify cached
	if repo.ctxIDs[userID] != "new-ctx-123" {
		t.Errorf("expected ctx_id cached in repo")
	}
}

func TestListCatalog(t *testing.T) {
	hc := &mockHoneycomb{
		courses: []honeycomb.ListEntry{
			{ID: "c1", Name: "Course 1"},
			{ID: "c2", Name: "Course 2"},
		},
	}
	svc := NewService(newMockRepo(), hc, &mockMemory{})
	entries, err := svc.ListCatalog(context.Background(), "ctx1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
}

func TestSelect_Success(t *testing.T) {
	hc := &mockHoneycomb{
		data: map[string]*honeycomb.CourseData{
			"course1": {ID: "course1", Name: "Marketing 101", ProgressP: 0, Progress: "0/10"},
		},
	}
	repo := newMockRepo()
	svc := NewService(repo, hc, &mockMemory{})
	userID := uuid.New()

	inst, data, err := svc.Select(context.Background(), userID, "ctx1", "course1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if inst.Title != "Marketing 101" {
		t.Errorf("expected Marketing 101, got %s", inst.Title)
	}
	if inst.Status != StatusActive {
		t.Errorf("expected active status, got %s", inst.Status)
	}
	if data.ID != "course1" {
		t.Errorf("expected course1, got %s", data.ID)
	}
}

func TestSelect_RejectsSecondActive(t *testing.T) {
	hc := &mockHoneycomb{
		data: map[string]*honeycomb.CourseData{
			"course1": {ID: "course1", Name: "Marketing 101"},
			"course2": {ID: "course2", Name: "Sales 101"},
		},
	}
	repo := newMockRepo()
	svc := NewService(repo, hc, &mockMemory{})
	userID := uuid.New()

	_, _, err := svc.Select(context.Background(), userID, "ctx1", "course1")
	if err != nil {
		t.Fatalf("unexpected error on first select: %v", err)
	}

	_, _, err = svc.Select(context.Background(), userID, "ctx1", "course2")
	if err == nil {
		t.Fatal("expected error on second select")
	}
}

func TestSubmitTask_TracksProgress(t *testing.T) {
	afterSubmit := &honeycomb.CourseData{
		ID:        "course1",
		ProgressP: 30,
		Progress:  "3/10",
		Modules: []honeycomb.Module{
			{
				ID:        "mod1",
				ProgressP: 50,
				Tasks: []honeycomb.ModuleTask{
					{ID: "task1", State: "done"},
					{ID: "task2", State: "open"},
				},
			},
		},
	}

	hc := &mockHoneycomb{
		data: map[string]*honeycomb.CourseData{
			"course1": {
				ID:        "course1",
				ProgressP: 20,
				Progress:  "2/10",
				Modules: []honeycomb.Module{
					{
						ID:        "mod1",
						ProgressP: 33,
						Tasks: []honeycomb.ModuleTask{
							{ID: "task1", State: "open"},
							{ID: "task2", State: "open"},
						},
					},
				},
			},
		},
		submitFn: func(_, _, _, _ string) (*honeycomb.CourseData, error) {
			return afterSubmit, nil
		},
	}

	repo := newMockRepo()
	svc := NewService(repo, hc, &mockMemory{})

	inst := &Instance{
		ID:              uuid.New(),
		UserID:          uuid.New(),
		CtxID:           "ctx1",
		HoneycombDataID: "course1",
		Status:          StatusActive,
	}
	repo.instances[inst.ID] = inst

	result, err := svc.SubmitTask(context.Background(), inst, "mod1", "task1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.CourseData.ProgressP != 30 {
		t.Errorf("expected progress 30, got %d", result.CourseData.ProgressP)
	}
	if result.Progress.NewState != "done" {
		t.Errorf("expected new state 'done', got %s", result.Progress.NewState)
	}
	if result.XPAwarded < XPLernreiseTaskComplete {
		t.Errorf("expected at least %d XP, got %d", XPLernreiseTaskComplete, result.XPAwarded)
	}

	// Instance should be updated
	if inst.ProgressPercent != 30 {
		t.Errorf("expected instance progress 30, got %d", inst.ProgressPercent)
	}

	// Progress event should be stored
	events, _ := repo.ListProgress(context.Background(), inst.ID)
	if len(events) != 1 {
		t.Fatalf("expected 1 progress event, got %d", len(events))
	}
}

func TestSubmitTask_CourseCompletion(t *testing.T) {
	afterSubmit := &honeycomb.CourseData{
		ID:        "course1",
		ProgressP: 100,
		Progress:  "10/10",
		Modules: []honeycomb.Module{
			{
				ID:        "mod1",
				ProgressP: 100,
				Tasks: []honeycomb.ModuleTask{
					{ID: "task1", State: "done"},
				},
			},
		},
	}

	hc := &mockHoneycomb{
		data: map[string]*honeycomb.CourseData{
			"course1": {
				ID:        "course1",
				ProgressP: 90,
				Modules: []honeycomb.Module{
					{ID: "mod1", ProgressP: 90, Tasks: []honeycomb.ModuleTask{{ID: "task1", State: "in progress"}}},
				},
			},
		},
		submitFn: func(_, _, _, _ string) (*honeycomb.CourseData, error) {
			return afterSubmit, nil
		},
	}

	repo := newMockRepo()
	svc := NewService(repo, hc, &mockMemory{})

	inst := &Instance{
		ID:              uuid.New(),
		UserID:          uuid.New(),
		CtxID:           "ctx1",
		HoneycombDataID: "course1",
		Status:          StatusActive,
	}
	repo.instances[inst.ID] = inst

	result, err := svc.SubmitTask(context.Background(), inst, "mod1", "task1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should award task + module + course XP
	expectedXP := XPLernreiseTaskComplete + XPLernreiseModuleComplete + XPLernreiseComplete
	if result.XPAwarded != expectedXP {
		t.Errorf("expected %d XP, got %d", expectedXP, result.XPAwarded)
	}

	// Instance should be completed
	if inst.Status != StatusCompleted {
		t.Errorf("expected completed status, got %s", inst.Status)
	}
	if inst.CompletedAt == nil {
		t.Error("expected CompletedAt to be set")
	}
}

func TestSplitName(t *testing.T) {
	tests := []struct {
		input         string
		wantGiven     string
		wantFamily    string
	}{
		{"Max Mustermann", "Max", "Mustermann"},
		{"Anna Maria Schmidt", "Anna Maria", "Schmidt"},
		{"Max", "Max", ""},
		{"", "", ""},
	}

	for _, tt := range tests {
		given, family := splitName(tt.input)
		if given != tt.wantGiven || family != tt.wantFamily {
			t.Errorf("splitName(%q) = (%q, %q), want (%q, %q)",
				tt.input, given, family, tt.wantGiven, tt.wantFamily)
		}
	}
}

func TestFindTaskState(t *testing.T) {
	data := &honeycomb.CourseData{
		Modules: []honeycomb.Module{
			{
				ID: "mod1",
				Tasks: []honeycomb.ModuleTask{
					{ID: "task1", State: "done"},
					{ID: "task2", State: "in progress"},
				},
			},
		},
	}

	if s := findTaskState(data, "mod1", "task1"); s != "done" {
		t.Errorf("expected done, got %s", s)
	}
	if s := findTaskState(data, "mod1", "task2"); s != "in progress" {
		t.Errorf("expected in progress, got %s", s)
	}
	if s := findTaskState(data, "mod1", "task3"); s != "open" {
		t.Errorf("expected open for missing task, got %s", s)
	}
	if s := findTaskState(data, "mod2", "task1"); s != "open" {
		t.Errorf("expected open for missing module, got %s", s)
	}
}
