package reflection

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

type mockRepo struct {
	reflections map[uuid.UUID]*ReflectionResult
}

func newMockRepo() *mockRepo {
	return &mockRepo{reflections: make(map[uuid.UUID]*ReflectionResult)}
}

func (m *mockRepo) Create(ctx context.Context, r *ReflectionResult) error {
	m.reflections[r.ID] = r
	return nil
}

func (m *mockRepo) List(ctx context.Context, params ListParams) ([]ReflectionResult, int, error) {
	var result []ReflectionResult
	for _, r := range m.reflections {
		if r.UserID == params.UserID {
			result = append(result, *r)
		}
	}
	return result, len(result), nil
}

func (m *mockRepo) GetAggregatedCapabilities(ctx context.Context, userID uuid.UUID) (*CapabilityScores, error) {
	var total CapabilityScores
	count := 0
	for _, r := range m.reflections {
		if r.UserID == userID {
			total.AnalyticalDepth += r.CapabilityScores.AnalyticalDepth
			total.Creativity += r.CapabilityScores.Creativity
			total.Confidence += r.CapabilityScores.Confidence
			total.Resilience += r.CapabilityScores.Resilience
			total.SelfAwareness += r.CapabilityScores.SelfAwareness
			count++
		}
	}
	if count == 0 {
		return &CapabilityScores{}, nil
	}
	n := float64(count)
	return &CapabilityScores{
		AnalyticalDepth: total.AnalyticalDepth / n,
		Creativity:      total.Creativity / n,
		Confidence:      total.Confidence / n,
		Resilience:      total.Resilience / n,
		SelfAwareness:   total.SelfAwareness / n,
	}, nil
}

func TestService_Submit(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	userID := uuid.New()
	req := CreateReflectionRequest{
		StationID:      "station-v1",
		QuestionID:     "q1",
		Response:       "I learned about change",
		ResponseTimeMs: 5000,
	}

	result, err := svc.Submit(context.Background(), userID, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.StationID != "station-v1" {
		t.Errorf("expected station-v1, got %s", result.StationID)
	}
	if result.CapabilityScores.AnalyticalDepth != 50 {
		t.Errorf("expected stub score 50, got %f", result.CapabilityScores.AnalyticalDepth)
	}
}

func TestService_Submit_Validation(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	_, err := svc.Submit(context.Background(), uuid.New(), CreateReflectionRequest{})
	if err == nil {
		t.Fatal("expected validation error for empty request")
	}
}

func TestService_Capabilities(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	userID := uuid.New()
	_, _ = svc.Submit(context.Background(), userID, CreateReflectionRequest{
		StationID:      "station-v1",
		QuestionID:     "q1",
		Response:       "test",
		ResponseTimeMs: 1000,
	})

	scores, err := svc.Capabilities(context.Background(), userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if scores.AnalyticalDepth != 50 {
		t.Errorf("expected 50, got %f", scores.AnalyticalDepth)
	}
}
