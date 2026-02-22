package endorsement

import (
	"net/http"
	"strconv"

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

	limit := intQuery(c, "limit", 20)
	offset := intQuery(c, "offset", 0)

	endorsements, total, err := h.svc.List(c.Request().Context(), userID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list endorsements")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"endorsements": endorsements, "total": total})
}

func (h *Handler) Submit(c echo.Context) error {
	var req SubmitEndorsementRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	endorsement, err := h.svc.Submit(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, endorsement)
}

func (h *Handler) Invite(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	var req EndorsementInviteRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	invite, err := h.svc.Invite(c.Request().Context(), userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, invite)
}

func (h *Handler) Pending(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	invites, total, err := h.svc.Pending(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get pending endorsements")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"invitations": invites, "total": total})
}

func (h *Handler) Visibility(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid endorsement ID")
	}

	var req VisibilityRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	endorsement, err := h.svc.Visibility(c.Request().Context(), id, userID, req.Visible)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "endorsement not found")
	}
	return c.JSON(http.StatusOK, endorsement)
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
