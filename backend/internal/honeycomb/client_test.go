package honeycomb

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestListCourses(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/honeycomb/ctx123/list" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.Header.Get("X-API-KEY") != "test-key" {
			t.Errorf("missing or wrong API key: %s", r.Header.Get("X-API-KEY"))
		}
		if r.Method != http.MethodGet {
			t.Errorf("expected GET, got %s", r.Method)
		}
		resp := listResponse{
			Items: []ListEntry{
				{ID: "course1", Name: "Marketing 101", Description: "Learn marketing"},
				{ID: "course2", Name: "Sales 101", Description: "Learn sales"},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	courses, err := client.ListCourses(context.Background(), "ctx123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(courses) != 2 {
		t.Fatalf("expected 2 courses, got %d", len(courses))
	}
	if courses[0].ID != "course1" {
		t.Errorf("expected course1, got %s", courses[0].ID)
	}
	if courses[1].Name != "Sales 101" {
		t.Errorf("expected Sales 101, got %s", courses[1].Name)
	}
}

func TestGetCourseData(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/honeycomb/ctx123/data/course1" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		data := CourseData{
			ID:        "course1",
			Name:      "Marketing 101",
			ProgressP: 50,
			Progress:  "5/10",
			Modules: []Module{
				{
					ID:   "mod1",
					Name: "Module 1",
					Tasks: []ModuleTask{
						{ID: "task1", State: "open", Name: "Task 1"},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	data, err := client.GetCourseData(context.Background(), "ctx123", "course1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if data.ID != "course1" {
		t.Errorf("expected course1, got %s", data.ID)
	}
	if data.ProgressP != 50 {
		t.Errorf("expected progress 50, got %d", data.ProgressP)
	}
	if len(data.Modules) != 1 {
		t.Fatalf("expected 1 module, got %d", len(data.Modules))
	}
	if len(data.Modules[0].Tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(data.Modules[0].Tasks))
	}
}

func TestSubmitTask(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/honeycomb/ctx123/data/course1/mod1/task1/submit" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		data := CourseData{
			ID:        "course1",
			Name:      "Marketing 101",
			ProgressP: 60,
			Progress:  "6/10",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	data, err := client.SubmitTask(context.Background(), "ctx123", "course1", "mod1", "task1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if data.ProgressP != 60 {
		t.Errorf("expected progress 60, got %d", data.ProgressP)
	}
}

func TestGetModified(t *testing.T) {
	expected := time.Date(2026, 2, 21, 10, 0, 0, 0, time.UTC)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/honeycomb/ctx123/course/course1/modified" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		resp := modifiedResponse{Modified: expected}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	modified, err := client.GetModified(context.Background(), "ctx123", "course1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !modified.Equal(expected) {
		t.Errorf("expected %v, got %v", expected, modified)
	}
}

func TestPing(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound) // Any response means reachable
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	if err := client.Ping(context.Background()); err != nil {
		t.Fatalf("expected ping to succeed, got: %v", err)
	}
}

func TestListCourses_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"internal"}`))
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	_, err := client.ListCourses(context.Background(), "ctx123")
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
}

func TestSubmitTask_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte(`{"error":"forbidden"}`))
	}))
	defer srv.Close()

	client := NewHTTPClient(srv.URL, "test-key")
	_, err := client.SubmitTask(context.Background(), "ctx123", "c1", "m1", "t1")
	if err == nil {
		t.Fatal("expected error for 403 response")
	}
}
