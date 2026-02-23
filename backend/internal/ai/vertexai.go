package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/oauth2/google"
	"google.golang.org/genai"
)

const (
	DefaultChatModel = "gemini-2.5-flash"
	DefaultTTSModel  = "gemini-2.5-flash-tts"
	DefaultSTTModel  = "gemini-2.5-flash"
)

type VertexAIClient struct {
	chatClient *genai.Client // unified SDK — Chat/Generate/Ping (region)
	ttsClient  *genai.Client // unified SDK — TTS/STT (ttsRegion)
	projectID  string
	region     string
	ttsRegion  string // separate region for TTS/STT (e.g., europe-west1)
}

func NewVertexAIClient(ctx context.Context, projectID, region, ttsRegion string) (*VertexAIClient, error) {
	if projectID == "" {
		return nil, fmt.Errorf("GCP_PROJECT_ID is required for VertexAI")
	}

	if ttsRegion == "" {
		ttsRegion = region
	}

	log.Printf("[AI] Initializing Vertex AI client (project=%s, region=%s, ttsRegion=%s)", projectID, region, ttsRegion)

	// If GOOGLE_APPLICATION_CREDENTIALS points to a missing file, unset it
	// so the SDK falls back to other ADC methods (gcloud auth, metadata server).
	if credFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); credFile != "" {
		if _, err := os.Stat(credFile); os.IsNotExist(err) {
			log.Printf("[AI] GOOGLE_APPLICATION_CREDENTIALS=%s does not exist — unsetting to allow ADC fallback", credFile)
			os.Unsetenv("GOOGLE_APPLICATION_CREDENTIALS")
		}
	}

	// Log ADC identity so credential mismatches are visible at startup
	if identity := adcIdentity(ctx); identity != "" {
		log.Printf("[AI] ADC identity: %s", identity)
	} else {
		log.Printf("[AI] ADC identity: unknown (could not detect)")
	}

	chatClient, err := genai.NewClient(ctx, &genai.ClientConfig{
		Backend:  genai.BackendVertexAI,
		Project:  projectID,
		Location: region,
	})
	if err != nil {
		log.Printf("[AI] ERROR: Failed to create chat genai client: %v", err)
		return nil, fmt.Errorf("create chat genai client: %w", err)
	}
	log.Printf("[AI] Chat genai client created successfully (region=%s)", region)

	ttsClient, err := genai.NewClient(ctx, &genai.ClientConfig{
		Backend:  genai.BackendVertexAI,
		Project:  projectID,
		Location: ttsRegion,
	})
	if err != nil {
		log.Printf("[AI] ERROR: Failed to create TTS genai client: %v", err)
		return nil, fmt.Errorf("create tts genai client: %w", err)
	}
	log.Printf("[AI] TTS genai client created successfully (ttsRegion=%s)", ttsRegion)

	return &VertexAIClient{
		chatClient: chatClient,
		ttsClient:  ttsClient,
		projectID:  projectID,
		region:     region,
		ttsRegion:  ttsRegion,
	}, nil
}

func (c *VertexAIClient) Close() error {
	// The unified genai SDK client does not expose a Close() method.
	log.Printf("[AI] Closing Vertex AI client (no-op for unified SDK)")
	return nil
}

// Ping performs a lightweight Vertex AI request to verify connectivity.
// Returns latency in milliseconds and any error encountered.
func (c *VertexAIClient) Ping(ctx context.Context) (int64, error) {
	start := time.Now()

	maxTokens := int32(1)
	_, err := c.chatClient.Models.GenerateContent(ctx, DefaultChatModel, genai.Text("ping"), &genai.GenerateContentConfig{
		MaxOutputTokens: maxTokens,
		SafetySettings:  youthSafetySettings(),
	})
	latencyMs := time.Since(start).Milliseconds()

	if err != nil {
		log.Printf("[AI] Ping FAILED (latency=%dms): %v", latencyMs, err)
		return latencyMs, err
	}

	log.Printf("[AI] Ping OK (latency=%dms)", latencyMs)
	return latencyMs, nil
}

type ChatRequest struct {
	Model             string
	SystemInstruction string
	History           []ChatMessage
	Message           string
	Temperature       *float32
	TopP              *float32
	TopK              *int32
	MaxOutputTokens   *int32
	ResponseMIMEType  string
}

type ChatMessage struct {
	Role string
	Text string
}

type ChatResponse struct {
	Text       string
	TokenCount int
	ModelUsed  string
	LatencyMs  int
}

type TTSRequest struct {
	Text          string
	VoiceName     string
	DialectPrompt string
}

type TTSResponse struct {
	AudioData []byte
	MIMEType  string
}

type STTRequest struct {
	AudioData []byte
	MIMEType  string
}

type STTResponse struct {
	Text string
}

// adcIdentity returns the email/account from Application Default Credentials.
// This helps diagnose 403 errors caused by ADC/gcloud account mismatches.
// For service accounts, the email is in the JSON. For authorized_user credentials,
// we resolve the email via the Google userinfo endpoint.
func adcIdentity(ctx context.Context) string {
	creds, err := google.FindDefaultCredentials(ctx, "https://www.googleapis.com/auth/cloud-platform")
	if err != nil {
		return ""
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(creds.JSON, &raw); err != nil {
		return ""
	}
	credType, _ := raw["type"].(string)

	// Service account: email is directly in the JSON
	if email, ok := raw["client_email"].(string); ok && email != "" {
		return email + " (service_account)"
	}

	// Authorized user: resolve email via userinfo endpoint
	if credType == "authorized_user" {
		token, err := creds.TokenSource.Token()
		if err == nil && token.AccessToken != "" {
			if email := resolveUserEmail(ctx, token.AccessToken); email != "" {
				return email + " (authorized_user)"
			}
		}
		quotaProject, _ := raw["quota_project_id"].(string)
		if quotaProject != "" {
			return credType + " (quota_project=" + quotaProject + ", email unknown)"
		}
	}

	return credType
}

// resolveUserEmail fetches the email from Google's userinfo endpoint using an access token.
func resolveUserEmail(ctx context.Context, accessToken string) string {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return ""
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return ""
	}
	defer resp.Body.Close()

	var info struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return ""
	}
	return info.Email
}

// JMStV §5: Safety settings for youth protection (target audience 14+)
// Block medium and above for all harm categories.
func youthSafetySettings() []*genai.SafetySetting {
	return []*genai.SafetySetting{
		{Category: genai.HarmCategoryHateSpeech, Threshold: genai.HarmBlockThresholdBlockMediumAndAbove},
		{Category: genai.HarmCategoryDangerousContent, Threshold: genai.HarmBlockThresholdBlockMediumAndAbove},
		{Category: genai.HarmCategorySexuallyExplicit, Threshold: genai.HarmBlockThresholdBlockMediumAndAbove},
		{Category: genai.HarmCategoryHarassment, Threshold: genai.HarmBlockThresholdBlockMediumAndAbove},
	}
}

func (c *VertexAIClient) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	start := time.Now()
	modelName := req.Model
	if modelName == "" {
		modelName = DefaultChatModel
	}

	log.Printf("[AI] Chat request: model=%s, historyLen=%d, msgLen=%d", modelName, len(req.History), len(req.Message))

	// Build config
	config := &genai.GenerateContentConfig{
		SafetySettings: youthSafetySettings(),
	}

	if req.SystemInstruction != "" {
		config.SystemInstruction = &genai.Content{
			Parts: []*genai.Part{{Text: req.SystemInstruction}},
		}
	}
	if req.Temperature != nil {
		config.Temperature = req.Temperature
	}
	if req.TopP != nil {
		config.TopP = req.TopP
	}
	if req.TopK != nil {
		topK := float32(*req.TopK)
		config.TopK = &topK
	}
	if req.MaxOutputTokens != nil {
		config.MaxOutputTokens = *req.MaxOutputTokens
	}
	if req.ResponseMIMEType != "" {
		config.ResponseMIMEType = req.ResponseMIMEType
	}

	// Build contents: history + new user message
	var contents []*genai.Content
	for _, msg := range req.History {
		contents = append(contents, &genai.Content{
			Role:  msg.Role,
			Parts: []*genai.Part{{Text: msg.Text}},
		})
	}
	contents = append(contents, &genai.Content{
		Role:  "user",
		Parts: []*genai.Part{{Text: req.Message}},
	})

	// Send request
	resp, err := c.chatClient.Models.GenerateContent(ctx, modelName, contents, config)
	latencyMs := time.Since(start).Milliseconds()
	if err != nil {
		log.Printf("[AI] Chat FAILED (model=%s, latency=%dms): %v", modelName, latencyMs, err)
		return nil, fmt.Errorf("send message: %w", err)
	}

	// Extract text response
	text := resp.Text()

	tokenCount := 0
	if resp.UsageMetadata != nil {
		tokenCount = int(resp.UsageMetadata.TotalTokenCount)
	}

	log.Printf("[AI] Chat OK (model=%s, latency=%dms, tokens=%d, responseLen=%d)", modelName, latencyMs, tokenCount, len(text))

	return &ChatResponse{
		Text:       text,
		TokenCount: tokenCount,
		ModelUsed:  modelName,
		LatencyMs:  int(latencyMs),
	}, nil
}

func (c *VertexAIClient) Generate(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	start := time.Now()
	modelName := req.Model
	if modelName == "" {
		modelName = DefaultChatModel
	}

	log.Printf("[AI] Generate request: model=%s, msgLen=%d, mimeType=%s", modelName, len(req.Message), req.ResponseMIMEType)

	// Build config
	config := &genai.GenerateContentConfig{
		SafetySettings: youthSafetySettings(),
	}

	if req.SystemInstruction != "" {
		config.SystemInstruction = &genai.Content{
			Parts: []*genai.Part{{Text: req.SystemInstruction}},
		}
	}
	if req.Temperature != nil {
		config.Temperature = req.Temperature
	}
	if req.ResponseMIMEType != "" {
		config.ResponseMIMEType = req.ResponseMIMEType
	}

	resp, err := c.chatClient.Models.GenerateContent(ctx, modelName, genai.Text(req.Message), config)
	latencyMs := time.Since(start).Milliseconds()
	if err != nil {
		log.Printf("[AI] Generate FAILED (model=%s, latency=%dms): %v", modelName, latencyMs, err)
		return nil, fmt.Errorf("generate content: %w", err)
	}

	text := resp.Text()

	tokenCount := 0
	if resp.UsageMetadata != nil {
		tokenCount = int(resp.UsageMetadata.TotalTokenCount)
	}

	log.Printf("[AI] Generate OK (model=%s, latency=%dms, tokens=%d, responseLen=%d)", modelName, latencyMs, tokenCount, len(text))

	return &ChatResponse{
		Text:       text,
		TokenCount: tokenCount,
		ModelUsed:  modelName,
		LatencyMs:  int(latencyMs),
	}, nil
}

func (c *VertexAIClient) TextToSpeech(ctx context.Context, req TTSRequest) (*TTSResponse, error) {
	start := time.Now()
	if req.Text == "" {
		return nil, fmt.Errorf("text is required")
	}

	voiceName := req.VoiceName
	if voiceName == "" {
		voiceName = "Kore"
	}

	log.Printf("[AI] TTS request: voice=%s, textLen=%d", voiceName, len(req.Text))

	prompt := req.Text
	if req.DialectPrompt != "" {
		prompt = req.DialectPrompt + "\n\n" + req.Text
	}

	cfg := &genai.GenerateContentConfig{
		ResponseModalities: []string{"AUDIO"},
		SpeechConfig: &genai.SpeechConfig{
			VoiceConfig: &genai.VoiceConfig{
				PrebuiltVoiceConfig: &genai.PrebuiltVoiceConfig{
					VoiceName: voiceName,
				},
			},
		},
	}

	resp, err := c.ttsClient.Models.GenerateContent(ctx, DefaultTTSModel, genai.Text(prompt), cfg)
	latencyMs := time.Since(start).Milliseconds()
	if err != nil {
		log.Printf("[AI] TTS FAILED (latency=%dms): %v", latencyMs, err)
		return nil, fmt.Errorf("tts generate: %w", err)
	}

	for _, candidate := range resp.Candidates {
		if candidate.Content == nil {
			continue
		}
		for _, part := range candidate.Content.Parts {
			if part.InlineData != nil && len(part.InlineData.Data) > 0 {
				log.Printf("[AI] TTS OK (latency=%dms, audioBytes=%d, mime=%s)", latencyMs, len(part.InlineData.Data), part.InlineData.MIMEType)
				return &TTSResponse{
					AudioData: part.InlineData.Data,
					MIMEType:  part.InlineData.MIMEType,
				}, nil
			}
		}
	}

	log.Printf("[AI] TTS FAILED (latency=%dms): no audio data in response", latencyMs)
	return nil, fmt.Errorf("no audio data in TTS response")
}

func (c *VertexAIClient) SpeechToText(ctx context.Context, req STTRequest) (*STTResponse, error) {
	start := time.Now()
	if len(req.AudioData) == 0 {
		return nil, fmt.Errorf("audio data is required")
	}

	mimeType := req.MIMEType
	if mimeType == "" {
		mimeType = "audio/wav"
	}

	log.Printf("[AI] STT request: audioBytes=%d, mime=%s", len(req.AudioData), mimeType)

	contents := []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromBytes(req.AudioData, mimeType),
				genai.NewPartFromText("Transkribiere diese Aufnahme auf Deutsch. Gib nur den transkribierten Text zurueck, ohne Erklaerungen."),
			},
		},
	}

	resp, err := c.ttsClient.Models.GenerateContent(ctx, DefaultSTTModel, contents, nil)
	latencyMs := time.Since(start).Milliseconds()
	if err != nil {
		log.Printf("[AI] STT FAILED (latency=%dms): %v", latencyMs, err)
		return nil, fmt.Errorf("stt generate: %w", err)
	}

	text := strings.TrimSpace(resp.Text())
	log.Printf("[AI] STT OK (latency=%dms, transcriptLen=%d)", latencyMs, len(text))
	return &STTResponse{Text: text}, nil
}
