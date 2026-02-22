package agents

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/ai"
	"skillr-mvp-v1/backend/internal/firebase"
	"skillr-mvp-v1/backend/internal/postgres"
)

type Handler struct {
	store     *firebase.AgentStore
	vertexai  *ai.VertexAIClient
	prompts   *firebase.PromptStore
	analytics *postgres.AnalyticsRepository
}

func NewHandler(store *firebase.AgentStore, vertexai *ai.VertexAIClient, prompts *firebase.PromptStore, analytics *postgres.AnalyticsRepository) *Handler {
	return &Handler{store: store, vertexai: vertexai, prompts: prompts, analytics: analytics}
}

func (h *Handler) List(c echo.Context) error {
	agents, err := h.store.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list agents")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"agents": agents,
		"total":  len(agents),
	})
}

func (h *Handler) Get(c echo.Context) error {
	agentID := c.Param("agentId")
	agent, err := h.store.Get(c.Request().Context(), agentID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "agent not found")
	}
	return c.JSON(http.StatusOK, agent)
}

func (h *Handler) Update(c echo.Context) error {
	agentID := c.Param("agentId")

	var updates map[string]interface{}
	if err := c.Bind(&updates); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	agent, err := h.store.Update(c.Request().Context(), agentID, updates)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "agent not found")
	}
	return c.JSON(http.StatusOK, agent)
}

func (h *Handler) Executions(c echo.Context) error {
	// Return agent execution history from PostgreSQL
	// Stub: return empty list for now since we need a query method on analytics repo
	return c.JSON(http.StatusOK, map[string]interface{}{
		"executions": []interface{}{},
		"total":      0,
	})
}

type InvokeAgentRequest struct {
	UserID       string                 `json:"user_id"`
	SessionID    *string                `json:"session_id,omitempty"`
	TriggerEvent string                 `json:"trigger_event"`
	Parameters   map[string]interface{} `json:"parameters,omitempty"`
}

func (h *Handler) Invoke(c echo.Context) error {
	agentID := c.Param("agentId")

	var req InvokeAgentRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	ctx := c.Request().Context()

	agent, err := h.store.Get(ctx, agentID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "agent not found")
	}

	if len(agent.PromptIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "agent has no configured prompts")
	}

	prompt, err := h.prompts.Get(ctx, agent.PromptIDs[0])
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load agent prompt")
	}

	// Execute the agent
	chatReq := ai.ChatRequest{
		Model:             prompt.ModelConfig.Model,
		SystemInstruction: prompt.SystemInstruction,
		Message:           "invoke",
		ResponseMIMEType:  prompt.ModelConfig.ResponseMIMEType,
	}

	resp, err := h.vertexai.Chat(ctx, chatReq)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "agent execution failed")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":             "manual-" + agentID,
		"agent_id":       agentID,
		"prompt_id":      agent.PromptIDs[0],
		"prompt_version": prompt.Version,
		"trigger_event":  req.TriggerEvent,
		"output_summary": truncate(resp.Text, 500),
		"model_name":     resp.ModelUsed,
		"token_count":    resp.TokenCount,
		"status":         "success",
	})
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func intQuery(c echo.Context, key string, def int) int {
	if v := c.QueryParam(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i >= 0 {
			return i
		}
	}
	return def
}
