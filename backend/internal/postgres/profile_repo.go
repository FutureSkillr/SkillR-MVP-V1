package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/FutureSkillr/MVP72/backend/internal/domain/profile"
)

type ProfileRepository struct {
	pool *pgxpool.Pool
}

func NewProfileRepository(pool *pgxpool.Pool) *ProfileRepository {
	return &ProfileRepository{pool: pool}
}

func (r *ProfileRepository) GetLatest(ctx context.Context, userID uuid.UUID) (*profile.SkillProfile, error) {
	p := &profile.SkillProfile{}
	var categoriesJSON, summaryJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, skill_categories, top_interests, top_strengths, completeness, evidence_summary, last_computed_at, created_at
		 FROM skill_profiles WHERE user_id = $1 ORDER BY last_computed_at DESC LIMIT 1`,
		userID,
	).Scan(&p.ID, &p.UserID, &categoriesJSON, &p.TopInterests, &p.TopStrengths, &p.Completeness, &summaryJSON, &p.LastComputedAt, &p.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("no profile found")
		}
		return nil, fmt.Errorf("get profile: %w", err)
	}
	_ = json.Unmarshal(categoriesJSON, &p.SkillCategories)
	if summaryJSON != nil {
		var s profile.EvidenceSummary
		_ = json.Unmarshal(summaryJSON, &s)
		p.EvidenceSummary = &s
	}
	return p, nil
}

func (r *ProfileRepository) Create(ctx context.Context, p *profile.SkillProfile) error {
	categoriesJSON, _ := json.Marshal(p.SkillCategories)
	summaryJSON, _ := json.Marshal(p.EvidenceSummary)

	_, err := r.pool.Exec(ctx,
		`INSERT INTO skill_profiles (id, user_id, skill_categories, top_interests, top_strengths, completeness, evidence_summary, last_computed_at, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		p.ID, p.UserID, categoriesJSON, p.TopInterests, p.TopStrengths, p.Completeness, summaryJSON, p.LastComputedAt, p.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert profile: %w", err)
	}
	return nil
}

func (r *ProfileRepository) GetHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]profile.SkillProfile, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM skill_profiles WHERE user_id = $1`, userID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count profiles: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, skill_categories, top_interests, top_strengths, completeness, evidence_summary, last_computed_at, created_at
		 FROM skill_profiles WHERE user_id = $1 ORDER BY last_computed_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list profiles: %w", err)
	}
	defer rows.Close()

	var profiles []profile.SkillProfile
	for rows.Next() {
		var p profile.SkillProfile
		var categoriesJSON, summaryJSON []byte
		if err := rows.Scan(&p.ID, &p.UserID, &categoriesJSON, &p.TopInterests, &p.TopStrengths, &p.Completeness, &summaryJSON, &p.LastComputedAt, &p.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan profile: %w", err)
		}
		_ = json.Unmarshal(categoriesJSON, &p.SkillCategories)
		if summaryJSON != nil {
			var s profile.EvidenceSummary
			_ = json.Unmarshal(summaryJSON, &s)
			p.EvidenceSummary = &s
		}
		profiles = append(profiles, p)
	}
	return profiles, total, nil
}

func (r *ProfileRepository) GetPublic(ctx context.Context, userID uuid.UUID) (*profile.PublicProfile, error) {
	p, err := r.GetLatest(ctx, userID)
	if err != nil {
		return nil, err
	}

	var displayName string
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(display_name, '') FROM users WHERE id = $1`, userID).Scan(&displayName)

	var endorsementCount int
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM endorsements WHERE learner_id = $1 AND visible = true`, userID).Scan(&endorsementCount)

	return &profile.PublicProfile{
		UserID:           p.UserID,
		DisplayName:      displayName,
		SkillCategories:  p.SkillCategories,
		TopInterests:     p.TopInterests,
		TopStrengths:     p.TopStrengths,
		Completeness:     p.Completeness,
		EndorsementCount: endorsementCount,
	}, nil
}
