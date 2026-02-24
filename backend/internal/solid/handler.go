package solid

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
)

// Handler exposes Pod operations as HTTP endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new Pod HTTP handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// resolveUserID extracts the authenticated user's database UUID.
// For local auth users the middleware UID is already a UUID.
// For Firebase auth users the UID is a Firebase UID string which must be
// resolved to the users.id UUID via the firebase_uid column.
// Returns empty string and an error if not authenticated or resolution fails.
func (h *Handler) resolveUserID(c echo.Context) (string, error) {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	resolved, err := h.svc.ResolveUserID(
		c.Request().Context(),
		userInfo.UID,
		userInfo.Email,
		userInfo.DisplayName,
	)
	if err != nil {
		if handleNotReady(c, err) {
			return "", nil
		}
		return "", err
	}
	return resolved, nil
}

// Readiness handles GET /api/v1/pod/readiness — public, no auth required.
// Checks both database connectivity and CSS (Community Solid Server) reachability.
// Returns `managedAvailable` (TC-036) so the frontend can hide the local CSS option.
func (h *Handler) Readiness(c echo.Context) error {
	dbReady := h.svc.Ready()
	log.Printf("[pod] Readiness: dbReady=%v", dbReady)
	if !dbReady {
		log.Printf("[pod] Readiness: unavailable reason=database_not_configured")
		return c.JSON(http.StatusOK, map[string]interface{}{
			"available":        false,
			"managedAvailable": false,
			"reason":           "database_not_configured",
		})
	}

	cssReachable := h.svc.PingCSS(c.Request().Context()) == nil

	// available = DB ready (external pods don't need local CSS).
	// managedAvailable = CSS is reachable (controls managed provider visibility, TC-036).
	available := dbReady
	log.Printf("[pod] Readiness: available=%v managedAvailable=%v", available, cssReachable)

	resp := map[string]interface{}{
		"available":        available,
		"managedAvailable": cssReachable,
	}
	if cssReachable && h.svc.CSSBaseURL() != "" {
		resp["managedPodUrl"] = h.svc.CSSBaseURL()
	}
	return c.JSON(http.StatusOK, resp)
}

// handleNotReady checks if the error is ErrNotReady and returns 503 with Retry-After header.
// Returns true if the error was handled.
func handleNotReady(c echo.Context, err error) bool {
	if errors.Is(err, ErrNotReady) {
		log.Printf("[pod] WARN not-ready: 503")
		c.Response().Header().Set("Retry-After", "30")
		_ = c.JSON(http.StatusServiceUnavailable, map[string]string{
			"message": "pod service not ready",
		})
		return true
	}
	return false
}

// Connect handles POST /api/v1/pod/connect.
func (h *Handler) Connect(c echo.Context) error {
	uid, err := h.resolveUserID(c)
	if err != nil {
		return err
	}
	if uid == "" {
		return nil // already handled by resolveUserID (503)
	}
	log.Printf("[pod] handler Connect: user=%s", uid)

	var req ConnectRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("[pod] handler Connect: bind error: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := req.Validate(); err != nil {
		log.Printf("[pod] handler Connect: validation error: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	conn, err := h.svc.Connect(c.Request().Context(), uid, req)
	if err != nil {
		if handleNotReady(c, err) {
			return nil
		}
		log.Printf("[pod] ERROR handler Connect (user=%s): %v", uid, err)
		if strings.Contains(err.Error(), "not reachable") {
			log.Printf("[pod] handler Connect: CSS unreachable")
			return echo.NewHTTPError(http.StatusBadGateway, "Pod server is not reachable. Is the Community Solid Server running?")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to connect pod")
	}

	return c.JSON(http.StatusOK, conn)
}

// Disconnect handles DELETE /api/v1/pod/connect.
func (h *Handler) Disconnect(c echo.Context) error {
	uid, err := h.resolveUserID(c)
	if err != nil {
		return err
	}
	if uid == "" {
		return nil
	}
	log.Printf("[pod] handler Disconnect: user=%s", uid)

	if err := h.svc.Disconnect(c.Request().Context(), uid); err != nil {
		if handleNotReady(c, err) {
			return nil
		}
		log.Printf("[pod] ERROR handler Disconnect (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to disconnect pod")
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "disconnected"})
}

// Status handles GET /api/v1/pod/status.
func (h *Handler) Status(c echo.Context) error {
	uid, err := h.resolveUserID(c)
	if err != nil {
		return err
	}
	if uid == "" {
		return nil
	}
	log.Printf("[pod] handler Status: user=%s", uid)

	status, err := h.svc.Status(c.Request().Context(), uid)
	if err != nil {
		if handleNotReady(c, err) {
			return nil
		}
		log.Printf("[pod] ERROR handler Status (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get pod status")
	}

	return c.JSON(http.StatusOK, status)
}

// Sync handles POST /api/v1/pod/sync.
func (h *Handler) Sync(c echo.Context) error {
	uid, err := h.resolveUserID(c)
	if err != nil {
		return err
	}
	if uid == "" {
		return nil
	}
	log.Printf("[pod] handler Sync: user=%s", uid)

	var req SyncRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.svc.Sync(c.Request().Context(), uid, req)
	if err != nil {
		if handleNotReady(c, err) {
			return nil
		}
		log.Printf("[pod] ERROR handler Sync (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to sync pod")
	}

	return c.JSON(http.StatusOK, result)
}

// Data handles GET /api/v1/pod/data.
func (h *Handler) Data(c echo.Context) error {
	uid, err := h.resolveUserID(c)
	if err != nil {
		return err
	}
	if uid == "" {
		return nil
	}
	log.Printf("[pod] handler Data: user=%s", uid)

	data, err := h.svc.Data(c.Request().Context(), uid)
	if err != nil {
		if handleNotReady(c, err) {
			return nil
		}
		log.Printf("[pod] ERROR handler Data (user=%s): %v", uid, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get pod data")
	}

	return c.JSON(http.StatusOK, data)
}
