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
		pod := v1.Group("/pod")
		pod.POST("/connect", deps.Pod.Connect)
		pod.DELETE("/connect", deps.Pod.Disconnect)
		pod.GET("/status", deps.Pod.Status)
		pod.POST("/sync", deps.Pod.Sync)
		pod.GET("/data", deps.Pod.Data)
	}

	// AI endpoints — registered outside v1 auth group with optional auth.
	// The intro flow (coach selection, onboarding chat) happens before user login,
	// so AI routes must work without Firebase auth.
	if deps.AI != nil {
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
}

// Dependencies holds all handler instances for route wiring.
type Dependencies struct {
	Health                  *HealthHandler
	ConfigH                 *ConfigHandler
	Auth                    *AuthHandler
	Session                 SessionHandler
	Reflection              ReflectionHandler
	Profile                 ProfileHandler
	Evidence                EvidenceHandler
	Endorsement             EndorsementHandler
	Artifact                ArtifactHandler
	Journal                 JournalHandler
	Engagement              EngagementHandler
	Lernreise               LernreiseHandler
	Pod                     PodHandler
	AI                      AIHandler
	AdminPrompts            AdminPromptHandler
	AdminAgents             AdminAgentHandler
	FirebaseAuthMiddleware  echo.MiddlewareFunc // C1/H8: auth middleware for v1 group
	OptionalFirebaseAuth    echo.MiddlewareFunc // optional auth for AI routes (intro flow)
	EndorsementRateLimit    echo.MiddlewareFunc // H9: rate limit for public endorsement submit
	AIRateLimit             echo.MiddlewareFunc // rate limit for public AI endpoints
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

type PodHandler interface {
	Connect(c echo.Context) error
	Disconnect(c echo.Context) error
	Status(c echo.Context) error
	Sync(c echo.Context) error
	Data(c echo.Context) error
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
