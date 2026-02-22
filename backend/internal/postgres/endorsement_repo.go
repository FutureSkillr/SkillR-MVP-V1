package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"skillr-mvp-v1/backend/internal/domain/endorsement"
)

type EndorsementRepository struct {
	pool *pgxpool.Pool
}

func NewEndorsementRepository(pool *pgxpool.Pool) *EndorsementRepository {
	return &EndorsementRepository{pool: pool}
}

func (r *EndorsementRepository) Create(ctx context.Context, e *endorsement.Endorsement) error {
	dimJSON, _ := json.Marshal(e.SkillDimensions)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO endorsements (id, learner_id, endorser_id, endorser_name, endorser_role, endorser_verified, skill_dimensions, statement, context, artifact_refs, visible, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		e.ID, e.LearnerID, e.EndorserID, e.EndorserName, e.EndorserRole, e.EndorserVerified, dimJSON, e.Statement, e.Context, e.ArtifactRefs, e.Visible, e.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert endorsement: %w", err)
	}
	return nil
}

func (r *EndorsementRepository) List(ctx context.Context, learnerID uuid.UUID, limit, offset int) ([]endorsement.Endorsement, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM endorsements WHERE learner_id = $1`, learnerID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count endorsements: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, learner_id, endorser_id, endorser_name, endorser_role, endorser_verified, skill_dimensions, statement, context, artifact_refs, visible, created_at
		 FROM endorsements WHERE learner_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		learnerID, limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list endorsements: %w", err)
	}
	defer rows.Close()

	var endorsements []endorsement.Endorsement
	for rows.Next() {
		var e endorsement.Endorsement
		var dimJSON []byte
		if err := rows.Scan(&e.ID, &e.LearnerID, &e.EndorserID, &e.EndorserName, &e.EndorserRole, &e.EndorserVerified, &dimJSON, &e.Statement, &e.Context, &e.ArtifactRefs, &e.Visible, &e.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan endorsement: %w", err)
		}
		_ = json.Unmarshal(dimJSON, &e.SkillDimensions)
		endorsements = append(endorsements, e)
	}
	return endorsements, total, nil
}

func (r *EndorsementRepository) GetByID(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*endorsement.Endorsement, error) {
	e := &endorsement.Endorsement{}
	var dimJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, learner_id, endorser_id, endorser_name, endorser_role, endorser_verified, skill_dimensions, statement, context, artifact_refs, visible, created_at
		 FROM endorsements WHERE id = $1 AND learner_id = $2`,
		id, learnerID,
	).Scan(&e.ID, &e.LearnerID, &e.EndorserID, &e.EndorserName, &e.EndorserRole, &e.EndorserVerified, &dimJSON, &e.Statement, &e.Context, &e.ArtifactRefs, &e.Visible, &e.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get endorsement: %w", err)
	}
	_ = json.Unmarshal(dimJSON, &e.SkillDimensions)
	return e, nil
}

func (r *EndorsementRepository) UpdateVisibility(ctx context.Context, id uuid.UUID, learnerID uuid.UUID, visible bool) (*endorsement.Endorsement, error) {
	_, err := r.pool.Exec(ctx,
		`UPDATE endorsements SET visible = $1 WHERE id = $2 AND learner_id = $3`,
		visible, id, learnerID,
	)
	if err != nil {
		return nil, fmt.Errorf("update visibility: %w", err)
	}
	return r.GetByID(ctx, id, learnerID)
}

func (r *EndorsementRepository) CreateInvite(ctx context.Context, inv *endorsement.EndorsementInvite) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO endorsement_invites (id, learner_id, endorser_email, endorser_role, invitation_token, status, created_at, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		inv.ID, inv.LearnerID, inv.EndorserEmail, inv.EndorserRole, inv.InviteURL, inv.Status, inv.CreatedAt, inv.ExpiresAt,
	)
	if err != nil {
		return fmt.Errorf("insert invite: %w", err)
	}
	return nil
}

func (r *EndorsementRepository) GetInviteByToken(ctx context.Context, token string) (*endorsement.EndorsementInvite, error) {
	inv := &endorsement.EndorsementInvite{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, learner_id, endorser_email, endorser_role, status, created_at, expires_at
		 FROM endorsement_invites WHERE invitation_token = $1`,
		token,
	).Scan(&inv.ID, &inv.LearnerID, &inv.EndorserEmail, &inv.EndorserRole, &inv.Status, &inv.CreatedAt, &inv.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("get invite: %w", err)
	}
	return inv, nil
}

func (r *EndorsementRepository) ListPendingInvites(ctx context.Context, learnerID uuid.UUID) ([]endorsement.EndorsementInvite, int, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, learner_id, endorser_email, endorser_role, status, created_at, expires_at
		 FROM endorsement_invites WHERE learner_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
		learnerID,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list pending: %w", err)
	}
	defer rows.Close()

	var invites []endorsement.EndorsementInvite
	for rows.Next() {
		var inv endorsement.EndorsementInvite
		if err := rows.Scan(&inv.ID, &inv.LearnerID, &inv.EndorserEmail, &inv.EndorserRole, &inv.Status, &inv.CreatedAt, &inv.ExpiresAt); err != nil {
			return nil, 0, fmt.Errorf("scan invite: %w", err)
		}
		invites = append(invites, inv)
	}
	return invites, len(invites), nil
}

func (r *EndorsementRepository) MarkInviteCompleted(ctx context.Context, token string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE endorsement_invites SET status = 'completed' WHERE invitation_token = $1`,
		token,
	)
	return err
}
