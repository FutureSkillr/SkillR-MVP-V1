package portfolio

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
)

// Handler exposes HTTP endpoints for portfolio operations.
type Handler struct {
	svc *Service
}

// NewHandler creates a Handler backed by the given Service.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// resolveUserID extracts the authenticated user's database UUID.
// For Firebase auth users, the UID is resolved via the users table.
// For local auth users, the UID is already a valid UUID.
func (h *Handler) resolveUserID(c echo.Context) (uuid.UUID, error) {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return uuid.Nil, echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	resolved, err := h.svc.ResolveUserID(
		c.Request().Context(),
		userInfo.UID,
		userInfo.Email,
		userInfo.DisplayName,
	)
	if err != nil {
		return uuid.Nil, echo.NewHTTPError(http.StatusServiceUnavailable, err.Error())
	}
	return resolved, nil
}

// List returns all portfolio entries for the authenticated user.
func (h *Handler) List(c echo.Context) error {
	userID, err := h.resolveUserID(c)
	if err != nil {
		return err
	}

	entries, err := h.svc.List(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if entries == nil {
		entries = []PortfolioEntry{}
	}

	return c.JSON(http.StatusOK, map[string]any{
		"entries": entries,
	})
}

// Create adds a new portfolio entry.
func (h *Handler) Create(c echo.Context) error {
	userID, err := h.resolveUserID(c)
	if err != nil {
		return err
	}

	var req CreateEntryRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	entry, err := h.svc.Create(c.Request().Context(), userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, entry)
}

// Update modifies an existing portfolio entry.
func (h *Handler) Update(c echo.Context) error {
	userID, err := h.resolveUserID(c)
	if err != nil {
		return err
	}

	entryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid entry ID")
	}

	var req CreateEntryRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	entry, err := h.svc.Update(c.Request().Context(), userID, entryID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, entry)
}

// Delete removes a portfolio entry.
func (h *Handler) Delete(c echo.Context) error {
	userID, err := h.resolveUserID(c)
	if err != nil {
		return err
	}

	entryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid entry ID")
	}

	if err := h.svc.Delete(c.Request().Context(), userID, entryID); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "entry not found")
	}

	return c.NoContent(http.StatusNoContent)
}

// CreateDemo generates 3 demo portfolio entries.
func (h *Handler) CreateDemo(c echo.Context) error {
	userID, err := h.resolveUserID(c)
	if err != nil {
		return err
	}

	entries, err := h.svc.CreateDemo(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"created": len(entries),
		"entries": entries,
	})
}

// Export returns the portfolio as HTML or ZIP.
func (h *Handler) Export(c echo.Context) error {
	userID, err := h.resolveUserID(c)
	if err != nil {
		return err
	}

	format := ExportFormat(c.QueryParam("format"))
	if format == "" {
		format = ExportHTML
	}

	switch format {
	case ExportHTML:
		html, err := h.svc.ExportHTML(c.Request().Context(), userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		c.Response().Header().Set("Content-Disposition", `attachment; filename="portfolio.html"`)
		return c.HTML(http.StatusOK, html)

	case ExportZIP:
		data, err := h.svc.ExportZIP(c.Request().Context(), userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		c.Response().Header().Set("Content-Disposition", `attachment; filename="portfolio.zip"`)
		return c.Blob(http.StatusOK, "application/zip", data)

	default:
		return echo.NewHTTPError(http.StatusBadRequest, "unsupported format: use html or zip")
	}
}

// PublicPage returns the public portfolio for a given user ID (no auth required).
// Content negotiation: browsers (Accept: text/html) get a rendered HTML page,
// API clients (Accept: application/json) get JSON.
func (h *Handler) PublicPage(c echo.Context) error {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user ID")
	}

	page, err := h.svc.PublicPage(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Content negotiation: serve HTML to browsers, JSON to API clients
	accept := c.Request().Header.Get("Accept")
	if strings.Contains(accept, "text/html") {
		baseURL := c.Scheme() + "://" + c.Request().Host
		html := renderPortfolioHTML(page.DisplayName, page.Entries, baseURL)
		return c.HTML(http.StatusOK, html)
	}

	return c.JSON(http.StatusOK, page)
}
