package lernreise

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/firebase"
	"skillr-mvp-v1/backend/internal/honeycomb"
	"skillr-mvp-v1/backend/internal/middleware"
)

func setupHandler() (*Handler, *mockRepo, *mockHoneycomb) {
	repo := newMockRepo()
	hc := &mockHoneycomb{
		courses: []honeycomb.ListEntry{
			{ID: "course1", Name: "Marketing 101", Description: "Learn marketing"},
		},
		data: map[string]*honeycomb.CourseData{
			"course1": {
				ID:        "course1",
				Name:      "Marketing 101",
				ProgressP: 0,
				Progress:  "0/10",
				Modules: []honeycomb.Module{
					{
						ID:   "mod1",
						Name: "Module 1",
						Tasks: []honeycomb.ModuleTask{
							{ID: "task1", State: "open", Name: "Task 1"},
						},
					},
				},
			},
		},
	}
	mem := &mockMemory{ctxID: "test-ctx-id"}
	svc := NewService(repo, hc, mem)
	handler := NewHandler(svc)
	return handler, repo, hc
}

func setAuth(c echo.Context, uid string) {
	middleware.SetTestUserInfo(c, &firebase.UserInfo{
		UID:         uid,
		Email:       "test@example.com",
		DisplayName: "Test User",
	})
}

func TestListCatalog_Success(t *testing.T) {
	handler, _, _ := setupHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/lernreise/catalog", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setAuth(c, "user-1")

	if err := handler.ListCatalog(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	items, ok := resp["items"].([]any)
	if !ok {
		t.Fatal("items is not an array")
	}
	if len(items) != 1 {
		t.Errorf("expected 1 item, got %d", len(items))
	}
}

func TestListCatalog_Unauthenticated(t *testing.T) {
	handler, _, _ := setupHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/lernreise/catalog", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No auth set

	err := handler.ListCatalog(c)
	if err == nil {
		t.Fatal("expected error for unauthenticated request")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", httpErr.Code)
	}
}

func TestHandlerSelect_Success(t *testing.T) {
	handler, _, _ := setupHandler()
	e := echo.New()
	body := `{"data_id":"course1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lernreise/select", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setAuth(c, "user-1")

	if err := handler.Select(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp["instance"] == nil {
		t.Error("expected instance in response")
	}
	if resp["course_data"] == nil {
		t.Error("expected course_data in response")
	}
}

func TestHandlerSelect_MissingDataID(t *testing.T) {
	handler, _, _ := setupHandler()
	e := echo.New()
	body := `{}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lernreise/select", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setAuth(c, "user-1")

	err := handler.Select(c)
	if err == nil {
		t.Fatal("expected error for missing data_id")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", httpErr.Code)
	}
}

func TestGetActive_NoInstance(t *testing.T) {
	handler, _, _ := setupHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/lernreise/active", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setAuth(c, "user-1")

	if err := handler.GetActive(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp["instance"] != nil {
		t.Error("expected nil instance")
	}
}

func TestSubmitTask_Success(t *testing.T) {
	handler, repo, hc := setupHandler()

	// Create an active instance first
	userID := deriveUUID("user-1")
	inst := &Instance{
		ID:              uuid.New(),
		UserID:          userID,
		CtxID:           "test-ctx-id",
		HoneycombDataID: "course1",
		Status:          StatusActive,
	}
	repo.instances[inst.ID] = inst

	// Set up submit response
	hc.submitFn = func(_, _, _, _ string) (*honeycomb.CourseData, error) {
		return &honeycomb.CourseData{
			ID:        "course1",
			ProgressP: 10,
			Progress:  "1/10",
			Modules: []honeycomb.Module{
				{
					ID:        "mod1",
					ProgressP: 33,
					Tasks: []honeycomb.ModuleTask{
						{ID: "task1", State: "done"},
					},
				},
			},
		}, nil
	}

	e := echo.New()
	body := `{"module_id":"mod1","task_id":"task1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lernreise/instances/"+inst.ID.String()+"/submit", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(inst.ID.String())
	setAuth(c, "user-1")

	if err := handler.SubmitTask(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp["xp_awarded"] == nil {
		t.Error("expected xp_awarded in response")
	}
}

func TestSubmitTask_WrongUser(t *testing.T) {
	handler, repo, _ := setupHandler()

	inst := &Instance{
		ID:              uuid.New(),
		UserID:          deriveUUID("user-OTHER"),
		CtxID:           "test-ctx-id",
		HoneycombDataID: "course1",
		Status:          StatusActive,
	}
	repo.instances[inst.ID] = inst

	e := echo.New()
	body := `{"module_id":"mod1","task_id":"task1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lernreise/instances/"+inst.ID.String()+"/submit", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(inst.ID.String())
	setAuth(c, "user-1") // Different user

	err := handler.SubmitTask(c)
	if err == nil {
		t.Fatal("expected error for wrong user")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", httpErr.Code)
	}
}

func TestGetProgress_Success(t *testing.T) {
	handler, repo, _ := setupHandler()

	userID := deriveUUID("user-1")
	inst := &Instance{
		ID:     uuid.New(),
		UserID: userID,
		Status: StatusActive,
	}
	repo.instances[inst.ID] = inst
	repo.progress[inst.ID] = []Progress{
		{ID: uuid.New(), InstanceID: inst.ID, ModuleID: "mod1", TaskID: "task1", OldState: "open", NewState: "done", ProgressP: 10},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/lernreise/instances/"+inst.ID.String()+"/progress", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(inst.ID.String())
	setAuth(c, "user-1")

	if err := handler.GetProgress(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	events, ok := resp["events"].([]any)
	if !ok {
		t.Fatal("events is not an array")
	}
	if len(events) != 1 {
		t.Errorf("expected 1 event, got %d", len(events))
	}
}
