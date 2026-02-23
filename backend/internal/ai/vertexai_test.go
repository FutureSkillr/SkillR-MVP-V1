package ai

import (
	"context"
	"testing"
)

func TestNewVertexAIClient_EmptyProjectID(t *testing.T) {
	_, err := NewVertexAIClient(context.Background(), "", "us-central1", "")
	if err == nil {
		t.Fatal("expected error for empty project ID")
	}
	if err.Error() != "GCP_PROJECT_ID is required for VertexAI" {
		t.Errorf("unexpected error message: %v", err)
	}
}

func TestTTSRequest_Validation(t *testing.T) {
	// TextToSpeech requires a non-nil ttsClient, but we can test the input
	// validation path on a zero VertexAIClient since it checks text first.
	client := &VertexAIClient{} // nil clients

	_, err := client.TextToSpeech(context.Background(), TTSRequest{Text: ""})
	if err == nil {
		t.Fatal("expected error for empty text")
	}
	if err.Error() != "text is required" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestSTTRequest_Validation(t *testing.T) {
	client := &VertexAIClient{} // nil clients

	_, err := client.SpeechToText(context.Background(), STTRequest{AudioData: nil})
	if err == nil {
		t.Fatal("expected error for empty audio data")
	}
	if err.Error() != "audio data is required" {
		t.Errorf("unexpected error: %v", err)
	}

	_, err = client.SpeechToText(context.Background(), STTRequest{AudioData: []byte{}})
	if err == nil {
		t.Fatal("expected error for empty audio data slice")
	}
}

func TestTTSRequest_DefaultVoiceName(t *testing.T) {
	req := TTSRequest{Text: "hello"}
	if req.VoiceName != "" {
		t.Errorf("expected empty VoiceName by default, got %q", req.VoiceName)
	}
	// The TextToSpeech method defaults to "Kore" when VoiceName is empty.
	// This is tested at the handler level in handler_test.go.
}

func TestSTTRequest_DefaultMimeType(t *testing.T) {
	req := STTRequest{AudioData: []byte("data")}
	if req.MIMEType != "" {
		t.Errorf("expected empty MIMEType by default, got %q", req.MIMEType)
	}
	// The SpeechToText method defaults to "audio/wav" when MIMEType is empty.
	// This is tested at the handler level in handler_test.go.
}

func TestDefaultModelConstants(t *testing.T) {
	if DefaultChatModel != "gemini-2.5-flash" {
		t.Errorf("unexpected Chat model: %q", DefaultChatModel)
	}
	if DefaultTTSModel != "gemini-2.5-flash-tts" {
		t.Errorf("unexpected TTS model: %q", DefaultTTSModel)
	}
	if DefaultSTTModel != "gemini-2.5-flash" {
		t.Errorf("unexpected STT model: %q", DefaultSTTModel)
	}
}
