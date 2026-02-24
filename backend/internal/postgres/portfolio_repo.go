package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"skillr-mvp-v1/backend/internal/domain/portfolio"
)

// PortfolioRepository implements portfolio.Repository using PostgreSQL.
type PortfolioRepository struct {
	pool *pgxpool.Pool
}

// NewPortfolioRepository creates a new repository backed by the given pool.
func NewPortfolioRepository(pool *pgxpool.Pool) *PortfolioRepository {
	return &PortfolioRepository{pool: pool}
}

func (r *PortfolioRepository) List(ctx context.Context, userID uuid.UUID) ([]portfolio.PortfolioEntry, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, description, category, visibility, tags, created_at, updated_at
		 FROM learner_portfolio_entries WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list portfolio entries: %w", err)
	}
	defer rows.Close()

	var entries []portfolio.PortfolioEntry
	for rows.Next() {
		var e portfolio.PortfolioEntry
		if err := rows.Scan(&e.ID, &e.UserID, &e.Title, &e.Description, &e.Category, &e.Visibility, &e.Tags, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan portfolio entry: %w", err)
		}
		if e.Tags == nil {
			e.Tags = []string{}
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func (r *PortfolioRepository) ListPublic(ctx context.Context, userID uuid.UUID) ([]portfolio.PortfolioEntry, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, description, category, visibility, tags, created_at, updated_at
		 FROM learner_portfolio_entries WHERE user_id = $1 AND visibility = 'public' ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list public portfolio entries: %w", err)
	}
	defer rows.Close()

	var entries []portfolio.PortfolioEntry
	for rows.Next() {
		var e portfolio.PortfolioEntry
		if err := rows.Scan(&e.ID, &e.UserID, &e.Title, &e.Description, &e.Category, &e.Visibility, &e.Tags, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan portfolio entry: %w", err)
		}
		if e.Tags == nil {
			e.Tags = []string{}
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func (r *PortfolioRepository) Create(ctx context.Context, e *portfolio.PortfolioEntry) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO learner_portfolio_entries (id, user_id, title, description, category, visibility, tags, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		e.ID, e.UserID, e.Title, e.Description, e.Category, e.Visibility, e.Tags, e.CreatedAt, e.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert portfolio entry: %w", err)
	}
	return nil
}

func (r *PortfolioRepository) Update(ctx context.Context, e *portfolio.PortfolioEntry) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE learner_portfolio_entries SET title = $1, description = $2, category = $3, visibility = $4, tags = $5, updated_at = $6
		 WHERE id = $7 AND user_id = $8`,
		e.Title, e.Description, e.Category, e.Visibility, e.Tags, e.UpdatedAt, e.ID, e.UserID,
	)
	if err != nil {
		return fmt.Errorf("update portfolio entry: %w", err)
	}
	return nil
}

func (r *PortfolioRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM learner_portfolio_entries WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete portfolio entry: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("portfolio entry not found")
	}
	return nil
}

func (r *PortfolioRepository) Count(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM learner_portfolio_entries WHERE user_id = $1`,
		userID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count portfolio entries: %w", err)
	}
	return count, nil
}
