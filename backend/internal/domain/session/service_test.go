package session

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"
)

// mockRepo implements Repository for testing
type mockRepo struct {
	sessions map[uuid.UUID]*Session
}

func newMockRepo() *mockRepo {
	return &mockRepo{sessions: make(map[uuid.UUID]*Session)}
}

func (m *mockRepo) Create(ctx context.Context, s *Session) error {
	m.sessions[s.ID] = s
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Session, error) {
	s, ok := m.sessions[id]
	if !ok {
		return nil, echo_notfound()
	}
	if s.UserID != userID {
		return nil, echo_notfound()
	}
	return s, nil
}

func (m *mockRepo) GetDetailedByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*SessionDetailed, error) {
	s, err := m.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	return &SessionDetailed{Session: *s}, nil
}

func (m *mockRepo) List(ctx context.Context, params ListParams) ([]Session, int, error) {
	var result []Session
	for _, s := range m.sessions {
		if s.UserID == params.UserID {
			result = append(result, *s)
		}
	}
	return result, len(result), nil
}

func (m *mockRepo) Update(ctx context.Context, s *Session) error {
	m.sessions[s.ID] = s
	return nil
}

func (m *mockRepo) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	delete(m.sessions, id)
	return nil
}

func echo_notfound() error {
	return fmt.Errorf("not found")
}

func TestService_Create(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	userID := uuid.New()
	req := CreateSessionRequest{
		SessionType: "onboarding",
	}

	sess, err := svc.Create(context.Background(), userID, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if sess.SessionType != "onboarding" {
		t.Errorf("expected session type onboarding, got %s", sess.SessionType)
	}
	if sess.UserID != userID {
		t.Errorf("expected user ID %s, got %s", userID, sess.UserID)
	}
	if sess.StartedAt.IsZero() {
		t.Error("expected non-zero started_at")
	}
}

func TestService_List(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	userID := uuid.New()
	_, _ = svc.Create(context.Background(), userID, CreateSessionRequest{SessionType: "onboarding"})
	_, _ = svc.Create(context.Background(), userID, CreateSessionRequest{SessionType: "vuca-journey"})

	sessions, total, err := svc.List(context.Background(), ListParams{UserID: userID, Limit: 20})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 2 {
		t.Errorf("expected 2 sessions, got %d", total)
	}
	if len(sessions) != 2 {
		t.Errorf("expected 2 sessions, got %d", len(sessions))
	}
}
