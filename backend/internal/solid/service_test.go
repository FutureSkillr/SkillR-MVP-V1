package solid

import (
	"context"
	"fmt"
	"strings"
	"testing"
)

// mockClient implements Client for testing without a real CSS server.
type mockClient struct {
	containers map[string]bool
	resources  map[string]string
	pingErr    error
	putErr     error
}

func newMockClient() *mockClient {
	return &mockClient{
		containers: make(map[string]bool),
		resources:  make(map[string]string),
	}
}

func (m *mockClient) CreateContainer(_ context.Context, path string) error {
	m.containers[path] = true
	return nil
}

func (m *mockClient) PutResource(_ context.Context, path string, turtle string) error {
	if m.putErr != nil {
		return m.putErr
	}
	m.resources[path] = turtle
	return nil
}

func (m *mockClient) GetResource(_ context.Context, path string) (string, error) {
	if content, ok := m.resources[path]; ok {
		return content, nil
	}
	return "", fmt.Errorf("resource not found: %s", path)
}

func (m *mockClient) DeleteResource(_ context.Context, path string) error {
	// Simulate recursive container deletion: trailing slash removes all children
	if strings.HasSuffix(path, "/") {
		prefix := path
		for k := range m.resources {
			if strings.HasPrefix(k, prefix) || k+"/" == prefix {
				delete(m.resources, k)
			}
		}
		for k := range m.containers {
			if strings.HasPrefix(k+"/", prefix) || k+"/" == prefix {
				delete(m.containers, k)
			}
		}
		return nil
	}
	delete(m.resources, path)
	return nil
}

func (m *mockClient) Ping(_ context.Context) error {
	return m.pingErr
}

func TestNewService(t *testing.T) {
	client := newMockClient()
	svc := NewService(client, nil)
	if svc == nil {
		t.Fatal("expected non-nil service")
	}
	if svc.client != client {
		t.Error("expected service to use provided client")
	}
}

func TestService_Connect_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil)
	_, err := svc.Connect(context.Background(), "user-1", ConnectRequest{
		Provider: PodProviderManaged,
		PodURL:   "http://localhost:3000",
	})
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Disconnect_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil)
	err := svc.Disconnect(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Status_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil)
	_, err := svc.Status(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Sync_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil)
	_, err := svc.Sync(context.Background(), "user-1", SyncRequest{})
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Data_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil)
	_, err := svc.Data(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestInitializePodStructure(t *testing.T) {
	mc := newMockClient()
	svc := NewService(mc, nil)

	err := svc.initializePodStructure(context.Background(), "testuser")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expectedContainers := []string{
		"/testuser",
		"/testuser/profile",
		"/testuser/journey",
		"/testuser/journal",
		"/testuser/journal/reflections",
	}
	for _, c := range expectedContainers {
		if !mc.containers[c] {
			t.Errorf("expected container %q to be created", c)
		}
	}

	// Check profile card was created
	card, ok := mc.resources["/testuser/profile/card"]
	if !ok {
		t.Error("expected profile card to be created")
	}
	if card == "" {
		t.Error("expected non-empty profile card")
	}
}

func TestPodProviderConstants(t *testing.T) {
	if PodProviderNone != "none" {
		t.Errorf("PodProviderNone = %q, want %q", PodProviderNone, "none")
	}
	if PodProviderManaged != "managed" {
		t.Errorf("PodProviderManaged = %q, want %q", PodProviderManaged, "managed")
	}
	if PodProviderExternal != "external" {
		t.Errorf("PodProviderExternal = %q, want %q", PodProviderExternal, "external")
	}
}
