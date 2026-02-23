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
	PackID        string    `json:"packId"`
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

// ContentPack represents a row in content_packs.
type ContentPack struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	Sponsor        string    `json:"sponsor,omitempty"`
	DefaultEnabled bool      `json:"defaultEnabled"`
	CreatedAt      time.Time `json:"createdAt"`
}

// BrandContentPack is a content pack with its activation status for a specific brand.
type BrandContentPack struct {
	ContentPack
	BrandActive bool `json:"brandActive"`
}

// ListLernreisen returns default Lernreisen ordered by sort_order.
func (r *ContentPackRepository) ListLernreisen(ctx context.Context) ([]Lernreise, error) {
	return r.listLernreisenQuery(ctx,
		`SELECT l.id, l.title, l.subtitle, l.description, l.icon, l.journey_type, l.location, l.lat, l.lng,
		        l.setting, l.character_name, l.character_desc, l.dimensions, l.sort_order, l.pack_id, l.created_at
		 FROM content_pack_lernreisen l
		 JOIN content_packs p ON p.id = l.pack_id
		 WHERE p.default_enabled = TRUE
		 ORDER BY l.sort_order`,
	)
}

// ListLernreisenForBrand returns Lernreisen for a brand: defaults + brand-activated packs.
func (r *ContentPackRepository) ListLernreisenForBrand(ctx context.Context, brandSlug string) ([]Lernreise, error) {
	return r.listLernreisenQuery(ctx,
		`SELECT DISTINCT l.id, l.title, l.subtitle, l.description, l.icon, l.journey_type, l.location, l.lat, l.lng,
		        l.setting, l.character_name, l.character_desc, l.dimensions, l.sort_order, l.pack_id, l.created_at
		 FROM content_pack_lernreisen l
		 JOIN content_packs p ON p.id = l.pack_id
		 WHERE p.default_enabled = TRUE
		    OR l.pack_id IN (SELECT pack_id FROM brand_content_packs WHERE brand_slug = $1 AND is_active = TRUE)
		 ORDER BY l.sort_order`,
		brandSlug,
	)
}

func (r *ContentPackRepository) listLernreisenQuery(ctx context.Context, query string, args ...interface{}) ([]Lernreise, error) {
	rows, err := r.pool.Query(ctx, query, args...)
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
			&dimJSON, &lr.SortOrder, &lr.PackID, &lr.CreatedAt,
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

// ListPacks returns all content packs.
func (r *ContentPackRepository) ListPacks(ctx context.Context) ([]ContentPack, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, sponsor, default_enabled, created_at
		 FROM content_packs ORDER BY id`,
	)
	if err != nil {
		return nil, fmt.Errorf("list packs: %w", err)
	}
	defer rows.Close()

	var result []ContentPack
	for rows.Next() {
		var p ContentPack
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Sponsor, &p.DefaultEnabled, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan pack row: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// ListBrandPacks returns all content packs with their activation status for a brand.
func (r *ContentPackRepository) ListBrandPacks(ctx context.Context, brandSlug string) ([]BrandContentPack, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.name, p.description, p.sponsor, p.default_enabled, p.created_at,
		        COALESCE(bcp.is_active, FALSE)
		 FROM content_packs p
		 LEFT JOIN brand_content_packs bcp ON bcp.pack_id = p.id AND bcp.brand_slug = $1
		 ORDER BY p.id`,
		brandSlug,
	)
	if err != nil {
		return nil, fmt.Errorf("list brand packs: %w", err)
	}
	defer rows.Close()

	var result []BrandContentPack
	for rows.Next() {
		var bp BrandContentPack
		if err := rows.Scan(&bp.ID, &bp.Name, &bp.Description, &bp.Sponsor, &bp.DefaultEnabled, &bp.CreatedAt, &bp.BrandActive); err != nil {
			return nil, fmt.Errorf("scan brand pack row: %w", err)
		}
		result = append(result, bp)
	}
	return result, rows.Err()
}

// ListPacksByBrandSlug returns content packs linked to a specific brand (active only).
func (r *ContentPackRepository) ListPacksByBrandSlug(ctx context.Context, brandSlug string) ([]ContentPack, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.name, p.description, p.sponsor, p.default_enabled, p.created_at
		 FROM content_packs p
		 JOIN brand_content_packs bcp ON bcp.pack_id = p.id
		 WHERE bcp.brand_slug = $1 AND bcp.is_active = TRUE
		 ORDER BY p.id`,
		brandSlug,
	)
	if err != nil {
		return nil, fmt.Errorf("list packs by brand slug: %w", err)
	}
	defer rows.Close()

	var result []ContentPack
	for rows.Next() {
		var p ContentPack
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Sponsor, &p.DefaultEnabled, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan pack row: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// ListLernreisenByBrandSlug returns Lernreisen from packs linked to a specific brand.
func (r *ContentPackRepository) ListLernreisenByBrandSlug(ctx context.Context, brandSlug string) ([]Lernreise, error) {
	return r.listLernreisenQuery(ctx,
		`SELECT l.id, l.title, l.subtitle, l.description, l.icon, l.journey_type, l.location, l.lat, l.lng,
		        l.setting, l.character_name, l.character_desc, l.dimensions, l.sort_order, l.pack_id, l.created_at
		 FROM content_pack_lernreisen l
		 JOIN brand_content_packs bcp ON bcp.pack_id = l.pack_id
		 WHERE bcp.brand_slug = $1 AND bcp.is_active = TRUE
		 ORDER BY l.sort_order`,
		brandSlug,
	)
}

// ContentPackWithCount is a pack with its Lernreise count for admin listing.
type ContentPackWithCount struct {
	ContentPack
	LernreisenCount int `json:"lernreisenCount"`
}

// ListPacksWithCount returns all content packs with their Lernreise count.
func (r *ContentPackRepository) ListPacksWithCount(ctx context.Context) ([]ContentPackWithCount, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.name, p.description, p.sponsor, p.default_enabled, p.created_at,
		        COUNT(l.id)::int AS lr_count
		 FROM content_packs p
		 LEFT JOIN content_pack_lernreisen l ON l.pack_id = p.id
		 GROUP BY p.id
		 ORDER BY p.id`,
	)
	if err != nil {
		return nil, fmt.Errorf("list packs with count: %w", err)
	}
	defer rows.Close()

	var result []ContentPackWithCount
	for rows.Next() {
		var p ContentPackWithCount
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Sponsor, &p.DefaultEnabled, &p.CreatedAt, &p.LernreisenCount); err != nil {
			return nil, fmt.Errorf("scan pack with count row: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// CreatePack inserts a new content pack.
func (r *ContentPackRepository) CreatePack(ctx context.Context, pack ContentPack) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO content_packs (id, name, description, sponsor, default_enabled)
		 VALUES ($1, $2, $3, $4, $5)`,
		pack.ID, pack.Name, pack.Description, pack.Sponsor, pack.DefaultEnabled,
	)
	if err != nil {
		return fmt.Errorf("create pack: %w", err)
	}
	return nil
}

// UpdatePack updates an existing content pack's metadata.
func (r *ContentPackRepository) UpdatePack(ctx context.Context, id string, pack ContentPack) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE content_packs SET name = $1, description = $2, sponsor = $3, default_enabled = $4
		 WHERE id = $5`,
		pack.Name, pack.Description, pack.Sponsor, pack.DefaultEnabled, id,
	)
	if err != nil {
		return fmt.Errorf("update pack: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("pack not found: %s", id)
	}
	return nil
}

// DeletePack removes a content pack (CASCADE deletes lernreisen + brand links).
func (r *ContentPackRepository) DeletePack(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM content_packs WHERE id = $1`, id,
	)
	if err != nil {
		return fmt.Errorf("delete pack: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("pack not found: %s", id)
	}
	return nil
}

// ListLernreisenByPack returns Lernreisen for a specific pack, ordered by sort_order.
func (r *ContentPackRepository) ListLernreisenByPack(ctx context.Context, packID string) ([]Lernreise, error) {
	return r.listLernreisenQuery(ctx,
		`SELECT l.id, l.title, l.subtitle, l.description, l.icon, l.journey_type, l.location, l.lat, l.lng,
		        l.setting, l.character_name, l.character_desc, l.dimensions, l.sort_order, l.pack_id, l.created_at
		 FROM content_pack_lernreisen l
		 WHERE l.pack_id = $1
		 ORDER BY l.sort_order`,
		packID,
	)
}

// CreateLernreise inserts a new Lernreise into a pack.
func (r *ContentPackRepository) CreateLernreise(ctx context.Context, lr Lernreise) error {
	dimJSON, err := json.Marshal(lr.Dimensions)
	if err != nil {
		return fmt.Errorf("marshal dimensions: %w", err)
	}
	_, err = r.pool.Exec(ctx,
		`INSERT INTO content_pack_lernreisen
		 (id, title, subtitle, description, icon, journey_type, location, lat, lng,
		  setting, character_name, character_desc, dimensions, sort_order, pack_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
		lr.ID, lr.Title, lr.Subtitle, lr.Description, lr.Icon,
		lr.JourneyType, lr.Location, lr.Lat, lr.Lng,
		lr.Setting, lr.CharacterName, lr.CharacterDesc,
		string(dimJSON), lr.SortOrder, lr.PackID,
	)
	if err != nil {
		return fmt.Errorf("create lernreise: %w", err)
	}
	return nil
}

// UpdateLernreise updates an existing Lernreise.
func (r *ContentPackRepository) UpdateLernreise(ctx context.Context, id string, lr Lernreise) error {
	dimJSON, err := json.Marshal(lr.Dimensions)
	if err != nil {
		return fmt.Errorf("marshal dimensions: %w", err)
	}
	tag, err := r.pool.Exec(ctx,
		`UPDATE content_pack_lernreisen SET
		 title = $1, subtitle = $2, description = $3, icon = $4, journey_type = $5,
		 location = $6, lat = $7, lng = $8, setting = $9,
		 character_name = $10, character_desc = $11, dimensions = $12, sort_order = $13
		 WHERE id = $14`,
		lr.Title, lr.Subtitle, lr.Description, lr.Icon, lr.JourneyType,
		lr.Location, lr.Lat, lr.Lng, lr.Setting,
		lr.CharacterName, lr.CharacterDesc, string(dimJSON), lr.SortOrder,
		id,
	)
	if err != nil {
		return fmt.Errorf("update lernreise: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("lernreise not found: %s", id)
	}
	return nil
}

// DeleteLernreise removes a Lernreise by ID.
func (r *ContentPackRepository) DeleteLernreise(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM content_pack_lernreisen WHERE id = $1`, id,
	)
	if err != nil {
		return fmt.Errorf("delete lernreise: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("lernreise not found: %s", id)
	}
	return nil
}

// ReorderLernreisen updates sort_order for Lernreisen within a pack.
// orderedIDs is the desired order — index becomes the new sort_order.
func (r *ContentPackRepository) ReorderLernreisen(ctx context.Context, packID string, orderedIDs []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for i, id := range orderedIDs {
		tag, err := tx.Exec(ctx,
			`UPDATE content_pack_lernreisen SET sort_order = $1 WHERE id = $2 AND pack_id = $3`,
			i, id, packID,
		)
		if err != nil {
			return fmt.Errorf("reorder lernreise %s: %w", id, err)
		}
		if tag.RowsAffected() == 0 {
			return fmt.Errorf("lernreise %s not found in pack %s", id, packID)
		}
	}

	return tx.Commit(ctx)
}

// ToggleBrandPack activates or deactivates a content pack for a brand.
func (r *ContentPackRepository) ToggleBrandPack(ctx context.Context, brandSlug, packID string, active bool, updatedBy string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO brand_content_packs (brand_slug, pack_id, is_active, updated_at, updated_by)
		 VALUES ($1, $2, $3, NOW(), $4)
		 ON CONFLICT (brand_slug, pack_id) DO UPDATE SET is_active = $3, updated_at = NOW(), updated_by = $4`,
		brandSlug, packID, active, updatedBy,
	)
	if err != nil {
		return fmt.Errorf("toggle brand pack: %w", err)
	}
	return nil
}
