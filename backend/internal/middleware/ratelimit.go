package middleware

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"

	internalredis "github.com/FutureSkillr/MVP72/backend/internal/redis"
)

// In-memory fallback counters when Redis is unavailable
var (
	fallbackMu       sync.Mutex
	fallbackCounters = map[string]*fallbackEntry{}
)

const maxFallbackEntries = 10000

type fallbackEntry struct {
	count   int
	resetAt time.Time
}

func fallbackAllow(key string, limit int, window time.Duration) bool {
	fallbackMu.Lock()
	defer fallbackMu.Unlock()

	now := time.Now()

	// H7: Evict expired entries to prevent unbounded memory growth
	if len(fallbackCounters) > maxFallbackEntries {
		for k, v := range fallbackCounters {
			if now.After(v.resetAt) {
				delete(fallbackCounters, k)
			}
		}
	}

	entry, ok := fallbackCounters[key]
	if !ok || now.After(entry.resetAt) {
		fallbackCounters[key] = &fallbackEntry{count: 1, resetAt: now.Add(window)}
		return true
	}
	entry.count++
	return entry.count <= limit
}

func RateLimit(limiter *internalredis.RateLimiter, prefix string, limit int, window time.Duration) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userInfo := GetUserInfo(c)
			var key string
			if userInfo != nil {
				key = fmt.Sprintf("ratelimit:%s:%s", prefix, userInfo.UID)
			} else {
				key = fmt.Sprintf("ratelimit:%s:%s", prefix, c.RealIP())
			}

			result, err := limiter.Allow(c.Request().Context(), key, limit, window)
			if err != nil {
				// Fall back to in-memory counter instead of allowing through
				log.Printf("rate limiter redis error, using fallback: %v", err)
				if !fallbackAllow(key, limit, window) {
					return echo.NewHTTPError(http.StatusTooManyRequests, "rate limit exceeded")
				}
				return next(c)
			}

			c.Response().Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
			c.Response().Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", result.Remaining))

			if !result.Allowed {
				c.Response().Header().Set("Retry-After", fmt.Sprintf("%d", int(result.RetryAfter.Seconds())))
				return echo.NewHTTPError(http.StatusTooManyRequests, "rate limit exceeded")
			}

			return next(c)
		}
	}
}
