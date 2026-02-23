package honeycomb

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client defines the interface for Honeycomb API operations (FR-074).
type Client interface {
	ListCourses(ctx context.Context, ctxID string) ([]ListEntry, error)
	GetCourseData(ctx context.Context, ctxID, dataID string) (*CourseData, error)
	SubmitTask(ctx context.Context, ctxID, dataID, moduleID, taskID string) (*CourseData, error)
	GetModified(ctx context.Context, ctxID, courseID string) (time.Time, error)
	Ping(ctx context.Context) error
}

// ListEntry maps to HoneycombListEntry in the OpenAPI spec.
type ListEntry struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// CourseData maps to HoneycombData in the OpenAPI spec.
type CourseData struct {
	ID               string   `json:"id"`
	App              string   `json:"app"`
	Name             string   `json:"name"`
	DescriptionShort string   `json:"description_short"`
	DescriptionS     string   `json:"description_s"`
	Description      string   `json:"description"`
	ProgressS        string   `json:"progress_s"`
	Progress         string   `json:"progress"`
	ProgressP        int      `json:"progress_p"`
	Modules          []Module `json:"modules"`
}

// Module maps to HoneycombModule in the OpenAPI spec.
type Module struct {
	ID                  string       `json:"id"`
	App                 string       `json:"app"`
	NameShort           string       `json:"name_short"`
	Name                string       `json:"name"`
	Duration            string       `json:"duration"`
	Severity            string       `json:"severity"`
	Badge               bool         `json:"badge"`
	ProgressP           int          `json:"progress_p"`
	ContentS            string       `json:"content_s"`
	Content             string       `json:"content"`
	RequirementsS       string       `json:"requirements_s"`
	Requirements        string       `json:"requirements"`
	RequirementsModules []string     `json:"requirements_modules"`
	GoalsS              string       `json:"goals_s"`
	Goals               string       `json:"goals"`
	GoalsModules        []string     `json:"goals_modules"`
	CanStart            bool         `json:"can_start"`
	TasksOpenS          string       `json:"tasks_open_s"`
	TasksProgressS      string       `json:"tasks_progress_s"`
	TasksDoneS          string       `json:"tasks_done_s"`
	Tasks               []ModuleTask `json:"tasks"`
}

// ModuleTask maps to HoneycombModuleTask in the OpenAPI spec.
type ModuleTask struct {
	ID               string       `json:"id"`
	State            string       `json:"state"`
	NameShort        string       `json:"name_short"`
	Name             string       `json:"name"`
	DescriptionShort string       `json:"description_short"`
	Description      string       `json:"description"`
	SourcesS         string       `json:"sources_s"`
	Sources          []TaskSource `json:"sources"`
	AnswerPlaceholderS string     `json:"answer_placeholder_s"`
	CompleteS        string       `json:"complete_s"`
	MemoryID         string       `json:"memory_id"`
}

// TaskSource is a source link within a task.
type TaskSource struct {
	URL   string `json:"url"`
	Title string `json:"title"`
}

type listResponse struct {
	Items []ListEntry `json:"items"`
}

type modifiedResponse struct {
	Modified time.Time `json:"modified"`
}

// HTTPClient implements Client using net/http.
type HTTPClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

// NewHTTPClient creates a Honeycomb HTTP client.
func NewHTTPClient(baseURL, apiKey string) *HTTPClient {
	return &HTTPClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *HTTPClient) ListCourses(ctx context.Context, ctxID string) ([]ListEntry, error) {
	url := fmt.Sprintf("%s/honeycomb/%s/list", c.baseURL, ctxID)
	body, err := c.doGet(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("list courses: %w", err)
	}
	var resp listResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("decode list response: %w", err)
	}
	return resp.Items, nil
}

func (c *HTTPClient) GetCourseData(ctx context.Context, ctxID, dataID string) (*CourseData, error) {
	url := fmt.Sprintf("%s/honeycomb/%s/data/%s", c.baseURL, ctxID, dataID)
	body, err := c.doGet(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("get course data: %w", err)
	}
	var data CourseData
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("decode course data: %w", err)
	}
	return &data, nil
}

func (c *HTTPClient) SubmitTask(ctx context.Context, ctxID, dataID, moduleID, taskID string) (*CourseData, error) {
	url := fmt.Sprintf("%s/honeycomb/%s/data/%s/%s/%s/submit", c.baseURL, ctxID, dataID, moduleID, taskID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("X-API-KEY", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("submit task: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("submit task: status %d: %s", resp.StatusCode, string(body))
	}

	var data CourseData
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("decode submit response: %w", err)
	}
	return &data, nil
}

func (c *HTTPClient) GetModified(ctx context.Context, ctxID, courseID string) (time.Time, error) {
	url := fmt.Sprintf("%s/honeycomb/%s/course/%s/modified", c.baseURL, ctxID, courseID)
	body, err := c.doGet(ctx, url)
	if err != nil {
		return time.Time{}, fmt.Errorf("get modified: %w", err)
	}
	var resp modifiedResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return time.Time{}, fmt.Errorf("decode modified response: %w", err)
	}
	return resp.Modified, nil
}

func (c *HTTPClient) Ping(ctx context.Context) error {
	// Use a lightweight list call with a dummy ctx_id to check connectivity.
	// The API should respond (even with an error status) if it is reachable.
	url := fmt.Sprintf("%s/honeycomb/_ping/list", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("create ping request: %w", err)
	}
	req.Header.Set("X-API-KEY", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("ping honeycomb: %w", err)
	}
	_ = resp.Body.Close()
	// Any HTTP response means the service is reachable
	return nil
}

func (c *HTTPClient) doGet(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("X-API-KEY", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}
	return body, nil
}
