package solid

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
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
	log.Printf("[pod] css CreateContainer %s", path)
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

	// 409 = container already exists — not an error
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusResetContent && resp.StatusCode != http.StatusConflict {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[pod] ERROR css CreateContainer %s: %d", path, resp.StatusCode)
		return fmt.Errorf("create container %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	return nil
}

func (c *HTTPClient) PutResource(ctx context.Context, path string, turtle string) error {
	log.Printf("[pod] css PutResource %s (%d bytes)", path, len(turtle))
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

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusResetContent {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[pod] ERROR css PutResource %s: %d", path, resp.StatusCode)
		return fmt.Errorf("put resource %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	return nil
}

func (c *HTTPClient) GetResource(ctx context.Context, path string) (string, error) {
	log.Printf("[pod] css GetResource %s", path)
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
		log.Printf("[pod] WARN css GetResource %s: not found", path)
		return "", fmt.Errorf("resource not found: %s", path)
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[pod] ERROR css GetResource %s: %d", path, resp.StatusCode)
		return "", fmt.Errorf("get resource %s: status %d: %s", path, resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read body: %w", err)
	}
	return string(body), nil
}

func (c *HTTPClient) DeleteResource(ctx context.Context, path string) error {
	log.Printf("[pod] css DeleteResource %s", path)
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

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusResetContent && resp.StatusCode != http.StatusNotFound {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[pod] ERROR css DeleteResource %s: %d", path, resp.StatusCode)
		return fmt.Errorf("delete resource %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	return nil
}

func (c *HTTPClient) Ping(ctx context.Context) error {
	log.Printf("[pod] css Ping %s", c.baseURL)
	url := c.baseURL + "/.well-known/openid-configuration"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("ping request: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		log.Printf("[pod] ERROR css Ping: %v", err)
		return fmt.Errorf("ping: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[pod] ERROR css Ping: status %d", resp.StatusCode)
		return fmt.Errorf("ping: status %d", resp.StatusCode)
	}
	return nil
}

// Authenticate logs in to a CSS v7 account using email/password.
// The session cookie is stored in the client's cookie jar and used for all
// subsequent requests. This is required for external Pod servers that enforce
// access control (unlike the local dev CSS which is open by default).
func (c *HTTPClient) Authenticate(ctx context.Context, email, password string) error {
	log.Printf("[pod] css Authenticate %s (email=%s)", c.baseURL, email)

	// Enable cookie jar so the session cookie is stored and reused
	jar, err := cookiejar.New(nil)
	if err != nil {
		return fmt.Errorf("create cookie jar: %w", err)
	}
	c.http.Jar = jar

	loginURL := c.baseURL + "/.account/login/password/"
	body := fmt.Sprintf(`{"email":%q,"password":%q}`, email, password)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, loginURL, strings.NewReader(body))
	if err != nil {
		return fmt.Errorf("create login request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		log.Printf("[pod] ERROR css Authenticate: %v", err)
		return fmt.Errorf("login: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("[pod] ERROR css Authenticate: status %d", resp.StatusCode)
		return fmt.Errorf("login failed: status %d: %s", resp.StatusCode, string(respBody))
	}

	log.Printf("[pod] css Authenticate: ok")
	return nil
}

func ensureTrailingSlash(path string) string {
	if !strings.HasSuffix(path, "/") {
		return path + "/"
	}
	return path
}
