package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"skillr-mvp-v1/backend/internal/firebase"
)

func TestFirebaseAuth_MissingHeader(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := FirebaseAuth(nil)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Fatal("expected error for missing auth header")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestFirebaseAuth_InvalidFormat(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Basic abc123")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := FirebaseAuth(nil)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Fatal("expected error for invalid format")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestApplyAdminOverride(t *testing.T) {
	SetAdminEmails([]string{"admin@example.com", "boss@example.com"})
	defer SetAdminEmails(nil)

	tests := []struct {
		name     string
		email    string
		initRole string
		wantRole string
	}{
		{"admin email gets promoted", "admin@example.com", "user", "admin"},
		{"case insensitive match", "Admin@Example.COM", "user", "admin"},
		{"non-admin stays user", "nobody@example.com", "user", "user"},
		{"already admin stays admin", "admin@example.com", "admin", "admin"},
		{"empty email unchanged", "", "user", "user"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			info := &firebase.UserInfo{Email: tt.email, Role: tt.initRole}
			applyAdminOverride(info)
			if info.Role != tt.wantRole {
				t.Errorf("got role %q, want %q", info.Role, tt.wantRole)
			}
		})
	}
}

func TestApplyAdminOverride_Nil(t *testing.T) {
	SetAdminEmails([]string{"admin@example.com"})
	defer SetAdminEmails(nil)
	// Should not panic
	applyAdminOverride(nil)
}
