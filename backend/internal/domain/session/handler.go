package session

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID, err := getUserUUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user")
	}

	params := ListParams{
		Limit:  getIntQuery(c, "limit", 20),
		Offset: getIntQuery(c, "offset", 0),
		UserID: userID,
	}

	if jt := c.QueryParam("journey_type"); jt != "" {
		params.JourneyType = &jt
	}
	if sid := c.QueryParam("station_id"); sid != "" {
		params.StationID = &sid
	}
	if from := c.QueryParam("from"); from != "" {
		if t, err := time.Parse(time.RFC3339, from); err == nil {
			params.From = &t
		}
	}
	if to := c.QueryParam("to"); to != "" {
		if t, err := time.Parse(time.RFC3339, to); err == nil {
			params.To = &t
		}
	}

	sessions, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list sessions")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"sessions": sessions,
		"total":    total,
	})
}

func (h *Handler) Create(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID, err := getUserUUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user")
	}

	var req CreateSessionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.SessionType == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "session_type is required")
	}

	sess, err := h.svc.Create(c.Request().Context(), userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create session")
	}

	return c.JSON(http.StatusCreated, sess)
}

func (h *Handler) Get(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID, err := getUserUUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session ID")
	}

	detailed, err := h.svc.GetDetailed(c.Request().Context(), id, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "session not found")
	}

	return c.JSON(http.StatusOK, detailed)
}

func (h *Handler) Update(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID, err := getUserUUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session ID")
	}

	var req UpdateSessionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	sess, err := h.svc.Update(c.Request().Context(), id, userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "session not found")
	}

	return c.JSON(http.StatusOK, sess)
}

func (h *Handler) Delete(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID, err := getUserUUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid session ID")
	}

	if err := h.svc.Delete(c.Request().Context(), id, userID); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "session not found")
	}

	return c.NoContent(http.StatusNoContent)
}

// getUserUUID retrieves user UUID from context. In production, this maps
// Firebase UID to internal UUID via the users table. For now, we derive a
// deterministic UUID from the Firebase UID.
func getUserUUID(c echo.Context) (uuid.UUID, error) {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return uuid.Nil, echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	// Use UUID v5 from Firebase UID for deterministic mapping
	return uuid.NewSHA1(uuid.NameSpaceDNS, []byte(userInfo.UID)), nil
}

func getIntQuery(c echo.Context, key string, def int) int {
	if v := c.QueryParam(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i >= 0 {
			return i
		}
	}
	return def
}
