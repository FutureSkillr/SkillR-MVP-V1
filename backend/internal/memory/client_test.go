package memory

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRegisterUser(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/user/access" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.Header.Get("X-API-KEY") != "test-key" {
			t.Errorf("missing or wrong API key: %s", r.Header.Get("X-API-KEY"))
		}
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("expected application/json, got %s", r.Header.Get("Content-Type"))
		}

		var req accessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if req.UID != "firebase-uid-123" {
			t.Errorf("expected firebase-uid-123, got %s", req.UID)
		}
		if req.GivenName != "Max" {
			t.Errorf("expected Max, got %s", req.GivenName)
		}
		if req.FamilyName != "Mustermann" {
			t.Errorf("expected Mustermann, got %s", req.FamilyName)
		}
		if req.Email != "max@example.com" {
			t.Errorf("expected max@example.com, got %s", req.Email)
		}
		if !req.EmailValid {
			t.Error("expected email_valid true")
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(accessResponse{
			CtxID: "ctx-abc-123",
			Tier:  "free",
		})
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	ctxID, err := client.RegisterUser(context.Background(), "firebase-uid-123", "Max", "Mustermann", "max@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ctxID != "ctx-abc-123" {
		t.Errorf("expected ctx-abc-123, got %s", ctxID)
	}
}

func TestRegisterUser_EmptyEmail(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req accessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if req.EmailValid {
			t.Error("expected email_valid false when email is empty")
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(accessResponse{CtxID: "ctx-456"})
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	ctxID, err := client.RegisterUser(context.Background(), "uid-1", "Anna", "Schmidt", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ctxID != "ctx-456" {
		t.Errorf("expected ctx-456, got %s", ctxID)
	}
}

func TestRegisterUser_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"error":"forbidden"}`))
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	_, err := client.RegisterUser(context.Background(), "uid-1", "Max", "M", "m@x.com")
	if err == nil {
		t.Fatal("expected error for 403 response")
	}
}

func TestRegisterUser_EmptyCtxID(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(accessResponse{CtxID: ""})
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	_, err := client.RegisterUser(context.Background(), "uid-1", "Max", "M", "m@x.com")
	if err == nil {
		t.Fatal("expected error for empty ctx_id")
	}
}

func TestPing(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest) // Any response means reachable
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	if err := client.Ping(context.Background()); err != nil {
		t.Fatalf("expected ping to succeed, got: %v", err)
	}
}
