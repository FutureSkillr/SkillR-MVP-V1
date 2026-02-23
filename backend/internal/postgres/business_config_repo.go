package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type BusinessConfigRepository struct {
	pool *pgxpool.Pool
}

func NewBusinessConfigRepository(pool *pgxpool.Pool) *BusinessConfigRepository {
	return &BusinessConfigRepository{pool: pool}
}

func (r *BusinessConfigRepository) GetAll(ctx context.Context) (map[string]string, error) {
	rows, err := r.pool.Query(ctx, `SELECT key, value FROM business_config`)
	if err != nil {
		return nil, fmt.Errorf("query business_config: %w", err)
	}
	defer rows.Close()

	result := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, fmt.Errorf("scan business_config row: %w", err)
		}
		result[k] = v
	}
	return result, rows.Err()
}

func (r *BusinessConfigRepository) Upsert(ctx context.Context, key, value, updatedBy string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO business_config (key, value, updated_at, updated_by)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by`,
		key, value, time.Now(), updatedBy,
	)
	if err != nil {
		return fmt.Errorf("upsert business_config: %w", err)
	}
	return nil
}
