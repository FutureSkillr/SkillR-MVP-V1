package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/FutureSkillr/MVP72/backend/internal/domain/session"
)

type SessionRepository struct {
	pool *pgxpool.Pool
}

func NewSessionRepository(pool *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{pool: pool}
}

func (r *SessionRepository) Create(ctx context.Context, s *session.Session) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO sessions (id, user_id, session_type, journey_type, station_id, started_at, ended_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		s.ID, s.UserID, s.SessionType, s.JourneyType, s.StationID, s.StartedAt, s.EndedAt,
	)
	if err != nil {
		return fmt.Errorf("insert session: %w", err)
	}
	return nil
}

func (r *SessionRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*session.Session, error) {
	s := &session.Session{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, session_type, journey_type, station_id, started_at, ended_at
		 FROM sessions WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&s.ID, &s.UserID, &s.SessionType, &s.JourneyType, &s.StationID, &s.StartedAt, &s.EndedAt)
	if err != nil {
		return nil, fmt.Errorf("get session: %w", err)
	}
	return s, nil
}

func (r *SessionRepository) GetDetailedByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*session.SessionDetailed, error) {
	s, err := r.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, session_id, modality, user_input, assistant_response, timing, context, profile_impact, created_at
		 FROM interactions WHERE session_id = $1 ORDER BY created_at ASC`,
		id,
	)
	if err != nil {
		return nil, fmt.Errorf("query interactions: %w", err)
	}
	defer rows.Close()

	var interactions []session.Interaction
	for rows.Next() {
		var i session.Interaction
		var timingJSON, contextJSON, impactJSON []byte
		err := rows.Scan(&i.ID, &i.UserID, &i.SessionID, &i.Modality, &i.UserInput, &i.AssistantResponse,
			&timingJSON, &contextJSON, &impactJSON, &i.Timestamp)
		if err != nil {
			return nil, fmt.Errorf("scan interaction: %w", err)
		}
		_ = json.Unmarshal(timingJSON, &i.Timing)
		_ = json.Unmarshal(contextJSON, &i.Context)
		_ = json.Unmarshal(impactJSON, &i.ProfileImpact)
		interactions = append(interactions, i)
	}

	return &session.SessionDetailed{
		Session:          *s,
		Interactions:     interactions,
		InteractionCount: len(interactions),
	}, nil
}

func (r *SessionRepository) List(ctx context.Context, params session.ListParams) ([]session.Session, int, error) {
	// Build query with filters
	query := `SELECT id, user_id, session_type, journey_type, station_id, started_at, ended_at FROM sessions WHERE user_id = $1`
	countQuery := `SELECT COUNT(*) FROM sessions WHERE user_id = $1`
	args := []interface{}{params.UserID}
	argIdx := 2

	if params.JourneyType != nil {
		query += fmt.Sprintf(" AND journey_type = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND journey_type = $%d", argIdx)
		args = append(args, *params.JourneyType)
		argIdx++
	}
	if params.StationID != nil {
		query += fmt.Sprintf(" AND station_id = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND station_id = $%d", argIdx)
		args = append(args, *params.StationID)
		argIdx++
	}
	if params.From != nil {
		query += fmt.Sprintf(" AND started_at >= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND started_at >= $%d", argIdx)
		args = append(args, *params.From)
		argIdx++
	}
	if params.To != nil {
		query += fmt.Sprintf(" AND started_at <= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND started_at <= $%d", argIdx)
		args = append(args, *params.To)
		argIdx++
	}

	// Count
	var total int
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count sessions: %w", err)
	}

	// Paginated list
	query += fmt.Sprintf(" ORDER BY started_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list sessions: %w", err)
	}
	defer rows.Close()

	var sessions []session.Session
	for rows.Next() {
		var s session.Session
		if err := rows.Scan(&s.ID, &s.UserID, &s.SessionType, &s.JourneyType, &s.StationID, &s.StartedAt, &s.EndedAt); err != nil {
			return nil, 0, fmt.Errorf("scan session: %w", err)
		}
		sessions = append(sessions, s)
	}

	return sessions, total, nil
}

func (r *SessionRepository) Update(ctx context.Context, s *session.Session) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE sessions SET journey_type = $1, station_id = $2, ended_at = $3 WHERE id = $4 AND user_id = $5`,
		s.JourneyType, s.StationID, s.EndedAt, s.ID, s.UserID,
	)
	if err != nil {
		return fmt.Errorf("update session: %w", err)
	}
	return nil
}

func (r *SessionRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM sessions WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("session not found")
	}
	return nil
}
