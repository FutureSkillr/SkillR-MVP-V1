package portfolio

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Service contains the business logic for portfolio entries.
type Service struct {
	repo Repository
	db   *pgxpool.Pool
}

// NewService creates a Service with the given repository (may be nil).
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// SetRepo replaces the repository (used for lazy DB injection after startup).
func (s *Service) SetRepo(repo Repository) {
	s.repo = repo
}

// SetDB sets the database pool for user resolution queries.
func (s *Service) SetDB(db *pgxpool.Pool) {
	s.db = db
}

// ResolveUserID converts a middleware UID (Firebase UID or local auth UUID) into
// the users.id UUID. Firebase UIDs are looked up via the firebase_uid column.
// For local auth users the UID is already a valid UUID and is returned directly.
func (s *Service) ResolveUserID(ctx context.Context, uid, email, displayName string) (uuid.UUID, error) {
	// If uid is already a valid UUID, it's a local auth user — use directly.
	if parsed, err := uuid.Parse(uid); err == nil {
		return parsed, nil
	}

	// Firebase UID — need DB to resolve
	if s.db == nil {
		return uuid.Nil, fmt.Errorf("database not available for user resolution")
	}

	// Look up by firebase_uid column
	var userID uuid.UUID
	err := s.db.QueryRow(ctx,
		`SELECT id FROM users WHERE firebase_uid=$1`, uid,
	).Scan(&userID)
	if err == nil {
		log.Printf("[portfolio] ResolveUserID: firebase_uid=%s -> id=%s", uid, userID)
		return userID, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, fmt.Errorf("resolve user: %w", err)
	}

	// No row with this firebase_uid — check if email already exists
	if email != "" {
		err = s.db.QueryRow(ctx,
			`SELECT id FROM users WHERE email=$1`, email,
		).Scan(&userID)
		if err == nil {
			log.Printf("[portfolio] ResolveUserID: linking firebase_uid=%s to existing user=%s (email=%s)", uid, userID, email)
			_, _ = s.db.Exec(ctx,
				`UPDATE users SET firebase_uid=$1 WHERE id=$2 AND firebase_uid IS NULL`,
				uid, userID,
			)
			return userID, nil
		}
	}

	// No users row — auto-provision
	log.Printf("[portfolio] ResolveUserID: auto-provisioning user for firebase_uid=%s email=%s", uid, email)
	err = s.db.QueryRow(ctx,
		`INSERT INTO users (firebase_uid, email, display_name, auth_provider)
		 VALUES ($1, $2, $3, 'google'::auth_provider)
		 RETURNING id`,
		uid, email, displayName,
	).Scan(&userID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("auto-provision user: %w", err)
	}
	return userID, nil
}

// List returns all entries for the authenticated user.
func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]PortfolioEntry, error) {
	if s.repo == nil {
		return nil, fmt.Errorf("database not available")
	}
	return s.repo.List(ctx, userID)
}

// Create validates and persists a new portfolio entry.
func (s *Service) Create(ctx context.Context, userID uuid.UUID, req CreateEntryRequest) (*PortfolioEntry, error) {
	if s.repo == nil {
		return nil, fmt.Errorf("database not available")
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}

	count, err := s.repo.Count(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("count entries: %w", err)
	}
	if count >= MaxEntriesPerUser {
		return nil, fmt.Errorf("maximum of %d portfolio entries reached", MaxEntriesPerUser)
	}

	now := time.Now().UTC()
	entry := &PortfolioEntry{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Visibility:  req.Visibility,
		Tags:        req.Tags,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if entry.Tags == nil {
		entry.Tags = []string{}
	}

	if err := s.repo.Create(ctx, entry); err != nil {
		return nil, fmt.Errorf("create entry: %w", err)
	}
	return entry, nil
}

// Update validates and persists changes to an existing entry.
func (s *Service) Update(ctx context.Context, userID uuid.UUID, entryID uuid.UUID, req CreateEntryRequest) (*PortfolioEntry, error) {
	if s.repo == nil {
		return nil, fmt.Errorf("database not available")
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Fetch existing entries to find the one being updated
	entries, err := s.repo.List(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list entries: %w", err)
	}

	var found *PortfolioEntry
	for i := range entries {
		if entries[i].ID == entryID {
			found = &entries[i]
			break
		}
	}
	if found == nil {
		return nil, fmt.Errorf("entry not found")
	}

	found.Title = req.Title
	found.Description = req.Description
	found.Category = req.Category
	found.Visibility = req.Visibility
	found.Tags = req.Tags
	if found.Tags == nil {
		found.Tags = []string{}
	}
	found.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, found); err != nil {
		return nil, fmt.Errorf("update entry: %w", err)
	}
	return found, nil
}

// Delete removes a portfolio entry.
func (s *Service) Delete(ctx context.Context, userID uuid.UUID, entryID uuid.UUID) error {
	if s.repo == nil {
		return fmt.Errorf("database not available")
	}
	return s.repo.Delete(ctx, entryID, userID)
}

// CreateDemo inserts 3 hardcoded demo entries for the user.
func (s *Service) CreateDemo(ctx context.Context, userID uuid.UUID) ([]PortfolioEntry, error) {
	if s.repo == nil {
		return nil, fmt.Errorf("database not available")
	}

	demos := []CreateEntryRequest{
		{
			Title:       "Mein VUCA-Reise Projekt",
			Description: "Ein umfassendes Projekt, das meine Erfahrungen und Erkenntnisse aus der VUCA-Reise dokumentiert. Ich habe gelernt, mit Unsicherheit umzugehen und kreative Loesungen zu entwickeln.",
			Category:    "project",
			Visibility:  "public",
			Tags:        []string{"VUCA", "Reflexion", "Teamarbeit"},
		},
		{
			Title:       "Design-Thinking Workshop",
			Description: "Ergebnisse aus einem Design-Thinking Workshop, in dem wir innovative Loesungen fuer reale Probleme entwickelt haben.",
			Category:    "deliverable",
			Visibility:  "public",
			Tags:        []string{"Kreativitaet", "Problemloesung"},
		},
		{
			Title:       "Persoenliche Reflexionen",
			Description: "Meine persoenlichen Reflexionen und Erkenntnisse aus der Lernreise. Diese Eintraege sind nur fuer mich sichtbar.",
			Category:    "example",
			Visibility:  "private",
			Tags:        []string{"Reflexion", "Persoenlich"},
		},
	}

	var created []PortfolioEntry
	for _, req := range demos {
		entry, err := s.Create(ctx, userID, req)
		if err != nil {
			return created, fmt.Errorf("create demo entry: %w", err)
		}
		created = append(created, *entry)
	}
	return created, nil
}

// PublicPage returns the public portfolio for a given user ID.
func (s *Service) PublicPage(ctx context.Context, userID uuid.UUID) (*PublicPortfolio, error) {
	if s.repo == nil {
		return nil, fmt.Errorf("database not available")
	}

	entries, err := s.repo.ListPublic(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list public entries: %w", err)
	}
	if entries == nil {
		entries = []PortfolioEntry{}
	}

	return &PublicPortfolio{
		UserID:      userID,
		DisplayName: "SkillR Learner",
		Entries:     entries,
	}, nil
}

// ExportHTML generates a self-contained HTML string of the portfolio.
func (s *Service) ExportHTML(ctx context.Context, userID uuid.UUID) (string, error) {
	if s.repo == nil {
		return "", fmt.Errorf("database not available")
	}

	entries, err := s.repo.List(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("list entries: %w", err)
	}
	if entries == nil {
		entries = []PortfolioEntry{}
	}

	return renderPortfolioHTML("SkillR Learner", entries, ""), nil
}

// ExportZIP generates a ZIP archive containing the portfolio HTML.
func (s *Service) ExportZIP(ctx context.Context, userID uuid.UUID) ([]byte, error) {
	html, err := s.ExportHTML(ctx, userID)
	if err != nil {
		return nil, err
	}
	return buildPortfolioZIP(html)
}
