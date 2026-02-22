package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/config"
)

func TestSecurityHeaders(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		AllowedOrigins: []string{"http://localhost:3000"},
	}
	srv := New(cfg)

	// Add a simple test handler
	srv.Echo.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	srv.Echo.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	tests := []struct {
		header   string
		expected string
	}{
		{"X-Frame-Options", "DENY"},
		{"X-Content-Type-Options", "nosniff"},
		{"Referrer-Policy", "strict-origin-when-cross-origin"},
		{"Strict-Transport-Security", "max-age=31536000; includeSubDomains"},
		{"Permissions-Policy", "camera=(), microphone=(), geolocation=()"},
	}

	for _, tt := range tests {
		got := rec.Header().Get(tt.header)
		if got != tt.expected {
			t.Errorf("header %s: expected %q, got %q", tt.header, tt.expected, got)
		}
	}
}

func TestCORSWildcardDisablesCredentials(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		AllowedOrigins: []string{"*"},
	}
	srv := New(cfg)

	srv.Echo.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "http://example.com")
	rec := httptest.NewRecorder()
	srv.Echo.ServeHTTP(rec, req)

	// When origin is wildcard, credentials should not be set to true
	credHeader := rec.Header().Get("Access-Control-Allow-Credentials")
	if credHeader == "true" {
		t.Error("wildcard origin should not allow credentials")
	}
}
