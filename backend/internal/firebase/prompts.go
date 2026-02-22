package firebase

import (
	"context"
	"fmt"
	"sync"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"

	"github.com/FutureSkillr/MVP72/backend/internal/model"
)

type PromptStore struct {
	fs    *firestore.Client
	cache map[string]*model.PromptTemplate
	mu    sync.RWMutex
	ttl   time.Duration
	lastRefresh time.Time
}

func NewPromptStore(fs *firestore.Client) *PromptStore {
	return &PromptStore{
		fs:    fs,
		cache: make(map[string]*model.PromptTemplate),
		ttl:   5 * time.Minute,
	}
}

func (s *PromptStore) collection() *firestore.CollectionRef {
	return s.fs.Collection("prompt_templates")
}

func (s *PromptStore) GetActivePrompt(ctx context.Context, promptID string) (*model.PromptTemplate, error) {
	s.mu.RLock()
	if p, ok := s.cache[promptID]; ok && time.Since(s.lastRefresh) < s.ttl {
		s.mu.RUnlock()
		return p, nil
	}
	s.mu.RUnlock()

	doc, err := s.collection().Doc(promptID).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("get prompt %s: %w", promptID, err)
	}

	var p model.PromptTemplate
	if err := doc.DataTo(&p); err != nil {
		return nil, fmt.Errorf("decode prompt: %w", err)
	}
	p.PromptID = doc.Ref.ID

	s.mu.Lock()
	s.cache[promptID] = &p
	s.lastRefresh = time.Now()
	s.mu.Unlock()

	return &p, nil
}

func (s *PromptStore) List(ctx context.Context, category *string, isActive *bool) ([]model.PromptTemplate, error) {
	q := s.collection().Query
	if category != nil {
		q = q.Where("category", "==", *category)
	}
	if isActive != nil {
		q = q.Where("is_active", "==", *isActive)
	}

	iter := q.Documents(ctx)
	defer iter.Stop()

	var prompts []model.PromptTemplate
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("iterate prompts: %w", err)
		}

		var p model.PromptTemplate
		if err := doc.DataTo(&p); err != nil {
			continue
		}
		p.PromptID = doc.Ref.ID
		prompts = append(prompts, p)
	}
	return prompts, nil
}

func (s *PromptStore) Get(ctx context.Context, promptID string) (*model.PromptTemplate, error) {
	doc, err := s.collection().Doc(promptID).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("get prompt %s: %w", promptID, err)
	}

	var p model.PromptTemplate
	if err := doc.DataTo(&p); err != nil {
		return nil, fmt.Errorf("decode prompt: %w", err)
	}
	p.PromptID = doc.Ref.ID
	return &p, nil
}

func (s *PromptStore) Update(ctx context.Context, promptID string, updates map[string]interface{}) (*model.PromptTemplate, error) {
	// Auto-increment version
	doc, err := s.collection().Doc(promptID).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("get prompt for update: %w", err)
	}

	var current model.PromptTemplate
	if err := doc.DataTo(&current); err != nil {
		return nil, fmt.Errorf("decode current prompt: %w", err)
	}

	updates["version"] = current.Version + 1
	updates["updated_at"] = time.Now().UTC()

	_, err = s.collection().Doc(promptID).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, fmt.Errorf("update prompt: %w", err)
	}

	// Invalidate cache
	s.mu.Lock()
	delete(s.cache, promptID)
	s.mu.Unlock()

	return s.Get(ctx, promptID)
}

func (s *PromptStore) InvalidateCache() {
	s.mu.Lock()
	s.cache = make(map[string]*model.PromptTemplate)
	s.mu.Unlock()
}
