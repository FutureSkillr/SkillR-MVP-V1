package gateway

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/postgres"
)

type UserAdminHandler struct {
	repo *postgres.UserAdminRepository
}

func NewUserAdminHandler() *UserAdminHandler {
	return &UserAdminHandler{}
}

func (h *UserAdminHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewUserAdminRepository(pool)
}

func (h *UserAdminHandler) dbReady() bool { return h.repo != nil }

// ListUsers handles GET /api/users — admin.
func (h *UserAdminHandler) ListUsers(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	users, err := h.repo.ListUsers(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list users")
	}
	if users == nil {
		users = []postgres.AdminUser{}
	}
	return c.JSON(http.StatusOK, users)
}

// UpdateRole handles PATCH /api/users/:id/role — admin.
func (h *UserAdminHandler) UpdateRole(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Role != "admin" && req.Role != "user" {
		return echo.NewHTTPError(http.StatusBadRequest, "Valid role (admin | user) is required.")
	}

	if err := h.repo.UpdateRole(c.Request().Context(), id, req.Role); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Benutzer nicht gefunden."})
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

// DeleteUser handles DELETE /api/users/:id — admin.
func (h *UserAdminHandler) DeleteUser(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}

	if err := h.repo.DeleteUser(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Benutzer nicht gefunden."})
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
