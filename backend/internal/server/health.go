package server

import (
	"log"
	"math"
	"net/http"
	"runtime"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	goredis "github.com/redis/go-redis/v9"

	"github.com/FutureSkillr/MVP72/backend/internal/config"
)

type HealthHandler struct {
	db                 *pgxpool.Pool
	redis              *goredis.Client
	startedAt          time.Time
	version            string
	healthToken        string
	aiAvailable        bool
	honeycombAvailable bool
}

func NewHealthHandler(db *pgxpool.Pool, redis *goredis.Client, version, healthToken string) *HealthHandler {
	return &HealthHandler{
		db:          db,
		redis:       redis,
		startedAt:   time.Now(),
		version:     version,
		healthToken: healthToken,
	}
}

// SetDB updates the database pool after async connection.
func (h *HealthHandler) SetDB(db *pgxpool.Pool) {
	h.db = db
}

// SetRedis updates the Redis client after async connection.
func (h *HealthHandler) SetRedis(redis *goredis.Client) {
	h.redis = redis
}

// SetAI marks whether the AI service is available.
func (h *HealthHandler) SetAI(available bool) {
	h.aiAvailable = available
}

// SetHoneycomb marks whether the Honeycomb service is available (FR-072).
func (h *HealthHandler) SetHoneycomb(available bool) {
	h.honeycombAvailable = available
}

// Health returns a minimal status — no infra details exposed (H14).
func (h *HealthHandler) Health(c echo.Context) error {
	ctx := c.Request().Context()
	status := "ok"

	// Check PostgreSQL (log details server-side only — H14)
	if h.db != nil {
		if err := h.db.Ping(ctx); err != nil {
			status = "degraded"
			log.Printf("health check: postgres ping failed: %v", err)
		}
	}

	// Check Redis (log details server-side only — H14)
	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			status = "degraded"
			log.Printf("health check: redis ping failed: %v", err)
		}
	}

	// H14: Only expose status to public — no infrastructure details
	resp := map[string]interface{}{
		"status": status,
	}

	code := http.StatusOK
	if status != "ok" {
		code = http.StatusServiceUnavailable
	}

	return c.JSON(code, resp)
}

// componentStatus holds status and latency for a single component.
type componentStatus struct {
	Status    string `json:"status"`
	LatencyMs *int64 `json:"latencyMs,omitempty"`
}

// DetailedHealth returns full operational data — gated by HEALTH_CHECK_TOKEN.
func (h *HealthHandler) DetailedHealth(c echo.Context) error {
	// Validate token
	token := c.QueryParam("token")
	if h.healthToken == "" || token != h.healthToken {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	ctx := c.Request().Context()
	status := "ok"

	// Check PostgreSQL with latency
	pgStatus := componentStatus{Status: "ok"}
	if h.db != nil {
		start := time.Now()
		if err := h.db.Ping(ctx); err != nil {
			pgStatus.Status = "unavailable"
			status = "degraded"
		} else {
			ms := time.Since(start).Milliseconds()
			pgStatus.LatencyMs = &ms
		}
	} else {
		pgStatus.Status = "not_configured"
	}

	// Check Redis with latency
	redisStatus := componentStatus{Status: "ok"}
	if h.redis != nil {
		start := time.Now()
		if err := h.redis.Ping(ctx).Err(); err != nil {
			redisStatus.Status = "unavailable"
			status = "degraded"
		} else {
			ms := time.Since(start).Milliseconds()
			redisStatus.LatencyMs = &ms
		}
	} else {
		redisStatus.Status = "not_configured"
	}

	// AI status
	aiStatus := componentStatus{Status: "unavailable"}
	if h.aiAvailable {
		aiStatus.Status = "ok"
	}

	// Honeycomb status (FR-072)
	honeycombStatus := componentStatus{Status: "unavailable"}
	if h.honeycombAvailable {
		honeycombStatus.Status = "ok"
	}

	// Runtime stats
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	heapMB := math.Round(float64(memStats.HeapAlloc)/1024/1024*10) / 10

	uptime := time.Since(h.startedAt)

	code := http.StatusOK
	if status != "ok" {
		code = http.StatusServiceUnavailable
	}

	resp := map[string]interface{}{
		"status":        status,
		"version":       h.version,
		"startedAt":     h.startedAt.UTC().Format(time.RFC3339),
		"uptimeSeconds": int64(uptime.Seconds()),
		"components": map[string]componentStatus{
			"postgres":  pgStatus,
			"redis":     redisStatus,
			"ai":        aiStatus,
			"honeycomb": honeycombStatus,
		},
		"runtime": map[string]interface{}{
			"goroutines": runtime.NumGoroutine(),
			"heapMB":     heapMB,
		},
	}

	return c.JSON(code, resp)
}

type ConfigHandler struct {
	cfg *config.Config
}

func NewConfigHandler(cfg *config.Config) *ConfigHandler {
	return &ConfigHandler{cfg: cfg}
}

func (h *ConfigHandler) Config(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"firebase": map[string]string{
			"apiKey":            h.cfg.FirebaseAPIKey,
			"authDomain":        h.cfg.FirebaseAuthDomain,
			"projectId":         h.cfg.FirebaseProject,
			"storageBucket":     h.cfg.FirebaseStorageBucket,
			"messagingSenderId": h.cfg.FirebaseMessagingSenderID,
			"appId":             h.cfg.FirebaseAppID,
		},
	})
}
