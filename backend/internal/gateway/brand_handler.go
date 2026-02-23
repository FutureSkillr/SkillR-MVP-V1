package gateway

import (
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
	"skillr-mvp-v1/backend/internal/postgres"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9-]+$`)

type BrandHandler struct {
	repo *postgres.BrandRepository
}

func NewBrandHandler() *BrandHandler {
	return &BrandHandler{}
}

func (h *BrandHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewBrandRepository(pool)
}

func (h *BrandHandler) dbReady() bool { return h.repo != nil }

// GetBySlug handles GET /api/brand/:slug — public.
func (h *BrandHandler) GetBySlug(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	slug := c.Param("slug")
	if slug == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "slug required")
	}

	brand, err := h.repo.GetBySlug(c.Request().Context(), slug)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get brand")
	}
	if brand == nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Brand not found",
			"code":  "NOT_FOUND",
		})
	}

	// Return the parsed config JSON directly
	var config interface{}
	if err := json.Unmarshal(brand.Config, &config); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Invalid brand config")
	}
	return c.JSON(http.StatusOK, config)
}

// List handles GET /api/brand — admin.
func (h *BrandHandler) List(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	brands, err := h.repo.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list brands")
	}

	// Build response matching Express format
	var result []map[string]interface{}
	for _, b := range brands {
		entry := map[string]interface{}{
			"slug":      b.Slug,
			"isActive":  b.IsActive,
			"createdAt": b.CreatedAt.UnixMilli(),
			"updatedAt": b.UpdatedAt.UnixMilli(),
			"updatedBy": b.UpdatedBy,
		}
		// Merge config fields into entry
		var config map[string]interface{}
		if json.Unmarshal(b.Config, &config) == nil {
			for k, v := range config {
				if k != "slug" {
					entry[k] = v
				}
			}
		}
		result = append(result, entry)
	}
	if result == nil {
		result = []map[string]interface{}{}
	}
	return c.JSON(http.StatusOK, result)
}

// Create handles POST /api/brand — admin.
func (h *BrandHandler) Create(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var body map[string]interface{}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	slug, _ := body["slug"].(string)
	if slug == "" || !slugPattern.MatchString(slug) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid slug. Use lowercase letters, numbers, and hyphens only.",
			"code":  "INVALID_SLUG",
		})
	}

	// Check for conflict
	existing, _ := h.repo.GetBySlug(c.Request().Context(), slug)
	if existing != nil {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "Brand slug already exists",
			"code":  "CONFLICT",
		})
	}

	// Store the full body as config
	configJSON, _ := json.Marshal(body)
	updatedBy := ""
	if userInfo := middleware.GetUserInfo(c); userInfo != nil {
		updatedBy = userInfo.Email
	}

	if err := h.repo.Create(c.Request().Context(), slug, configJSON, updatedBy); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create brand")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"slug":    slug,
		"created": true,
	})
}

// Update handles PUT /api/brand/:slug — admin or sponsor_admin.
func (h *BrandHandler) Update(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	slug := c.Param("slug")

	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	if userInfo.Role != "admin" && userInfo.Role != "sponsor_admin" {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Admin or sponsor_admin access required",
			"code":  "FORBIDDEN",
		})
	}

	var body map[string]interface{}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Ensure slug is in the config
	body["slug"] = slug
	configJSON, _ := json.Marshal(body)

	if err := h.repo.Update(c.Request().Context(), slug, configJSON, userInfo.Email); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Brand not found",
			"code":  "NOT_FOUND",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"slug":    slug,
		"updated": true,
	})
}

// Deactivate handles DELETE /api/brand/:slug — admin.
func (h *BrandHandler) Deactivate(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	slug := c.Param("slug")

	updatedBy := ""
	if userInfo := middleware.GetUserInfo(c); userInfo != nil {
		updatedBy = userInfo.Email
	}

	if err := h.repo.Deactivate(c.Request().Context(), slug, updatedBy); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Brand not found",
			"code":  "NOT_FOUND",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"slug":        slug,
		"deactivated": true,
	})
}
