package gateway

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
	"skillr-mvp-v1/backend/internal/postgres"
)

// ContentPackHandler serves the Lernreise content pack.
type ContentPackHandler struct {
	repo *postgres.ContentPackRepository
}

// NewContentPackHandler creates a handler with nil DB (connected later via SetDB).
func NewContentPackHandler() *ContentPackHandler {
	return &ContentPackHandler{}
}

// SetDB injects the database connection pool.
func (h *ContentPackHandler) SetDB(pool *pgxpool.Pool) {
	h.repo = postgres.NewContentPackRepository(pool)
}

func (h *ContentPackHandler) dbReady() bool { return h.repo != nil }

// Get handles GET /api/v1/content-pack — returns Lernreisen.
// Optional query param ?brand=slug returns brand-aware results (defaults + brand-activated packs).
func (h *ContentPackHandler) Get(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	brand := c.QueryParam("brand")
	var lernreisen []postgres.Lernreise
	var err error
	if brand != "" {
		lernreisen, err = h.repo.ListLernreisenForBrand(c.Request().Context(), brand)
	} else {
		lernreisen, err = h.repo.ListLernreisen(c.Request().Context())
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load content pack")
	}

	if lernreisen == nil {
		lernreisen = []postgres.Lernreise{}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"lernreisen": lernreisen,
	})
}

// GetByBrand handles GET /api/v1/content-pack/brand/:slug — returns Lernreisen + packs for a partner brand.
func (h *ContentPackHandler) GetByBrand(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	slug := c.Param("slug")
	if slug == "" || !slugPattern.MatchString(slug) {
		return echo.NewHTTPError(http.StatusBadRequest, "valid brand slug required")
	}

	ctx := c.Request().Context()

	packs, err := h.repo.ListPacksByBrandSlug(ctx, slug)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load packs")
	}
	if packs == nil {
		packs = []postgres.ContentPack{}
	}

	lernreisen, err := h.repo.ListLernreisenByBrandSlug(ctx, slug)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load lernreisen")
	}
	if lernreisen == nil {
		lernreisen = []postgres.Lernreise{}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"packs":      packs,
		"lernreisen": lernreisen,
	})
}

// ListBrandPacks handles GET /api/brand/:slug/content-packs — admin/sponsor_admin.
// Returns all packs with their activation status for a specific brand.
func (h *ContentPackHandler) ListBrandPacks(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	slug := c.Param("slug")
	if slug == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "slug required")
	}

	packs, err := h.repo.ListBrandPacks(c.Request().Context(), slug)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load brand packs")
	}
	if packs == nil {
		packs = []postgres.BrandContentPack{}
	}

	return c.JSON(http.StatusOK, packs)
}

// --- Admin CRUD for Content Packs (FR-124) ---

// AdminListPacks handles GET /api/admin/content-packs — list all packs with Lernreise count.
func (h *ContentPackHandler) AdminListPacks(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	packs, err := h.repo.ListPacksWithCount(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list packs")
	}
	if packs == nil {
		packs = []postgres.ContentPackWithCount{}
	}
	return c.JSON(http.StatusOK, packs)
}

// AdminCreatePack handles POST /api/admin/content-packs — create a new pack.
func (h *ContentPackHandler) AdminCreatePack(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var pack postgres.ContentPack
	if err := c.Bind(&pack); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if pack.ID == "" || pack.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "id and name are required")
	}

	if err := h.repo.CreatePack(c.Request().Context(), pack); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create pack: "+err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":      pack.ID,
		"created": true,
	})
}

// AdminUpdatePack handles PUT /api/admin/content-packs/:id — update pack metadata.
func (h *ContentPackHandler) AdminUpdatePack(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	var pack postgres.ContentPack
	if err := c.Bind(&pack); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.repo.UpdatePack(c.Request().Context(), id, pack); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "pack not found")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":      id,
		"updated": true,
	})
}

// AdminDeletePack handles DELETE /api/admin/content-packs/:id — delete pack (CASCADE).
func (h *ContentPackHandler) AdminDeletePack(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	if err := h.repo.DeletePack(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "pack not found")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":      id,
		"deleted": true,
	})
}

// AdminListPackLernreisen handles GET /api/admin/content-packs/:id/lernreisen.
func (h *ContentPackHandler) AdminListPackLernreisen(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	packID := c.Param("id")
	if packID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	lernreisen, err := h.repo.ListLernreisenByPack(c.Request().Context(), packID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list lernreisen")
	}
	if lernreisen == nil {
		lernreisen = []postgres.Lernreise{}
	}

	return c.JSON(http.StatusOK, lernreisen)
}

// AdminCreateLernreise handles POST /api/admin/content-packs/:id/lernreisen.
func (h *ContentPackHandler) AdminCreateLernreise(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	packID := c.Param("id")
	if packID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	var lr postgres.Lernreise
	if err := c.Bind(&lr); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	lr.PackID = packID

	if lr.ID == "" || lr.Title == "" || lr.JourneyType == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "id, title, and journeyType are required")
	}

	if err := h.repo.CreateLernreise(c.Request().Context(), lr); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create lernreise: "+err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":      lr.ID,
		"created": true,
	})
}

// AdminUpdateLernreise handles PUT /api/admin/content-packs/:id/lernreisen/:lrId.
func (h *ContentPackHandler) AdminUpdateLernreise(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	lrID := c.Param("lrId")
	if lrID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "lernreise id required")
	}

	var lr postgres.Lernreise
	if err := c.Bind(&lr); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.repo.UpdateLernreise(c.Request().Context(), lrID, lr); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "lernreise not found")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":      lrID,
		"updated": true,
	})
}

// AdminDeleteLernreise handles DELETE /api/admin/content-packs/:id/lernreisen/:lrId.
func (h *ContentPackHandler) AdminDeleteLernreise(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	lrID := c.Param("lrId")
	if lrID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "lernreise id required")
	}

	if err := h.repo.DeleteLernreise(c.Request().Context(), lrID); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "lernreise not found")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":      lrID,
		"deleted": true,
	})
}

// AdminReorderLernreisen handles PUT /api/admin/content-packs/:id/lernreisen/order.
func (h *ContentPackHandler) AdminReorderLernreisen(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	packID := c.Param("id")
	if packID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	var body struct {
		OrderedIDs []string `json:"orderedIds"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if len(body.OrderedIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "orderedIds required")
	}

	if err := h.repo.ReorderLernreisen(c.Request().Context(), packID, body.OrderedIDs); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to reorder: "+err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"packId":    packID,
		"reordered": true,
	})
}

// --- Videoset Submissions (FR-131) ---

// AdminListSubmissions handles GET /api/admin/content-packs/:id/submissions.
func (h *ContentPackHandler) AdminListSubmissions(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	packID := c.Param("id")
	if packID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	subs, err := h.repo.ListSubmissions(c.Request().Context(), packID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list submissions")
	}
	if subs == nil {
		subs = []postgres.VideosetSubmission{}
	}

	return c.JSON(http.StatusOK, subs)
}

// AdminGetSubmission handles GET /api/admin/content-packs/:id/submissions/:subId.
func (h *ContentPackHandler) AdminGetSubmission(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	subID := c.Param("subId")
	if subID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "submission id required")
	}

	sub, err := h.repo.GetSubmission(c.Request().Context(), subID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "submission not found")
	}

	return c.JSON(http.StatusOK, sub)
}

// AdminCreateSubmission handles POST /api/admin/content-packs/:id/submissions.
func (h *ContentPackHandler) AdminCreateSubmission(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	packID := c.Param("id")
	if packID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pack id required")
	}

	var sub postgres.VideosetSubmission
	if err := c.Bind(&sub); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	sub.PackID = packID

	if sub.Title == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "title is required")
	}

	// Set submitted_by from auth context
	userInfo := middleware.GetUserInfo(c)
	if userInfo != nil {
		sub.SubmittedBy = userInfo.Email
	}

	created, err := h.repo.CreateSubmission(c.Request().Context(), sub)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create submission: "+err.Error())
	}

	return c.JSON(http.StatusCreated, created)
}

// AdminUpdateSubmission handles PUT /api/admin/content-packs/:id/submissions/:subId.
func (h *ContentPackHandler) AdminUpdateSubmission(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	subID := c.Param("subId")
	if subID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "submission id required")
	}

	var sub postgres.VideosetSubmission
	if err := c.Bind(&sub); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.repo.UpdateSubmission(c.Request().Context(), subID, sub); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "submission not found or not in draft status")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":      subID,
		"updated": true,
	})
}

// AdminSubmitSubmission handles POST /api/admin/content-packs/:id/submissions/:subId/submit.
func (h *ContentPackHandler) AdminSubmitSubmission(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	subID := c.Param("subId")
	if subID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "submission id required")
	}

	submittedBy := ""
	userInfo := middleware.GetUserInfo(c)
	if userInfo != nil {
		submittedBy = userInfo.Email
	}

	if err := h.repo.SubmitSubmission(c.Request().Context(), subID, submittedBy); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "submission not found or not in draft status")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":        subID,
		"submitted": true,
	})
}

// ToggleBrandPack handles PUT /api/brand/:slug/content-packs/:packId — admin/sponsor_admin.
func (h *ContentPackHandler) ToggleBrandPack(c echo.Context) error {
	if !h.dbReady() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	slug := c.Param("slug")
	packID := c.Param("packId")
	if slug == "" || packID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "slug and packId required")
	}

	userInfo := middleware.GetUserInfo(c)
	if userInfo == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
	}
	if userInfo.Role != "admin" && userInfo.Role != "sponsor_admin" {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Admin or sponsor_admin access required",
			"code":  "FORBIDDEN",
		})
	}

	var body struct {
		Active bool `json:"active"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.repo.ToggleBrandPack(c.Request().Context(), slug, packID, body.Active, userInfo.Email); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to toggle pack")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"brandSlug": slug,
		"packId":    packID,
		"active":    body.Active,
	})
}
