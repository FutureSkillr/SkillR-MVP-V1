package portfolio

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"
)

// mockRepo implements Repository for testing.
type mockRepo struct {
	entries []PortfolioEntry
	err     error
}

func (m *mockRepo) List(_ context.Context, userID uuid.UUID) ([]PortfolioEntry, error) {
	if m.err != nil {
		return nil, m.err
	}
	var result []PortfolioEntry
	for _, e := range m.entries {
		if e.UserID == userID {
			result = append(result, e)
		}
	}
	return result, nil
}

func (m *mockRepo) ListPublic(_ context.Context, userID uuid.UUID) ([]PortfolioEntry, error) {
	if m.err != nil {
		return nil, m.err
	}
	var result []PortfolioEntry
	for _, e := range m.entries {
		if e.UserID == userID && e.Visibility == "public" {
			result = append(result, e)
		}
	}
	return result, nil
}

func (m *mockRepo) Create(_ context.Context, e *PortfolioEntry) error {
	if m.err != nil {
		return m.err
	}
	m.entries = append(m.entries, *e)
	return nil
}

func (m *mockRepo) Update(_ context.Context, e *PortfolioEntry) error {
	if m.err != nil {
		return m.err
	}
	for i, existing := range m.entries {
		if existing.ID == e.ID {
			m.entries[i] = *e
			return nil
		}
	}
	return fmt.Errorf("not found")
}

func (m *mockRepo) Delete(_ context.Context, id, userID uuid.UUID) error {
	if m.err != nil {
		return m.err
	}
	for i, e := range m.entries {
		if e.ID == id && e.UserID == userID {
			m.entries = append(m.entries[:i], m.entries[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("not found")
}

func (m *mockRepo) Count(_ context.Context, userID uuid.UUID) (int, error) {
	if m.err != nil {
		return 0, m.err
	}
	count := 0
	for _, e := range m.entries {
		if e.UserID == userID {
			count++
		}
	}
	return count, nil
}

func TestService_Create(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	repo := &mockRepo{}
	svc := NewService(repo)

	req := CreateEntryRequest{
		Title:      "Test Entry",
		Category:   "project",
		Visibility: "public",
		Tags:       []string{"go", "test"},
	}

	entry, err := svc.Create(ctx, userID, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if entry.Title != "Test Entry" {
		t.Errorf("expected title 'Test Entry', got %q", entry.Title)
	}
	if entry.UserID != userID {
		t.Errorf("expected userID %v, got %v", userID, entry.UserID)
	}
	if len(repo.entries) != 1 {
		t.Errorf("expected 1 entry in repo, got %d", len(repo.entries))
	}
}

func TestService_Create_MaxEntries(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	repo := &mockRepo{}
	svc := NewService(repo)

	// Fill to max
	for i := 0; i < MaxEntriesPerUser; i++ {
		repo.entries = append(repo.entries, PortfolioEntry{
			ID:     uuid.New(),
			UserID: userID,
		})
	}

	_, err := svc.Create(ctx, userID, CreateEntryRequest{
		Title:      "One Too Many",
		Category:   "project",
		Visibility: "public",
	})
	if err == nil {
		t.Fatal("expected error for exceeding max entries")
	}
}

func TestService_Create_ValidationError(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	svc := NewService(&mockRepo{})

	_, err := svc.Create(ctx, userID, CreateEntryRequest{
		Title:    "",
		Category: "project",
	})
	if err == nil {
		t.Fatal("expected validation error for empty title")
	}
}

func TestService_Delete(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	entryID := uuid.New()
	repo := &mockRepo{
		entries: []PortfolioEntry{
			{ID: entryID, UserID: userID, Title: "To Delete"},
		},
	}
	svc := NewService(repo)

	err := svc.Delete(ctx, userID, entryID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repo.entries) != 0 {
		t.Errorf("expected 0 entries after delete, got %d", len(repo.entries))
	}
}

func TestService_CreateDemo(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	repo := &mockRepo{}
	svc := NewService(repo)

	entries, err := svc.CreateDemo(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 3 {
		t.Errorf("expected 3 demo entries, got %d", len(entries))
	}
	if len(repo.entries) != 3 {
		t.Errorf("expected 3 entries in repo, got %d", len(repo.entries))
	}
}

func TestService_PublicPage(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	repo := &mockRepo{
		entries: []PortfolioEntry{
			{ID: uuid.New(), UserID: userID, Title: "Public", Visibility: "public"},
			{ID: uuid.New(), UserID: userID, Title: "Private", Visibility: "private"},
		},
	}
	svc := NewService(repo)

	page, err := svc.PublicPage(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(page.Entries) != 1 {
		t.Errorf("expected 1 public entry, got %d", len(page.Entries))
	}
	if page.Entries[0].Title != "Public" {
		t.Errorf("expected 'Public', got %q", page.Entries[0].Title)
	}
}

func TestService_NilRepo(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	svc := NewService(nil)

	_, err := svc.List(ctx, userID)
	if err == nil {
		t.Fatal("expected error for nil repo")
	}
}

func TestService_Update(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	entryID := uuid.New()
	repo := &mockRepo{
		entries: []PortfolioEntry{
			{ID: entryID, UserID: userID, Title: "Original", Category: "project", Visibility: "public", Tags: []string{}},
		},
	}
	svc := NewService(repo)

	updated, err := svc.Update(ctx, userID, entryID, CreateEntryRequest{
		Title:      "Updated",
		Category:   "deliverable",
		Visibility: "private",
		Tags:       []string{"new"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Title != "Updated" {
		t.Errorf("expected 'Updated', got %q", updated.Title)
	}
	if updated.Category != "deliverable" {
		t.Errorf("expected 'deliverable', got %q", updated.Category)
	}
}
