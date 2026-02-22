package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/FutureSkillr/MVP72/backend/internal/domain/reflection"
)

type ReflectionRepository struct {
	pool *pgxpool.Pool
}

func NewReflectionRepository(pool *pgxpool.Pool) *ReflectionRepository {
	return &ReflectionRepository{pool: pool}
}

func (r *ReflectionRepository) Create(ctx context.Context, ref *reflection.ReflectionResult) error {
	scoresJSON, err := json.Marshal(ref.CapabilityScores)
	if err != nil {
		return fmt.Errorf("marshal capability scores: %w", err)
	}

	_, err = r.pool.Exec(ctx,
		`INSERT INTO reflections (id, user_id, station_id, question_id, response, response_time_ms, capability_scores, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		ref.ID, ref.UserID, ref.StationID, ref.QuestionID, ref.Response, ref.ResponseTimeMs, scoresJSON, ref.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert reflection: %w", err)
	}
	return nil
}

func (r *ReflectionRepository) List(ctx context.Context, params reflection.ListParams) ([]reflection.ReflectionResult, int, error) {
	query := `SELECT id, user_id, station_id, question_id, response, response_time_ms, capability_scores, created_at FROM reflections WHERE user_id = $1`
	countQuery := `SELECT COUNT(*) FROM reflections WHERE user_id = $1`
	args := []interface{}{params.UserID}
	argIdx := 2

	if params.StationID != nil {
		query += fmt.Sprintf(" AND station_id = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND station_id = $%d", argIdx)
		args = append(args, *params.StationID)
		argIdx++
	}

	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count reflections: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list reflections: %w", err)
	}
	defer rows.Close()

	var results []reflection.ReflectionResult
	for rows.Next() {
		var ref reflection.ReflectionResult
		var scoresJSON []byte
		if err := rows.Scan(&ref.ID, &ref.UserID, &ref.StationID, &ref.QuestionID, &ref.Response, &ref.ResponseTimeMs, &scoresJSON, &ref.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan reflection: %w", err)
		}
		_ = json.Unmarshal(scoresJSON, &ref.CapabilityScores)
		results = append(results, ref)
	}

	return results, total, nil
}

func (r *ReflectionRepository) GetAggregatedCapabilities(ctx context.Context, userID uuid.UUID) (*reflection.CapabilityScores, error) {
	var scores reflection.CapabilityScores
	err := r.pool.QueryRow(ctx,
		`SELECT
			COALESCE(AVG((capability_scores->>'analytical_depth')::numeric), 0),
			COALESCE(AVG((capability_scores->>'creativity')::numeric), 0),
			COALESCE(AVG((capability_scores->>'confidence')::numeric), 0),
			COALESCE(AVG((capability_scores->>'resilience')::numeric), 0),
			COALESCE(AVG((capability_scores->>'self_awareness')::numeric), 0)
		 FROM reflections WHERE user_id = $1`,
		userID,
	).Scan(&scores.AnalyticalDepth, &scores.Creativity, &scores.Confidence, &scores.Resilience, &scores.SelfAwareness)
	if err != nil {
		return nil, fmt.Errorf("aggregate capabilities: %w", err)
	}
	return &scores, nil
}
