package artifact

import (
	"encoding/json"
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

	var at *string
	if v := c.QueryParam("artifact_type"); v != "" {
		at = &v
	}

	artifacts, total, err := h.svc.List(c.Request().Context(), userID, at, intQuery(c, "limit", 20), intQuery(c, "offset", 0))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list artifacts")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"artifacts": artifacts, "total": total})
}

func (h *Handler) Upload(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	artifactType := c.FormValue("artifact_type")
	description := c.FormValue("description")
	url := c.FormValue("url")

	var storageRef *string
	if url != "" {
		storageRef = &url
	}

	var skillDimensions map[string]float64
	if sd := c.FormValue("skill_dimensions"); sd != "" {
		_ = json.Unmarshal([]byte(sd), &skillDimensions)
	}

	// TODO: Handle file upload to Firebase Storage in Phase 5

	artifact, err := h.svc.Upload(c.Request().Context(), userID, artifactType, description, skillDimensions, storageRef)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, artifact)
}

func (h *Handler) Get(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid artifact ID")
	}

	detailed, err := h.svc.Get(c.Request().Context(), id, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "artifact not found")
	}
	return c.JSON(http.StatusOK, detailed)
}

func (h *Handler) Delete(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid artifact ID")
	}

	if err := h.svc.Delete(c.Request().Context(), id, userID); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "artifact not found")
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) LinkEndorsement(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid artifact ID")
	}

	var req LinkEndorsementRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	detailed, err := h.svc.LinkEndorsement(c.Request().Context(), id, userID, req.EndorsementID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "artifact or endorsement not found")
	}
	return c.JSON(http.StatusOK, detailed)
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
