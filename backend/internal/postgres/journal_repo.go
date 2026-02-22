package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/FutureSkillr/MVP72/backend/internal/domain/journal"
)

type JournalRepository struct {
	pool *pgxpool.Pool
}

func NewJournalRepository(pool *pgxpool.Pool) *JournalRepository {
	return &JournalRepository{pool: pool}
}

func (r *JournalRepository) Create(ctx context.Context, i *journal.Interaction) error {
	timingJSON, _ := json.Marshal(i.Timing)
	ctxJSON, _ := json.Marshal(i.Context)

	_, err := r.pool.Exec(ctx,
		`INSERT INTO interactions (id, user_id, session_id, modality, user_input, assistant_response, timing, context, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		i.ID, i.UserID, i.SessionID, i.Modality, i.UserInput, i.AssistantResponse, timingJSON, ctxJSON, i.Timestamp,
	)
	if err != nil {
		return fmt.Errorf("insert interaction: %w", err)
	}
	return nil
}

func (r *JournalRepository) List(ctx context.Context, params journal.ListParams) ([]journal.Interaction, int, error) {
	query := `SELECT id, user_id, session_id, modality, user_input, assistant_response, timing, context, profile_impact, created_at FROM interactions WHERE user_id = $1`
	countQuery := `SELECT COUNT(*) FROM interactions WHERE user_id = $1`
	args := []interface{}{params.UserID}
	argIdx := 2

	if params.From != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		args = append(args, *params.From)
		argIdx++
	}
	if params.To != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		args = append(args, *params.To)
		argIdx++
	}

	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count interactions: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY created_at ASC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	return r.scanInteractions(ctx, query, args, total)
}

func (r *JournalRepository) ListByStation(ctx context.Context, userID uuid.UUID, stationID string) ([]journal.Interaction, int, error) {
	query := `SELECT id, user_id, session_id, modality, user_input, assistant_response, timing, context, profile_impact, created_at
		 FROM interactions WHERE user_id = $1 AND context->>'station_id' = $2 ORDER BY created_at ASC`
	return r.scanInteractions(ctx, query, []interface{}{userID, stationID}, 0)
}

func (r *JournalRepository) ListByDimension(ctx context.Context, userID uuid.UUID, dimension string) ([]journal.Interaction, int, error) {
	query := `SELECT id, user_id, session_id, modality, user_input, assistant_response, timing, context, profile_impact, created_at
		 FROM interactions WHERE user_id = $1 AND context->'vuca_dimensions' ? $2 ORDER BY created_at ASC`
	return r.scanInteractions(ctx, query, []interface{}{userID, dimension}, 0)
}

func (r *JournalRepository) scanInteractions(ctx context.Context, query string, args []interface{}, total int) ([]journal.Interaction, int, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query interactions: %w", err)
	}
	defer rows.Close()

	var interactions []journal.Interaction
	for rows.Next() {
		var i journal.Interaction
		var timingJSON, ctxJSON, impactJSON []byte
		if err := rows.Scan(&i.ID, &i.UserID, &i.SessionID, &i.Modality, &i.UserInput, &i.AssistantResponse, &timingJSON, &ctxJSON, &impactJSON, &i.Timestamp); err != nil {
			return nil, 0, fmt.Errorf("scan interaction: %w", err)
		}
		_ = json.Unmarshal(timingJSON, &i.Timing)
		_ = json.Unmarshal(ctxJSON, &i.Context)
		_ = json.Unmarshal(impactJSON, &i.ProfileImpact)
		interactions = append(interactions, i)
	}
	if total == 0 {
		total = len(interactions)
	}
	return interactions, total, nil
}
