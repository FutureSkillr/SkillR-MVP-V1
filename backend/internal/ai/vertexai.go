package ai

import (
	"context"
	"fmt"
	"strings"

	"cloud.google.com/go/vertexai/genai"
	ugenai "google.golang.org/genai"
)

const (
	DefaultTTSModel = "gemini-2.5-flash-preview-tts"
	DefaultSTTModel = "gemini-2.0-flash-lite"
)

type VertexAIClient struct {
	client    *genai.Client
	uclient   *ugenai.Client // unified SDK client for TTS/STT
	projectID string
	region    string
}

func NewVertexAIClient(ctx context.Context, projectID, region string) (*VertexAIClient, error) {
	if projectID == "" {
		return nil, fmt.Errorf("GCP_PROJECT_ID is required for VertexAI")
	}

	client, err := genai.NewClient(ctx, projectID, region)
	if err != nil {
		return nil, fmt.Errorf("create vertexai client: %w", err)
	}

	uclient, err := ugenai.NewClient(ctx, &ugenai.ClientConfig{
		Backend:  ugenai.BackendVertexAI,
		Project:  projectID,
		Location: region,
	})
	if err != nil {
		client.Close()
		return nil, fmt.Errorf("create unified genai client: %w", err)
	}

	return &VertexAIClient{
		client:    client,
		uclient:   uclient,
		projectID: projectID,
		region:    region,
	}, nil
}

func (c *VertexAIClient) Close() error {
	if c.client != nil {
		return c.client.Close()
	}
	return nil
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

// JMStV §5: Safety settings for youth protection (target audience 14+)
// Block medium and above for all harm categories.
func youthSafetySettings() []*genai.SafetySetting {
	return []*genai.SafetySetting{
		{Category: genai.HarmCategoryHateSpeech, Threshold: genai.HarmBlockMediumAndAbove},
		{Category: genai.HarmCategoryDangerousContent, Threshold: genai.HarmBlockMediumAndAbove},
		{Category: genai.HarmCategorySexuallyExplicit, Threshold: genai.HarmBlockMediumAndAbove},
		{Category: genai.HarmCategoryHarassment, Threshold: genai.HarmBlockMediumAndAbove},
	}
}

func (c *VertexAIClient) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	modelName := req.Model
	if modelName == "" {
		modelName = "gemini-2.0-flash-lite"
	}

	model := c.client.GenerativeModel(modelName)

	// JMStV §5: Apply safety settings for youth protection (14+ audience)
	model.SafetySettings = youthSafetySettings()

	if req.SystemInstruction != "" {
		model.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text(req.SystemInstruction)},
		}
	}
	if req.Temperature != nil {
		model.Temperature = req.Temperature
	}
	if req.TopP != nil {
		model.TopP = req.TopP
	}
	if req.TopK != nil {
		model.TopK = req.TopK
	}
	if req.MaxOutputTokens != nil {
		model.MaxOutputTokens = req.MaxOutputTokens
	}
	if req.ResponseMIMEType != "" {
		model.ResponseMIMEType = req.ResponseMIMEType
	}

	// Build chat history
	cs := model.StartChat()
	for _, msg := range req.History {
		cs.History = append(cs.History, &genai.Content{
			Role:  msg.Role,
			Parts: []genai.Part{genai.Text(msg.Text)},
		})
	}

	// Send message
	resp, err := cs.SendMessage(ctx, genai.Text(req.Message))
	if err != nil {
		return nil, fmt.Errorf("send message: %w", err)
	}

	// Extract text response
	var text string
	if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
		for _, part := range resp.Candidates[0].Content.Parts {
			if t, ok := part.(genai.Text); ok {
				text += string(t)
			}
		}
	}

	tokenCount := 0
	if resp.UsageMetadata != nil {
		tokenCount = int(resp.UsageMetadata.TotalTokenCount)
	}

	return &ChatResponse{
		Text:       text,
		TokenCount: tokenCount,
		ModelUsed:  modelName,
	}, nil
}

func (c *VertexAIClient) Generate(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	modelName := req.Model
	if modelName == "" {
		modelName = "gemini-2.0-flash-lite"
	}

	model := c.client.GenerativeModel(modelName)

	// JMStV §5: Apply safety settings for youth protection
	model.SafetySettings = youthSafetySettings()

	if req.SystemInstruction != "" {
		model.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text(req.SystemInstruction)},
		}
	}
	if req.Temperature != nil {
		model.Temperature = req.Temperature
	}
	if req.ResponseMIMEType != "" {
		model.ResponseMIMEType = req.ResponseMIMEType
	}

	resp, err := model.GenerateContent(ctx, genai.Text(req.Message))
	if err != nil {
		return nil, fmt.Errorf("generate content: %w", err)
	}

	var text string
	if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
		for _, part := range resp.Candidates[0].Content.Parts {
			if t, ok := part.(genai.Text); ok {
				text += string(t)
			}
		}
	}

	tokenCount := 0
	if resp.UsageMetadata != nil {
		tokenCount = int(resp.UsageMetadata.TotalTokenCount)
	}

	return &ChatResponse{
		Text:       text,
		TokenCount: tokenCount,
		ModelUsed:  modelName,
	}, nil
}

func (c *VertexAIClient) TextToSpeech(ctx context.Context, req TTSRequest) (*TTSResponse, error) {
	if req.Text == "" {
		return nil, fmt.Errorf("text is required")
	}

	voiceName := req.VoiceName
	if voiceName == "" {
		voiceName = "Kore"
	}

	prompt := req.Text
	if req.DialectPrompt != "" {
		prompt = req.DialectPrompt + "\n\n" + req.Text
	}

	config := &ugenai.GenerateContentConfig{
		ResponseModalities: []string{"AUDIO"},
		SpeechConfig: &ugenai.SpeechConfig{
			VoiceConfig: &ugenai.VoiceConfig{
				PrebuiltVoiceConfig: &ugenai.PrebuiltVoiceConfig{
					VoiceName: voiceName,
				},
			},
		},
	}

	resp, err := c.uclient.Models.GenerateContent(ctx, DefaultTTSModel, ugenai.Text(prompt), config)
	if err != nil {
		return nil, fmt.Errorf("tts generate: %w", err)
	}

	for _, candidate := range resp.Candidates {
		if candidate.Content == nil {
			continue
		}
		for _, part := range candidate.Content.Parts {
			if part.InlineData != nil && len(part.InlineData.Data) > 0 {
				return &TTSResponse{
					AudioData: part.InlineData.Data,
					MIMEType:  part.InlineData.MIMEType,
				}, nil
			}
		}
	}

	return nil, fmt.Errorf("no audio data in TTS response")
}

func (c *VertexAIClient) SpeechToText(ctx context.Context, req STTRequest) (*STTResponse, error) {
	if len(req.AudioData) == 0 {
		return nil, fmt.Errorf("audio data is required")
	}

	mimeType := req.MIMEType
	if mimeType == "" {
		mimeType = "audio/wav"
	}

	contents := []*ugenai.Content{
		{
			Role: "user",
			Parts: []*ugenai.Part{
				ugenai.NewPartFromBytes(req.AudioData, mimeType),
				ugenai.NewPartFromText("Transkribiere diese Aufnahme auf Deutsch. Gib nur den transkribierten Text zurueck, ohne Erklaerungen."),
			},
		},
	}

	resp, err := c.uclient.Models.GenerateContent(ctx, DefaultSTTModel, contents, nil)
	if err != nil {
		return nil, fmt.Errorf("stt generate: %w", err)
	}

	return &STTResponse{Text: strings.TrimSpace(resp.Text())}, nil
}
