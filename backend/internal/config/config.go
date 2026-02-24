package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

// LogStatus logs the current configuration state at startup.
// Secrets are masked; only presence/absence is shown.
func (c *Config) LogStatus() {
	log.Println("=== Configuration Status ===")
	log.Printf("  Port:           %s", c.Port)
	log.Printf("  Database:       %s", maskDSN(c.DatabaseURL))
	log.Printf("  Redis:          %s", configured(c.RedisURL))
	log.Printf("  Firebase:       %s", configured(c.FirebaseProject))
	log.Printf("  GCP Project:    %s", configured(c.GCPProject))
	log.Printf("  GCP Region:     %s", c.GCPRegion)
	log.Printf("  GCP TTS Region: %s", c.GCPTTSRegion)
	log.Printf("  Honeycomb:      %s", configured(c.HoneycombURL))
	log.Printf("  Memory Service: %s", configured(c.MemoryServiceURL))
	log.Printf("  Solid Pod:      %s (enabled=%v)", configured(c.SolidPodURL), c.SolidPodEnabled)
	log.Printf("  Health Token:   %s", configured(c.HealthCheckToken))
	log.Printf("  CORS Origins:   %v", c.AllowedOrigins)
	log.Printf("  Admin Email:    %s", c.AdminSeedEmail)
	log.Printf("  Admin Password: %s", c.AdminSeedPassword)
	log.Printf("  LFS Proxy:      %s (enabled=%v)", configured(c.LFSProxyURL), c.LFSProxyEnabled)
	log.Println("============================")
}

func configured(v string) string {
	if v != "" {
		return "configured"
	}
	return "not set"
}

func maskDSN(dsn string) string {
	if dsn == "" {
		return "not set"
	}
	if _, after, ok := strings.Cut(dsn, "@"); ok {
		return "***@" + after
	}
	return "configured"
}

type Config struct {
	Port            string
	DatabaseURL     string
	RedisURL        string
	FirebaseProject string
	GCPProject      string
	GCPRegion       string
	GCPTTSRegion    string // Separate region for TTS/STT (Gemini TTS not available in all regions)
	AllowedOrigins  []string
	RunMigrations   bool
	MigrationsPath  string
	StaticDir       string
	// Firebase client config (injected into /api/config for frontend)
	FirebaseAPIKey            string
	FirebaseAuthDomain        string
	FirebaseStorageBucket     string
	FirebaseMessagingSenderID string
	FirebaseAppID             string
	// Health check token for /api/health/detailed endpoint (FR-067)
	HealthCheckToken string
	// Honeycomb API (Lernreise tracking — FR-072)
	HoneycombURL    string
	HoneycombAPIKey string
	// Memory Service (user context sync — FR-073)
	MemoryServiceURL    string
	MemoryServiceAPIKey string
	// Solid Pod integration (MVP4 — FR-076)
	SolidPodURL     string
	SolidPodEnabled bool
	// Admin seed credentials (FR-115)
	AdminSeedEmail    string
	AdminSeedPassword string
	// Permanent admin emails — these users always get admin role regardless of DB/claims
	AdminEmails []string
	// LFS Proxy integration (FR-131)
	LFSProxyURL     string
	LFSProxyEnabled bool
}

func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	cfg := &Config{
		Port:            port,
		DatabaseURL:     dbURL,
		RedisURL:        getEnv("REDIS_URL", ""),
		FirebaseProject: os.Getenv("FIREBASE_PROJECT_ID"),
		GCPProject:      getEnv("GCP_PROJECT_ID", os.Getenv("FIREBASE_PROJECT_ID")),
		GCPRegion:       getEnv("GCP_REGION", "europe-west3"),
		GCPTTSRegion:    getEnv("GCP_TTS_REGION", "europe-west1"),
		AllowedOrigins:  parseOrigins(getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:9090")),
		RunMigrations:   getEnvBool("RUN_MIGRATIONS", false),
		MigrationsPath:  getEnv("MIGRATIONS_PATH", "migrations"),
		StaticDir:       getEnv("STATIC_DIR", "static"),
		// Health check (FR-067)
		HealthCheckToken: os.Getenv("HEALTH_CHECK_TOKEN"),
		// Firebase client config
		FirebaseAPIKey:            os.Getenv("FIREBASE_API_KEY"),
		FirebaseAuthDomain:        os.Getenv("FIREBASE_AUTH_DOMAIN"),
		FirebaseStorageBucket:     os.Getenv("FIREBASE_STORAGE_BUCKET"),
		FirebaseMessagingSenderID: os.Getenv("FIREBASE_MESSAGING_SENDER_ID"),
		FirebaseAppID:             os.Getenv("FIREBASE_APP_ID"),
		// Honeycomb + Memory (FR-072, FR-073)
		HoneycombURL:        os.Getenv("HONEYCOMB_URL"),
		HoneycombAPIKey:     os.Getenv("HONEYCOMB_API_KEY"),
		MemoryServiceURL:    os.Getenv("MEMORY_SERVICE_URL"),
		MemoryServiceAPIKey: os.Getenv("MEMORY_SERVICE_API_KEY"),
		// Solid Pod (FR-076)
		SolidPodURL:     os.Getenv("SOLID_POD_URL"),
		SolidPodEnabled: getEnvBool("SOLID_POD_ENABLED", false),
		// Admin seed (FR-115) — defaults for local dev
		AdminSeedEmail:    getEnv("ADMIN_SEED_EMAIL", "admin@skillr.local"),
		AdminSeedPassword: getEnv("ADMIN_SEED_PASSWORD", "Admin1local"),
		// Permanent admin emails — always elevated to admin role
		AdminEmails: splitAndTrim(getEnv("ADMIN_EMAILS", "mirko.kaempf@gmail.com"), ","),
		// LFS Proxy (FR-131) — defaults to localhost:8080 in dev mode
		LFSProxyURL:     getEnv("LFS_PROXY_URL", "http://localhost:8080"),
		LFSProxyEnabled: getEnvBool("LFS_PROXY_ENABLED", true),
	}
	// M12: Warn about ALLOWED_ORIGINS in production
	if os.Getenv("ALLOWED_ORIGINS") == "" {
		if os.Getenv("K_SERVICE") != "" || os.Getenv("CLOUD_RUN") != "" {
			log.Println("WARNING: ALLOWED_ORIGINS not set on Cloud Run — using localhost defaults. Set ALLOWED_ORIGINS for cross-origin requests.")
		} else {
			log.Println("WARNING: ALLOWED_ORIGINS not set — using localhost defaults. Set ALLOWED_ORIGINS for production.")
		}
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		b, err := strconv.ParseBool(v)
		if err == nil {
			return b
		}
	}
	return fallback
}

func parseOrigins(s string) []string {
	var origins []string
	for _, o := range splitAndTrim(s, ",") {
		if o != "" {
			origins = append(origins, o)
		}
	}
	return origins
}

func splitAndTrim(s, sep string) []string {
	parts := make([]string, 0)
	for _, p := range strings.Split(s, sep) {
		p = strings.TrimSpace(p)
		if p != "" {
			parts = append(parts, p)
		}
	}
	return parts
}
