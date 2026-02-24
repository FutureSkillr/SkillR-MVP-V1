//go:build integration

package solid

import (
	"context"
	"net/url"
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

// TestIntegration_ExternalPod validates all Pod operations against an external
// Solid Pod server (e.g. https://solid.redpencil.io/kamir-skillr).
//
// Requires:
//
//	EXTERNAL_POD_URL=https://solid.redpencil.io/kamir-skillr
//	EXTERNAL_POD_EMAIL=mirko.kaempf@gmail.com   (optional — skips write tests if not set)
//	EXTERNAL_POD_PASSWORD=...                     (optional — skips write tests if not set)
//
// Run: make e2e-pod-external EXTERNAL_POD_URL=https://solid.redpencil.io/kamir-skillr \
//
//	EXTERNAL_POD_EMAIL=... EXTERNAL_POD_PASSWORD=...
func TestIntegration_ExternalPod(t *testing.T) {
	extURL := os.Getenv("EXTERNAL_POD_URL")
	if extURL == "" {
		t.Skip("EXTERNAL_POD_URL not set — skipping external pod test")
	}

	parsed, err := url.Parse(extURL)
	if err != nil {
		t.Fatalf("parse EXTERNAL_POD_URL: %v", err)
	}
	baseURL := parsed.Scheme + "://" + parsed.Host
	podPath := strings.TrimRight(parsed.Path, "/")

	client := NewHTTPClient(baseURL)
	ctx := context.Background()

	email := os.Getenv("EXTERNAL_POD_EMAIL")
	password := os.Getenv("EXTERNAL_POD_PASSWORD")
	hasAuth := email != "" && password != ""

	// Test container path — isolated to avoid polluting the real pod
	testContainer := podPath + "/skillr-integration-test"

	// Cleanup at end
	defer func() {
		_ = client.DeleteResource(ctx, testContainer+"/test-resource")
		_ = client.DeleteResource(ctx, testContainer+"/")
	}()

	// 1. Ping — verify the external server is reachable (always works, no auth)
	t.Run("1_Ping", func(t *testing.T) {
		if err := client.Ping(ctx); err != nil {
			t.Fatalf("external Pod server not reachable at %s: %v", baseURL, err)
		}
	})

	// 2. Authenticate — log in to CSS account (required for write operations)
	t.Run("2_Authenticate", func(t *testing.T) {
		if !hasAuth {
			t.Skip("EXTERNAL_POD_EMAIL/EXTERNAL_POD_PASSWORD not set — skipping auth")
		}
		if err := client.Authenticate(ctx, email, password); err != nil {
			t.Fatalf("Authenticate: %v", err)
		}
	})

	// 3. CreateContainer — create a test container inside the pod
	t.Run("3_CreateContainer", func(t *testing.T) {
		if !hasAuth {
			t.Skip("no credentials — skipping write test")
		}
		if err := client.CreateContainer(ctx, testContainer); err != nil {
			t.Fatalf("CreateContainer: %v", err)
		}
	})

	// 4. PutResource — write a Turtle resource
	t.Run("4_PutResource", func(t *testing.T) {
		if !hasAuth {
			t.Skip("no credentials — skipping write test")
		}
		turtle := turtlePrefixes() + `<> a fs:UserProfile ;
    fs:userId "integration-test-external" .
`
		if err := client.PutResource(ctx, testContainer+"/test-resource", turtle); err != nil {
			t.Fatalf("PutResource: %v", err)
		}
	})

	// 5. GetResource — read it back
	t.Run("5_GetResource", func(t *testing.T) {
		if !hasAuth {
			t.Skip("no credentials — skipping read test")
		}
		body, err := client.GetResource(ctx, testContainer+"/test-resource")
		if err != nil {
			t.Fatalf("GetResource: %v", err)
		}
		if body == "" {
			t.Fatal("expected non-empty body")
		}
		if !strings.Contains(body, "integration-test-external") {
			t.Errorf("expected body to contain 'integration-test-external', got:\n%s", body)
		}
	})

	// 6. DeleteResource — clean up
	t.Run("6_DeleteResource", func(t *testing.T) {
		if !hasAuth {
			t.Skip("no credentials — skipping delete test")
		}
		if err := client.DeleteResource(ctx, testContainer+"/test-resource"); err != nil {
			t.Fatalf("DeleteResource: %v", err)
		}

		// Verify deleted
		_, err := client.GetResource(ctx, testContainer+"/test-resource")
		if err == nil {
			t.Error("expected error after delete, resource still exists")
		}
	})

	// 7. Delete container
	t.Run("7_DeleteContainer", func(t *testing.T) {
		if !hasAuth {
			t.Skip("no credentials — skipping delete test")
		}
		if err := client.DeleteResource(ctx, testContainer+"/"); err != nil {
			t.Fatalf("DeleteContainer: %v", err)
		}
	})
}

func TestIntegration_FullPodStructure(t *testing.T) {
	client := NewHTTPClient(getPodURL(t))
	ctx := context.Background()
	svc := NewService(client, nil, getPodURL(t)) // nil DB — we only test initializePodStructure

	if err := svc.initializePodStructure(ctx, "integration-admin"); err != nil {
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
