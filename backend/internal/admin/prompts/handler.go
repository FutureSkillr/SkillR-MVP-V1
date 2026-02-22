package prompts

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/ai"
	"github.com/FutureSkillr/MVP72/backend/internal/firebase"
)

type Handler struct {
	store    *firebase.PromptStore
	vertexai *ai.VertexAIClient
}

func NewHandler(store *firebase.PromptStore, vertexai *ai.VertexAIClient) *Handler {
	return &Handler{store: store, vertexai: vertexai}
}

func (h *Handler) List(c echo.Context) error {
	var category *string
	if cat := c.QueryParam("category"); cat != "" {
		category = &cat
	}
	var isActive *bool
	if active := c.QueryParam("is_active"); active != "" {
		b := active == "true"
		isActive = &b
	}

	prompts, err := h.store.List(c.Request().Context(), category, isActive)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list prompts")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"prompts": prompts,
		"total":   len(prompts),
	})
}

func (h *Handler) Get(c echo.Context) error {
	promptID := c.Param("promptId")
	prompt, err := h.store.Get(c.Request().Context(), promptID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "prompt not found")
	}
	return c.JSON(http.StatusOK, prompt)
}

func (h *Handler) Update(c echo.Context) error {
	promptID := c.Param("promptId")

	var updates map[string]interface{}
	if err := c.Bind(&updates); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	prompt, err := h.store.Update(c.Request().Context(), promptID, updates)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "prompt not found")
	}
	return c.JSON(http.StatusOK, prompt)
}

type TestPromptRequest struct {
	SampleInput   string              `json:"sample_input"`
	SampleHistory []map[string]string `json:"sample_history,omitempty"`
}

type TestPromptResponse struct {
	Response        string   `json:"response"`
	LatencyMs       int      `json:"latency_ms"`
	TokenCount      int      `json:"token_count"`
	ModelUsed       string   `json:"model_used"`
	MarkersDetected []string `json:"markers_detected,omitempty"`
}

func (h *Handler) Test(c echo.Context) error {
	promptID := c.Param("promptId")

	var req TestPromptRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	prompt, err := h.store.Get(c.Request().Context(), promptID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "prompt not found")
	}

	start := time.Now()

	var history []ai.ChatMessage
	for _, msg := range req.SampleHistory {
		history = append(history, ai.ChatMessage{Role: msg["role"], Text: msg["text"]})
	}

	chatReq := ai.ChatRequest{
		Model:             prompt.ModelConfig.Model,
		SystemInstruction: prompt.SystemInstruction,
		History:           history,
		Message:           req.SampleInput,
		ResponseMIMEType:  prompt.ModelConfig.ResponseMIMEType,
	}

	resp, err := h.vertexai.Chat(c.Request().Context(), chatReq)
	if err != nil {
		log.Printf("prompt test execution failed for %s: %v", promptID, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "test execution failed")
	}

	latencyMs := int(time.Since(start).Milliseconds())

	// Detect markers
	var markers []string
	for _, marker := range prompt.CompletionMarkers {
		if len(resp.Text) > 0 && contains(resp.Text, marker) {
			markers = append(markers, marker)
		}
	}

	return c.JSON(http.StatusOK, TestPromptResponse{
		Response:        resp.Text,
		LatencyMs:       latencyMs,
		TokenCount:      resp.TokenCount,
		ModelUsed:       resp.ModelUsed,
		MarkersDetected: markers,
	})
}

func (h *Handler) History(c echo.Context) error {
	promptID := c.Param("promptId")
	// For now, return the current version. Version history would require
	// a subcollection in Firestore (prompt_templates/{id}/versions).
	prompt, err := h.store.Get(c.Request().Context(), promptID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "prompt not found")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"versions": []interface{}{prompt},
	})
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstring(s, substr))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Ensure json import is used
var _ = json.Marshal
