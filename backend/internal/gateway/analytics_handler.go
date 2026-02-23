package gateway

import (
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/postgres"
)

type AnalyticsHandler struct {
	repo *postgres.AnalyticsRepository
}

func NewAnalyticsHandler() *AnalyticsHandler {
	return &AnalyticsHandler{}
}

func (h *AnalyticsHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewAnalyticsRepository(pool)
}

func (h *AnalyticsHandler) dbReady() bool { return h.repo != nil }

// BatchInsert handles POST /api/analytics/events — public, rate-limited.
func (h *AnalyticsHandler) BatchInsert(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var events []postgres.GatewayEvent
	if err := c.Bind(&events); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Expected non-empty array of events.")
	}
	if len(events) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "Expected non-empty array of events.")
	}

	inserted, err := h.repo.InsertGatewayEvents(c.Request().Context(), events)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to insert events")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"ok":       true,
		"inserted": inserted,
	})
}

// LogConsent handles POST /api/analytics/consent — public.
func (h *AnalyticsHandler) LogConsent(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var data map[string]interface{}
	if err := c.Bind(&data); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.repo.LogConsent(c.Request().Context(), data); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to log consent")
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

// QueryEvents handles GET /api/analytics/events — admin.
func (h *AnalyticsHandler) QueryEvents(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	f := postgres.EventFilter{
		EventType:        c.QueryParam("event_type"),
		BrowserSessionID: c.QueryParam("browser_session_id"),
	}
	if v := c.QueryParam("from"); v != "" {
		n, _ := strconv.ParseInt(v, 10, 64)
		f.From = &n
	}
	if v := c.QueryParam("to"); v != "" {
		n, _ := strconv.ParseInt(v, 10, 64)
		f.To = &n
	}
	if v := c.QueryParam("limit"); v != "" {
		f.Limit, _ = strconv.Atoi(v)
	}

	events, err := h.repo.QueryEvents(c.Request().Context(), f)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to query events")
	}
	if events == nil {
		events = []postgres.GatewayEvent{}
	}
	return c.JSON(http.StatusOK, events)
}

// Overview handles GET /api/analytics/overview — admin.
func (h *AnalyticsHandler) Overview(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	overview, err := h.repo.GetOverview(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get overview")
	}
	return c.JSON(http.StatusOK, overview)
}

// SessionEvents handles GET /api/analytics/sessions/:id — admin.
func (h *AnalyticsHandler) SessionEvents(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "session id required")
	}

	events, err := h.repo.GetSessionEvents(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get session events")
	}
	if events == nil {
		events = []postgres.GatewayEvent{}
	}
	return c.JSON(http.StatusOK, events)
}

// ExportCSV handles GET /api/analytics/export-csv — admin.
func (h *AnalyticsHandler) ExportCSV(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	data, err := h.repo.ExportEventsCSV(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to export events")
	}

	c.Response().Header().Set("Content-Disposition", "attachment; filename=analytics-events.csv")
	return c.Blob(http.StatusOK, "text/csv", data)
}

// DeleteEvents handles DELETE /api/analytics/events — admin.
func (h *AnalyticsHandler) DeleteEvents(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	if err := h.repo.DeleteAllEvents(c.Request().Context()); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete events")
	}
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
