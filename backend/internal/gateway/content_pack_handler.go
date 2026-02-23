package gateway

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/postgres"
)

// ContentPackHandler serves the Lernreise content pack.
type ContentPackHandler struct {
	repo *postgres.ContentPackRepository
}

// NewContentPackHandler creates a handler with nil DB (connected later via SetDB).
func NewContentPackHandler() *ContentPackHandler {
	return &ContentPackHandler{}
}

// SetDB injects the database connection pool.
func (h *ContentPackHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewContentPackRepository(pool)
}

func (h *ContentPackHandler) dbReady() bool { return h.repo != nil }

// Get handles GET /api/v1/content-pack — returns all Lernreisen.
func (h *ContentPackHandler) Get(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	lernreisen, err := h.repo.ListLernreisen(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load content pack")
	}

	if lernreisen == nil {
		lernreisen = []postgres.Lernreise{}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"lernreisen": lernreisen,
	})
}
