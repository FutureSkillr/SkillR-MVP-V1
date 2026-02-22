package solid

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/middleware"
)

// Handler exposes Pod operations as HTTP endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new Pod HTTP handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// getUserID extracts the authenticated user ID from the request context.
// Returns empty string if not authenticated.
func getUserID(c echo.Context) string {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return ""
	}
	return userInfo.UID
}

// Connect handles POST /api/v1/pod/connect.
func (h *Handler) Connect(c echo.Context) error {
	uid := getUserID(c)
	if uid == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	var req ConnectRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	conn, err := h.svc.Connect(c.Request().Context(), uid, req)
	if err != nil {
		log.Printf("pod connect error (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to connect pod")
	}

	return c.JSON(http.StatusOK, conn)
}

// Disconnect handles DELETE /api/v1/pod/connect.
func (h *Handler) Disconnect(c echo.Context) error {
	uid := getUserID(c)
	if uid == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	if err := h.svc.Disconnect(c.Request().Context(), uid); err != nil {
		log.Printf("pod disconnect error (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to disconnect pod")
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "disconnected"})
}

// Status handles GET /api/v1/pod/status.
func (h *Handler) Status(c echo.Context) error {
	uid := getUserID(c)
	if uid == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	status, err := h.svc.Status(c.Request().Context(), uid)
	if err != nil {
		log.Printf("pod status error (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get pod status")
	}

	return c.JSON(http.StatusOK, status)
}

// Sync handles POST /api/v1/pod/sync.
func (h *Handler) Sync(c echo.Context) error {
	uid := getUserID(c)
	if uid == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	var req SyncRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.svc.Sync(c.Request().Context(), uid, req)
	if err != nil {
		log.Printf("pod sync error (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to sync pod")
	}

	return c.JSON(http.StatusOK, result)
}

// Data handles GET /api/v1/pod/data.
func (h *Handler) Data(c echo.Context) error {
	uid := getUserID(c)
	if uid == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	data, err := h.svc.Data(c.Request().Context(), uid)
	if err != nil {
		log.Printf("pod data error (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get pod data")
	}

	return c.JSON(http.StatusOK, data)
}
