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

	"github.com/FutureSkillr/MVP72/backend/internal/ai"
	"github.com/FutureSkillr/MVP72/backend/internal/config"
	"github.com/FutureSkillr/MVP72/backend/internal/domain/lernreise"
	"github.com/FutureSkillr/MVP72/backend/internal/honeycomb"
	"github.com/FutureSkillr/MVP72/backend/internal/memory"
	"github.com/FutureSkillr/MVP72/backend/internal/postgres"
	"github.com/FutureSkillr/MVP72/backend/internal/redis"
	"github.com/FutureSkillr/MVP72/backend/internal/server"
	"github.com/FutureSkillr/MVP72/backend/internal/solid"
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

	deps := &server.Dependencies{
		Health:  healthH,
		ConfigH: configH,
		Auth:    authH,
	}

	// Initialize AI handler if GCP project is configured
	if cfg.GCPProject != "" {
		aiClient, err := ai.NewVertexAIClient(ctx, cfg.GCPProject, cfg.GCPRegion)
		if err != nil {
			log.Printf("warning: AI service unavailable: %v (passthrough mode disabled)", err)
		} else {
			orch := ai.NewPassthroughOrchestrator()
			deps.AI = ai.NewHandler(aiClient, orch)
			healthH.SetAI(true)
			log.Printf("AI service initialized (project=%s, region=%s)", cfg.GCPProject, cfg.GCPRegion)
			// Close AI client on shutdown
			defer aiClient.Close()
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

		// Seed default admin user if the users table is empty
		authH.SeedAdmin(ctx)
	}

	// Connect to Redis (optional)
	redisClient, err := redis.NewClient(ctx, cfg.RedisURL)
	if err != nil {
		log.Printf("warning: redis unavailable: %v", err)
	} else if redisClient != nil {
		defer redisClient.Close()
		log.Println("connected to Redis")
		healthH.SetRedis(redisClient)
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
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("apply migrations: %w", err)
	}
	return nil
}
