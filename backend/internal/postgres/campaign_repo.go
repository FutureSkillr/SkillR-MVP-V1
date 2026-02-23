package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Campaign struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Platform    string     `json:"platform"`
	UTMSource   string     `json:"utm_source"`
	UTMMedium   string     `json:"utm_medium"`
	UTMCampaign string     `json:"utm_campaign"`
	UTMContent  *string    `json:"utm_content,omitempty"`
	UTMTerm     *string    `json:"utm_term,omitempty"`
	MetaPixelID *string    `json:"meta_pixel_id,omitempty"`
	BudgetCents *int       `json:"budget_cents,omitempty"`
	Currency    string     `json:"currency"`
	StartDate   *time.Time `json:"start_date,omitempty"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	Status      string     `json:"status"`
	Notes       *string    `json:"notes,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CreatedBy   *string    `json:"created_by,omitempty"`
}

type CampaignRepository struct {
	pool *pgxpool.Pool
}

func NewCampaignRepository(pool *pgxpool.Pool) *CampaignRepository {
	return &CampaignRepository{pool: pool}
}

func (r *CampaignRepository) List(ctx context.Context) ([]Campaign, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, platform, utm_source, utm_medium, utm_campaign,
		        utm_content, utm_term, meta_pixel_id, budget_cents, currency,
		        start_date, end_date, status, notes, created_at, updated_at, created_by
		 FROM campaigns ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []Campaign
	for rows.Next() {
		var c Campaign
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Platform, &c.UTMSource, &c.UTMMedium, &c.UTMCampaign,
			&c.UTMContent, &c.UTMTerm, &c.MetaPixelID, &c.BudgetCents, &c.Currency,
			&c.StartDate, &c.EndDate, &c.Status, &c.Notes, &c.CreatedAt, &c.UpdatedAt, &c.CreatedBy,
		); err != nil {
			return nil, fmt.Errorf("scan campaign row: %w", err)
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, rows.Err()
}

func (r *CampaignRepository) GetByID(ctx context.Context, id string) (*Campaign, error) {
	c := &Campaign{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, platform, utm_source, utm_medium, utm_campaign,
		        utm_content, utm_term, meta_pixel_id, budget_cents, currency,
		        start_date, end_date, status, notes, created_at, updated_at, created_by
		 FROM campaigns WHERE id = $1`,
		id,
	).Scan(
		&c.ID, &c.Name, &c.Platform, &c.UTMSource, &c.UTMMedium, &c.UTMCampaign,
		&c.UTMContent, &c.UTMTerm, &c.MetaPixelID, &c.BudgetCents, &c.Currency,
		&c.StartDate, &c.EndDate, &c.Status, &c.Notes, &c.CreatedAt, &c.UpdatedAt, &c.CreatedBy,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get campaign by id: %w", err)
	}
	return c, nil
}

func (r *CampaignRepository) Create(ctx context.Context, c *Campaign) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO campaigns (id, name, platform, utm_source, utm_medium, utm_campaign,
		        utm_content, utm_term, meta_pixel_id, budget_cents, currency,
		        start_date, end_date, status, notes, created_at, updated_at, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16, $17)`,
		c.ID, c.Name, c.Platform, c.UTMSource, c.UTMMedium, c.UTMCampaign,
		c.UTMContent, c.UTMTerm, c.MetaPixelID, c.BudgetCents, c.Currency,
		c.StartDate, c.EndDate, c.Status, c.Notes, now, c.CreatedBy,
	)
	if err != nil {
		return fmt.Errorf("create campaign: %w", err)
	}
	return nil
}

func (r *CampaignRepository) Update(ctx context.Context, id string, fields map[string]interface{}) error {
	// Use COALESCE pattern for fields that should keep existing value when nil
	tag, err := r.pool.Exec(ctx,
		`UPDATE campaigns SET
			name         = COALESCE($1, name),
			platform     = COALESCE($2, platform),
			utm_source   = COALESCE($3, utm_source),
			utm_medium   = COALESCE($4, utm_medium),
			utm_campaign = COALESCE($5, utm_campaign),
			utm_content  = $6,
			utm_term     = $7,
			meta_pixel_id = $8,
			budget_cents = $9,
			currency     = COALESCE($10, currency),
			start_date   = $11,
			end_date     = $12,
			status       = COALESCE($13, status),
			notes        = $14,
			updated_at   = NOW()
		 WHERE id = $15`,
		nilStr(fields, "name"),
		nilStr(fields, "platform"),
		nilStr(fields, "utm_source"),
		nilStr(fields, "utm_medium"),
		nilStr(fields, "utm_campaign"),
		nilStrPtr(fields, "utm_content"),
		nilStrPtr(fields, "utm_term"),
		nilStrPtr(fields, "meta_pixel_id"),
		nilInt(fields, "budget_cents"),
		nilStr(fields, "currency"),
		nilStrPtr(fields, "start_date"),
		nilStrPtr(fields, "end_date"),
		nilStr(fields, "status"),
		nilStrPtr(fields, "notes"),
		id,
	)
	if err != nil {
		return fmt.Errorf("update campaign: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("campaign not found: %s", id)
	}
	return nil
}

func (r *CampaignRepository) Archive(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE campaigns SET status = 'archived', updated_at = NOW() WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("archive campaign: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("campaign not found: %s", id)
	}
	return nil
}

type CampaignStats struct {
	Visitors            int                  `json:"visitors"`
	Registrations       int                  `json:"registrations"`
	Funnel              []CampaignFunnelStep `json:"funnel"`
	CostPerVisitor      *string              `json:"costPerVisitor"`
	CostPerRegistration *string              `json:"costPerRegistration"`
}

type CampaignFunnelStep struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

func (r *CampaignRepository) Stats(ctx context.Context, utmCampaign string, budgetCents *int) (*CampaignStats, error) {
	// Count unique sessions
	var visitors int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT browser_session_id) FROM user_events
		 WHERE properties->>'utm_campaign' = $1`,
		utmCampaign,
	).Scan(&visitors)
	if err != nil {
		return nil, fmt.Errorf("campaign stats visitors: %w", err)
	}

	// Count registrations
	var registrations int
	err = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM user_events
		 WHERE properties->>'utm_campaign' = $1
		   AND event_type = 'page_view'
		   AND properties->>'from_view' = 'login'
		   AND properties->>'to_view' = 'landing'`,
		utmCampaign,
	).Scan(&registrations)
	if err != nil {
		return nil, fmt.Errorf("campaign stats registrations: %w", err)
	}

	// Funnel
	rows, err := r.pool.Query(ctx,
		`SELECT event_type, COUNT(*) as count FROM user_events
		 WHERE properties->>'utm_campaign' = $1
		 GROUP BY event_type ORDER BY count DESC`,
		utmCampaign,
	)
	if err != nil {
		return nil, fmt.Errorf("campaign stats funnel: %w", err)
	}
	defer rows.Close()

	var funnel []CampaignFunnelStep
	for rows.Next() {
		var step CampaignFunnelStep
		if err := rows.Scan(&step.Label, &step.Count); err != nil {
			return nil, fmt.Errorf("scan funnel row: %w", err)
		}
		funnel = append(funnel, step)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("funnel rows: %w", err)
	}
	if funnel == nil {
		funnel = []CampaignFunnelStep{}
	}

	stats := &CampaignStats{
		Visitors:      visitors,
		Registrations: registrations,
		Funnel:        funnel,
	}

	if budgetCents != nil && *budgetCents > 0 {
		budget := float64(*budgetCents) / 100.0
		if visitors > 0 {
			v := fmt.Sprintf("%.2f", budget/float64(visitors))
			stats.CostPerVisitor = &v
		}
		if registrations > 0 {
			v := fmt.Sprintf("%.2f", budget/float64(registrations))
			stats.CostPerRegistration = &v
		}
	}

	return stats, nil
}

// Helper functions for extracting nullable values from a map
func nilStr(m map[string]interface{}, key string) *string {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	s, ok := v.(string)
	if !ok {
		return nil
	}
	return &s
}

func nilStrPtr(m map[string]interface{}, key string) *string {
	v, ok := m[key]
	if !ok {
		return nil
	}
	if v == nil {
		return nil
	}
	s, ok := v.(string)
	if !ok {
		return nil
	}
	return &s
}

func nilInt(m map[string]interface{}, key string) *int {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	switch n := v.(type) {
	case float64:
		i := int(n)
		return &i
	case int:
		return &n
	default:
		return nil
	}
}
