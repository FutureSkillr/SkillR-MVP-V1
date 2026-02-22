package ai

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/firebase"
	"github.com/FutureSkillr/MVP72/backend/internal/middleware"
	"github.com/FutureSkillr/MVP72/backend/internal/model"
)

// mockAIClient implements AIClient for testing.
type mockAIClient struct {
	chatFn func(ctx context.Context, req ChatRequest) (*ChatResponse, error)
	genFn  func(ctx context.Context, req ChatRequest) (*ChatResponse, error)
	ttsFn  func(ctx context.Context, req TTSRequest) (*TTSResponse, error)
	sttFn  func(ctx context.Context, req STTRequest) (*STTResponse, error)
}

func (m *mockAIClient) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	if m.chatFn != nil {
		return m.chatFn(ctx, req)
	}
	return &ChatResponse{Text: "mock response", ModelUsed: "mock"}, nil
}

func (m *mockAIClient) Generate(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	if m.genFn != nil {
		return m.genFn(ctx, req)
	}
	return &ChatResponse{Text: `{"result":"mock"}`, ModelUsed: "mock"}, nil
}

func (m *mockAIClient) TextToSpeech(ctx context.Context, req TTSRequest) (*TTSResponse, error) {
	if m.ttsFn != nil {
		return m.ttsFn(ctx, req)
	}
	return &TTSResponse{AudioData: []byte("fake-audio-data"), MIMEType: "audio/L16;rate=24000"}, nil
}

func (m *mockAIClient) SpeechToText(ctx context.Context, req STTRequest) (*STTResponse, error) {
	if m.sttFn != nil {
		return m.sttFn(ctx, req)
	}
	return &STTResponse{Text: "transkribierter Text"}, nil
}

// mockOrchestrator helpers
type mockPromptLoader struct {
	prompts map[string]*model.PromptTemplate
}

func (m *mockPromptLoader) GetActivePrompt(_ context.Context, id string) (*model.PromptTemplate, error) {
	if p, ok := m.prompts[id]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("prompt not found: %s", id)
}

type mockAgentLoader struct {
	agents []model.AgentConfig
}

func (m *mockAgentLoader) GetActiveAgent(_ context.Context, id string) (*model.AgentConfig, error) {
	for _, a := range m.agents {
		if a.AgentID == id {
			return &a, nil
		}
	}
	return nil, fmt.Errorf("agent not found: %s", id)
}

func (m *mockAgentLoader) ListActiveAgents(_ context.Context) ([]model.AgentConfig, error) {
	return m.agents, nil
}

func newTestHandler(ai AIClient) *Handler {
	orch := NewOrchestrator(
		&mockPromptLoader{prompts: map[string]*model.PromptTemplate{}},
		&mockAgentLoader{agents: []model.AgentConfig{}},
	)
	return NewHandler(ai, orch)
}

func newAuthContext(method, path, body string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	middleware.SetTestUserInfo(c, &firebase.UserInfo{
		UID:   "test-user-123",
		Email: "test@example.com",
		Role:  "user",
	})
	return c, rec
}

func newUnauthContext(method, path, body string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	return c, rec
}

// ── TTS Tests ────────────────────────────────────────────────────────────────

func TestTTS_HappyPath(t *testing.T) {
	audioBytes := []byte("test-audio-pcm-data")
	client := &mockAIClient{
		ttsFn: func(_ context.Context, req TTSRequest) (*TTSResponse, error) {
			if req.Text != "Hallo Welt" {
				t.Errorf("expected text 'Hallo Welt', got %q", req.Text)
			}
			if req.VoiceName != "Kore" {
				t.Errorf("expected voice 'Kore', got %q", req.VoiceName)
			}
			if !strings.Contains(req.DialectPrompt, "Hochdeutsch") {
				t.Errorf("expected Hochdeutsch dialect prompt, got %q", req.DialectPrompt)
			}
			return &TTSResponse{AudioData: audioBytes, MIMEType: "audio/L16;rate=24000"}, nil
		},
	}
	h := newTestHandler(client)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/tts", `{"text":"Hallo Welt"}`)

	err := h.TTS(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp AiTtsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	decoded, err := base64.StdEncoding.DecodeString(resp.Audio)
	if err != nil {
		t.Fatalf("invalid base64 audio: %v", err)
	}
	if string(decoded) != string(audioBytes) {
		t.Errorf("audio data mismatch: got %q, want %q", decoded, audioBytes)
	}
}

func TestTTS_BayerischDialect(t *testing.T) {
	client := &mockAIClient{
		ttsFn: func(_ context.Context, req TTSRequest) (*TTSResponse, error) {
			if !strings.Contains(req.DialectPrompt, "bayerisch") {
				t.Errorf("expected bayerisch dialect prompt, got %q", req.DialectPrompt)
			}
			return &TTSResponse{AudioData: []byte("audio"), MIMEType: "audio/L16;rate=24000"}, nil
		},
	}
	h := newTestHandler(client)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/tts", `{"text":"Gruss Gott","voice_dialect":"bayerisch"}`)

	err := h.TTS(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestTTS_MissingText(t *testing.T) {
	h := newTestHandler(&mockAIClient{})
	c, _ := newAuthContext(http.MethodPost, "/api/v1/ai/tts", `{}`)

	err := h.TTS(c)
	if err == nil {
		t.Fatal("expected error for missing text")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestTTS_WorksWithoutAuth(t *testing.T) {
	client := &mockAIClient{
		ttsFn: func(_ context.Context, _ TTSRequest) (*TTSResponse, error) {
			return &TTSResponse{AudioData: []byte("audio"), MIMEType: "audio/L16;rate=24000"}, nil
		},
	}
	h := newTestHandler(client)
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/tts", `{"text":"hello"}`)

	err := h.TTS(c)
	if err != nil {
		t.Fatalf("TTS should work without auth, got: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestTTS_AIError(t *testing.T) {
	client := &mockAIClient{
		ttsFn: func(_ context.Context, _ TTSRequest) (*TTSResponse, error) {
			return nil, fmt.Errorf("model unavailable")
		},
	}
	h := newTestHandler(client)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/tts", `{"text":"hello"}`)

	err := h.TTS(c)
	if err != nil {
		t.Fatalf("aiError should not return an error, got: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
	var resp aiErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp.ErrorCode != "ai_internal_error" {
		t.Errorf("expected error_code ai_internal_error, got %q", resp.ErrorCode)
	}
}

func TestTTS_UnknownDialectFallsBackToHochdeutsch(t *testing.T) {
	client := &mockAIClient{
		ttsFn: func(_ context.Context, req TTSRequest) (*TTSResponse, error) {
			if !strings.Contains(req.DialectPrompt, "Hochdeutsch") {
				t.Errorf("expected Hochdeutsch fallback, got %q", req.DialectPrompt)
			}
			return &TTSResponse{AudioData: []byte("audio"), MIMEType: "audio/L16;rate=24000"}, nil
		},
	}
	h := newTestHandler(client)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/tts", `{"text":"hi","voice_dialect":"unknown"}`)

	err := h.TTS(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

// ── STT Tests ────────────────────────────────────────────────────────────────

func TestSTT_HappyPath(t *testing.T) {
	audioBase64 := base64.StdEncoding.EncodeToString([]byte("fake-wav-data"))
	client := &mockAIClient{
		sttFn: func(_ context.Context, req STTRequest) (*STTResponse, error) {
			if req.MIMEType != "audio/wav" {
				t.Errorf("expected mime type audio/wav, got %q", req.MIMEType)
			}
			if string(req.AudioData) != "fake-wav-data" {
				t.Errorf("audio data mismatch")
			}
			return &STTResponse{Text: "Hallo das ist ein Test"}, nil
		},
	}
	h := newTestHandler(client)
	body := fmt.Sprintf(`{"audio":"%s"}`, audioBase64)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/stt", body)

	err := h.STT(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp AiSttResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp.Text != "Hallo das ist ein Test" {
		t.Errorf("expected transcription, got %q", resp.Text)
	}
}

func TestSTT_CustomMimeType(t *testing.T) {
	audioBase64 := base64.StdEncoding.EncodeToString([]byte("opus-data"))
	client := &mockAIClient{
		sttFn: func(_ context.Context, req STTRequest) (*STTResponse, error) {
			if req.MIMEType != "audio/webm" {
				t.Errorf("expected mime type audio/webm, got %q", req.MIMEType)
			}
			return &STTResponse{Text: "result"}, nil
		},
	}
	h := newTestHandler(client)
	body := fmt.Sprintf(`{"audio":"%s","mime_type":"audio/webm"}`, audioBase64)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/stt", body)

	err := h.STT(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestSTT_MissingAudio(t *testing.T) {
	h := newTestHandler(&mockAIClient{})
	c, _ := newAuthContext(http.MethodPost, "/api/v1/ai/stt", `{}`)

	err := h.STT(c)
	if err == nil {
		t.Fatal("expected error for missing audio")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestSTT_InvalidBase64(t *testing.T) {
	h := newTestHandler(&mockAIClient{})
	c, _ := newAuthContext(http.MethodPost, "/api/v1/ai/stt", `{"audio":"!!!not-base64!!!"}`)

	err := h.STT(c)
	if err == nil {
		t.Fatal("expected error for invalid base64")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestSTT_WorksWithoutAuth(t *testing.T) {
	audioBase64 := base64.StdEncoding.EncodeToString([]byte("data"))
	client := &mockAIClient{
		sttFn: func(_ context.Context, _ STTRequest) (*STTResponse, error) {
			return &STTResponse{Text: "ok"}, nil
		},
	}
	h := newTestHandler(client)
	body := fmt.Sprintf(`{"audio":"%s"}`, audioBase64)
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/stt", body)

	err := h.STT(c)
	if err != nil {
		t.Fatalf("STT should work without auth, got: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestSTT_AIError(t *testing.T) {
	audioBase64 := base64.StdEncoding.EncodeToString([]byte("data"))
	client := &mockAIClient{
		sttFn: func(_ context.Context, _ STTRequest) (*STTResponse, error) {
			return nil, fmt.Errorf("transcription failed")
		},
	}
	h := newTestHandler(client)
	body := fmt.Sprintf(`{"audio":"%s"}`, audioBase64)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/stt", body)

	err := h.STT(c)
	if err != nil {
		t.Fatalf("aiError should not return an error, got: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
	var resp aiErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp.ErrorCode != "ai_internal_error" {
		t.Errorf("expected error_code ai_internal_error, got %q", resp.ErrorCode)
	}
}

func TestSTT_DefaultMimeType(t *testing.T) {
	audioBase64 := base64.StdEncoding.EncodeToString([]byte("data"))
	client := &mockAIClient{
		sttFn: func(_ context.Context, req STTRequest) (*STTResponse, error) {
			if req.MIMEType != "audio/wav" {
				t.Errorf("expected default mime type audio/wav, got %q", req.MIMEType)
			}
			return &STTResponse{Text: "ok"}, nil
		},
	}
	h := newTestHandler(client)
	body := fmt.Sprintf(`{"audio":"%s"}`, audioBase64)
	c, _ := newAuthContext(http.MethodPost, "/api/v1/ai/stt", body)

	err := h.STT(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// ── Chat Tests ───────────────────────────────────────────────────────────────

func TestChat_MissingMessage(t *testing.T) {
	h := newTestHandler(&mockAIClient{})
	c, _ := newAuthContext(http.MethodPost, "/api/v1/ai/chat", `{}`)

	err := h.Chat(c)
	if err == nil {
		t.Fatal("expected error for missing message")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestChat_FallbackToDefault(t *testing.T) {
	client := &mockAIClient{
		chatFn: func(_ context.Context, req ChatRequest) (*ChatResponse, error) {
			if req.Message != "Hallo" {
				t.Errorf("expected message 'Hallo', got %q", req.Message)
			}
			return &ChatResponse{Text: "Hallo zurueck!", ModelUsed: "gemini-2.0-flash-lite"}, nil
		},
	}
	h := newTestHandler(client)
	c, rec := newAuthContext(http.MethodPost, "/api/v1/ai/chat", `{"message":"Hallo"}`)

	err := h.Chat(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp AiChatResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp.Response != "Hallo zurueck!" {
		t.Errorf("expected 'Hallo zurueck!', got %q", resp.Response)
	}
	if resp.Text != "Hallo zurueck!" {
		t.Errorf("expected text='Hallo zurueck!', got %q", resp.Text)
	}
	if resp.AgentID != "default" {
		t.Errorf("expected agent 'default', got %q", resp.AgentID)
	}
}

func TestChat_WorksWithoutAuth(t *testing.T) {
	client := &mockAIClient{
		chatFn: func(_ context.Context, _ ChatRequest) (*ChatResponse, error) {
			return &ChatResponse{Text: "antwort", ModelUsed: "mock"}, nil
		},
	}
	h := newTestHandler(client)
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/chat", `{"message":"hi"}`)

	err := h.Chat(c)
	if err != nil {
		t.Fatalf("Chat should work without auth, got: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestChat_PassthroughWithSystemInstruction(t *testing.T) {
	client := &mockAIClient{
		chatFn: func(_ context.Context, req ChatRequest) (*ChatResponse, error) {
			if req.SystemInstruction != "Du bist Susi." {
				t.Errorf("expected system instruction 'Du bist Susi.', got %q", req.SystemInstruction)
			}
			if req.Message != "Hallo Susi" {
				t.Errorf("expected message 'Hallo Susi', got %q", req.Message)
			}
			if len(req.History) != 1 {
				t.Errorf("expected 1 history entry, got %d", len(req.History))
			}
			return &ChatResponse{Text: "Hallo! Ich bin Susi.", ModelUsed: "mock"}, nil
		},
	}
	h := newTestHandler(client)
	body := `{"system_instruction":"Du bist Susi.","history":[{"role":"user","content":"Hi"}],"message":"Hallo Susi"}`
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/chat", body)

	err := h.Chat(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp AiChatResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp.Text != "Hallo! Ich bin Susi." {
		t.Errorf("expected text 'Hallo! Ich bin Susi.', got %q", resp.Text)
	}
	if resp.AgentID != "passthrough" {
		t.Errorf("expected agent 'passthrough', got %q", resp.AgentID)
	}
}

// ── Extract Tests ────────────────────────────────────────────────────────────

func TestExtract_PassthroughInsights(t *testing.T) {
	client := &mockAIClient{
		genFn: func(_ context.Context, req ChatRequest) (*ChatResponse, error) {
			if req.ResponseMIMEType != "application/json" {
				t.Errorf("expected JSON response MIME type, got %q", req.ResponseMIMEType)
			}
			if !strings.Contains(req.Message, "Onboarding-Gespraech") {
				t.Errorf("expected Onboarding-Gespraech in message, got %q", req.Message)
			}
			return &ChatResponse{
				Text:      `{"interests":["Holz"],"strengths":["Kreativitaet"],"preferredStyle":"hands-on","recommendedJourney":"vuca","summary":"Test"}`,
				ModelUsed: "mock",
			}, nil
		},
	}
	h := newTestHandler(client)
	body := `{"messages":[{"role":"user","content":"Ich mag Holz"},{"role":"model","content":"Super!"}],"context":{"extract_type":"insights"}}`
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/extract", body)

	err := h.Extract(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp AiExtractResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp.PromptID != "builtin:insights" {
		t.Errorf("expected prompt_id 'builtin:insights', got %q", resp.PromptID)
	}
}

func TestExtract_PassthroughStationResult(t *testing.T) {
	client := &mockAIClient{
		genFn: func(_ context.Context, req ChatRequest) (*ChatResponse, error) {
			if !strings.Contains(req.Message, "vuca") {
				t.Errorf("expected journey type in message, got %q", req.Message)
			}
			return &ChatResponse{
				Text:      `{"dimensionScores":{"creativity":80},"summary":"Gut gemacht"}`,
				ModelUsed: "mock",
			}, nil
		},
	}
	h := newTestHandler(client)
	body := `{"messages":[{"role":"user","text":"Antwort"}],"context":{"extract_type":"station-result","journey_type":"vuca","station_id":"v1"}}`
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/extract", body)

	err := h.Extract(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

// ── Generate Tests ───────────────────────────────────────────────────────────

func TestGenerate_PassthroughCurriculum(t *testing.T) {
	client := &mockAIClient{
		genFn: func(_ context.Context, req ChatRequest) (*ChatResponse, error) {
			if !strings.Contains(req.Message, "Foerster") {
				t.Errorf("expected goal in message, got %q", req.Message)
			}
			return &ChatResponse{
				Text:      `{"goal":"Foerster","modules":[]}`,
				ModelUsed: "mock",
			}, nil
		},
	}
	h := newTestHandler(client)
	body := `{"parameters":{"goal":"Foerster"},"context":{"generate_type":"curriculum"}}`
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/generate", body)

	err := h.Generate(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp AiGenerateResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp.PromptID != "builtin:curriculum" {
		t.Errorf("expected prompt_id 'builtin:curriculum', got %q", resp.PromptID)
	}
}

// ── Dialect Prompt Tests ─────────────────────────────────────────────────────

func TestDialectPrompts_AllSupported(t *testing.T) {
	expected := map[string]string{
		"hochdeutsch":  "Hochdeutsch",
		"bayerisch":    "bayerisch",
		"schwaebisch":  "schwaebisch",
		"berlinerisch": "Berliner",
		"saechsisch":   "saechsisch",
		"koelsch":      "koelsch",
	}
	for dialect, keyword := range expected {
		prompt, ok := dialectPrompts[dialect]
		if !ok {
			t.Errorf("dialect %q not found in dialectPrompts", dialect)
			continue
		}
		if !strings.Contains(prompt, keyword) {
			t.Errorf("dialect %q prompt %q does not contain keyword %q", dialect, prompt, keyword)
		}
	}
}

// ── classifyAIError Tests ────────────────────────────────────────────────────

func TestClassifyAIError_CredentialsMissing(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("could not find default credentials"))
	if status != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", status)
	}
	if resp.ErrorCode != "ai_credentials_missing" {
		t.Errorf("expected ai_credentials_missing, got %q", resp.ErrorCode)
	}
}

func TestClassifyAIError_RateLimited(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("RESOURCE_EXHAUSTED: quota exceeded"))
	if status != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", status)
	}
	if resp.ErrorCode != "ai_rate_limited" {
		t.Errorf("expected ai_rate_limited, got %q", resp.ErrorCode)
	}
}

func TestClassifyAIError_PermissionDenied(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("PERMISSION_DENIED: caller does not have permission"))
	if status != http.StatusForbidden {
		t.Errorf("expected 403, got %d", status)
	}
	if resp.ErrorCode != "ai_permission_denied" {
		t.Errorf("expected ai_permission_denied, got %q", resp.ErrorCode)
	}
}

func TestClassifyAIError_Timeout(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("context deadline exceeded"))
	if status != http.StatusGatewayTimeout {
		t.Errorf("expected 504, got %d", status)
	}
	if resp.ErrorCode != "ai_timeout" {
		t.Errorf("expected ai_timeout, got %q", resp.ErrorCode)
	}
}

func TestClassifyAIError_NetworkError(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("connection refused"))
	if status != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", status)
	}
	if resp.ErrorCode != "ai_network_error" {
		t.Errorf("expected ai_network_error, got %q", resp.ErrorCode)
	}
}

func TestClassifyAIError_DefaultInternal(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("something unexpected happened"))
	if status != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", status)
	}
	if resp.ErrorCode != "ai_internal_error" {
		t.Errorf("expected ai_internal_error, got %q", resp.ErrorCode)
	}
}

func TestClassifyAIError_429InMessage(t *testing.T) {
	status, resp := classifyAIError(fmt.Errorf("received HTTP 429 from upstream"))
	if status != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", status)
	}
	if resp.ErrorCode != "ai_rate_limited" {
		t.Errorf("expected ai_rate_limited, got %q", resp.ErrorCode)
	}
}

func TestChat_AIErrorReturnsClassifiedJSON(t *testing.T) {
	client := &mockAIClient{
		chatFn: func(_ context.Context, _ ChatRequest) (*ChatResponse, error) {
			return nil, fmt.Errorf("could not find default credentials")
		},
	}
	h := newTestHandler(client)
	c, rec := newUnauthContext(http.MethodPost, "/api/v1/ai/chat", `{"system_instruction":"test","message":"hi"}`)

	err := h.Chat(c)
	if err != nil {
		t.Fatalf("aiError should not return an error, got: %v", err)
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
	var resp aiErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if resp.ErrorCode != "ai_credentials_missing" {
		t.Errorf("expected error_code ai_credentials_missing, got %q", resp.ErrorCode)
	}
}
