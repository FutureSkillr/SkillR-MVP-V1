//go:build integration

package solid

import (
	"context"
	"os"
	"strings"
	"testing"
)

// These tests require a running CSS instance.
// Run with: SOLID_POD_URL=http://localhost:3000 go test -tags=integration ./internal/solid/

func getPodURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("SOLID_POD_URL")
	if url == "" {
		url = "http://localhost:3000"
	}
	return url
}

func TestIntegration_Ping(t *testing.T) {
	client := NewHTTPClient(getPodURL(t))
	if err := client.Ping(context.Background()); err != nil {
		t.Fatalf("CSS not reachable: %v", err)
	}
}

func TestIntegration_CreateContainerAndPutGet(t *testing.T) {
	client := NewHTTPClient(getPodURL(t))
	ctx := context.Background()

	// Create test container
	if err := client.CreateContainer(ctx, "/integration-test"); err != nil {
		t.Fatalf("CreateContainer: %v", err)
	}

	// Put a Turtle resource
	turtle := turtlePrefixes() + "<> a fs:UserProfile ;\n    fs:userId \"test-123\" .\n"
	if err := client.PutResource(ctx, "/integration-test/profile", turtle); err != nil {
		t.Fatalf("PutResource: %v", err)
	}

	// Get it back
	body, err := client.GetResource(ctx, "/integration-test/profile")
	if err != nil {
		t.Fatalf("GetResource: %v", err)
	}
	if body == "" {
		t.Fatal("expected non-empty body")
	}
	// CSS may add server-managed triples, so just check our data is present
	if !strings.Contains(body, "test-123") {
		t.Errorf("expected body to contain 'test-123', got:\n%s", body)
	}

	// Cleanup
	_ = client.DeleteResource(ctx, "/integration-test/profile")
	_ = client.DeleteResource(ctx, "/integration-test/")
}

func TestIntegration_DeleteResource(t *testing.T) {
	client := NewHTTPClient(getPodURL(t))
	ctx := context.Background()

	// Create and delete
	if err := client.CreateContainer(ctx, "/delete-test"); err != nil {
		t.Fatalf("CreateContainer: %v", err)
	}
	turtle := "<> a <http://example.org/Test> ."
	if err := client.PutResource(ctx, "/delete-test/resource", turtle); err != nil {
		t.Fatalf("PutResource: %v", err)
	}
	if err := client.DeleteResource(ctx, "/delete-test/resource"); err != nil {
		t.Fatalf("DeleteResource: %v", err)
	}

	// Verify deleted
	_, err := client.GetResource(ctx, "/delete-test/resource")
	if err == nil {
		t.Error("expected error after delete")
	}

	_ = client.DeleteResource(ctx, "/delete-test/")
}

func TestIntegration_FullPodStructure(t *testing.T) {
	client := NewHTTPClient(getPodURL(t))
	ctx := context.Background()
	svc := NewService(client, nil) // nil DB — we only test initializePodStructure

	if err := svc.initializePodStructure(ctx, getPodURL(t), "integration-admin"); err != nil {
		t.Fatalf("initializePodStructure: %v", err)
	}

	// Verify profile card was created
	card, err := client.GetResource(ctx, "/integration-admin/profile/card")
	if err != nil {
		t.Fatalf("profile card not found: %v", err)
	}
	if !strings.Contains(card, "foaf:Person") {
		t.Errorf("profile card missing foaf:Person, got:\n%s", card)
	}

	// Cleanup
	for _, p := range []string{
		"/integration-admin/profile/card",
		"/integration-admin/journal/reflections/",
		"/integration-admin/journal/",
		"/integration-admin/journey/",
		"/integration-admin/profile/",
		"/integration-admin/",
	} {
		_ = client.DeleteResource(ctx, p)
	}
}
