package config

import (
	"testing"
)

func TestLoad_RequiresDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	_, err := Load()
	if err == nil {
		t.Fatal("expected error when DATABASE_URL is not set")
	}
}

func TestLoad_Defaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/test")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.Port != "8080" {
		t.Errorf("expected port 8080, got %s", cfg.Port)
	}
	if cfg.GCPRegion != "europe-west3" {
		t.Errorf("expected region europe-west3, got %s", cfg.GCPRegion)
	}
}

func TestLoad_DefaultTTSRegion(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/test")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.GCPTTSRegion != "europe-west1" {
		t.Errorf("expected default TTS region europe-west1, got %s", cfg.GCPTTSRegion)
	}
}

func TestLoad_CustomTTSRegion(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/test")
	t.Setenv("GCP_TTS_REGION", "europe-west4")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.GCPTTSRegion != "europe-west4" {
		t.Errorf("expected TTS region europe-west4, got %s", cfg.GCPTTSRegion)
	}
}

func TestParseOrigins(t *testing.T) {
	origins := parseOrigins("http://a.com, http://b.com , http://c.com")
	if len(origins) != 3 {
		t.Errorf("expected 3 origins, got %d", len(origins))
	}
}
