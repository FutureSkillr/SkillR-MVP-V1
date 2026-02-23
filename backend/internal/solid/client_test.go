package solid

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPing_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/.well-known/openid-configuration" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"issuer":"http://localhost:3000"}`))
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.Ping(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestPing_ServerDown(t *testing.T) {
	client := NewHTTPClient("http://localhost:1") // nothing listening
	err := client.Ping(context.Background())
	if err == nil {
		t.Fatal("expected error for unreachable server")
	}
}

func TestPutResource_Success(t *testing.T) {
	var gotBody string
	var gotContentType string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			t.Errorf("expected PUT, got %s", r.Method)
		}
		gotContentType = r.Header.Get("Content-Type")
		buf := make([]byte, 1024)
		n, _ := r.Body.Read(buf)
		gotBody = string(buf[:n])
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	turtle := "<> a <http://example.org/Type> ."
	err := client.PutResource(context.Background(), "/test/resource", turtle)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotContentType != "text/turtle" {
		t.Errorf("expected text/turtle content type, got %s", gotContentType)
	}
	if gotBody != turtle {
		t.Errorf("expected body %q, got %q", turtle, gotBody)
	}
}

func TestPutResource_ResetContent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusResetContent)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.PutResource(context.Background(), "/test/resource", "data")
	if err != nil {
		t.Fatalf("expected 205 to be accepted, got error: %v", err)
	}
}

func TestPutResource_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte("internal error"))
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.PutResource(context.Background(), "/test", "data")
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
}

func TestGetResource_Success(t *testing.T) {
	expected := "<> a <http://example.org/Type> ."
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Errorf("expected GET, got %s", r.Method)
		}
		if r.Header.Get("Accept") != "text/turtle" {
			t.Errorf("expected Accept: text/turtle, got %s", r.Header.Get("Accept"))
		}
		w.Header().Set("Content-Type", "text/turtle")
		_, _ = w.Write([]byte(expected))
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	body, err := client.GetResource(context.Background(), "/test/resource")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if body != expected {
		t.Errorf("expected %q, got %q", expected, body)
	}
}

func TestGetResource_NotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	_, err := client.GetResource(context.Background(), "/missing")
	if err == nil {
		t.Fatal("expected error for 404 response")
	}
}

func TestCreateContainer_Success(t *testing.T) {
	var gotLinkHeader string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			t.Errorf("expected PUT, got %s", r.Method)
		}
		gotLinkHeader = r.Header.Get("Link")
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.CreateContainer(context.Background(), "/test/container")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotLinkHeader == "" {
		t.Error("expected Link header for container creation")
	}
}

func TestCreateContainer_ResetContent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusResetContent)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.CreateContainer(context.Background(), "/test/container")
	if err != nil {
		t.Fatalf("expected 205 to be accepted, got error: %v", err)
	}
}

func TestDeleteResource_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			t.Errorf("expected DELETE, got %s", r.Method)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.DeleteResource(context.Background(), "/test/resource")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteResource_NotFound_IsOK(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL)
	err := client.DeleteResource(context.Background(), "/missing")
	if err != nil {
		t.Fatalf("expected no error for 404 on delete, got: %v", err)
	}
}

func TestEnsureTrailingSlash(t *testing.T) {
	tests := []struct {
		input, want string
	}{
		{"/foo", "/foo/"},
		{"/foo/", "/foo/"},
		{"/", "/"},
	}
	for _, tt := range tests {
		got := ensureTrailingSlash(tt.input)
		if got != tt.want {
			t.Errorf("ensureTrailingSlash(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
