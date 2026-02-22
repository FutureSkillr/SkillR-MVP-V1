package lernreise

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/middleware"
)

// Handler provides HTTP endpoints for Lernreise management (FR-074, FR-075).
type Handler struct {
	svc *Service
}

// NewHandler creates a Lernreise HTTP handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ListCatalog returns available Lernreisen from Honeycomb.
func (h *Handler) ListCatalog(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	ctxID, err := h.svc.ResolveCtxID(c.Request().Context(), userID, userInfo.UID, userInfo.DisplayName, userInfo.Email)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to resolve user context")
	}

	entries, err := h.svc.ListCatalog(c.Request().Context(), ctxID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to fetch catalog")
	}

	return c.JSON(http.StatusOK, map[string]any{"items": entries})
}

// GetCatalogDetail returns course detail from Honeycomb.
func (h *Handler) GetCatalogDetail(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	dataID := c.Param("dataId")
	if dataID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "dataId is required")
	}

	ctxID, err := h.svc.ResolveCtxID(c.Request().Context(), userID, userInfo.UID, userInfo.DisplayName, userInfo.Email)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to resolve user context")
	}

	data, err := h.svc.GetCatalogDetail(c.Request().Context(), ctxID, dataID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to fetch course detail")
	}

	return c.JSON(http.StatusOK, data)
}

// Select creates a new Lernreise instance for the user.
func (h *Handler) Select(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	var req struct {
		DataID string `json:"data_id"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.DataID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "data_id is required")
	}

	ctxID, err := h.svc.ResolveCtxID(c.Request().Context(), userID, userInfo.UID, userInfo.DisplayName, userInfo.Email)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to resolve user context")
	}

	inst, data, err := h.svc.Select(c.Request().Context(), userID, ctxID, req.DataID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"instance":    inst,
		"course_data": data,
	})
}

// GetActive returns the current active instance for the user.
func (h *Handler) GetActive(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	inst, err := h.svc.GetActive(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get active instance")
	}
	if inst == nil {
		return c.JSON(http.StatusOK, map[string]any{"instance": nil})
	}

	return c.JSON(http.StatusOK, map[string]any{"instance": inst})
}

// ListInstances returns all Lernreise instances for the user.
func (h *Handler) ListInstances(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	instances, err := h.svc.ListInstances(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list instances")
	}

	return c.JSON(http.StatusOK, map[string]any{"instances": instances})
}

// GetInstance returns an instance detail with Honeycomb course data.
func (h *Handler) GetInstance(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid instance ID")
	}

	inst, err := h.svc.GetInstance(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "instance not found")
	}
	if inst.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "access denied")
	}

	data, err := h.svc.GetInstanceWithData(c.Request().Context(), inst)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to fetch course data")
	}

	return c.JSON(http.StatusOK, map[string]any{
		"instance":    inst,
		"course_data": data,
	})
}

// SubmitTask submits a task completion and awards XP.
func (h *Handler) SubmitTask(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid instance ID")
	}

	var req struct {
		ModuleID string `json:"module_id"`
		TaskID   string `json:"task_id"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.ModuleID == "" || req.TaskID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "module_id and task_id are required")
	}

	inst, err := h.svc.GetInstance(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "instance not found")
	}
	if inst.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "access denied")
	}
	if inst.Status != StatusActive {
		return echo.NewHTTPError(http.StatusBadRequest, "instance is not active")
	}

	result, err := h.svc.SubmitTask(c.Request().Context(), inst, req.ModuleID, req.TaskID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to submit task")
	}

	return c.JSON(http.StatusOK, map[string]any{
		"course_data": result.CourseData,
		"progress":    result.Progress,
		"xp_awarded":  result.XPAwarded,
	})
}

// GetProgress returns progress event history for an instance.
func (h *Handler) GetProgress(c echo.Context) error {
	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	userID := deriveUUID(userInfo.UID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid instance ID")
	}

	inst, err := h.svc.GetInstance(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "instance not found")
	}
	if inst.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "access denied")
	}

	events, err := h.svc.ListProgress(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get progress")
	}

	return c.JSON(http.StatusOK, map[string]any{"events": events})
}

func deriveUUID(firebaseUID string) uuid.UUID {
	return uuid.NewSHA1(uuid.NameSpaceDNS, []byte(firebaseUID))
}
