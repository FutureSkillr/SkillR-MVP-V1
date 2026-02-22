package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/config"
)

func TestHealth_NoDBNoRedis(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "test-ver", "secret")
	if err := h.Health(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp["status"] != "ok" {
		t.Errorf("expected status ok, got %v", resp["status"])
	}
	// Public endpoint must not leak version or components
	if _, ok := resp["version"]; ok {
		t.Error("public health must not expose version")
	}
	if _, ok := resp["components"]; ok {
		t.Error("public health must not expose components")
	}
}

func TestDetailedHealth_RequiresToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "my-secret")
	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without token, got %d", rec.Code)
	}
}

func TestDetailedHealth_WrongToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=wrong", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "my-secret")
	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 with wrong token, got %d", rec.Code)
	}
}

func TestDetailedHealth_EmptyTokenConfig(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=anything", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// No token configured — should always reject
	h := NewHealthHandler(nil, nil, "v1", "")
	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 when no token configured, got %d", rec.Code)
	}
}

func TestDetailedHealth_ReturnsFullStatus(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=secret", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "abc1234", "secret")
	h.SetAI(true)

	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	// Check required top-level fields
	for _, field := range []string{"status", "version", "startedAt", "uptimeSeconds", "components", "runtime"} {
		if _, ok := resp[field]; !ok {
			t.Errorf("missing field: %s", field)
		}
	}

	if resp["version"] != "abc1234" {
		t.Errorf("expected version abc1234, got %v", resp["version"])
	}
	if resp["status"] != "ok" {
		t.Errorf("expected status ok, got %v", resp["status"])
	}

	// Check components
	components, ok := resp["components"].(map[string]interface{})
	if !ok {
		t.Fatal("components is not a map")
	}
	for _, comp := range []string{"postgres", "redis", "ai", "honeycomb"} {
		c, ok := components[comp].(map[string]interface{})
		if !ok {
			t.Errorf("component %s missing or not a map", comp)
			continue
		}
		if _, ok := c["status"]; !ok {
			t.Errorf("component %s missing status", comp)
		}
	}

	// AI should be ok since we called SetAI(true)
	aiComp := components["ai"].(map[string]interface{})
	if aiComp["status"] != "ok" {
		t.Errorf("expected AI status ok, got %v", aiComp["status"])
	}

	// DB/Redis not configured — should show not_configured
	pgComp := components["postgres"].(map[string]interface{})
	if pgComp["status"] != "not_configured" {
		t.Errorf("expected postgres not_configured, got %v", pgComp["status"])
	}

	// Check runtime
	rt, ok := resp["runtime"].(map[string]interface{})
	if !ok {
		t.Fatal("runtime is not a map")
	}
	if _, ok := rt["goroutines"]; !ok {
		t.Error("runtime missing goroutines")
	}
	if _, ok := rt["heapMB"]; !ok {
		t.Error("runtime missing heapMB")
	}
}

func TestDetailedHealth_AIUnavailable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=tok", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "tok")
	// Don't call SetAI — defaults to unavailable

	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	components := resp["components"].(map[string]interface{})
	aiComp := components["ai"].(map[string]interface{})
	if aiComp["status"] != "unavailable" {
		t.Errorf("expected AI unavailable, got %v", aiComp["status"])
	}
}

func TestConfig_ReturnsFirebaseConfig(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/config", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	cfg := &config.Config{
		FirebaseAPIKey:     "test-key",
		FirebaseAuthDomain: "test.firebaseapp.com",
		FirebaseProject:    "test-project",
	}
	h := NewConfigHandler(cfg)
	if err := h.Config(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	fb := resp["firebase"].(map[string]interface{})
	if fb["projectId"] != "test-project" {
		t.Errorf("expected test-project, got %v", fb["projectId"])
	}
}
