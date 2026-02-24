package server

import (
	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/middleware"
)

// RegisterRoutes wires all route groups.
// Called from main.go after creating handlers.
func RegisterRoutes(e *echo.Echo, deps *Dependencies) {
	// Public endpoints (no auth)
	e.GET("/api/health", deps.Health.Health)
	e.GET("/api/health/detailed", deps.Health.DetailedHealth)
	e.GET("/api/config", deps.ConfigH.Config)

	// Local auth (used when Firebase is not configured)
	if deps.Auth != nil {
		e.POST("/api/auth/login", deps.Auth.Login)
		e.POST("/api/auth/register", deps.Auth.Register)
		e.POST("/api/auth/login-provider", deps.Auth.LoginProvider)
		e.POST("/api/auth/reset-password", deps.Auth.ResetPassword)
		// User deletion endpoint — DSGVO Art. 17
		e.DELETE("/api/auth/account", deps.Auth.DeleteAccount)
	}

	// API v1 group — apply FirebaseAuth middleware if available (C1/H8)
	var v1Middlewares []echo.MiddlewareFunc
	if deps.FirebaseAuthMiddleware != nil {
		v1Middlewares = append(v1Middlewares, deps.FirebaseAuthMiddleware)
	}
	v1 := e.Group("/api/v1", v1Middlewares...)

	// Sessions
	if deps.Session != nil {
		v1.GET("/sessions", deps.Session.List)
		v1.POST("/sessions", deps.Session.Create)
		v1.GET("/sessions/:id", deps.Session.Get)
		v1.PUT("/sessions/:id", deps.Session.Update)
		v1.DELETE("/sessions/:id", deps.Session.Delete)
	}

	// Reflections
	if deps.Reflection != nil {
		v1.GET("/portfolio/reflections", deps.Reflection.List)
		v1.POST("/portfolio/reflections", deps.Reflection.Submit)
		v1.GET("/portfolio/reflections/capabilities", deps.Reflection.Capabilities)
	}

	// Profile
	if deps.Profile != nil {
		v1.GET("/portfolio/profile", deps.Profile.Get)
		v1.POST("/portfolio/profile/compute", deps.Profile.Compute)
		v1.GET("/portfolio/profile/history", deps.Profile.History)
		v1.GET("/portfolio/profile/export", deps.Profile.Export)
	}
	// Public profile (no auth)
	if deps.Profile != nil {
		e.GET("/api/v1/portfolio/profile/public/:userId", deps.Profile.Public)
	}

	// Evidence
	if deps.Evidence != nil {
		v1.GET("/portfolio/evidence", deps.Evidence.List)
		v1.POST("/portfolio/evidence", deps.Evidence.Create)
		v1.GET("/portfolio/evidence/:id", deps.Evidence.Get)
		v1.GET("/portfolio/evidence/by-dimension/:dim", deps.Evidence.ByDimension)
	}
	// Public verification (no auth) — L12: POST preferred, GET kept for email links
	if deps.Evidence != nil {
		e.GET("/api/v1/portfolio/evidence/verify/:id", deps.Evidence.Verify)
		e.POST("/api/v1/portfolio/evidence/verify/:id", deps.Evidence.Verify)
	}

	// Endorsements
	if deps.Endorsement != nil {
		v1.GET("/portfolio/endorsements", deps.Endorsement.List)
		v1.POST("/portfolio/endorsements/invite", deps.Endorsement.Invite)
		v1.GET("/portfolio/endorsements/pending", deps.Endorsement.Pending)
		v1.PUT("/portfolio/endorsements/:id/visibility", deps.Endorsement.Visibility)
	}
	// Public submit (no auth, but rate limited — H9)
	if deps.Endorsement != nil {
		endorseGroup := e.Group("/api/v1/portfolio/endorsements-public")
		if deps.EndorsementRateLimit != nil {
			endorseGroup.Use(deps.EndorsementRateLimit)
		}
		endorseGroup.POST("", deps.Endorsement.Submit)
		// Keep legacy path for backwards compat but rate limited
		e.POST("/api/v1/portfolio/endorsements", deps.Endorsement.Submit)
	}

	// Artifacts
	if deps.Artifact != nil {
		v1.GET("/portfolio/artifacts", deps.Artifact.List)
		v1.POST("/portfolio/artifacts", deps.Artifact.Upload)
		v1.GET("/portfolio/artifacts/:id", deps.Artifact.Get)
		v1.DELETE("/portfolio/artifacts/:id", deps.Artifact.Delete)
		v1.POST("/portfolio/artifacts/:id/link-endorsement", deps.Artifact.LinkEndorsement)
	}

	// Portfolio Entries
	if deps.PortfolioEntries != nil {
		entries := v1.Group("/portfolio/entries")
		entries.GET("", deps.PortfolioEntries.List)
		entries.POST("", deps.PortfolioEntries.Create)
		entries.PUT("/:id", deps.PortfolioEntries.Update)
		entries.DELETE("/:id", deps.PortfolioEntries.Delete)
		entries.POST("/demo", deps.PortfolioEntries.CreateDemo)
		v1.GET("/portfolio/export", deps.PortfolioEntries.Export)
		// Public page (no auth)
		e.GET("/api/v1/portfolio/page/:userId", deps.PortfolioEntries.PublicPage)
	}

	// Journal
	if deps.Journal != nil {
		v1.GET("/portfolio/journal", deps.Journal.List)
		v1.GET("/portfolio/journal/station/:stationId", deps.Journal.ByStation)
		v1.GET("/portfolio/journal/dimension/:dim", deps.Journal.ByDimension)
		v1.POST("/portfolio/journal/interactions", deps.Journal.Record)
	}

	// Engagement
	if deps.Engagement != nil {
		v1.GET("/portfolio/engagement", deps.Engagement.Get)
		v1.POST("/portfolio/engagement/award", deps.Engagement.Award)
		v1.GET("/portfolio/engagement/leaderboard", deps.Engagement.Leaderboard)
	}

	// Lernreise (FR-074, FR-075)
	if deps.Lernreise != nil {
		lr := v1.Group("/lernreise")
		lr.GET("/catalog", deps.Lernreise.ListCatalog)
		lr.GET("/catalog/:dataId", deps.Lernreise.GetCatalogDetail)
		lr.POST("/select", deps.Lernreise.Select)
		lr.GET("/active", deps.Lernreise.GetActive)
		lr.GET("/instances", deps.Lernreise.ListInstances)
		lr.GET("/instances/:id", deps.Lernreise.GetInstance)
		lr.POST("/instances/:id/submit", deps.Lernreise.SubmitTask)
		lr.GET("/instances/:id/progress", deps.Lernreise.GetProgress)
	}

	// Pod endpoints (FR-076, FR-077, FR-078)
	if deps.Pod != nil {
		// Readiness probe — public, no auth (FR-127)
		e.GET("/api/v1/pod/readiness", deps.Pod.Readiness)

		pod := v1.Group("/pod")
		pod.POST("/connect", deps.Pod.Connect)
		pod.DELETE("/connect", deps.Pod.Disconnect)
		pod.GET("/status", deps.Pod.Status)
		pod.POST("/sync", deps.Pod.Sync)
		pod.GET("/data", deps.Pod.Data)
	} else {
		// Fallback: Solid not configured — readiness always returns unavailable (FR-127)
		e.GET("/api/v1/pod/readiness", func(c echo.Context) error {
			return c.JSON(200, map[string]interface{}{
				"available": false,
				"reason":    "not_configured",
			})
		})
	}

	// AI endpoints — registered outside v1 auth group with optional auth.
	// The intro flow (coach selection, onboarding chat) happens before user login,
	// so AI routes must work without Firebase auth.
	if deps.AI != nil {
		// AI status — public, no auth, no rate limit (lightweight ping)
		e.GET("/api/v1/ai/status", deps.AI.Status)

		var aiMiddlewares []echo.MiddlewareFunc
		if deps.OptionalFirebaseAuth != nil {
			aiMiddlewares = append(aiMiddlewares, deps.OptionalFirebaseAuth)
		}
		if deps.AIRateLimit != nil {
			aiMiddlewares = append(aiMiddlewares, deps.AIRateLimit)
		}
		ai := e.Group("/api/v1/ai", aiMiddlewares...)
		ai.POST("/chat", deps.AI.Chat)
		ai.POST("/extract", deps.AI.Extract)
		ai.POST("/generate", deps.AI.Generate)
		ai.POST("/tts", deps.AI.TTS)
		ai.POST("/stt", deps.AI.STT)

		// Compatibility aliases: /api/gemini/* → delegate to existing AI handler.
		// The frontend calls /api/gemini/chat, /api/gemini/tts, etc.
		gemini := e.Group("/api/gemini", aiMiddlewares...)
		gemini.POST("/chat", deps.AI.Chat)
		gemini.POST("/extract-insights", deps.AI.Extract)
		gemini.POST("/extract-station-result", deps.AI.Extract)
		gemini.POST("/generate-curriculum", deps.AI.Generate)
		gemini.POST("/generate-course", deps.AI.Generate)
		gemini.POST("/tts", deps.AI.TTS)
		gemini.POST("/stt", deps.AI.STT)
	}

	// Compatibility aliases: /api/sessions → delegate to existing Session handler.
	// The frontend calls /api/sessions directly (Express gateway path).
	if deps.Session != nil {
		var sessionMiddlewares []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			sessionMiddlewares = append(sessionMiddlewares, deps.FirebaseAuthMiddleware)
		}
		sessCompat := e.Group("/api/sessions", sessionMiddlewares...)
		sessCompat.GET("", deps.Session.List)
		sessCompat.POST("", deps.Session.Create)
		sessCompat.GET("/:id", deps.Session.Get)
		sessCompat.PUT("/:id", deps.Session.Update)
		sessCompat.PATCH("/:id/end", deps.Session.Update)
		sessCompat.DELETE("/:id", deps.Session.Delete)
	}

	// Admin: Infrastructure status (FR-126 — requires admin role)
	{
		var infraAdminMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			infraAdminMws = append(infraAdminMws, deps.FirebaseAuthMiddleware)
		}
		infraAdminMws = append(infraAdminMws, middleware.RequireAdmin())
		e.GET("/api/admin/infra", deps.Health.InfraStatus, infraAdminMws...)
	}

	// Admin: Prompts (requires admin role)
	if deps.AdminPrompts != nil {
		prompts := v1.Group("/prompts", middleware.RequireAdmin())
		prompts.GET("", deps.AdminPrompts.List)
		prompts.GET("/:promptId", deps.AdminPrompts.Get)
		prompts.PUT("/:promptId", deps.AdminPrompts.Update)
		prompts.POST("/:promptId/test", deps.AdminPrompts.Test)
		prompts.GET("/:promptId/history", deps.AdminPrompts.History)
	}

	// Admin: Agents (requires admin role)
	if deps.AdminAgents != nil {
		agents := v1.Group("/agents", middleware.RequireAdmin())
		agents.GET("", deps.AdminAgents.List)
		agents.GET("/:agentId", deps.AdminAgents.Get)
		agents.PUT("/:agentId", deps.AdminAgents.Update)
		agents.GET("/:agentId/executions", deps.AdminAgents.Executions)
		agents.POST("/:agentId/invoke", deps.AdminAgents.Invoke)
	}

	// --- Gateway routes (ported from Express gateway) ---

	// Analytics — public endpoints (rate-limited)
	if deps.GatewayAnalytics != nil {
		e.POST("/api/analytics/events", deps.GatewayAnalytics.BatchInsert)
		e.POST("/api/analytics/consent", deps.GatewayAnalytics.LogConsent)

		// Analytics — admin endpoints
		var adminAnalyticsMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			adminAnalyticsMws = append(adminAnalyticsMws, deps.FirebaseAuthMiddleware)
		}
		adminAnalyticsMws = append(adminAnalyticsMws, middleware.RequireAdmin())
		analyticsAdmin := e.Group("/api/analytics", adminAnalyticsMws...)
		analyticsAdmin.GET("/events", deps.GatewayAnalytics.QueryEvents)
		analyticsAdmin.GET("/overview", deps.GatewayAnalytics.Overview)
		analyticsAdmin.GET("/sessions/:id", deps.GatewayAnalytics.SessionEvents)
		analyticsAdmin.GET("/export-csv", deps.GatewayAnalytics.ExportCSV)
		analyticsAdmin.DELETE("/events", deps.GatewayAnalytics.DeleteEvents)
	}

	// Legal config
	if deps.GatewayLegal != nil {
		e.GET("/api/config/legal", deps.GatewayLegal.GetLegal)

		var adminLegalMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			adminLegalMws = append(adminLegalMws, deps.FirebaseAuthMiddleware)
		}
		adminLegalMws = append(adminLegalMws, middleware.RequireAdmin())
		legalAdmin := e.Group("/api/config", adminLegalMws...)
		legalAdmin.PUT("/legal", deps.GatewayLegal.PutLegal)
	}

	// User admin
	if deps.GatewayUserAdmin != nil {
		var userAdminMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			userAdminMws = append(userAdminMws, deps.FirebaseAuthMiddleware)
		}
		userAdminMws = append(userAdminMws, middleware.RequireAdmin())
		users := e.Group("/api/users", userAdminMws...)
		users.GET("", deps.GatewayUserAdmin.ListUsers)
		users.PATCH("/:id/role", deps.GatewayUserAdmin.UpdateRole)
		users.DELETE("/:id", deps.GatewayUserAdmin.DeleteUser)
	}

	// Prompt logs
	if deps.GatewayPromptLogs != nil {
		// POST uses optional auth — intro flow calls this before user login (OBS-003)
		var promptLogAuthMws []echo.MiddlewareFunc
		if deps.OptionalFirebaseAuth != nil {
			promptLogAuthMws = append(promptLogAuthMws, deps.OptionalFirebaseAuth)
		}
		e.POST("/api/prompt-logs", deps.GatewayPromptLogs.LogPrompt, promptLogAuthMws...)

		// Admin endpoints
		var promptLogAdminMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			promptLogAdminMws = append(promptLogAdminMws, deps.FirebaseAuthMiddleware)
		}
		promptLogAdminMws = append(promptLogAdminMws, middleware.RequireAdmin())
		promptAdmin := e.Group("/api/prompt-logs", promptLogAdminMws...)
		promptAdmin.GET("", deps.GatewayPromptLogs.QueryLogs)
		promptAdmin.GET("/stats", deps.GatewayPromptLogs.Stats)
		promptAdmin.GET("/export-csv", deps.GatewayPromptLogs.ExportCSV)
		promptAdmin.DELETE("", deps.GatewayPromptLogs.DeleteAll)
	}

	// Capacity
	if deps.GatewayCapacity != nil {
		e.GET("/api/capacity", deps.GatewayCapacity.GetCapacity)
		e.POST("/api/capacity/book", deps.GatewayCapacity.BookSlot)
	}

	// Campaigns
	if deps.GatewayCampaigns != nil {
		var campaignAdminMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			campaignAdminMws = append(campaignAdminMws, deps.FirebaseAuthMiddleware)
		}
		campaignAdminMws = append(campaignAdminMws, middleware.RequireAdmin())
		campaigns := e.Group("/api/campaigns", campaignAdminMws...)
		campaigns.GET("", deps.GatewayCampaigns.List)
		campaigns.POST("", deps.GatewayCampaigns.Create)
		campaigns.PUT("/:id", deps.GatewayCampaigns.Update)
		campaigns.DELETE("/:id", deps.GatewayCampaigns.Archive)
		campaigns.GET("/:id/stats", deps.GatewayCampaigns.Stats)
	}

	// Brand
	if deps.GatewayBrand != nil {
		// Public: get by slug
		e.GET("/api/brand/:slug", deps.GatewayBrand.GetBySlug)
		// Public: list active partners
		e.GET("/api/v1/partners", deps.GatewayBrand.ListPublic)

		// Admin endpoints
		var brandAdminMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			brandAdminMws = append(brandAdminMws, deps.FirebaseAuthMiddleware)
		}
		brandAdminMws = append(brandAdminMws, middleware.RequireAdmin())
		brandAdmin := e.Group("/api/brand", brandAdminMws...)
		brandAdmin.GET("", deps.GatewayBrand.List)
		brandAdmin.POST("", deps.GatewayBrand.Create)

		// Update requires auth but allows admin or sponsor_admin
		var brandAuthMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			brandAuthMws = append(brandAuthMws, deps.FirebaseAuthMiddleware)
		}
		e.PUT("/api/brand/:slug", deps.GatewayBrand.Update, brandAuthMws...)
		e.DELETE("/api/brand/:slug", deps.GatewayBrand.Deactivate, brandAdminMws...)
	}

	// Content Pack — public endpoints (FR-116, FR-119)
	if deps.GatewayContentPack != nil {
		e.GET("/api/v1/content-pack", deps.GatewayContentPack.Get)
		e.GET("/api/v1/content-pack/brand/:slug", deps.GatewayContentPack.GetByBrand)

		// Brand content pack management — admin/sponsor_admin (FR-119)
		var brandPackMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			brandPackMws = append(brandPackMws, deps.FirebaseAuthMiddleware)
		}
		e.GET("/api/brand/:slug/content-packs", deps.GatewayContentPack.ListBrandPacks, brandPackMws...)
		e.PUT("/api/brand/:slug/content-packs/:packId", deps.GatewayContentPack.ToggleBrandPack, brandPackMws...)

		// Admin CRUD for content packs (FR-124)
		var cpAdminMws []echo.MiddlewareFunc
		if deps.FirebaseAuthMiddleware != nil {
			cpAdminMws = append(cpAdminMws, deps.FirebaseAuthMiddleware)
		}
		cpAdminMws = append(cpAdminMws, middleware.RequireAdmin())
		cpAdmin := e.Group("/api/admin/content-packs", cpAdminMws...)
		cpAdmin.GET("", deps.GatewayContentPack.AdminListPacks)
		cpAdmin.POST("", deps.GatewayContentPack.AdminCreatePack)
		cpAdmin.PUT("/:id", deps.GatewayContentPack.AdminUpdatePack)
		cpAdmin.DELETE("/:id", deps.GatewayContentPack.AdminDeletePack)
		cpAdmin.GET("/:id/lernreisen", deps.GatewayContentPack.AdminListPackLernreisen)
		cpAdmin.POST("/:id/lernreisen", deps.GatewayContentPack.AdminCreateLernreise)
		cpAdmin.PUT("/:id/lernreisen/order", deps.GatewayContentPack.AdminReorderLernreisen)
		cpAdmin.PUT("/:id/lernreisen/:lrId", deps.GatewayContentPack.AdminUpdateLernreise)
		cpAdmin.DELETE("/:id/lernreisen/:lrId", deps.GatewayContentPack.AdminDeleteLernreise)
	}
}

// Dependencies holds all handler instances for route wiring.
type Dependencies struct {
	Health                 *HealthHandler
	ConfigH                *ConfigHandler
	Auth                   *AuthHandler
	Session                SessionHandler
	Reflection             ReflectionHandler
	Profile                ProfileHandler
	Evidence               EvidenceHandler
	Endorsement            EndorsementHandler
	Artifact               ArtifactHandler
	Journal                JournalHandler
	Engagement             EngagementHandler
	Lernreise              LernreiseHandler
	PortfolioEntries       PortfolioEntriesHandler
	Pod                    PodHandler
	AI                     AIHandler
	AdminPrompts           AdminPromptHandler
	AdminAgents            AdminAgentHandler
	FirebaseAuthMiddleware echo.MiddlewareFunc // C1/H8: auth middleware for v1 group
	OptionalFirebaseAuth   echo.MiddlewareFunc // optional auth for AI routes (intro flow)
	EndorsementRateLimit   echo.MiddlewareFunc // H9: rate limit for public endorsement submit
	AIRateLimit            echo.MiddlewareFunc // rate limit for public AI endpoints
	// Gateway handlers (ported from Express gateway)
	GatewayAnalytics   GatewayAnalyticsHandler
	GatewayLegal       GatewayLegalHandler
	GatewayUserAdmin   GatewayUserAdminHandler
	GatewayPromptLogs  GatewayPromptLogHandler
	GatewayCapacity    GatewayCapacityHandler
	GatewayBrand       GatewayBrandHandler
	GatewayCampaigns   GatewayCampaignHandler
	GatewayContentPack GatewayContentPackHandler
}

// Handler interfaces — each domain package implements these
type SessionHandler interface {
	List(c echo.Context) error
	Create(c echo.Context) error
	Get(c echo.Context) error
	Update(c echo.Context) error
	Delete(c echo.Context) error
}

type ReflectionHandler interface {
	List(c echo.Context) error
	Submit(c echo.Context) error
	Capabilities(c echo.Context) error
}

type ProfileHandler interface {
	Get(c echo.Context) error
	Compute(c echo.Context) error
	History(c echo.Context) error
	Public(c echo.Context) error
	Export(c echo.Context) error
}

type EvidenceHandler interface {
	List(c echo.Context) error
	Create(c echo.Context) error
	Get(c echo.Context) error
	ByDimension(c echo.Context) error
	Verify(c echo.Context) error
}

type EndorsementHandler interface {
	List(c echo.Context) error
	Submit(c echo.Context) error
	Invite(c echo.Context) error
	Pending(c echo.Context) error
	Visibility(c echo.Context) error
}

type ArtifactHandler interface {
	List(c echo.Context) error
	Upload(c echo.Context) error
	Get(c echo.Context) error
	Delete(c echo.Context) error
	LinkEndorsement(c echo.Context) error
}

type JournalHandler interface {
	List(c echo.Context) error
	ByStation(c echo.Context) error
	ByDimension(c echo.Context) error
	Record(c echo.Context) error
}

type EngagementHandler interface {
	Get(c echo.Context) error
	Award(c echo.Context) error
	Leaderboard(c echo.Context) error
}

type AIHandler interface {
	Chat(c echo.Context) error
	Extract(c echo.Context) error
	Generate(c echo.Context) error
	TTS(c echo.Context) error
	STT(c echo.Context) error
	Status(c echo.Context) error
}

type AdminPromptHandler interface {
	List(c echo.Context) error
	Get(c echo.Context) error
	Update(c echo.Context) error
	Test(c echo.Context) error
	History(c echo.Context) error
}

type AdminAgentHandler interface {
	List(c echo.Context) error
	Get(c echo.Context) error
	Update(c echo.Context) error
	Executions(c echo.Context) error
	Invoke(c echo.Context) error
}

type PortfolioEntriesHandler interface {
	List(c echo.Context) error
	Create(c echo.Context) error
	Update(c echo.Context) error
	Delete(c echo.Context) error
	CreateDemo(c echo.Context) error
	Export(c echo.Context) error
	PublicPage(c echo.Context) error
}

type PodHandler interface {
	Connect(c echo.Context) error
	Disconnect(c echo.Context) error
	Status(c echo.Context) error
	Sync(c echo.Context) error
	Data(c echo.Context) error
	Readiness(c echo.Context) error
}

type LernreiseHandler interface {
	ListCatalog(c echo.Context) error
	GetCatalogDetail(c echo.Context) error
	Select(c echo.Context) error
	GetActive(c echo.Context) error
	ListInstances(c echo.Context) error
	GetInstance(c echo.Context) error
	SubmitTask(c echo.Context) error
	GetProgress(c echo.Context) error
}

// Gateway handler interfaces
type GatewayAnalyticsHandler interface {
	BatchInsert(c echo.Context) error
	LogConsent(c echo.Context) error
	QueryEvents(c echo.Context) error
	Overview(c echo.Context) error
	SessionEvents(c echo.Context) error
	ExportCSV(c echo.Context) error
	DeleteEvents(c echo.Context) error
}

type GatewayLegalHandler interface {
	GetLegal(c echo.Context) error
	PutLegal(c echo.Context) error
}

type GatewayUserAdminHandler interface {
	ListUsers(c echo.Context) error
	UpdateRole(c echo.Context) error
	DeleteUser(c echo.Context) error
}

type GatewayPromptLogHandler interface {
	LogPrompt(c echo.Context) error
	QueryLogs(c echo.Context) error
	Stats(c echo.Context) error
	ExportCSV(c echo.Context) error
	DeleteAll(c echo.Context) error
}

type GatewayCapacityHandler interface {
	GetCapacity(c echo.Context) error
	BookSlot(c echo.Context) error
}

type GatewayBrandHandler interface {
	GetBySlug(c echo.Context) error
	List(c echo.Context) error
	ListPublic(c echo.Context) error
	Create(c echo.Context) error
	Update(c echo.Context) error
	Deactivate(c echo.Context) error
}

type GatewayCampaignHandler interface {
	List(c echo.Context) error
	Create(c echo.Context) error
	Update(c echo.Context) error
	Archive(c echo.Context) error
	Stats(c echo.Context) error
}

type GatewayContentPackHandler interface {
	Get(c echo.Context) error
	GetByBrand(c echo.Context) error
	ListBrandPacks(c echo.Context) error
	ToggleBrandPack(c echo.Context) error
	// Admin CRUD (FR-124)
	AdminListPacks(c echo.Context) error
	AdminCreatePack(c echo.Context) error
	AdminUpdatePack(c echo.Context) error
	AdminDeletePack(c echo.Context) error
	AdminListPackLernreisen(c echo.Context) error
	AdminCreateLernreise(c echo.Context) error
	AdminUpdateLernreise(c echo.Context) error
	AdminDeleteLernreise(c echo.Context) error
	AdminReorderLernreisen(c echo.Context) error
}
