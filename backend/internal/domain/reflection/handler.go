package reflection

import (
	"net/http"
	"strconv"

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

	userID := getUserUUID(userInfo.UID)

	params := ListParams{
		Limit:  getIntQuery(c, "limit", 20),
		Offset: getIntQuery(c, "offset", 0),
		UserID: userID,
	}

	if sid := c.QueryParam("station_id"); sid != "" {
		params.StationID = &sid
	}

	reflections, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list reflections")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"reflections": reflections,
		"total":       total,
	})
}

func (h *Handler) Submit(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID := getUserUUID(userInfo.UID)

	var req CreateReflectionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	result, err := h.svc.Submit(c.Request().Context(), userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) Capabilities(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}

	userID := getUserUUID(userInfo.UID)

	scores, err := h.svc.Capabilities(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get capabilities")
	}

	return c.JSON(http.StatusOK, scores)
}

func getUserUUID(firebaseUID string) uuid.UUID {
	return uuid.NewSHA1(uuid.NameSpaceDNS, []byte(firebaseUID))
}

func getIntQuery(c echo.Context, key string, def int) int {
	if v := c.QueryParam(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i >= 0 {
			return i
		}
	}
	return def
}
