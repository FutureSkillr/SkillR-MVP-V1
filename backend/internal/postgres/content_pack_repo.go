package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Lernreise represents a row in content_pack_lernreisen.
type Lernreise struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Subtitle      string    `json:"subtitle"`
	Description   string    `json:"description"`
	Icon          string    `json:"icon"`
	JourneyType   string    `json:"journeyType"`
	Location      string    `json:"location"`
	Lat           float64   `json:"lat"`
	Lng           float64   `json:"lng"`
	Setting       string    `json:"setting"`
	CharacterName string    `json:"characterName"`
	CharacterDesc string    `json:"characterDesc"`
	Dimensions    []string  `json:"dimensions"`
	SortOrder     int       `json:"sortOrder"`
	CreatedAt     time.Time `json:"createdAt"`
}

// ContentPackRepository provides read access to the content_pack_lernreisen table.
type ContentPackRepository struct {
	pool *pgxpool.Pool
}

// NewContentPackRepository creates a new repository with the given connection pool.
func NewContentPackRepository(pool *pgxpool.Pool) *ContentPackRepository {
	return &ContentPackRepository{pool: pool}
}

// ListLernreisen returns all Lernreisen ordered by sort_order.
func (r *ContentPackRepository) ListLernreisen(ctx context.Context) ([]Lernreise, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, subtitle, description, icon, journey_type, location, lat, lng,
		        setting, character_name, character_desc, dimensions, sort_order, created_at
		 FROM content_pack_lernreisen
		 ORDER BY sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("list lernreisen: %w", err)
	}
	defer rows.Close()

	var result []Lernreise
	for rows.Next() {
		var lr Lernreise
		var dimJSON string
		if err := rows.Scan(
			&lr.ID, &lr.Title, &lr.Subtitle, &lr.Description, &lr.Icon,
			&lr.JourneyType, &lr.Location, &lr.Lat, &lr.Lng,
			&lr.Setting, &lr.CharacterName, &lr.CharacterDesc,
			&dimJSON, &lr.SortOrder, &lr.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan lernreise row: %w", err)
		}
		if err := json.Unmarshal([]byte(dimJSON), &lr.Dimensions); err != nil {
			lr.Dimensions = []string{}
		}
		result = append(result, lr)
	}
	return result, rows.Err()
}
