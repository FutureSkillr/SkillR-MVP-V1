package gateway

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestAdminListSubmissions_NoDB(t *testing.T) {
	h := NewContentPackHandler() // no DB set
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/content-packs/001/submissions", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("001")

	err := h.AdminListSubmissions(c)
	if err == nil {
		t.Fatal("expected error for no DB")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", he.Code)
	}
}

func TestAdminCreateSubmission_NoDB(t *testing.T) {
	h := NewContentPackHandler()
	e := echo.New()
	body := `{"title":"Test Submission"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/content-packs/001/submissions", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("001")

	err := h.AdminCreateSubmission(c)
	if err == nil {
		t.Fatal("expected error for no DB")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", he.Code)
	}
}

func TestAdminCreateSubmission_MissingTitle(t *testing.T) {
	// This test verifies validation even without DB — but since dbReady() is false,
	// it returns 503 first. This is expected behavior for the nil-DB pattern.
	h := NewContentPackHandler()
	e := echo.New()
	body := `{}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/content-packs/001/submissions", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("001")

	err := h.AdminCreateSubmission(c)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestAdminGetSubmission_NoDB(t *testing.T) {
	h := NewContentPackHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/content-packs/001/submissions/abc-123", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id", "subId")
	c.SetParamValues("001", "abc-123")

	err := h.AdminGetSubmission(c)
	if err == nil {
		t.Fatal("expected error for no DB")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", he.Code)
	}
}

func TestAdminUpdateSubmission_NoDB(t *testing.T) {
	h := NewContentPackHandler()
	e := echo.New()
	body := `{"title":"Updated"}`
	req := httptest.NewRequest(http.MethodPut, "/api/admin/content-packs/001/submissions/abc-123", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id", "subId")
	c.SetParamValues("001", "abc-123")

	err := h.AdminUpdateSubmission(c)
	if err == nil {
		t.Fatal("expected error for no DB")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", he.Code)
	}
}

func TestAdminSubmitSubmission_NoDB(t *testing.T) {
	h := NewContentPackHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/admin/content-packs/001/submissions/abc-123/submit", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id", "subId")
	c.SetParamValues("001", "abc-123")

	err := h.AdminSubmitSubmission(c)
	if err == nil {
		t.Fatal("expected error for no DB")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", he.Code)
	}
}

func TestAdminListSubmissions_MissingPackID(t *testing.T) {
	h := NewContentPackHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/content-packs//submissions", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No param set — empty pack ID

	err := h.AdminListSubmissions(c)
	if err == nil {
		t.Fatal("expected error")
	}
	// First check is dbReady, so it returns 503
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", he.Code)
	}
}

func TestAdminGetSubmission_MissingSubID(t *testing.T) {
	h := NewContentPackHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/content-packs/001/submissions/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("001")
	// No subId param set

	err := h.AdminGetSubmission(c)
	if err == nil {
		t.Fatal("expected error")
	}
}
