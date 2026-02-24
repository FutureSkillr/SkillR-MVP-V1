//go:build integration

package solid

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Full-flow integration test that simulates all 6 frontend Pod API calls:
//
//   1. Readiness  — GET  /api/v1/pod/readiness
//   2. Status     — GET  /api/v1/pod/status      (before connect)
//   3. Connect    — POST /api/v1/pod/connect
//   4. Status     — GET  /api/v1/pod/status      (after connect)
//   5. Sync       — POST /api/v1/pod/sync
//   6. Data       — GET  /api/v1/pod/data
//   7. Disconnect — DELETE /api/v1/pod/connect
//   8. Status     — GET  /api/v1/pod/status      (after disconnect)
//
// Requires:
//   make services-up     (starts PostgreSQL + Redis + CSS in Docker)
//
// Run:
//   make e2e-pod
//   or: cd backend && SOLID_POD_URL=http://localhost:3003 DATABASE_URL=postgres://skillr:localdev@localhost:15432/skillr?sslmode=disable go test -tags=integration -v -timeout=60s ./internal/solid/ -run TestIntegration_FullPodFlow

const testUserID = "integration-test-user-00000001"

func getTestDatabaseURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		url = "postgres://skillr:localdev@localhost:15432/skillr?sslmode=disable"
	}
	return url
}

func getTestPodURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("SOLID_POD_URL")
	if url == "" {
		url = "http://localhost:3003"
	}
	return url
}

// ensureTestUser creates a test user in the users table if it doesn't exist.
// Returns the user's UUID (id column).
func ensureTestUser(ctx context.Context, t *testing.T, pool *pgxpool.Pool) string {
	t.Helper()

	var userID string
	err := pool.QueryRow(ctx,
		`SELECT id FROM users WHERE firebase_uid = $1`, testUserID,
	).Scan(&userID)
	if err == nil {
		return userID
	}

	// Insert test user
	err = pool.QueryRow(ctx,
		`INSERT INTO users (firebase_uid, email, display_name, role, auth_provider)
		 VALUES ($1, $2, $3, 'user', 'email')
		 RETURNING id`,
		testUserID, "pod-test@skillr.local", "Pod Test User",
	).Scan(&userID)
	if err != nil {
		t.Fatalf("create test user: %v", err)
	}
	return userID
}

// cleanupTestUser removes the test user from the users table.
func cleanupTestUser(ctx context.Context, pool *pgxpool.Pool) {
	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE firebase_uid = $1`, testUserID)
}

// cleanupPodContainers removes all CSS containers created by the test.
func cleanupPodContainers(ctx context.Context, client Client, username string) {
	resources := []string{
		"/" + username + "/profile/card",
		"/" + username + "/profile/state",
		"/" + username + "/profile/skill-profile",
		"/" + username + "/profile/engagement",
		"/" + username + "/journey/vuca-state",
	}
	for _, r := range resources {
		_ = client.DeleteResource(ctx, r)
	}
	containers := []string{
		"/" + username + "/journal/reflections/",
		"/" + username + "/journal/",
		"/" + username + "/journey/",
		"/" + username + "/profile/",
		"/" + username + "/",
	}
	for _, c := range containers {
		_ = client.DeleteResource(ctx, c)
	}
}

func TestIntegration_FullPodFlow(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	podURL := getTestPodURL(t)
	dbURL := getTestDatabaseURL(t)

	// --- Setup: connect to DB and CSS ---
	client := NewHTTPClient(podURL)
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("database ping failed: %v (is PostgreSQL running? try: make services-up)", err)
	}

	svc := NewService(client, pool, podURL)

	// Ensure test user exists; clean up afterward
	userID := ensureTestUser(ctx, t, pool)
	username := sanitizeUsername(userID)
	defer cleanupTestUser(ctx, pool)
	defer cleanupPodContainers(ctx, client, username)

	// Also reset any previous pod connection for this user
	_, _ = pool.Exec(ctx,
		`UPDATE users SET pod_url=NULL, pod_webid=NULL, pod_provider='none', pod_connected_at=NULL, pod_last_synced_at=NULL, pod_sync_status='none' WHERE id=$1`,
		userID,
	)

	// ──────────────────────────────────────────────────────────────────
	// Step 1: Readiness — simulates GET /api/v1/pod/readiness
	// Frontend calls checkPodReadiness() on mount
	// ──────────────────────────────────────────────────────────────────
	t.Run("1_Readiness", func(t *testing.T) {
		if !svc.Ready() {
			t.Fatal("service should be ready (DB is connected)")
		}
		if err := svc.PingCSS(ctx); err != nil {
			t.Fatalf("CSS not reachable at %s: %v (is Solid running? try: make services-up)", podURL, err)
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 2: Status (before connect) — simulates GET /api/v1/pod/status
	// Frontend calls getPodStatus() after readiness passes
	// ──────────────────────────────────────────────────────────────────
	t.Run("2_Status_BeforeConnect", func(t *testing.T) {
		status, err := svc.Status(ctx, userID)
		if err != nil {
			t.Fatalf("status: %v", err)
		}
		if status.Connected {
			t.Error("expected connected=false before connect")
		}
		if status.Provider != PodProviderNone {
			t.Errorf("expected provider 'none', got %q", status.Provider)
		}
		if status.SyncStatus != "none" {
			t.Errorf("expected syncStatus 'none', got %q", status.SyncStatus)
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 3: Connect — simulates POST /api/v1/pod/connect
	// Frontend sends: { provider: "managed", podUrl: "http://localhost:3003" }
	// ──────────────────────────────────────────────────────────────────
	t.Run("3_Connect", func(t *testing.T) {
		conn, err := svc.Connect(ctx, userID, ConnectRequest{
			Provider: PodProviderManaged,
			PodURL:   podURL,
		})
		if err != nil {
			t.Fatalf("connect: %v", err)
		}
		if conn.UserID != userID {
			t.Errorf("expected userId %q, got %q", userID, conn.UserID)
		}
		if conn.PodURL == "" {
			t.Error("expected non-empty podUrl")
		}
		if conn.WebID == "" {
			t.Error("expected non-empty webId")
		}
		if conn.Provider != PodProviderManaged {
			t.Errorf("expected provider 'managed', got %q", conn.Provider)
		}
		if conn.ConnectedAt == nil {
			t.Error("expected connectedAt to be set")
		}
		if conn.SyncStatus != "connected" {
			t.Errorf("expected syncStatus 'connected', got %q", conn.SyncStatus)
		}

		// Verify profile card was created on CSS
		card, err := client.GetResource(ctx, "/"+username+"/profile/card")
		if err != nil {
			t.Fatalf("profile card not found on CSS: %v", err)
		}
		if !strings.Contains(card, "foaf:Person") {
			t.Errorf("profile card missing foaf:Person, got:\n%s", card)
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 4: Status (after connect) — simulates GET /api/v1/pod/status
	// Frontend refreshes status after successful connect
	// ──────────────────────────────────────────────────────────────────
	t.Run("4_Status_AfterConnect", func(t *testing.T) {
		status, err := svc.Status(ctx, userID)
		if err != nil {
			t.Fatalf("status: %v", err)
		}
		if !status.Connected {
			t.Error("expected connected=true after connect")
		}
		if status.Provider != PodProviderManaged {
			t.Errorf("expected provider 'managed', got %q", status.Provider)
		}
		if status.SyncStatus != "connected" {
			t.Errorf("expected syncStatus 'connected', got %q", status.SyncStatus)
		}
		if status.ConnectedAt == nil {
			t.Error("expected connectedAt to be set")
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 5: Sync — simulates POST /api/v1/pod/sync
	// Frontend sends engagement + journey progress from app state
	// ──────────────────────────────────────────────────────────────────
	t.Run("5_Sync", func(t *testing.T) {
		result, err := svc.Sync(ctx, userID, SyncRequest{
			Engagement: &EngagementData{
				TotalXP: 420,
				Level:   3,
				Streak:  5,
				Title:   "Entdecker",
			},
			JourneyProgress: &JourneyProgressData{
				"vuca": JourneyTypeProgress{
					Started:           true,
					StationsCompleted: 2,
					DimensionScores: map[string]float64{
						"volatility":  0.7,
						"uncertainty": 0.5,
					},
				},
			},
		})
		if err != nil {
			t.Fatalf("sync: %v", err)
		}
		if result.SyncedEntities < 1 {
			t.Errorf("expected at least 1 synced entity, got %d", result.SyncedEntities)
		}
		if result.LastSyncedAt.IsZero() {
			t.Error("expected lastSyncedAt to be set")
		}
		// Errors are allowed (e.g. skill profile may not exist), but log them
		for _, e := range result.Errors {
			t.Logf("sync warning: %s", e)
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 6: Data — simulates GET /api/v1/pod/data
	// Frontend calls getPodData() to display Pod contents
	// ──────────────────────────────────────────────────────────────────
	t.Run("6_Data", func(t *testing.T) {
		data, err := svc.Data(ctx, userID)
		if err != nil {
			t.Fatalf("data: %v", err)
		}
		if data == nil {
			t.Fatal("expected non-nil data")
		}

		// Profile state should contain user info
		state, ok := data.Profile["state"]
		if !ok {
			t.Error("expected profile/state in data")
		} else {
			stateStr := fmt.Sprintf("%v", state)
			if !strings.Contains(stateStr, "Pod Test User") {
				t.Errorf("expected profile state to contain user name, got:\n%s", stateStr)
			}
		}

		// Engagement should contain the synced data
		engagement, ok := data.Profile["engagement"]
		if !ok {
			t.Error("expected profile/engagement in data")
		} else {
			engStr := fmt.Sprintf("%v", engagement)
			if !strings.Contains(engStr, "420") {
				t.Errorf("expected engagement to contain XP value 420, got:\n%s", engStr)
			}
		}

		// Journey state should contain VUCA progress
		journey, ok := data.Journey["vuca-state"]
		if !ok {
			t.Error("expected journey/vuca-state in data")
		} else {
			jStr := fmt.Sprintf("%v", journey)
			if !strings.Contains(jStr, "vuca") {
				t.Errorf("expected journey data to contain 'vuca', got:\n%s", jStr)
			}
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 7: Disconnect — simulates DELETE /api/v1/pod/connect
	// User clicks disconnect in the PodManagementCard
	// ──────────────────────────────────────────────────────────────────
	t.Run("7_Disconnect", func(t *testing.T) {
		if err := svc.Disconnect(ctx, userID); err != nil {
			t.Fatalf("disconnect: %v", err)
		}
	})

	// ──────────────────────────────────────────────────────────────────
	// Step 8: Status (after disconnect) — simulates GET /api/v1/pod/status
	// Frontend refreshes to confirm disconnect
	// ──────────────────────────────────────────────────────────────────
	t.Run("8_Status_AfterDisconnect", func(t *testing.T) {
		status, err := svc.Status(ctx, userID)
		if err != nil {
			t.Fatalf("status: %v", err)
		}
		if status.Connected {
			t.Error("expected connected=false after disconnect")
		}
		if status.Provider != PodProviderNone {
			t.Errorf("expected provider 'none', got %q", status.Provider)
		}
		if status.SyncStatus != "none" {
			t.Errorf("expected syncStatus 'none', got %q", status.SyncStatus)
		}
	})
}

// TestIntegration_ReadinessWhenCSSDown verifies that readiness returns false
// when CSS is not reachable. This test uses a deliberately wrong URL.
func TestIntegration_ReadinessWhenCSSDown(t *testing.T) {
	// Use a port that's definitely not running CSS
	client := NewHTTPClient("http://localhost:19999")
	svc := NewService(client, nil, "http://localhost:19999")

	// PingCSS should fail
	if err := svc.PingCSS(context.Background()); err == nil {
		t.Error("expected PingCSS to fail for unreachable server")
	}
}

// TestIntegration_StatusForNonexistentUser verifies graceful handling
// when querying status for a user that doesn't exist in the DB.
func TestIntegration_StatusForNonexistentUser(t *testing.T) {
	ctx := context.Background()
	dbURL := getTestDatabaseURL(t)

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	podURL := getTestPodURL(t)
	client := NewHTTPClient(podURL)
	svc := NewService(client, pool, podURL)

	// Query status for a UUID that doesn't exist
	status, err := svc.Status(ctx, "00000000-0000-0000-0000-000000000000")
	if err != nil {
		t.Fatalf("expected graceful handling, got error: %v", err)
	}
	if status.Connected {
		t.Error("expected connected=false for nonexistent user")
	}
}
