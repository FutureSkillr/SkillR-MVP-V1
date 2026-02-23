package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"skillr-mvp-v1/backend/internal/ai"
	"skillr-mvp-v1/backend/internal/config"
	"skillr-mvp-v1/backend/internal/domain/lernreise"
	"skillr-mvp-v1/backend/internal/domain/session"
	"skillr-mvp-v1/backend/internal/firebase"
	"skillr-mvp-v1/backend/internal/gateway"
	"skillr-mvp-v1/backend/internal/honeycomb"
	"skillr-mvp-v1/backend/internal/memory"
	"skillr-mvp-v1/backend/internal/middleware"
	"skillr-mvp-v1/backend/internal/postgres"
	"skillr-mvp-v1/backend/internal/redis"
	"skillr-mvp-v1/backend/internal/server"
	"skillr-mvp-v1/backend/internal/solid"
)

// version is set at build time via ldflags: -X main.version=<git-sha>
var version = "dev"

func main() {
	if err := run(); err != nil {
		log.Fatalf("fatal: %v", err)
	}
}

func run() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	cfg.LogStatus()
	log.Printf("starting Future SkillR backend on :%s", cfg.Port)

	// Create server and register routes with nil deps first.
	// Cloud Run needs the port open fast — connect to DB afterward.
	srv := server.New(cfg)

	healthH := server.NewHealthHandler(nil, nil, version, cfg.HealthCheckToken)
	configH := server.NewConfigHandler(cfg)
	authH := server.NewAuthHandler(nil)

	// Session handler created early with nil repo (DB connected later via SetRepo)
	sessionSvc := session.NewService(nil)
	sessionH := session.NewHandler(sessionSvc)

	deps := &server.Dependencies{
		Health:  healthH,
		ConfigH: configH,
		Auth:    authH,
		Session: sessionH,
	}

	// Initialize AI handler if GCP project is configured
	if cfg.GCPProject != "" {
		aiClient, err := ai.NewVertexAIClient(ctx, cfg.GCPProject, cfg.GCPRegion, cfg.GCPTTSRegion)
		if err != nil {
			log.Printf("warning: AI service unavailable: %v (passthrough mode disabled)", err)
		} else {
			orch := ai.NewPassthroughOrchestrator()
			deps.AI = ai.NewHandler(aiClient, orch)
			healthH.SetAI(true)
			log.Printf("AI service initialized (project=%s, region=%s, ttsRegion=%s)", cfg.GCPProject, cfg.GCPRegion, cfg.GCPTTSRegion)
			// Close AI client on shutdown
			defer func() { _ = aiClient.Close() }()
		}
	} else {
		log.Println("warning: GCP_PROJECT_ID not set — AI routes disabled")
	}

	// Initialize Honeycomb + Memory clients if configured (FR-072, FR-073)
	if cfg.HoneycombURL != "" && cfg.MemoryServiceURL != "" {
		hcClient := honeycomb.NewHTTPClient(cfg.HoneycombURL, cfg.HoneycombAPIKey)
		memClient := memory.NewHTTPClient(cfg.MemoryServiceURL, cfg.MemoryServiceAPIKey)

		// Lernreise service uses a nil repo until DB is connected (same pattern as auth)
		lrSvc := lernreise.NewService(nil, hcClient, memClient)
		deps.Lernreise = lernreise.NewHandler(lrSvc)
		healthH.SetHoneycomb(true)
		log.Printf("Honeycomb integration initialized (url=%s)", cfg.HoneycombURL)
	} else {
		log.Println("warning: HONEYCOMB_URL or MEMORY_SERVICE_URL not set — Lernreise routes disabled")
	}

	// Initialize Solid Pod client if configured (FR-076)
	var solidSvc *solid.Service
	if cfg.SolidPodEnabled && cfg.SolidPodURL != "" {
		solidClient := solid.NewHTTPClient(cfg.SolidPodURL)
		solidSvc = solid.NewService(solidClient, nil) // DB connected later
		deps.Pod = solid.NewHandler(solidSvc)
		log.Printf("Solid Pod integration initialized (url=%s)", cfg.SolidPodURL)
	} else {
		log.Println("warning: SOLID_POD_ENABLED not set or SOLID_POD_URL empty — Pod routes disabled")
	}

	// Initialize Firebase auth middleware if configured (FR-056)
	if cfg.FirebaseProject != "" {
		fbClient, err := firebase.NewClient(ctx, cfg.FirebaseProject)
		if err != nil {
			log.Printf("warning: Firebase unavailable: %v (auth middleware disabled)", err)
		} else {
			defer fbClient.Close()
			deps.FirebaseAuthMiddleware = middleware.FirebaseAuth(fbClient)
			deps.OptionalFirebaseAuth = middleware.OptionalFirebaseAuth(fbClient)
			log.Printf("Firebase auth initialized (project=%s)", cfg.FirebaseProject)
		}
	}

	// Fallback: use local session auth when Firebase is not configured (local dev)
	if deps.FirebaseAuthMiddleware == nil {
		deps.FirebaseAuthMiddleware = middleware.LocalSessionAuth()
		log.Println("Firebase not configured — using local session auth for admin routes")
	}

	// Initialize rate limiters with in-memory fallback (FR-060)
	// Redis client is connected later; SetClient upgrades to Redis-backed.
	rl := redis.NewRateLimiter(nil)
	deps.AIRateLimit = middleware.RateLimit(rl, "ai", 30, time.Minute)
	deps.EndorsementRateLimit = middleware.RateLimit(rl, "endorsement", 10, time.Minute)
	log.Println("rate limiters initialized (in-memory fallback)")

	// Initialize gateway handlers (created early with nil DB, SetDB called after pool connects)
	gwAnalytics := gateway.NewAnalyticsHandler()
	gwLegal := gateway.NewLegalHandler()
	gwUserAdmin := gateway.NewUserAdminHandler()
	gwPromptLogs := gateway.NewPromptLogHandler()
	gwBrand := gateway.NewBrandHandler()
	gwCampaigns := gateway.NewCampaignHandler()
	gwContentPack := gateway.NewContentPackHandler()

	deps.GatewayAnalytics = gwAnalytics
	deps.GatewayLegal = gwLegal
	deps.GatewayUserAdmin = gwUserAdmin
	deps.GatewayPromptLogs = gwPromptLogs
	deps.GatewayCapacity = gateway.NewCapacityHandler()
	deps.GatewayBrand = gwBrand
	deps.GatewayCampaigns = gwCampaigns
	deps.GatewayContentPack = gwContentPack

	server.RegisterRoutes(srv.Echo, deps)
	server.RegisterStaticRoutes(srv.Echo, cfg.StaticDir)

	// Start HTTP server immediately
	go func() {
		if err := srv.Start(); err != nil {
			if err.Error() != "http: Server closed" {
				log.Fatalf("server: %v", err)
			}
		}
	}()

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("shutting down...")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()

		if err := srv.Echo.Shutdown(shutdownCtx); err != nil {
			log.Printf("shutdown error: %v", err)
		}
	}()

	// --- Connect to dependencies (server already listening) ---

	// Run migrations if requested
	if cfg.RunMigrations {
		log.Println("running database migrations...")
		if err := runMigrations(cfg); err != nil {
			log.Printf("ERROR: migrations failed: %v", err)
		} else {
			log.Println("migrations complete")
		}
	}

	// Connect to PostgreSQL
	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Printf("ERROR: postgres unavailable: %v", err)
	} else {
		defer pool.Close()
		log.Println("connected to PostgreSQL")
		healthH.SetDB(pool)
		authH.SetDB(pool)
		if solidSvc != nil {
			solidSvc.SetDB(pool)
		}

		// Inject DB into session service (created earlier with nil repo)
		sessionSvc.SetRepo(postgres.NewSessionRepository(pool))

		// Inject DB into gateway handlers (created earlier with nil DB)
		gwAnalytics.SetDB(pool)
		gwLegal.SetDB(pool)
		gwUserAdmin.SetDB(pool)
		gwPromptLogs.SetDB(pool)
		gwBrand.SetDB(pool)
		gwCampaigns.SetDB(pool)
		gwContentPack.SetDB(pool)
		log.Println("gateway handlers connected to PostgreSQL")

		// Seed default admin user if the users table is empty
		authH.SeedAdmin(ctx, cfg.AdminSeedEmail, cfg.AdminSeedPassword)
	}

	// Connect to Redis (optional)
	redisClient, err := redis.NewClient(ctx, cfg.RedisURL)
	if err != nil {
		log.Printf("warning: redis unavailable: %v", err)
	} else if redisClient != nil {
		defer func() { _ = redisClient.Close() }()
		log.Println("connected to Redis")
		healthH.SetRedis(redisClient)

		// Upgrade rate limiters from in-memory to Redis-backed (FR-060)
		rl.SetClient(redisClient)
		log.Println("rate limiters upgraded to Redis-backed")
	}

	// Block until shutdown
	<-ctx.Done()
	log.Println("server stopped")
	return nil
}

func runMigrations(cfg *config.Config) error {
	// L16: Validate migration path is within expected directory
	if strings.Contains(cfg.MigrationsPath, "..") {
		return fmt.Errorf("invalid migration path: must not contain '..'")
	}

	m, err := migrate.New(
		fmt.Sprintf("file://%s", cfg.MigrationsPath),
		cfg.DatabaseURL,
	)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}
	defer func() { _, _ = m.Close() }()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("apply migrations: %w", err)
	}
	return nil
}
