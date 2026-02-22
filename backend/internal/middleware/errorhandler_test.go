package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestJSONErrorHandler_HTTPError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := echo.NewHTTPError(http.StatusNotFound, "resource not found")
	JSONErrorHandler(err, c)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}

	var resp map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp["error"] != "resource not found" {
		t.Errorf("expected 'resource not found', got %q", resp["error"])
	}
}

func TestJSONErrorHandler_InternalError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := echo.NewHTTPError(http.StatusInternalServerError, "db connection failed: sensitive details")
	JSONErrorHandler(err, c)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}

	var resp map[string]string
	if e := json.Unmarshal(rec.Body.Bytes(), &resp); e != nil {
		t.Fatalf("invalid JSON: %v", e)
	}
	// Should NOT leak the sensitive message
	if resp["error"] != "internal server error" {
		t.Errorf("expected generic message, got %q", resp["error"])
	}
}
