package gateway

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
	"skillr-mvp-v1/backend/internal/postgres"
)

// Allowed keys for business_config (matches Express gateway).
var allowedLegalKeys = map[string]bool{
	"company_name":                true,
	"company_address":             true,
	"company_country":             true,
	"contact_email":               true,
	"contact_phone":               true,
	"legal_representative":        true,
	"register_entry":              true,
	"vat_id":                      true,
	"content_responsible":         true,
	"content_responsible_address": true,
	"dpo_name":                    true,
	"dpo_email":                   true,
}

type LegalHandler struct {
	repo *postgres.BusinessConfigRepository
}

func NewLegalHandler() *LegalHandler {
	return &LegalHandler{}
}

func (h *LegalHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewBusinessConfigRepository(pool)
}

func (h *LegalHandler) dbReady() bool { return h.repo != nil }

// GetLegal handles GET /api/config/legal — public, cached 5 min.
func (h *LegalHandler) GetLegal(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	config, err := h.repo.GetAll(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load legal config")
	}
	if config == nil {
		config = make(map[string]string)
	}
	c.Response().Header().Set("Cache-Control", "public, max-age=300")
	return c.JSON(http.StatusOK, config)
}

// PutLegal handles PUT /api/config/legal — admin only.
func (h *LegalHandler) PutLegal(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var data map[string]string
	if err := c.Bind(&data); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Expected a key/value object")
	}
	if len(data) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "Expected a key/value object")
	}

	updatedBy := "unknown"
	if userInfo := middleware.GetUserInfo(c); userInfo != nil && userInfo.Email != "" {
		updatedBy = userInfo.Email
	}

	ctx := c.Request().Context()
	for key, value := range data {
		if !allowedLegalKeys[key] {
			continue
		}
		if err := h.repo.Upsert(ctx, key, value, updatedBy); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to upsert config")
		}
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
