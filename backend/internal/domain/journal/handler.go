package journal

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/middleware"
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
	userID := deriveUUID(userInfo.UID)

	params := ListParams{
		Limit:  intQuery(c, "limit", 50),
		Offset: intQuery(c, "offset", 0),
		UserID: userID,
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

	interactions, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list journal")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"interactions": interactions, "total": total})
}

func (h *Handler) ByStation(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	stationID := c.Param("stationId")
	interactions, total, err := h.svc.ByStation(c.Request().Context(), userID, stationID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get station journal")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"interactions": interactions, "station_id": stationID, "total": total})
}

func (h *Handler) ByDimension(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	dim := c.Param("dim")
	interactions, total, err := h.svc.ByDimension(c.Request().Context(), userID, dim)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get dimension journal")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"interactions": interactions, "dimension": dim, "total": total})
}

func (h *Handler) Record(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	var req CreateInteractionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	interaction, err := h.svc.Record(c.Request().Context(), userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, interaction)
}

func deriveUUID(firebaseUID string) uuid.UUID {
	return uuid.NewSHA1(uuid.NameSpaceDNS, []byte(firebaseUID))
}

func intQuery(c echo.Context, key string, def int) int {
	if v := c.QueryParam(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i >= 0 {
			return i
		}
	}
	return def
}
