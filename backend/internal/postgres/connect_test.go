package postgres

import (
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestParseConfig(t *testing.T) {
	_, err := pgxpool.ParseConfig("postgres://user:pass@localhost:5432/db?sslmode=disable")
	if err != nil {
		t.Fatalf("failed to parse valid URL: %v", err)
	}
}

func TestParseConfig_Invalid(t *testing.T) {
	_, err := pgxpool.ParseConfig("not-a-url")
	if err == nil {
		t.Fatal("expected error for invalid URL")
	}
}
