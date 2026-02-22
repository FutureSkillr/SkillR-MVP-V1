package firebase

import (
	"context"
	"fmt"
	"sync"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"

	"skillr-mvp-v1/backend/internal/model"
)

type AgentStore struct {
	fs    *firestore.Client
	cache map[string]*model.AgentConfig
	mu    sync.RWMutex
	ttl   time.Duration
	lastRefresh time.Time
}

func NewAgentStore(fs *firestore.Client) *AgentStore {
	return &AgentStore{
		fs:    fs,
		cache: make(map[string]*model.AgentConfig),
		ttl:   5 * time.Minute,
	}
}

func (s *AgentStore) collection() *firestore.CollectionRef {
	return s.fs.Collection("agent_configs")
}

func (s *AgentStore) GetActiveAgent(ctx context.Context, agentID string) (*model.AgentConfig, error) {
	s.mu.RLock()
	if a, ok := s.cache[agentID]; ok && time.Since(s.lastRefresh) < s.ttl {
		s.mu.RUnlock()
		return a, nil
	}
	s.mu.RUnlock()

	doc, err := s.collection().Doc(agentID).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("get agent %s: %w", agentID, err)
	}

	var a model.AgentConfig
	if err := doc.DataTo(&a); err != nil {
		return nil, fmt.Errorf("decode agent: %w", err)
	}
	a.AgentID = doc.Ref.ID

	s.mu.Lock()
	s.cache[agentID] = &a
	s.lastRefresh = time.Now()
	s.mu.Unlock()

	return &a, nil
}

func (s *AgentStore) ListActiveAgents(ctx context.Context) ([]model.AgentConfig, error) {
	iter := s.collection().Where("is_active", "==", true).Documents(ctx)
	defer iter.Stop()

	var agents []model.AgentConfig
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("iterate agents: %w", err)
		}

		var a model.AgentConfig
		if err := doc.DataTo(&a); err != nil {
			continue
		}
		a.AgentID = doc.Ref.ID
		agents = append(agents, a)
	}
	return agents, nil
}

func (s *AgentStore) List(ctx context.Context) ([]model.AgentConfig, error) {
	iter := s.collection().Documents(ctx)
	defer iter.Stop()

	var agents []model.AgentConfig
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("iterate agents: %w", err)
		}

		var a model.AgentConfig
		if err := doc.DataTo(&a); err != nil {
			continue
		}
		a.AgentID = doc.Ref.ID
		agents = append(agents, a)
	}
	return agents, nil
}

func (s *AgentStore) Get(ctx context.Context, agentID string) (*model.AgentConfig, error) {
	doc, err := s.collection().Doc(agentID).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("get agent %s: %w", agentID, err)
	}

	var a model.AgentConfig
	if err := doc.DataTo(&a); err != nil {
		return nil, fmt.Errorf("decode agent: %w", err)
	}
	a.AgentID = doc.Ref.ID
	return &a, nil
}

func (s *AgentStore) Update(ctx context.Context, agentID string, updates map[string]interface{}) (*model.AgentConfig, error) {
	updates["updated_at"] = time.Now().UTC()

	_, err := s.collection().Doc(agentID).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, fmt.Errorf("update agent: %w", err)
	}

	// Invalidate cache
	s.mu.Lock()
	delete(s.cache, agentID)
	s.mu.Unlock()

	return s.Get(ctx, agentID)
}
