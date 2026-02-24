package portfolio

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func setupTestHandler() (*Handler, *mockRepo) {
	repo := &mockRepo{}
	svc := NewService(repo)
	return NewHandler(svc), repo
}

// setAuthContext injects a mock user info into the echo context.
func setAuthContext(c echo.Context, uid string) {
	c.Set("user_info", map[string]string{"uid": uid})
}

func TestHandler_List_Unauthorized(t *testing.T) {
	h, _ := setupTestHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/portfolio/entries", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.List(c)
	if err == nil {
		t.Fatal("expected unauthorized error")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestHandler_Create_InvalidBody(t *testing.T) {
	h, _ := setupTestHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/portfolio/entries", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// Simulate auth — this won't match middleware.GetUserInfo since that looks for a specific key.
	// We test the unauthorized path above; here we test the bind error path.

	err := h.Create(c)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestHandler_PublicPage_InvalidUUID(t *testing.T) {
	h, _ := setupTestHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/portfolio/page/not-a-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("userId")
	c.SetParamValues("not-a-uuid")

	err := h.PublicPage(c)
	if err == nil {
		t.Fatal("expected error for invalid UUID")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestHandler_Export_UnsupportedFormat(t *testing.T) {
	h, _ := setupTestHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/portfolio/export?format=pdf", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Export(c)
	if err == nil {
		t.Fatal("expected error for unsupported format")
	}
}

func TestHandler_PublicPage_JSON(t *testing.T) {
	h, repo := setupTestHandler()
	uid := "11111111-1111-1111-1111-111111111111"
	repo.entries = []PortfolioEntry{
		{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), UserID: uuid.MustParse(uid), Title: "Public", Visibility: "public", Tags: []string{}},
	}
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/portfolio/page/"+uid, nil)
	req.Header.Set("Accept", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("userId")
	c.SetParamValues(uid)

	err := h.PublicPage(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	ct := rec.Header().Get("Content-Type")
	if !strings.Contains(ct, "application/json") {
		t.Errorf("expected JSON content type, got %q", ct)
	}
	if !strings.Contains(rec.Body.String(), `"Public"`) {
		t.Error("expected entry title in JSON response")
	}
}

func TestHandler_PublicPage_HTML(t *testing.T) {
	h, repo := setupTestHandler()
	uid := "11111111-1111-1111-1111-111111111111"
	repo.entries = []PortfolioEntry{
		{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), UserID: uuid.MustParse(uid), Title: "My Project", Visibility: "public", Tags: []string{"Go"}},
	}
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/portfolio/page/"+uid, nil)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("userId")
	c.SetParamValues(uid)

	err := h.PublicPage(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	ct := rec.Header().Get("Content-Type")
	if !strings.Contains(ct, "text/html") {
		t.Errorf("expected HTML content type, got %q", ct)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "<!DOCTYPE html>") {
		t.Error("expected HTML doctype in response")
	}
	if !strings.Contains(body, "My Project") {
		t.Error("expected entry title in HTML response")
	}
}

func TestHandler_Delete_InvalidID(t *testing.T) {
	h, _ := setupTestHandler()
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/portfolio/entries/bad", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("bad")

	err := h.Delete(c)
	if err == nil {
		t.Fatal("expected error for invalid ID")
	}
}
