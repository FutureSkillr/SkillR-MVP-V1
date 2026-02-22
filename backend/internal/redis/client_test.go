package redis

import (
	"context"
	"testing"
)

func TestNewClient_EmptyURL(t *testing.T) {
	client, err := NewClient(context.Background(), "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if client != nil {
		t.Fatal("expected nil client for empty URL")
	}
}
