package redis

import (
	"context"
	"fmt"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type RateLimiter struct {
	client *goredis.Client
}

func NewRateLimiter(client *goredis.Client) *RateLimiter {
	return &RateLimiter{client: client}
}

// SetClient upgrades the rate limiter to use Redis instead of in-memory fallback.
func (rl *RateLimiter) SetClient(client *goredis.Client) {
	rl.client = client
}

type RateLimitResult struct {
	Allowed    bool
	Remaining  int
	RetryAfter time.Duration
}

// In-memory fallback for when Redis client is nil
var (
	memMu       sync.Mutex
	memCounters = map[string]*memEntry{}
)

type memEntry struct {
	count   int
	resetAt time.Time
}

func memAllow(key string, limit int, window time.Duration) *RateLimitResult {
	memMu.Lock()
	defer memMu.Unlock()

	now := time.Now()
	entry, ok := memCounters[key]
	if !ok || now.After(entry.resetAt) {
		memCounters[key] = &memEntry{count: 1, resetAt: now.Add(window)}
		return &RateLimitResult{Allowed: true, Remaining: limit - 1}
	}
	entry.count++
	if entry.count > limit {
		retryAfter := entry.resetAt.Sub(now)
		if retryAfter < 0 {
			retryAfter = time.Second
		}
		return &RateLimitResult{Allowed: false, Remaining: 0, RetryAfter: retryAfter}
	}
	return &RateLimitResult{Allowed: true, Remaining: limit - entry.count}
}

// Allow checks if a request is allowed under the sliding window rate limit.
// key: unique identifier (e.g., "ratelimit:ai:{userID}")
// limit: max requests per window
// window: time window duration
func (rl *RateLimiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (*RateLimitResult, error) {
	if rl.client == nil {
		// Use in-memory fallback instead of allowing everything through
		return memAllow(key, limit, window), nil
	}

	now := time.Now()
	windowStart := now.Add(-window)

	pipe := rl.client.Pipeline()
	// Remove old entries outside the window
	pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart.UnixMicro()))
	// Count current entries in window
	countCmd := pipe.ZCard(ctx, key)
	// Add current request
	pipe.ZAdd(ctx, key, goredis.Z{Score: float64(now.UnixMicro()), Member: now.UnixMicro()})
	// Set expiry on the key
	pipe.Expire(ctx, key, window)

	if _, err := pipe.Exec(ctx); err != nil {
		return nil, fmt.Errorf("rate limit check: %w", err)
	}

	count := countCmd.Val()
	if count >= int64(limit) {
		// Find the oldest entry to calculate retry-after
		oldest, err := rl.client.ZRangeWithScores(ctx, key, 0, 0).Result()
		if err != nil || len(oldest) == 0 {
			return &RateLimitResult{Allowed: false, Remaining: 0, RetryAfter: window}, nil
		}
		oldestTime := time.UnixMicro(int64(oldest[0].Score))
		retryAfter := oldestTime.Add(window).Sub(now)
		if retryAfter < 0 {
			retryAfter = time.Second
		}
		return &RateLimitResult{Allowed: false, Remaining: 0, RetryAfter: retryAfter}, nil
	}

	return &RateLimitResult{Allowed: true, Remaining: int(int64(limit) - count - 1)}, nil
}
