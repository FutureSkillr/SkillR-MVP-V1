package ai

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/labstack/echo/v4"
)

// FR-058: Input validation patterns
var (
	journeyTypeRe = regexp.MustCompile(`^[a-z0-9-]{1,50}$`)
	stationIDRe   = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,100}$`)
)

// aiErrorResponse is returned as JSON for classified AI errors.
type aiErrorResponse struct {
	Error     string `json:"error"`
	ErrorCode string `json:"error_code"`
}

// classifyAIError inspects an AI error and returns an HTTP status code and structured response.
func classifyAIError(err error) (int, aiErrorResponse) {
	msg := err.Error()
	lower := strings.ToLower(msg)

	switch {
	case strings.Contains(lower, "could not find default credentials") ||
		strings.Contains(lower, "application default credentials"):
		return http.StatusServiceUnavailable, aiErrorResponse{
			Error:     "AI credentials not configured",
			ErrorCode: "ai_credentials_missing",
		}
	case strings.Contains(msg, "RESOURCE_EXHAUSTED") || strings.Contains(msg, "429"):
		return http.StatusTooManyRequests, aiErrorResponse{
			Error:     "AI rate limit exceeded",
			ErrorCode: "ai_rate_limited",
		}
	case (strings.Contains(lower, "not found") && strings.Contains(lower, "model")) ||
		strings.Contains(msg, "models/") && strings.Contains(lower, "not found"):
		return http.StatusBadGateway, aiErrorResponse{
			Error:     "AI model not found",
			ErrorCode: "ai_model_not_found",
		}
	case strings.Contains(msg, "PERMISSION_DENIED"):
		return http.StatusForbidden, aiErrorResponse{
			Error:     "AI permission denied",
			ErrorCode: "ai_permission_denied",
		}
	case strings.Contains(lower, "context deadline exceeded") || strings.Contains(lower, "timeout"):
		return http.StatusGatewayTimeout, aiErrorResponse{
			Error:     "AI request timed out",
			ErrorCode: "ai_timeout",
		}
	case strings.Contains(lower, "connection refused") || strings.Contains(lower, "no such host"):
		return http.StatusServiceUnavailable, aiErrorResponse{
			Error:     "AI service unreachable",
			ErrorCode: "ai_network_error",
		}
	default:
		return http.StatusInternalServerError, aiErrorResponse{
			Error:     "AI service error",
			ErrorCode: "ai_internal_error",
		}
	}
}

// aiError logs the full error server-side and returns a classified JSON response.
// It writes the response directly via c.JSON, bypassing the global jsonErrorHandler.
func (h *Handler) aiError(c echo.Context, operation string, err error) error {
	status, resp := classifyAIError(err)
	log.Printf("[ERROR] %s: %v (error_code=%s, status=%d)", operation, err, resp.ErrorCode, status)
	return c.JSON(status, resp)
}

// AIClient defines the interface for AI operations.
type AIClient interface {
	Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error)
	Generate(ctx context.Context, req ChatRequest) (*ChatResponse, error)
	TextToSpeech(ctx context.Context, req TTSRequest) (*TTSResponse, error)
	SpeechToText(ctx context.Context, req STTRequest) (*STTResponse, error)
	Ping(ctx context.Context) (int64, error)
}

type Handler struct {
	ai           AIClient
	orchestrator *Orchestrator
}

func NewHandler(ai AIClient, orchestrator *Orchestrator) *Handler {
	return &Handler{ai: ai, orchestrator: orchestrator}
}

var dialectPrompts = map[string]string{
	"hochdeutsch":  "Lies diesen Text in klarem Hochdeutsch vor.",
	"bayerisch":    "Lies diesen Text mit bayerischem Akzent vor.",
	"schwaebisch":  "Lies diesen Text mit schwaebischem Akzent vor.",
	"berlinerisch": "Lies diesen Text mit Berliner Dialekt vor.",
	"saechsisch":   "Lies diesen Text mit saechsischem Akzent vor.",
	"koelsch":      "Lies diesen Text mit koelschem Akzent vor.",
}

// Built-in prompts for passthrough mode (when orchestrator has no prompt_id).
// These mirror the Express server's hardcoded prompts.
var builtinExtractPrompts = map[string]string{
	"insights": `Du bist ein Analyse-Tool. Extrahiere strukturierte Daten aus Gespraechen.
Antworte NUR mit validem JSON in diesem Format:
{"interests": ["..."], "strengths": ["..."], "preferredStyle": "hands-on|reflective|creative", "recommendedJourney": "vuca|entrepreneur|self-learning", "summary": "..."}
Regeln:
- interests: 3-5 erkannte Interessen
- strengths: 2-4 erkannte Staerken
- preferredStyle: hands-on (Macher), reflective (Denker), creative (Kreativer)
- recommendedJourney: vuca fuer Entdecker, entrepreneur fuer Macher, self-learning fuer Denker
- summary: 1-2 Saetze auf Deutsch`,

	"station-result": `Du bist ein Bewertungs-Tool. Analysiere das Gespraech und vergib Scores fuer die gezeigten Dimensionen.
Antworte NUR mit validem JSON in diesem Format:
{"dimensionScores": {"dimension_name": 80, ...}, "summary": "Kurze Zusammenfassung"}
Regeln:
- dimensionScores: Scores von 0-100 pro erkannter Dimension
- summary: 1-2 Saetze auf Deutsch`,
}

var builtinGeneratePrompts = map[string]string{
	"curriculum": `Du bist ein Curriculum-Generator fuer die VUCA-Reise. Erstelle strukturierte Lehrplaene mit 12 Modulen (3 pro VUCA-Dimension).
Antworte NUR mit validem JSON in diesem Format:
{"goal": "...", "modules": [{"id": "v1", "title": "...", "description": "...", "category": "V|U|C|A", "order": 1}, ...]}
Regeln:
- 12 Module total, 3 pro Kategorie (V, U, C, A)
- IDs: v1-v3, u1-u3, c1-c3, a1-a3
- Alle Texte auf Deutsch
- Module sollen zum Berufsziel passen`,

	"course": `Du bist ein Kurs-Generator. Erstelle Lernmaterial mit Quiz-Fragen.
Antworte NUR mit validem JSON in diesem Format:
{"title": "...", "sections": [{"heading": "...", "content": "..."}], "quiz": [{"question": "...", "options": ["..."], "correctIndex": 0, "explanation": "..."}]}
Regeln:
- 2-3 Abschnitte mit Lerninhalt
- 3 Quiz-Fragen (Multiple-Choice mit je 4 Optionen)
- Alle Texte auf Deutsch`,
}

// ── Status ───────────────────────────────────────────────────────────────────

// AiStatusResponse is returned by the /api/v1/ai/status endpoint.
type AiStatusResponse struct {
	Status    string `json:"status"`     // "connected", "error", "network_error"
	LatencyMs int64  `json:"latency_ms"` // round-trip time of the ping
	ErrorCode string `json:"error_code,omitempty"`
	Message   string `json:"message,omitempty"`
}

// Status performs an active Vertex AI connectivity check and returns the result.
func (h *Handler) Status(c echo.Context) error {
	ctx := c.Request().Context()

	latencyMs, err := h.ai.Ping(ctx)
	if err != nil {
		errMsg := err.Error()
		lower := strings.ToLower(errMsg)

		status := "error"
		errorCode := "ai_error"

		switch {
		case strings.Contains(lower, "connection refused") ||
			strings.Contains(lower, "no such host") ||
			strings.Contains(lower, "dial tcp") ||
			strings.Contains(lower, "network is unreachable") ||
			strings.Contains(lower, "dns"):
			status = "network_error"
			errorCode = "ai_network_error"
		case strings.Contains(lower, "context deadline exceeded") ||
			strings.Contains(lower, "timeout"):
			status = "network_error"
			errorCode = "ai_timeout"
		case strings.Contains(lower, "could not find default credentials") ||
			strings.Contains(lower, "application default credentials"):
			errorCode = "ai_credentials_missing"
		case strings.Contains(errMsg, "PERMISSION_DENIED"):
			errorCode = "ai_permission_denied"
		case strings.Contains(errMsg, "RESOURCE_EXHAUSTED") || strings.Contains(errMsg, "429"):
			errorCode = "ai_rate_limited"
		}

		log.Printf("[AI] Status check: %s (error_code=%s, latency=%dms): %v", status, errorCode, latencyMs, err)

		return c.JSON(http.StatusOK, AiStatusResponse{
			Status:    status,
			LatencyMs: latencyMs,
			ErrorCode: errorCode,
			Message:   errMsg,
		})
	}

	log.Printf("[AI] Status check: connected (latency=%dms)", latencyMs)

	return c.JSON(http.StatusOK, AiStatusResponse{
		Status:    "connected",
		LatencyMs: latencyMs,
	})
}

// ── Chat ─────────────────────────────────────────────────────────────────────

type AiChatRequest struct {
	SessionID string                 `json:"session_id"`
	AgentID   *string                `json:"agent_id,omitempty"`
	Message   string                 `json:"message"`
	Context   map[string]interface{} `json:"context,omitempty"`
	// Passthrough fields — used when client provides system instruction directly
	SystemInstruction string              `json:"system_instruction,omitempty"`
	History           []map[string]string `json:"history,omitempty"`
}

type AiChatResponse struct {
	Response      string   `json:"response"`
	Text          string   `json:"text"` // alias for Response (frontend compat)
	AgentID       string   `json:"agent_id"`
	Markers       []string `json:"markers,omitempty"`
	InteractionID *string  `json:"interaction_id,omitempty"`
}

func (h *Handler) Chat(c echo.Context) error {
	// Auth is optional — intro flow works without login
	var req AiChatRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Message == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "message is required")
	}
	if len(req.Message) > 10000 {
		return echo.NewHTTPError(http.StatusBadRequest, "message exceeds 10000 characters")
	}

	ctx := c.Request().Context()

	// Passthrough mode: client provides system instruction directly
	if req.SystemInstruction != "" {
		history := convertHistory(req.History)
		chatReq := ChatRequest{
			SystemInstruction: req.SystemInstruction,
			History:           history,
			Message:           req.Message,
		}
		resp, err := h.ai.Chat(ctx, chatReq)
		if err != nil {
			return h.aiError(c, "chat/passthrough", err)
		}
		return c.JSON(http.StatusOK, AiChatResponse{
			Response: resp.Text,
			Text:     resp.Text,
			AgentID:  "passthrough",
		})
	}

	// Orchestrated mode: select agent and prompt from DB
	journeyType := ""
	if jt, ok := req.Context["journey_type"].(string); ok {
		if !journeyTypeRe.MatchString(jt) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid journey_type format")
		}
		journeyType = jt
	}

	agent, prompt, err := h.orchestrator.SelectAgent(ctx, journeyType, "")
	if err != nil || prompt == nil {
		// Fallback to default model without prompt
		resp, err := h.ai.Chat(ctx, ChatRequest{
			Message: req.Message,
		})
		if err != nil {
			return h.aiError(c, "chat/fallback", err)
		}
		agentID := "default"
		if agent != nil {
			agentID = agent.AgentID
		}
		return c.JSON(http.StatusOK, AiChatResponse{
			Response: resp.Text,
			Text:     resp.Text,
			AgentID:  agentID,
		})
	}

	// Build request with prompt
	var temp *float32
	if prompt.ModelConfig.Temperature > 0 {
		t := float32(prompt.ModelConfig.Temperature)
		temp = &t
	}

	chatReq := ChatRequest{
		Model:             prompt.ModelConfig.Model,
		SystemInstruction: prompt.SystemInstruction,
		Message:           req.Message,
		Temperature:       temp,
		ResponseMIMEType:  prompt.ModelConfig.ResponseMIMEType,
	}

	resp, err := h.ai.Chat(ctx, chatReq)
	if err != nil {
		return h.aiError(c, "chat/orchestrated", err)
	}

	// Detect completion markers
	var markers []string
	for _, marker := range prompt.CompletionMarkers {
		if strings.Contains(resp.Text, marker) {
			markers = append(markers, marker)
		}
	}

	return c.JSON(http.StatusOK, AiChatResponse{
		Response: resp.Text,
		Text:     resp.Text,
		AgentID:  agent.AgentID,
		Markers:  markers,
	})
}

// ── Extract ──────────────────────────────────────────────────────────────────

type AiExtractRequest struct {
	PromptID string              `json:"prompt_id"`
	Messages []map[string]string `json:"messages,omitempty"`
	Context  map[string]interface{} `json:"context,omitempty"`
}

type AiExtractResponse struct {
	Result        json.RawMessage `json:"result"`
	PromptID      string          `json:"prompt_id"`
	PromptVersion int             `json:"prompt_version"`
}

func (h *Handler) Extract(c echo.Context) error {
	// Auth is optional
	var req AiExtractRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	ctx := c.Request().Context()

	// If prompt_id provided, use orchestrator (original flow)
	if req.PromptID != "" {
		return h.extractOrchestrated(c, ctx, req)
	}

	// Passthrough mode: use built-in prompt based on extract_type
	extractType := "insights"
	if et, ok := req.Context["extract_type"].(string); ok {
		extractType = et
	}

	sysInstruction, ok := builtinExtractPrompts[extractType]
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "unknown extract_type: "+extractType)
	}

	// Build transcript from messages
	transcript := formatTranscript(req.Messages, extractType)

	// Build user message with context
	var userMessage string
	switch extractType {
	case "insights":
		userMessage = fmt.Sprintf("Analysiere dieses Onboarding-Gespraech und extrahiere strukturierte Insights:\n\n%s", transcript)
	case "station-result":
		journeyType, _ := req.Context["journey_type"].(string)
		stationID, _ := req.Context["station_id"].(string)
		if journeyType != "" && !journeyTypeRe.MatchString(journeyType) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid journey_type format")
		}
		if stationID != "" && !stationIDRe.MatchString(stationID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid station_id format")
		}
		userMessage = fmt.Sprintf("Analysiere diese Station und bewerte die gezeigten Faehigkeiten:\n\nReise-Typ: %s\nStation: %s\n\n%s",
			journeyType, stationID, transcript)
	}

	chatReq := ChatRequest{
		SystemInstruction: sysInstruction,
		Message:           userMessage,
		ResponseMIMEType:  "application/json",
	}

	resp, err := h.ai.Generate(ctx, chatReq)
	if err != nil {
		return h.aiError(c, "extract/"+extractType, err)
	}

	resultJSON := []byte(resp.Text)
	if !json.Valid(resultJSON) {
		resultJSON = []byte(`{"error":"invalid JSON from AI"}`)
	}

	return c.JSON(http.StatusOK, AiExtractResponse{
		Result:   json.RawMessage(resultJSON),
		PromptID: "builtin:" + extractType,
	})
}

func (h *Handler) extractOrchestrated(c echo.Context, ctx context.Context, req AiExtractRequest) error {
	prompt, err := h.orchestrator.GetPrompt(ctx, req.PromptID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "prompt not found: "+req.PromptID)
	}

	var message string
	for _, msg := range req.Messages {
		role := msg["role"]
		text := msgText(msg)
		message += role + ": " + text + "\n"
	}

	chatReq := ChatRequest{
		Model:             prompt.ModelConfig.Model,
		SystemInstruction: prompt.SystemInstruction,
		Message:           message,
		ResponseMIMEType:  "application/json",
	}

	resp, err := h.ai.Generate(ctx, chatReq)
	if err != nil {
		return h.aiError(c, "extract/orchestrated", err)
	}

	resultJSON := []byte(resp.Text)
	if !json.Valid(resultJSON) {
		resultJSON = []byte(`{"error":"invalid JSON from AI"}`)
	}

	return c.JSON(http.StatusOK, AiExtractResponse{
		Result:        json.RawMessage(resultJSON),
		PromptID:      req.PromptID,
		PromptVersion: prompt.Version,
	})
}

// ── Generate ─────────────────────────────────────────────────────────────────

type AiGenerateRequest struct {
	PromptID   string                 `json:"prompt_id"`
	Parameters map[string]interface{} `json:"parameters,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
}

type AiGenerateResponse struct {
	Result        json.RawMessage `json:"result"`
	PromptID      string          `json:"prompt_id"`
	PromptVersion int             `json:"prompt_version"`
}

func (h *Handler) Generate(c echo.Context) error {
	// Auth is optional
	var req AiGenerateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	ctx := c.Request().Context()

	// If prompt_id provided, use orchestrator (original flow)
	if req.PromptID != "" {
		return h.generateOrchestrated(c, ctx, req)
	}

	// Passthrough mode: use built-in prompt based on generate_type
	generateType := "curriculum"
	if gt, ok := req.Context["generate_type"].(string); ok {
		generateType = gt
	}

	sysInstruction, ok := builtinGeneratePrompts[generateType]
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "unknown generate_type: "+generateType)
	}

	// Build user message from parameters
	var userMessage string
	switch generateType {
	case "curriculum":
		goal, _ := req.Parameters["goal"].(string)
		userMessage = fmt.Sprintf("Erstelle einen Lehrplan fuer das Berufsziel: \"%s\".", goal)
	case "course":
		goal, _ := req.Parameters["goal"].(string)
		mod, _ := req.Parameters["module"].(map[string]interface{})
		title, _ := mod["title"].(string)
		desc, _ := mod["description"].(string)
		cat, _ := mod["category"].(string)
		userMessage = fmt.Sprintf("Erstelle Kursinhalt fuer das Modul \"%s\" (%s). VUCA-Dimension: %s. Berufsziel: \"%s\".",
			title, desc, cat, goal)
	default:
		paramsJSON, _ := json.Marshal(req.Parameters)
		userMessage = string(paramsJSON)
	}

	chatReq := ChatRequest{
		SystemInstruction: sysInstruction,
		Message:           userMessage,
		ResponseMIMEType:  "application/json",
	}

	resp, err := h.ai.Generate(ctx, chatReq)
	if err != nil {
		return h.aiError(c, "generate/"+generateType, err)
	}

	resultJSON := []byte(resp.Text)
	if !json.Valid(resultJSON) {
		resultJSON = []byte(`{"error":"invalid JSON from AI"}`)
	}

	return c.JSON(http.StatusOK, AiGenerateResponse{
		Result:   json.RawMessage(resultJSON),
		PromptID: "builtin:" + generateType,
	})
}

func (h *Handler) generateOrchestrated(c echo.Context, ctx context.Context, req AiGenerateRequest) error {
	prompt, err := h.orchestrator.GetPrompt(ctx, req.PromptID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "prompt not found: "+req.PromptID)
	}

	paramsJSON, _ := json.Marshal(req.Parameters)
	chatReq := ChatRequest{
		Model:             prompt.ModelConfig.Model,
		SystemInstruction: prompt.SystemInstruction,
		Message:           string(paramsJSON),
		ResponseMIMEType:  prompt.ModelConfig.ResponseMIMEType,
	}

	resp, err := h.ai.Generate(ctx, chatReq)
	if err != nil {
		return h.aiError(c, "generate/orchestrated", err)
	}

	genResultJSON := []byte(resp.Text)
	if !json.Valid(genResultJSON) {
		genResultJSON = []byte(`{"error":"invalid JSON from AI"}`)
	}

	return c.JSON(http.StatusOK, AiGenerateResponse{
		Result:        json.RawMessage(genResultJSON),
		PromptID:      req.PromptID,
		PromptVersion: prompt.Version,
	})
}

// ── TTS ──────────────────────────────────────────────────────────────────────

type AiTtsRequest struct {
	Text         string `json:"text"`
	VoiceDialect string `json:"voice_dialect,omitempty"`
}

type AiTtsResponse struct {
	Audio string `json:"audio"`
}

func (h *Handler) TTS(c echo.Context) error {
	// Auth is optional
	var req AiTtsRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Text == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "text is required")
	}
	if len(req.Text) > 5000 {
		return echo.NewHTTPError(http.StatusBadRequest, "text exceeds 5000 characters")
	}

	dialectPrompt := dialectPrompts["hochdeutsch"]
	if dp, ok := dialectPrompts[req.VoiceDialect]; ok {
		dialectPrompt = dp
	}

	ctx := c.Request().Context()
	resp, err := h.ai.TextToSpeech(ctx, TTSRequest{
		Text:          req.Text,
		VoiceName:     "Kore",
		DialectPrompt: dialectPrompt,
	})
	if err != nil {
		return h.aiError(c, "tts", err)
	}

	audioBase64 := base64.StdEncoding.EncodeToString(resp.AudioData)
	return c.JSON(http.StatusOK, AiTtsResponse{Audio: audioBase64})
}

// ── STT ──────────────────────────────────────────────────────────────────────

type AiSttRequest struct {
	Audio    string `json:"audio"`
	MimeType string `json:"mime_type,omitempty"`
}

type AiSttResponse struct {
	Text string `json:"text"`
}

func (h *Handler) STT(c echo.Context) error {
	// Auth is optional
	var req AiSttRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Audio == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "audio is required")
	}
	if len(req.Audio) > 7*1024*1024 { // ~7MB base64 ≈ 5MB binary
		return echo.NewHTTPError(http.StatusBadRequest, "audio data too large")
	}

	audioBytes, err := base64.StdEncoding.DecodeString(req.Audio)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid base64 audio data")
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "audio/wav"
	}

	ctx := c.Request().Context()
	resp, err := h.ai.SpeechToText(ctx, STTRequest{
		AudioData: audioBytes,
		MIMEType:  mimeType,
	})
	if err != nil {
		return h.aiError(c, "stt", err)
	}

	return c.JSON(http.StatusOK, AiSttResponse{Text: resp.Text})
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// convertHistory converts frontend-style history entries (role + content/text)
// to internal ChatMessage format.
func convertHistory(history []map[string]string) []ChatMessage {
	var result []ChatMessage
	for _, h := range history {
		role := h["role"]
		text := msgText(h)
		if role != "" && text != "" {
			result = append(result, ChatMessage{Role: role, Text: text})
		}
	}
	return result
}

// msgText extracts the text content from a message map,
// checking both "content" (frontend format) and "text" (Go format).
func msgText(msg map[string]string) string {
	if t := msg["content"]; t != "" {
		return t
	}
	return msg["text"]
}

// formatTranscript converts message entries to a readable transcript.
func formatTranscript(messages []map[string]string, extractType string) string {
	coachLabel := "Coach"
	if extractType == "station-result" {
		coachLabel = "Guide"
	}

	var parts []string
	for _, msg := range messages {
		role := msg["role"]
		text := msgText(msg)
		label := role
		switch role {
		case "user":
			label = "Nutzer"
		case "model":
			label = coachLabel
		}
		parts = append(parts, label+": "+text)
	}
	return strings.Join(parts, "\n")
}
