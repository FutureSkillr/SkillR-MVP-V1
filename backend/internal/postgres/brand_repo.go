package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BrandConfig struct {
	Slug      string          `json:"slug"`
	Config    json.RawMessage `json:"config"`
	IsActive  bool            `json:"isActive"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
	UpdatedBy *string         `json:"updatedBy,omitempty"`
}

type BrandRepository struct {
	pool *pgxpool.Pool
}

func NewBrandRepository(pool *pgxpool.Pool) *BrandRepository {
	return &BrandRepository{pool: pool}
}

func (r *BrandRepository) GetBySlug(ctx context.Context, slug string) (*BrandConfig, error) {
	b := &BrandConfig{}
	err := r.pool.QueryRow(ctx,
		`SELECT slug, config, is_active, created_at, updated_at, updated_by
		 FROM brand_configs WHERE slug = $1 AND is_active = true`,
		slug,
	).Scan(&b.Slug, &b.Config, &b.IsActive, &b.CreatedAt, &b.UpdatedAt, &b.UpdatedBy)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get brand by slug: %w", err)
	}
	return b, nil
}

func (r *BrandRepository) List(ctx context.Context) ([]BrandConfig, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT slug, config, is_active, created_at, updated_at, updated_by
		 FROM brand_configs ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list brands: %w", err)
	}
	defer rows.Close()

	var brands []BrandConfig
	for rows.Next() {
		var b BrandConfig
		if err := rows.Scan(&b.Slug, &b.Config, &b.IsActive, &b.CreatedAt, &b.UpdatedAt, &b.UpdatedBy); err != nil {
			return nil, fmt.Errorf("scan brand row: %w", err)
		}
		brands = append(brands, b)
	}
	return brands, rows.Err()
}

func (r *BrandRepository) Create(ctx context.Context, slug string, config json.RawMessage, updatedBy string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO brand_configs (slug, config, is_active, created_at, updated_at, updated_by)
		 VALUES ($1, $2, true, $3, $3, $4)`,
		slug, config, now, updatedBy,
	)
	if err != nil {
		return fmt.Errorf("create brand: %w", err)
	}
	return nil
}

func (r *BrandRepository) Update(ctx context.Context, slug string, config json.RawMessage, updatedBy string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE brand_configs SET config = $1, updated_at = $2, updated_by = $3 WHERE slug = $4`,
		config, time.Now(), updatedBy, slug,
	)
	if err != nil {
		return fmt.Errorf("update brand: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("brand not found: %s", slug)
	}
	return nil
}

func (r *BrandRepository) Deactivate(ctx context.Context, slug, updatedBy string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE brand_configs SET is_active = false, updated_at = $1, updated_by = $2 WHERE slug = $3`,
		time.Now(), updatedBy, slug,
	)
	if err != nil {
		return fmt.Errorf("deactivate brand: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("brand not found: %s", slug)
	}
	return nil
}
