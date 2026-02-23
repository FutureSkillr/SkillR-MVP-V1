package gateway

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/postgres"
)

type PromptLogHandler struct {
	repo *postgres.AnalyticsRepository
}

func NewPromptLogHandler() *PromptLogHandler {
	return &PromptLogHandler{}
}

func (h *PromptLogHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewAnalyticsRepository(pool)
}

func (h *PromptLogHandler) dbReady() bool { return h.repo != nil }

// LogPrompt handles POST /api/prompt-logs — authenticated.
func (h *PromptLogHandler) LogPrompt(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var log postgres.GatewayPromptLog
	if err := c.Bind(&log); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if log.RequestID == "" || log.SessionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "request_id and session_id are required.")
	}

	if err := h.repo.InsertGatewayPromptLog(c.Request().Context(), log); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to log prompt")
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

// QueryLogs handles GET /api/prompt-logs — admin.
func (h *PromptLogHandler) QueryLogs(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	f := postgres.PromptLogFilter{
		Method:    c.QueryParam("method"),
		Status:    c.QueryParam("status"),
		SessionID: c.QueryParam("sessionId"),
	}

	logs, err := h.repo.QueryPromptLogs(c.Request().Context(), f)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to query prompt logs")
	}
	if logs == nil {
		logs = []map[string]interface{}{}
	}
	return c.JSON(http.StatusOK, logs)
}

// Stats handles GET /api/prompt-logs/stats — admin.
func (h *PromptLogHandler) Stats(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	stats, err := h.repo.GetPromptLogStats(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get prompt log stats")
	}
	return c.JSON(http.StatusOK, stats)
}

// ExportCSV handles GET /api/prompt-logs/export-csv — admin.
func (h *PromptLogHandler) ExportCSV(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	data, err := h.repo.ExportPromptLogsCSV(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to export prompt logs")
	}
	return c.Blob(http.StatusOK, "text/csv", data)
}

// DeleteAll handles DELETE /api/prompt-logs — admin.
func (h *PromptLogHandler) DeleteAll(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	if err := h.repo.DeleteAllPromptLogs(c.Request().Context()); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete prompt logs")
	}
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
