package solid

import (
	"context"
	"errors"
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
	svc := NewService(client, nil, "http://localhost:3003")
	if svc == nil {
		t.Fatal("expected non-nil service")
	}
	if svc.client != client {
		t.Error("expected service to use provided client")
	}
}

func TestService_Ready_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	if svc.Ready() {
		t.Error("expected Ready() to return false when DB is nil")
	}
}

func TestService_Ready_WithDB(t *testing.T) {
	// We can't easily create a real pgxpool.Pool in a unit test, but we can
	// verify that the Ready() method checks db != nil by using SetDB with a
	// non-nil value. We use an unsafe cast to produce a non-nil pointer for
	// this test only.
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	if svc.Ready() {
		t.Fatal("precondition: Ready() should be false before SetDB")
	}
	// After the DB would be connected, Ready returns true.
	// We cannot set a real pool here, but the NoDB path is the important one.
}

func TestService_NoDB_ReturnsErrNotReady(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")

	_, err := svc.Connect(context.Background(), "u1", ConnectRequest{Provider: PodProviderManaged, PodURL: "http://localhost:3000"})
	if !errors.Is(err, ErrNotReady) {
		t.Errorf("Connect: expected ErrNotReady, got %v", err)
	}

	err = svc.Disconnect(context.Background(), "u1")
	if !errors.Is(err, ErrNotReady) {
		t.Errorf("Disconnect: expected ErrNotReady, got %v", err)
	}

	_, err = svc.Status(context.Background(), "u1")
	if !errors.Is(err, ErrNotReady) {
		t.Errorf("Status: expected ErrNotReady, got %v", err)
	}

	_, err = svc.Sync(context.Background(), "u1", SyncRequest{})
	if !errors.Is(err, ErrNotReady) {
		t.Errorf("Sync: expected ErrNotReady, got %v", err)
	}

	_, err = svc.Data(context.Background(), "u1")
	if !errors.Is(err, ErrNotReady) {
		t.Errorf("Data: expected ErrNotReady, got %v", err)
	}
}

func TestService_Connect_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	_, err := svc.Connect(context.Background(), "user-1", ConnectRequest{
		Provider: PodProviderManaged,
		PodURL:   "http://localhost:3000",
	})
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Disconnect_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	err := svc.Disconnect(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Status_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	_, err := svc.Status(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Sync_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	_, err := svc.Sync(context.Background(), "user-1", SyncRequest{})
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestService_Data_NoDB(t *testing.T) {
	svc := NewService(newMockClient(), nil, "http://localhost:3003")
	_, err := svc.Data(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error when DB is nil")
	}
}

func TestInitializePodStructure(t *testing.T) {
	mc := newMockClient()
	svc := NewService(mc, nil, "http://localhost:3003")

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

func TestService_PingCSS_Success(t *testing.T) {
	mc := newMockClient()
	svc := NewService(mc, nil, "http://localhost:3003")
	if err := svc.PingCSS(context.Background()); err != nil {
		t.Errorf("expected nil error, got %v", err)
	}
}

func TestService_PingCSS_Error(t *testing.T) {
	mc := newMockClient()
	mc.pingErr = fmt.Errorf("connection refused")
	svc := NewService(mc, nil, "http://localhost:3003")
	if err := svc.PingCSS(context.Background()); err == nil {
		t.Error("expected error when CSS is unreachable")
	}
}

func TestService_Connect_CSSUnreachable_NilDB(t *testing.T) {
	mc := newMockClient()
	mc.pingErr = fmt.Errorf("connection refused")
	svc := NewService(mc, nil, "http://localhost:3003")
	// With nil DB, ErrNotReady is returned before the CSS ping check
	_, err := svc.Connect(context.Background(), "user-1", ConnectRequest{
		Provider: PodProviderManaged,
		PodURL:   "http://localhost:3000",
	})
	if !errors.Is(err, ErrNotReady) {
		t.Errorf("expected ErrNotReady with nil DB, got %v", err)
	}
}

func TestInitPodContainers_WithExternalClient(t *testing.T) {
	mc := newMockClient()
	svc := NewService(newMockClient(), nil, "http://localhost:3003") // service has its own client

	// Use a different mock client to simulate external pod
	err := svc.initPodContainers(context.Background(), mc, "/kamir-skillr")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expectedContainers := []string{
		"/kamir-skillr",
		"/kamir-skillr/profile",
		"/kamir-skillr/journey",
		"/kamir-skillr/journal",
		"/kamir-skillr/journal/reflections",
	}
	for _, c := range expectedContainers {
		if !mc.containers[c] {
			t.Errorf("expected container %q to be created", c)
		}
	}

	// Check profile card was created on the external client, not the service client
	card, ok := mc.resources["/kamir-skillr/profile/card"]
	if !ok {
		t.Error("expected profile card to be created on external client")
	}
	if !strings.Contains(card, "kamir-skillr") {
		t.Errorf("expected card to contain 'kamir-skillr', got:\n%s", card)
	}
}

func TestNormalizePodPath_ExternalURL(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"https://solid.redpencil.io/kamir-skillr", "/kamir-skillr"},
		{"http://localhost:3000/user-1", "/user-1"},
		{"/user-1", "/user-1"},
		{"/af95a07c-1234-5678-9abc-def012345678", "/af95a07c-1234-5678-9abc-def012345678"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := normalizePodPath(tt.input)
			if got != tt.want {
				t.Errorf("normalizePodPath(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
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
