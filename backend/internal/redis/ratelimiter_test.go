package redis

import (
	"context"
	"testing"
	"time"
)

func TestNewRateLimiter_NilClient(t *testing.T) {
	rl := NewRateLimiter(nil)
	if rl == nil {
		t.Fatal("expected non-nil RateLimiter")
	}
	if rl.client != nil {
		t.Fatal("expected nil client")
	}
}

func TestRateLimiter_InMemoryFallback(t *testing.T) {
	rl := NewRateLimiter(nil)
	ctx := context.Background()

	// Allow up to 3 requests per window
	for i := 0; i < 3; i++ {
		result, err := rl.Allow(ctx, "test:inmem", 3, time.Minute)
		if err != nil {
			t.Fatalf("Allow() error on request %d: %v", i+1, err)
		}
		if !result.Allowed {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}

	// 4th request should be denied
	result, err := rl.Allow(ctx, "test:inmem", 3, time.Minute)
	if err != nil {
		t.Fatalf("Allow() error on request 4: %v", err)
	}
	if result.Allowed {
		t.Fatal("4th request should be denied")
	}
	if result.RetryAfter <= 0 {
		t.Fatal("expected positive RetryAfter")
	}
}

func TestRateLimiter_SetClient(t *testing.T) {
	rl := NewRateLimiter(nil)
	if rl.client != nil {
		t.Fatal("expected nil client initially")
	}

	// SetClient with nil should remain nil (no-op upgrade)
	rl.SetClient(nil)
	if rl.client != nil {
		t.Fatal("expected nil client after SetClient(nil)")
	}

	// We can't easily test with a real Redis client here without a running Redis,
	// but we can verify the field is set by testing the in-memory path still works.
	// The important thing is that SetClient doesn't panic.
}

func TestRateLimiter_InMemoryWindowReset(t *testing.T) {
	rl := NewRateLimiter(nil)
	ctx := context.Background()

	// Use a very short window
	window := 50 * time.Millisecond

	// Exhaust the limit
	result, _ := rl.Allow(ctx, "test:reset", 1, window)
	if !result.Allowed {
		t.Fatal("first request should be allowed")
	}
	result, _ = rl.Allow(ctx, "test:reset", 1, window)
	if result.Allowed {
		t.Fatal("second request should be denied")
	}

	// Wait for window to expire
	time.Sleep(60 * time.Millisecond)

	// Should be allowed again
	result, _ = rl.Allow(ctx, "test:reset", 1, window)
	if !result.Allowed {
		t.Fatal("request after window reset should be allowed")
	}
}
