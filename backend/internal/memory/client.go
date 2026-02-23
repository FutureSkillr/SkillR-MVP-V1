package memory

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client defines the interface for Memory service operations (FR-073).
type Client interface {
	RegisterUser(ctx context.Context, uid, givenName, familyName, email string) (ctxID string, err error)
	Ping(ctx context.Context) error
}

type accessRequest struct {
	UID        string `json:"uid"`
	GivenName  string `json:"given_name"`
	FamilyName string `json:"family_name"`
	Email      string `json:"email"`
	EmailValid bool   `json:"email_valid"`
}

type accessResponse struct {
	CtxID string `json:"ctx_id"`
	Tier  string `json:"tier"`
}

// HTTPClient implements Client using net/http.
type HTTPClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

// NewHTTPClient creates a Memory service HTTP client.
func NewHTTPClient(baseURL, apiKey string) *HTTPClient {
	return &HTTPClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *HTTPClient) RegisterUser(ctx context.Context, uid, givenName, familyName, email string) (string, error) {
	reqBody := accessRequest{
		UID:        uid,
		GivenName:  givenName,
		FamilyName: familyName,
		Email:      email,
		EmailValid: email != "",
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/user/access", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("register user: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("register user: status %d: %s", resp.StatusCode, string(body))
	}

	var accessResp accessResponse
	if err := json.Unmarshal(body, &accessResp); err != nil {
		return "", fmt.Errorf("decode response: %w", err)
	}

	if accessResp.CtxID == "" {
		return "", fmt.Errorf("register user: empty ctx_id in response")
	}

	return accessResp.CtxID, nil
}

func (c *HTTPClient) Ping(ctx context.Context) error {
	// POST /user/access with empty body should get a response (even an error)
	// if the service is reachable.
	url := fmt.Sprintf("%s/user/access", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader([]byte("{}")))
	if err != nil {
		return fmt.Errorf("create ping request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("ping memory service: %w", err)
	}
	_ = resp.Body.Close()
	// Any HTTP response means the service is reachable
	return nil
}
