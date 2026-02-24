package solid

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"unsafe"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/firebase"
	"skillr-mvp-v1/backend/internal/middleware"
)

func newTestHandler() *Handler {
	mc := newMockClient()
	svc := NewService(mc, nil, "http://localhost:3003") // nil DB — handlers will return 500 for DB-dependent ops
	return NewHandler(svc)
}

// setTestAuth sets authenticated user info in the request context,
// matching the middleware.GetUserInfo pattern used by all handlers.
func setTestAuth(c echo.Context, uid string) {
	middleware.SetTestUserInfo(c, &firebase.UserInfo{
		UID:   uid,
		Email: uid + "@test.example.com",
	})
}

func TestConnect_Unauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect", strings.NewReader(`{}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No auth set in context

	h := newTestHandler()
	err := h.Connect(c)
	if err == nil {
		t.Fatal("expected HTTPError, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestConnect_InvalidProvider(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect",
		strings.NewReader(`{"provider":"invalid","podUrl":"http://localhost:3000"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Connect(c)
	if err == nil {
		t.Fatal("expected HTTPError for invalid provider")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestConnect_SSRFBlocked(t *testing.T) {
	tests := []struct {
		name   string
		podURL string
	}{
		{"cloud metadata", "http://169.254.169.254/computeMetadata/v1/"},
		{"private 10.x", "http://10.0.0.1:8080"},
		{"private 192.168", "http://192.168.1.1"},
		{"private 172.16", "http://172.16.0.1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			body := `{"provider":"external","podUrl":"` + tt.podURL + `"}`
			req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect", strings.NewReader(body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			setTestAuth(c, "00000000-0000-0000-0000-000000000001")

			h := newTestHandler()
			err := h.Connect(c)
			if err == nil {
				t.Fatal("expected HTTPError for SSRF-blocked URL")
			}
			he, ok := err.(*echo.HTTPError)
			if !ok {
				t.Fatalf("expected echo.HTTPError, got %T", err)
			}
			if he.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d", he.Code)
			}
		})
	}
}

func TestConnect_NoDB(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect",
		strings.NewReader(`{"provider":"managed","podUrl":"http://localhost:3000"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Connect(c)
	// FR-127: handler writes 503 directly (no echo.HTTPError)
	if err != nil {
		t.Fatalf("expected nil error (503 written directly), got %v", err)
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "30" {
		t.Errorf("expected Retry-After: 30, got %q", rec.Header().Get("Retry-After"))
	}
}

func TestDisconnect_Unauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/pod/connect", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := newTestHandler()
	err := h.Disconnect(c)
	if err == nil {
		t.Fatal("expected HTTPError")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestStatus_Unauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/status", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := newTestHandler()
	err := h.Status(c)
	if err == nil {
		t.Fatal("expected HTTPError")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestSync_Unauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/sync", strings.NewReader(`{}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := newTestHandler()
	err := h.Sync(c)
	if err == nil {
		t.Fatal("expected HTTPError")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestSync_InvalidEngagement(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/sync",
		strings.NewReader(`{"engagement":{"totalXP":-1,"level":1,"streak":0,"title":"Test"}}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Sync(c)
	if err == nil {
		t.Fatal("expected HTTPError for invalid engagement")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestData_Unauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/data", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := newTestHandler()
	err := h.Data(c)
	if err == nil {
		t.Fatal("expected HTTPError")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestSync_NoDB(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/sync",
		strings.NewReader(`{"engagement":{"totalXP":100,"level":1,"streak":0,"title":"Test"}}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Sync(c)
	// FR-127: handler writes 503 directly
	if err != nil {
		t.Fatalf("expected nil error (503 written directly), got %v", err)
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "30" {
		t.Errorf("expected Retry-After: 30, got %q", rec.Header().Get("Retry-After"))
	}
}

func TestData_NoDB(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/data", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Data(c)
	// FR-127: handler writes 503 directly
	if err != nil {
		t.Fatalf("expected nil error (503 written directly), got %v", err)
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "30" {
		t.Errorf("expected Retry-After: 30, got %q", rec.Header().Get("Retry-After"))
	}
}

func TestConnect_ValidatesURLScheme(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect",
		strings.NewReader(`{"provider":"external","podUrl":"ftp://evil.example.com"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Connect(c)
	if err == nil {
		t.Fatal("expected HTTPError for ftp scheme")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestConnect_ErrorDoesNotLeakDetails(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect",
		strings.NewReader(`{"provider":"managed","podUrl":"http://localhost:3000"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	h := newTestHandler()
	err := h.Connect(c)
	// FR-127: 503 is written directly — no echo.HTTPError returned
	if err != nil {
		t.Fatalf("expected nil error (503 written directly), got %v", err)
	}
	// Body should NOT contain internal details like "database" or stack traces
	body := rec.Body.String()
	if strings.Contains(body, "database") || strings.Contains(body, "pgx") {
		t.Errorf("response body leaks internal details: %s", body)
	}
}

func TestReadiness_Unavailable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/readiness", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No auth set — readiness is public

	h := newTestHandler() // nil DB
	if err := h.Readiness(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	body := rec.Body.String()
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if !strings.Contains(body, `"available":false`) {
		t.Errorf("expected available:false, got %s", body)
	}
	if !strings.Contains(body, `"managedAvailable":false`) {
		t.Errorf("expected managedAvailable:false, got %s", body)
	}
	if !strings.Contains(body, `"reason":"database_not_configured"`) {
		t.Errorf("expected reason in body, got %s", body)
	}
}

// fakeDBPool returns a non-nil *pgxpool.Pool for testing nil-checks only.
// The pointer is never dereferenced — only used to pass the db != nil guard.
func fakeDBPool() *pgxpool.Pool {
	return (*pgxpool.Pool)(unsafe.Pointer(uintptr(1)))
}

func TestReadiness_CSSUnreachable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/readiness", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mc := newMockClient()
	mc.pingErr = fmt.Errorf("connection refused")
	svc := NewService(mc, nil, "http://localhost:3003")
	svc.db = fakeDBPool() // Pass Ready() check
	h := NewHandler(svc)

	if err := h.Readiness(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	body := rec.Body.String()
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	// DB is ready → available is true (external pods work without local CSS)
	if !strings.Contains(body, `"available":true`) {
		t.Errorf("expected available:true (DB up, external pods work), got %s", body)
	}
	if !strings.Contains(body, `"managedAvailable":false`) {
		t.Errorf("expected managedAvailable:false (TC-036, no CSS), got %s", body)
	}
}

func TestReadiness_Available(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/readiness", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mc := newMockClient() // pingErr is nil — CSS is "reachable"
	svc := NewService(mc, nil, "http://localhost:3003")
	svc.db = fakeDBPool()
	h := NewHandler(svc)

	if err := h.Readiness(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	body := rec.Body.String()
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if !strings.Contains(body, `"available":true`) {
		t.Errorf("expected available:true, got %s", body)
	}
	if !strings.Contains(body, `"managedAvailable":true`) {
		t.Errorf("expected managedAvailable:true (TC-036), got %s", body)
	}
	if !strings.Contains(body, `"managedPodUrl":"http://localhost:3003"`) {
		t.Errorf("expected managedPodUrl in response, got %s", body)
	}
}

func TestConnect_CSSUnreachable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect",
		strings.NewReader(`{"provider":"managed","podUrl":"http://localhost:3000"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "00000000-0000-0000-0000-000000000001")

	mc := newMockClient()
	mc.pingErr = fmt.Errorf("connection refused")
	svc := NewService(mc, nil, "http://localhost:3003")
	svc.db = fakeDBPool()
	h := NewHandler(svc)

	err := h.Connect(c)
	if err == nil {
		t.Fatal("expected HTTPError when CSS is unreachable")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadGateway {
		t.Errorf("expected 502, got %d", he.Code)
	}
	msg, _ := he.Message.(string)
	if !strings.Contains(msg, "not reachable") {
		t.Errorf("expected 'not reachable' in message, got %q", msg)
	}
}

func TestReadiness_NoAuth(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/readiness", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// Intentionally no auth — should not return 401

	h := newTestHandler()
	if err := h.Readiness(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code == http.StatusUnauthorized {
		t.Error("readiness endpoint must not require auth")
	}
}
