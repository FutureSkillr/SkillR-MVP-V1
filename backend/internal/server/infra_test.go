package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/config"
)

// mockPodChecker implements PodReadinessChecker for tests.
type mockPodChecker struct {
	ready   bool
	pingErr error
}

func (m *mockPodChecker) Ready() bool                        { return m.ready }
func (m *mockPodChecker) PingCSS(_ context.Context) error    { return m.pingErr }

func TestInfraStatus_ResponseStructure(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "test-ver", "")
	h.SetConfig(&config.Config{
		DatabaseURL:     "postgres://localhost/test",
		FirebaseProject: "my-project",
		GCPProject:      "my-gcp",
	})
	h.SetFirebase(true)
	h.SetAI(true)

	if err := h.InfraStatus(c); err != nil {
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
	for _, field := range []string{"status", "version", "startedAt", "uptimeSeconds", "postgres", "redis", "kafka", "apis", "configPresence", "runtime"} {
		if _, ok := resp[field]; !ok {
			t.Errorf("missing field: %s", field)
		}
	}

	if resp["version"] != "test-ver" {
		t.Errorf("expected version test-ver, got %v", resp["version"])
	}
}

func TestInfraStatus_KafkaAlwaysNotConfigured(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "")
	h.SetConfig(&config.Config{})

	if err := h.InfraStatus(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	kafka, ok := resp["kafka"].(map[string]interface{})
	if !ok {
		t.Fatal("kafka is not a map")
	}
	if kafka["status"] != "not_configured" {
		t.Errorf("expected kafka status not_configured, got %v", kafka["status"])
	}
	if kafka["note"] != "Kafka integration planned" {
		t.Errorf("expected kafka note, got %v", kafka["note"])
	}
}

func TestInfraStatus_OverallDegradedWhenNoDB(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// No DB, no Redis — should be degraded because postgres is not configured
	h := NewHealthHandler(nil, nil, "v1", "")
	h.SetConfig(&config.Config{})

	if err := h.InfraStatus(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp["status"] != "degraded" {
		t.Errorf("expected degraded when no DB, got %v", resp["status"])
	}

	pg, ok := resp["postgres"].(map[string]interface{})
	if !ok {
		t.Fatal("postgres is not a map")
	}
	if pg["status"] != "not_configured" {
		t.Errorf("expected postgres not_configured, got %v", pg["status"])
	}
}

func TestInfraStatus_ConfigPresence(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "")
	h.SetConfig(&config.Config{
		DatabaseURL:     "postgres://localhost/test",
		RedisURL:        "",
		FirebaseProject: "proj",
		GCPProject:      "gcp",
		SolidPodURL:     "",
		HoneycombURL:    "http://hc",
		MemoryServiceURL: "",
	})

	if err := h.InfraStatus(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	cp, ok := resp["configPresence"].(map[string]interface{})
	if !ok {
		t.Fatal("configPresence is not a map")
	}

	expected := map[string]bool{
		"DATABASE_URL":       true,
		"REDIS_URL":          false,
		"FIREBASE_PROJECT_ID": true,
		"GCP_PROJECT_ID":     true,
		"SOLID_POD_URL":      false,
		"HONEYCOMB_URL":      true,
		"MEMORY_SERVICE_URL": false,
	}

	for key, want := range expected {
		got, exists := cp[key]
		if !exists {
			t.Errorf("configPresence missing key: %s", key)
			continue
		}
		if got != want {
			t.Errorf("configPresence[%s] = %v, want %v", key, got, want)
		}
	}
}

func TestInfraStatus_APIsReflectSetters(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "")
	h.SetConfig(&config.Config{})
	h.SetFirebase(true)
	h.SetAI(true)
	h.SetHoneycomb(false)
	h.SetMemoryService(true)
	h.SetSolidPod(true, true)

	if err := h.InfraStatus(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	apis, ok := resp["apis"].(map[string]interface{})
	if !ok {
		t.Fatal("apis is not a map")
	}

	cases := map[string]string{
		"firebase_auth":  "ok",
		"vertex_ai":      "ok",
		"honeycomb":      "unavailable",
		"memory_service": "ok",
		"solid_pod":      "ok",
	}

	for name, wantStatus := range cases {
		api, ok := apis[name].(map[string]interface{})
		if !ok {
			t.Errorf("api %s missing or not a map", name)
			continue
		}
		if api["status"] != wantStatus {
			t.Errorf("api %s status = %v, want %s", name, api["status"], wantStatus)
		}
	}
}

func TestInfraStatus_SolidPodDisabled(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "")
	h.SetConfig(&config.Config{})
	// Solid Pod not enabled — should show not_configured
	h.SetSolidPod(false, false)

	if err := h.InfraStatus(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	apis := resp["apis"].(map[string]interface{})
	sp := apis["solid_pod"].(map[string]interface{})
	if sp["status"] != "not_configured" {
		t.Errorf("expected solid_pod not_configured when disabled, got %v", sp["status"])
	}
}

func TestInfraStatus_NilConfig(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/infra", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Don't call SetConfig — cfg is nil
	h := NewHealthHandler(nil, nil, "v1", "")

	if err := h.InfraStatus(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 even with nil config, got %d", rec.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	// All config presence should be false
	cp := resp["configPresence"].(map[string]interface{})
	for key, val := range cp {
		if val != false {
			t.Errorf("configPresence[%s] should be false with nil config, got %v", key, val)
		}
	}
}

func TestDetailedHealth_PodReadyComposite(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=secret", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "secret")
	h.SetConfig(&config.Config{})
	h.SetSolidService(&mockPodChecker{ready: true, pingErr: nil})

	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	// pod_ready must exist
	podReady, ok := resp["pod_ready"].(map[string]interface{})
	if !ok {
		t.Fatal("pod_ready is missing or not a map")
	}

	// Without DB: database should be not_configured, overall unavailable
	if podReady["status"] != "unavailable" {
		t.Errorf("expected pod_ready status unavailable (no DB), got %v", podReady["status"])
	}

	checks, ok := podReady["checks"].(map[string]interface{})
	if !ok {
		t.Fatal("pod_ready.checks is missing or not a map")
	}

	for _, key := range []string{"database", "migrations", "solid_server"} {
		if _, exists := checks[key]; !exists {
			t.Errorf("pod_ready.checks missing key: %s", key)
		}
	}

	// database should be not_configured when DB is nil
	if checks["database"] != "not_configured" {
		t.Errorf("expected database=not_configured, got %v", checks["database"])
	}

	// solid_server should be ok since mock returns nil
	if checks["solid_server"] != "ok" {
		t.Errorf("expected solid_server=ok, got %v", checks["solid_server"])
	}
}

func TestDetailedHealth_PodReadyNoSolidService(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=secret", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "secret")
	h.SetConfig(&config.Config{})
	// No SetSolidService call — solidSvc is nil

	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	podReady := resp["pod_ready"].(map[string]interface{})
	if podReady["status"] != "unavailable" {
		t.Errorf("expected unavailable when no solid service, got %v", podReady["status"])
	}

	checks := podReady["checks"].(map[string]interface{})
	if checks["solid_server"] != "not_configured" {
		t.Errorf("expected solid_server=not_configured, got %v", checks["solid_server"])
	}
}

func TestDetailedHealth_PodReadySolidPingFails(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/health/detailed?token=secret", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := NewHealthHandler(nil, nil, "v1", "secret")
	h.SetConfig(&config.Config{})
	h.SetSolidService(&mockPodChecker{ready: true, pingErr: fmt.Errorf("connection refused")})

	if err := h.DetailedHealth(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	podReady := resp["pod_ready"].(map[string]interface{})
	checks := podReady["checks"].(map[string]interface{})
	if checks["solid_server"] != "unavailable" {
		t.Errorf("expected solid_server=unavailable when ping fails, got %v", checks["solid_server"])
	}
}
