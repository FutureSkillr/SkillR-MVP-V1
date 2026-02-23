package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	internalredis "skillr-mvp-v1/backend/internal/redis"
)

func TestRateLimit_AllowsWithinLimit(t *testing.T) {
	rl := internalredis.NewRateLimiter(nil) // in-memory fallback
	mw := RateLimit(rl, "test-allow", 5, time.Minute)

	e := echo.New()
	handler := mw(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	for i := 0; i < 5; i++ {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "10.0.0.1:1234"
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if err := handler(c); err != nil {
			t.Fatalf("request %d: unexpected error: %v", i+1, err)
		}
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rec.Code)
		}
		if rec.Header().Get("X-RateLimit-Limit") != "5" {
			t.Fatalf("request %d: expected X-RateLimit-Limit=5, got %s", i+1, rec.Header().Get("X-RateLimit-Limit"))
		}
	}
}

func TestRateLimit_BlocksOverLimit(t *testing.T) {
	rl := internalredis.NewRateLimiter(nil) // in-memory fallback
	mw := RateLimit(rl, "test-block", 2, time.Minute)

	e := echo.New()
	handler := mw(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	// Exhaust the limit
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "10.0.0.2:1234"
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		_ = handler(c)
	}

	// 3rd request should be blocked
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.2:1234"
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler(c)
	if err == nil {
		t.Fatal("expected error for rate-limited request")
	}

	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", he.Code)
	}
}

func TestRateLimit_DifferentIPsAreIndependent(t *testing.T) {
	rl := internalredis.NewRateLimiter(nil)
	mw := RateLimit(rl, "test-ip", 1, time.Minute)

	e := echo.New()
	handler := mw(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	// IP 1 — should pass
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.3:1234"
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	if err := handler(c); err != nil {
		t.Fatalf("IP1 request 1: unexpected error: %v", err)
	}

	// IP 2 — should also pass (different key)
	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	req2.RemoteAddr = "10.0.0.4:1234"
	rec2 := httptest.NewRecorder()
	c2 := e.NewContext(req2, rec2)
	if err := handler(c2); err != nil {
		t.Fatalf("IP2 request 1: unexpected error: %v", err)
	}
}
