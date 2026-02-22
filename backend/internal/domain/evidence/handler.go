package evidence

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

	params := ListParams{
		Limit:  intQuery(c, "limit", 20),
		Offset: intQuery(c, "offset", 0),
		UserID: userID,
	}
	if et := c.QueryParam("evidence_type"); et != "" {
		params.EvidenceType = &et
	}

	entries, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list evidence")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"entries": entries, "total": total})
}

func (h *Handler) Create(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	var req CreateEvidenceRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	entry, err := h.svc.Create(c.Request().Context(), userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, entry)
}

func (h *Handler) Get(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evidence ID")
	}

	detailed, err := h.svc.Get(c.Request().Context(), id, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "evidence not found")
	}
	return c.JSON(http.StatusOK, detailed)
}

func (h *Handler) ByDimension(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	dim := c.Param("dim")
	entries, total, err := h.svc.ByDimension(c.Request().Context(), userID, dim)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get evidence")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"entries": entries, "dimension": dim, "total": total})
}

// L12: Accept token from POST body first, then query string as fallback
func (h *Handler) Verify(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evidence ID")
	}

	// Try POST body first (preferred), then query param (legacy / email links)
	token := ""
	if c.Request().Method == "POST" {
		var body struct {
			Token string `json:"token"`
		}
		if err := c.Bind(&body); err == nil && body.Token != "" {
			token = body.Token
		}
	}
	if token == "" {
		token = c.QueryParam("token")
	}
	if token == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "verification token required")
	}

	result, err := h.svc.Verify(c.Request().Context(), id, token)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "evidence not found or invalid token")
	}
	return c.JSON(http.StatusOK, result)
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
