package server

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	goredis "github.com/redis/go-redis/v9"

	"skillr-mvp-v1/backend/internal/config"
)

// PodReadinessChecker checks Pod subsystem readiness without importing the solid package.
type PodReadinessChecker interface {
	Ready() bool
	PingCSS(ctx context.Context) error
}

type HealthHandler struct {
	db                 *pgxpool.Pool
	redis              *goredis.Client
	startedAt          time.Time
	version            string
	healthToken        string
	aiAvailable        bool
	honeycombAvailable bool
	firebaseAvailable  bool
	solidPodAvailable  bool
	solidPodEnabled    bool
	memoryAvailable    bool
	solidSvc           PodReadinessChecker
	cfg                *config.Config
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

// SetFirebase marks whether Firebase Auth is available.
func (h *HealthHandler) SetFirebase(available bool) {
	h.firebaseAvailable = available
}

// SetSolidPod marks whether the Solid Pod service is available and enabled.
func (h *HealthHandler) SetSolidPod(available, enabled bool) {
	h.solidPodAvailable = available
	h.solidPodEnabled = enabled
}

// SetMemoryService marks whether the Memory Service is available.
func (h *HealthHandler) SetMemoryService(available bool) {
	h.memoryAvailable = available
}

// SetConfig stores the config reference for infra status reporting.
func (h *HealthHandler) SetConfig(cfg *config.Config) {
	h.cfg = cfg
}

// SetSolidService stores the Pod service for composite readiness checks.
func (h *HealthHandler) SetSolidService(svc PodReadinessChecker) {
	h.solidSvc = svc
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

	// Pod status (FR-127)
	podStatus := componentStatus{Status: "unavailable"}
	if h.solidPodAvailable {
		podStatus.Status = "ok"
	}

	// Pod readiness composite check (FR-127)
	podReadyChecks := map[string]string{}
	podReadyStatus := "ok"

	// Sub-check: database
	if h.db != nil {
		if err := h.db.Ping(ctx); err != nil {
			podReadyChecks["database"] = "unavailable"
			podReadyStatus = "unavailable"
		} else {
			podReadyChecks["database"] = "ok"
		}
	} else {
		podReadyChecks["database"] = "not_configured"
		podReadyStatus = "unavailable"
	}

	// Sub-check: migrations (pod_url column on users table)
	if h.db != nil {
		var colCount int
		migErr := h.db.QueryRow(ctx,
			`SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name='pod_url'`,
		).Scan(&colCount)
		if migErr != nil || colCount == 0 {
			podReadyChecks["migrations"] = "missing"
			podReadyStatus = "unavailable"
		} else {
			podReadyChecks["migrations"] = "ok"
		}
	} else {
		podReadyChecks["migrations"] = "unknown"
	}

	// Sub-check: solid_server
	if h.solidSvc != nil {
		if err := h.solidSvc.PingCSS(ctx); err != nil {
			podReadyChecks["solid_server"] = "unavailable"
			podReadyStatus = "unavailable"
		} else {
			podReadyChecks["solid_server"] = "ok"
		}
	} else {
		podReadyChecks["solid_server"] = "not_configured"
		podReadyStatus = "unavailable"
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
			"pod":       podStatus,
		},
		"pod_ready": map[string]interface{}{
			"status": podReadyStatus,
			"checks": podReadyChecks,
		},
		"runtime": map[string]interface{}{
			"goroutines": runtime.NumGoroutine(),
			"heapMB":     heapMB,
		},
	}

	return c.JSON(code, resp)
}

// infraComponentStatus holds status, latency, and optional note for an infra component.
type infraComponentStatus struct {
	Status    string `json:"status"`
	LatencyMs *int64 `json:"latencyMs,omitempty"`
	Note      string `json:"note,omitempty"`
}

// InfraStatus returns full infrastructure status for the admin dashboard (FR-126).
// Gated by RequireAdmin() middleware in routes.go.
func (h *HealthHandler) InfraStatus(c echo.Context) error {
	ctx := c.Request().Context()
	overall := "ok"

	// PostgreSQL
	pgStatus := infraComponentStatus{Status: "ok"}
	if h.db != nil {
		start := time.Now()
		if err := h.db.Ping(ctx); err != nil {
			pgStatus.Status = "unavailable"
			overall = "degraded"
		} else {
			ms := time.Since(start).Milliseconds()
			pgStatus.LatencyMs = &ms
		}
	} else {
		pgStatus.Status = "not_configured"
		overall = "degraded"
	}

	// Redis
	redisStatus := infraComponentStatus{Status: "ok"}
	if h.redis != nil {
		start := time.Now()
		if err := h.redis.Ping(ctx).Err(); err != nil {
			redisStatus.Status = "unavailable"
			overall = "degraded"
		} else {
			ms := time.Since(start).Milliseconds()
			redisStatus.LatencyMs = &ms
		}
	} else {
		redisStatus.Status = "not_configured"
	}

	// Kafka — not yet integrated
	kafkaStatus := infraComponentStatus{
		Status: "not_configured",
		Note:   "Kafka integration planned",
	}

	// API services
	apis := map[string]infraComponentStatus{
		"firebase_auth": boolStatus(h.firebaseAvailable),
		"vertex_ai":     boolStatus(h.aiAvailable),
		"solid_pod":     solidPodStatus(h.solidPodAvailable, h.solidPodEnabled),
		"honeycomb":     boolStatus(h.honeycombAvailable),
		"memory_service": boolStatus(h.memoryAvailable),
	}

	// Config presence — which env vars are set (no secret values)
	configPresence := map[string]bool{
		"DATABASE_URL":       h.cfg != nil && h.cfg.DatabaseURL != "",
		"REDIS_URL":          h.cfg != nil && h.cfg.RedisURL != "",
		"FIREBASE_PROJECT_ID": h.cfg != nil && h.cfg.FirebaseProject != "",
		"GCP_PROJECT_ID":     h.cfg != nil && h.cfg.GCPProject != "",
		"SOLID_POD_URL":      h.cfg != nil && h.cfg.SolidPodURL != "",
		"HONEYCOMB_URL":      h.cfg != nil && h.cfg.HoneycombURL != "",
		"MEMORY_SERVICE_URL": h.cfg != nil && h.cfg.MemoryServiceURL != "",
	}

	// Runtime stats
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	heapMB := math.Round(float64(memStats.HeapAlloc)/1024/1024*10) / 10
	uptime := time.Since(h.startedAt)

	resp := map[string]interface{}{
		"status":         overall,
		"version":        h.version,
		"startedAt":      h.startedAt.UTC().Format(time.RFC3339),
		"uptimeSeconds":  int64(uptime.Seconds()),
		"postgres":       pgStatus,
		"redis":          redisStatus,
		"kafka":          kafkaStatus,
		"apis":           apis,
		"configPresence": configPresence,
		"runtime": map[string]interface{}{
			"goroutines": runtime.NumGoroutine(),
			"heapMB":     heapMB,
		},
	}

	return c.JSON(http.StatusOK, resp)
}

func boolStatus(available bool) infraComponentStatus {
	if available {
		return infraComponentStatus{Status: "ok"}
	}
	return infraComponentStatus{Status: "unavailable"}
}

func solidPodStatus(available, enabled bool) infraComponentStatus {
	if !enabled {
		return infraComponentStatus{Status: "not_configured", Note: "SOLID_POD_ENABLED=false"}
	}
	if available {
		return infraComponentStatus{Status: "ok"}
	}
	return infraComponentStatus{Status: "unavailable"}
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
		"sessionToken": issueSessionToken(),
	})
}

// issueSessionToken creates an HMAC-signed session token for pre-auth Gemini access (M24).
// Token format: "<expiresAtMs>.<hmac-hex>", valid for 30 minutes.
func issueSessionToken() map[string]interface{} {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-session-secret"
	}

	expiresAt := time.Now().Add(30 * time.Minute).UnixMilli()
	payload := strconv.FormatInt(expiresAt, 10)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))

	return map[string]interface{}{
		"token":     fmt.Sprintf("%s.%s", payload, sig),
		"expiresAt": expiresAt,
	}
}
