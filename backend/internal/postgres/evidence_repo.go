package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"skillr-mvp-v1/backend/internal/domain/evidence"
)

type EvidenceRepository struct {
	pool *pgxpool.Pool
}

func NewEvidenceRepository(pool *pgxpool.Pool) *EvidenceRepository {
	return &EvidenceRepository{pool: pool}
}

func (r *EvidenceRepository) Create(ctx context.Context, e *evidence.PortfolioEntry) error {
	dimJSON, _ := json.Marshal(e.SkillDimensions)
	ctxJSON, _ := json.Marshal(e.Context)

	_, err := r.pool.Exec(ctx,
		`INSERT INTO portfolio_entries (id, user_id, source_interaction_ids, skill_dimensions, evidence_type, summary, confidence, context, verification_token, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		e.ID, e.UserID, e.SourceInteractionIDs, dimJSON, e.EvidenceType, e.Summary, e.Confidence, ctxJSON, e.VerificationToken, e.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert evidence: %w", err)
	}
	return nil
}

func (r *EvidenceRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*evidence.PortfolioEntry, error) {
	e := &evidence.PortfolioEntry{}
	var dimJSON, ctxJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, source_interaction_ids, skill_dimensions, evidence_type, summary, confidence, context, created_at
		 FROM portfolio_entries WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&e.ID, &e.UserID, &e.SourceInteractionIDs, &dimJSON, &e.EvidenceType, &e.Summary, &e.Confidence, &ctxJSON, &e.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get evidence: %w", err)
	}
	_ = json.Unmarshal(dimJSON, &e.SkillDimensions)
	_ = json.Unmarshal(ctxJSON, &e.Context)
	return e, nil
}

func (r *EvidenceRepository) GetDetailedByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*evidence.PortfolioEntryDetailed, error) {
	e, err := r.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	return &evidence.PortfolioEntryDetailed{PortfolioEntry: *e}, nil
}

func (r *EvidenceRepository) List(ctx context.Context, params evidence.ListParams) ([]evidence.PortfolioEntry, int, error) {
	query := `SELECT id, user_id, source_interaction_ids, skill_dimensions, evidence_type, summary, confidence, context, created_at FROM portfolio_entries WHERE user_id = $1`
	countQuery := `SELECT COUNT(*) FROM portfolio_entries WHERE user_id = $1`
	args := []interface{}{params.UserID}
	argIdx := 2

	if params.EvidenceType != nil {
		query += fmt.Sprintf(" AND evidence_type = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND evidence_type = $%d", argIdx)
		args = append(args, *params.EvidenceType)
		argIdx++
	}

	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count evidence: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list evidence: %w", err)
	}
	defer rows.Close()

	var entries []evidence.PortfolioEntry
	for rows.Next() {
		var e evidence.PortfolioEntry
		var dimJSON, ctxJSON []byte
		if err := rows.Scan(&e.ID, &e.UserID, &e.SourceInteractionIDs, &dimJSON, &e.EvidenceType, &e.Summary, &e.Confidence, &ctxJSON, &e.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan evidence: %w", err)
		}
		_ = json.Unmarshal(dimJSON, &e.SkillDimensions)
		_ = json.Unmarshal(ctxJSON, &e.Context)
		entries = append(entries, e)
	}
	return entries, total, nil
}

func (r *EvidenceRepository) ListByDimension(ctx context.Context, userID uuid.UUID, dimension string) ([]evidence.PortfolioEntry, int, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, source_interaction_ids, skill_dimensions, evidence_type, summary, confidence, context, created_at
		 FROM portfolio_entries WHERE user_id = $1 AND skill_dimensions ? $2 ORDER BY created_at DESC`,
		userID, dimension,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list by dimension: %w", err)
	}
	defer rows.Close()

	var entries []evidence.PortfolioEntry
	for rows.Next() {
		var e evidence.PortfolioEntry
		var dimJSON, ctxJSON []byte
		if err := rows.Scan(&e.ID, &e.UserID, &e.SourceInteractionIDs, &dimJSON, &e.EvidenceType, &e.Summary, &e.Confidence, &ctxJSON, &e.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan evidence: %w", err)
		}
		_ = json.Unmarshal(dimJSON, &e.SkillDimensions)
		_ = json.Unmarshal(ctxJSON, &e.Context)
		entries = append(entries, e)
	}
	return entries, len(entries), nil
}

func (r *EvidenceRepository) GetByVerificationToken(ctx context.Context, id uuid.UUID, token string) (*evidence.PortfolioEntry, error) {
	e := &evidence.PortfolioEntry{}
	var dimJSON, ctxJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, source_interaction_ids, skill_dimensions, evidence_type, summary, confidence, context, created_at
		 FROM portfolio_entries WHERE id = $1 AND verification_token = $2`,
		id, token,
	).Scan(&e.ID, &e.UserID, &e.SourceInteractionIDs, &dimJSON, &e.EvidenceType, &e.Summary, &e.Confidence, &ctxJSON, &e.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("verify evidence: %w", err)
	}
	_ = json.Unmarshal(dimJSON, &e.SkillDimensions)
	_ = json.Unmarshal(ctxJSON, &e.Context)
	return e, nil
}
