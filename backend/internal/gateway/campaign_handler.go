package gateway

import (
	"crypto/rand"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
	"skillr-mvp-v1/backend/internal/postgres"
)

type CampaignHandler struct {
	repo *postgres.CampaignRepository
}

func NewCampaignHandler() *CampaignHandler {
	return &CampaignHandler{}
}

func (h *CampaignHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewCampaignRepository(pool)
}

func (h *CampaignHandler) dbReady() bool { return h.repo != nil }

// List handles GET /api/campaigns — admin.
func (h *CampaignHandler) List(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	campaigns, err := h.repo.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list campaigns")
	}
	if campaigns == nil {
		campaigns = []postgres.Campaign{}
	}
	return c.JSON(http.StatusOK, campaigns)
}

// Create handles POST /api/campaigns — admin.
func (h *CampaignHandler) Create(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var body map[string]any
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	name, _ := body["name"].(string)
	utmCampaign, _ := body["utm_campaign"].(string)
	if name == "" || utmCampaign == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "name and utm_campaign are required",
			"code":  "INVALID_INPUT",
		})
	}

	id := generateUUID()

	campaign := &postgres.Campaign{
		ID:          id,
		Name:        name,
		Platform:    strOrDefault(body, "platform", "meta"),
		UTMSource:   strOrDefault(body, "utm_source", ""),
		UTMMedium:   strOrDefault(body, "utm_medium", ""),
		UTMCampaign: utmCampaign,
		UTMContent:  strPtr(body, "utm_content"),
		UTMTerm:     strPtr(body, "utm_term"),
		MetaPixelID: strPtr(body, "meta_pixel_id"),
		BudgetCents: intPtr(body, "budget_cents"),
		Currency:    strOrDefault(body, "currency", "EUR"),
		Status:      strOrDefault(body, "status", "draft"),
		Notes:       strPtr(body, "notes"),
	}

	// Parse dates
	if sd, ok := body["start_date"].(string); ok && sd != "" {
		campaign.StartDate = parseTimePtr(sd)
	}
	if ed, ok := body["end_date"].(string); ok && ed != "" {
		campaign.EndDate = parseTimePtr(ed)
	}

	// Set created_by from auth context
	if userInfo := middleware.GetUserInfo(c); userInfo != nil {
		campaign.CreatedBy = &userInfo.Email
	}

	if err := h.repo.Create(c.Request().Context(), campaign); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create campaign")
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"id":      id,
		"created": true,
	})
}

// Update handles PUT /api/campaigns/:id — admin.
func (h *CampaignHandler) Update(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id := c.Param("id")

	// Check existence
	existing, err := h.repo.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get campaign")
	}
	if existing == nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Campaign not found",
			"code":  "NOT_FOUND",
		})
	}

	var body map[string]any
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.repo.Update(c.Request().Context(), id, body); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update campaign")
	}

	return c.JSON(http.StatusOK, map[string]any{
		"id":      id,
		"updated": true,
	})
}

// Archive handles DELETE /api/campaigns/:id — admin (soft delete).
func (h *CampaignHandler) Archive(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id := c.Param("id")

	if err := h.repo.Archive(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Campaign not found",
			"code":  "NOT_FOUND",
		})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"id":       id,
		"archived": true,
	})
}

// Stats handles GET /api/campaigns/:id/stats — admin.
func (h *CampaignHandler) Stats(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id := c.Param("id")

	campaign, err := h.repo.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get campaign")
	}
	if campaign == nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Campaign not found",
			"code":  "NOT_FOUND",
		})
	}

	stats, err := h.repo.Stats(c.Request().Context(), campaign.UTMCampaign, campaign.BudgetCents)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get campaign stats")
	}

	return c.JSON(http.StatusOK, stats)
}

// --- helpers ---

func generateUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func strOrDefault(m map[string]any, key, def string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return def
	}
	s, ok := v.(string)
	if !ok || s == "" {
		return def
	}
	return s
}

func strPtr(m map[string]any, key string) *string {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	s, ok := v.(string)
	if !ok || s == "" {
		return nil
	}
	return &s
}

func intPtr(m map[string]any, key string) *int {
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

func parseTimePtr(s string) *time.Time {
	for _, layout := range []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z",
		"2006-01-02",
	} {
		if t, err := time.Parse(layout, s); err == nil {
			return &t
		}
	}
	return nil
}
