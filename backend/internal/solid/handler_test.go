package solid

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/firebase"
	"skillr-mvp-v1/backend/internal/middleware"
)

func newTestHandler() *Handler {
	mc := newMockClient()
	svc := NewService(mc, nil) // nil DB — handlers will return 500 for DB-dependent ops
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
	setTestAuth(c, "user-1")

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
			setTestAuth(c, "user-1")

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
	setTestAuth(c, "user-1")

	h := newTestHandler()
	err := h.Connect(c)
	if err == nil {
		t.Fatal("expected HTTPError (no DB)")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 (no DB), got %d", he.Code)
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
	setTestAuth(c, "user-1")

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
	setTestAuth(c, "user-1")

	h := newTestHandler()
	err := h.Sync(c)
	if err == nil {
		t.Fatal("expected HTTPError (no DB)")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 (no DB), got %d", he.Code)
	}
}

func TestData_NoDB(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/pod/data", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "user-1")

	h := newTestHandler()
	err := h.Data(c)
	if err == nil {
		t.Fatal("expected HTTPError (no DB)")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 (no DB), got %d", he.Code)
	}
}

func TestConnect_ValidatesURLScheme(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pod/connect",
		strings.NewReader(`{"provider":"external","podUrl":"ftp://evil.example.com"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setTestAuth(c, "user-1")

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
	setTestAuth(c, "user-1")

	h := newTestHandler()
	err := h.Connect(c)
	if err == nil {
		t.Fatal("expected error (no DB)")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	msg, ok := he.Message.(string)
	if !ok {
		t.Fatalf("expected string message, got %T", he.Message)
	}
	// Error message should NOT contain internal details like "database" or stack traces
	if strings.Contains(msg, "database") || strings.Contains(msg, "pgx") {
		t.Errorf("error message leaks internal details: %s", msg)
	}
}
