package gateway

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestLFSProxyHandler_Produce_ForwardsHeaders(t *testing.T) {
	// Mock upstream LFS-Proxy server
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify headers were forwarded
		if r.Header.Get("X-Kafka-Topic") != "test-topic" {
			t.Error("expected X-Kafka-Topic to be forwarded")
		}
		if r.Header.Get("X-Kafka-Key") != "dGVzdC1rZXk=" {
			t.Error("expected X-Kafka-Key to be forwarded")
		}
		if r.Header.Get("X-LFS-Size") != "1024" {
			t.Error("expected X-LFS-Size to be forwarded")
		}
		if r.Header.Get("X-LFS-Mode") != "single" {
			t.Error("expected X-LFS-Mode to be forwarded")
		}
		if r.Header.Get("Content-Type") != "video/mp4" {
			t.Error("expected Content-Type to be forwarded")
		}

		// Read body
		body, _ := io.ReadAll(r.Body)
		if string(body) != "file-content" {
			t.Errorf("expected body 'file-content', got '%s'", string(body))
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"bucket":"test","key":"path/file.mp4"}`))
	}))
	defer upstream.Close()

	handler := NewLFSProxyHandler(upstream.URL)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/lfs/produce", strings.NewReader("file-content"))
	req.Header.Set("X-Kafka-Topic", "test-topic")
	req.Header.Set("X-Kafka-Key", "dGVzdC1rZXk=")
	req.Header.Set("X-LFS-Size", "1024")
	req.Header.Set("X-LFS-Mode", "single")
	req.Header.Set("Content-Type", "video/mp4")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler.Produce(c)
	if err != nil {
		t.Fatalf("Produce returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"bucket":"test"`) {
		t.Errorf("expected JSON response, got: %s", rec.Body.String())
	}
}

func TestLFSProxyHandler_Produce_Upstream5xx(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		_, _ = w.Write([]byte(`{"error":"upstream failed"}`))
	}))
	defer upstream.Close()

	handler := NewLFSProxyHandler(upstream.URL)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/lfs/produce", strings.NewReader("data"))
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler.Produce(c)
	if err != nil {
		t.Fatalf("Produce returned error: %v", err)
	}

	// The handler forwards the upstream status code
	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected status 502, got %d", rec.Code)
	}
}

func TestLFSProxyHandler_Produce_UpstreamDown(t *testing.T) {
	// Use a URL that won't connect
	handler := NewLFSProxyHandler("http://127.0.0.1:1")
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/lfs/produce", strings.NewReader("data"))
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler.Produce(c)
	if err == nil {
		t.Fatal("expected error for unreachable upstream")
	}

	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadGateway {
		t.Errorf("expected 502 Bad Gateway, got %d", he.Code)
	}
}
