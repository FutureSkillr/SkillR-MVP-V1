package solid

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client defines the interface for Solid Pod HTTP operations.
type Client interface {
	// CreateContainer creates a new container (directory) at the given path.
	CreateContainer(ctx context.Context, path string) error
	// PutResource writes Turtle content to the given resource path.
	PutResource(ctx context.Context, path string, turtle string) error
	// GetResource reads a resource and returns its body.
	GetResource(ctx context.Context, path string) (string, error)
	// DeleteResource removes a resource at the given path.
	DeleteResource(ctx context.Context, path string) error
	// Ping checks whether the Pod server is reachable.
	Ping(ctx context.Context) error
}

// HTTPClient implements Client using standard HTTP against a CSS instance.
type HTTPClient struct {
	baseURL string
	http    *http.Client
}

// NewHTTPClient creates a new Solid Pod HTTP client.
func NewHTTPClient(baseURL string) *HTTPClient {
	return &HTTPClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		http:    &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *HTTPClient) CreateContainer(ctx context.Context, path string) error {
	url := c.baseURL + ensureTrailingSlash(path)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, nil)
	if err != nil {
		return fmt.Errorf("create container request: %w", err)
	}
	// CSS creates intermediate containers on PUT with Link header
	req.Header.Set("Content-Type", "text/turtle")
	req.Header.Set("Link", `<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"`)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("create container: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("create container %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	return nil
}

func (c *HTTPClient) PutResource(ctx context.Context, path string, turtle string) error {
	url := c.baseURL + path

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, bytes.NewBufferString(turtle))
	if err != nil {
		return fmt.Errorf("put resource request: %w", err)
	}
	req.Header.Set("Content-Type", "text/turtle")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("put resource: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("put resource %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	return nil
}

func (c *HTTPClient) GetResource(ctx context.Context, path string) (string, error) {
	url := c.baseURL + path

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("get resource request: %w", err)
	}
	req.Header.Set("Accept", "text/turtle")

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("get resource: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode == http.StatusNotFound {
		return "", fmt.Errorf("resource not found: %s", path)
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("get resource %s: status %d: %s", path, resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read body: %w", err)
	}
	return string(body), nil
}

func (c *HTTPClient) DeleteResource(ctx context.Context, path string) error {
	url := c.baseURL + path

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("delete resource request: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("delete resource: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusNotFound {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete resource %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	return nil
}

func (c *HTTPClient) Ping(ctx context.Context) error {
	url := c.baseURL + "/.well-known/openid-configuration"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("ping request: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("ping: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ping: status %d", resp.StatusCode)
	}
	return nil
}

func ensureTrailingSlash(path string) string {
	if !strings.HasSuffix(path, "/") {
		return path + "/"
	}
	return path
}
