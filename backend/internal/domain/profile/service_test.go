package profile

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"
)

type mockRepo struct {
	profiles map[uuid.UUID]*SkillProfile
}

func newMockRepo() *mockRepo {
	return &mockRepo{profiles: make(map[uuid.UUID]*SkillProfile)}
}

func (m *mockRepo) GetLatest(ctx context.Context, userID uuid.UUID) (*SkillProfile, error) {
	p, ok := m.profiles[userID]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	return p, nil
}

func (m *mockRepo) Create(ctx context.Context, p *SkillProfile) error {
	m.profiles[p.UserID] = p
	return nil
}

func (m *mockRepo) GetHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]SkillProfile, int, error) {
	p, ok := m.profiles[userID]
	if !ok {
		return nil, 0, nil
	}
	return []SkillProfile{*p}, 1, nil
}

func (m *mockRepo) GetPublic(ctx context.Context, userID uuid.UUID) (*PublicProfile, error) {
	return nil, fmt.Errorf("not found")
}

func TestService_Compute(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)
	userID := uuid.New()

	profile, err := svc.Compute(context.Background(), userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(profile.SkillCategories) != 4 {
		t.Errorf("expected 4 categories, got %d", len(profile.SkillCategories))
	}
	if profile.UserID != userID {
		t.Errorf("expected user ID %s, got %s", userID, profile.UserID)
	}
}

func TestService_GetAfterCompute(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)
	userID := uuid.New()

	_, _ = svc.Compute(context.Background(), userID)

	profile, err := svc.Get(context.Background(), userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if profile.UserID != userID {
		t.Errorf("expected user ID %s, got %s", userID, profile.UserID)
	}
}
