package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/FutureSkillr/MVP72/backend/internal/domain/artifact"
)

type ArtifactRepository struct {
	pool *pgxpool.Pool
}

func NewArtifactRepository(pool *pgxpool.Pool) *ArtifactRepository {
	return &ArtifactRepository{pool: pool}
}

func (r *ArtifactRepository) Create(ctx context.Context, a *artifact.ExternalArtifact) error {
	dimJSON, _ := json.Marshal(a.SkillDimensions)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO external_artifacts (id, learner_id, artifact_type, description, skill_dimensions, storage_ref, endorsement_ids, uploaded_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		a.ID, a.LearnerID, a.ArtifactType, a.Description, dimJSON, a.StorageRef, a.EndorsementIDs, a.UploadedAt,
	)
	if err != nil {
		return fmt.Errorf("insert artifact: %w", err)
	}
	return nil
}

func (r *ArtifactRepository) GetByID(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*artifact.ExternalArtifact, error) {
	a := &artifact.ExternalArtifact{}
	var dimJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, learner_id, artifact_type, description, skill_dimensions, storage_ref, endorsement_ids, uploaded_at
		 FROM external_artifacts WHERE id = $1 AND learner_id = $2`,
		id, learnerID,
	).Scan(&a.ID, &a.LearnerID, &a.ArtifactType, &a.Description, &dimJSON, &a.StorageRef, &a.EndorsementIDs, &a.UploadedAt)
	if err != nil {
		return nil, fmt.Errorf("get artifact: %w", err)
	}
	_ = json.Unmarshal(dimJSON, &a.SkillDimensions)
	return a, nil
}

func (r *ArtifactRepository) GetDetailedByID(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) (*artifact.ExternalArtifactDetailed, error) {
	a, err := r.GetByID(ctx, id, learnerID)
	if err != nil {
		return nil, err
	}
	return &artifact.ExternalArtifactDetailed{ExternalArtifact: *a}, nil
}

func (r *ArtifactRepository) List(ctx context.Context, learnerID uuid.UUID, artifactType *string, limit, offset int) ([]artifact.ExternalArtifact, int, error) {
	query := `SELECT id, learner_id, artifact_type, description, skill_dimensions, storage_ref, endorsement_ids, uploaded_at FROM external_artifacts WHERE learner_id = $1`
	countQuery := `SELECT COUNT(*) FROM external_artifacts WHERE learner_id = $1`
	args := []interface{}{learnerID}
	argIdx := 2

	if artifactType != nil {
		query += fmt.Sprintf(" AND artifact_type = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND artifact_type = $%d", argIdx)
		args = append(args, *artifactType)
		argIdx++
	}

	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count artifacts: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY uploaded_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list artifacts: %w", err)
	}
	defer rows.Close()

	var artifacts []artifact.ExternalArtifact
	for rows.Next() {
		var a artifact.ExternalArtifact
		var dimJSON []byte
		if err := rows.Scan(&a.ID, &a.LearnerID, &a.ArtifactType, &a.Description, &dimJSON, &a.StorageRef, &a.EndorsementIDs, &a.UploadedAt); err != nil {
			return nil, 0, fmt.Errorf("scan artifact: %w", err)
		}
		_ = json.Unmarshal(dimJSON, &a.SkillDimensions)
		artifacts = append(artifacts, a)
	}
	return artifacts, total, nil
}

func (r *ArtifactRepository) Delete(ctx context.Context, id uuid.UUID, learnerID uuid.UUID) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM external_artifacts WHERE id = $1 AND learner_id = $2`,
		id, learnerID,
	)
	if err != nil {
		return fmt.Errorf("delete artifact: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("artifact not found")
	}
	return nil
}

func (r *ArtifactRepository) LinkEndorsement(ctx context.Context, id uuid.UUID, learnerID uuid.UUID, endorsementID uuid.UUID) (*artifact.ExternalArtifactDetailed, error) {
	_, err := r.pool.Exec(ctx,
		`UPDATE external_artifacts SET endorsement_ids = array_append(endorsement_ids, $1) WHERE id = $2 AND learner_id = $3`,
		endorsementID, id, learnerID,
	)
	if err != nil {
		return nil, fmt.Errorf("link endorsement: %w", err)
	}
	return r.GetDetailedByID(ctx, id, learnerID)
}
