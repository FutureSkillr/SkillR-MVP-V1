//go:build integration

package ai

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"testing"
	"time"
)

// These tests require a running Go backend with valid Gemini credentials.
// Run with: API_BASE_URL=http://localhost:8080 go test -tags=integration -v -timeout=120s ./internal/ai/ -run TestIntegration_TTS

func getBaseURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("API_BASE_URL")
	if url == "" {
		url = "http://localhost:8080"
	}
	return url
}

func postTTS(t *testing.T, baseURL string, req AiTtsRequest) (*http.Response, AiTtsResponse) {
	t.Helper()

	body, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(baseURL+"/api/v1/ai/tts", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /api/v1/ai/tts: %v", err)
	}

	var ttsResp AiTtsResponse
	if resp.StatusCode == http.StatusOK {
		if err := json.NewDecoder(resp.Body).Decode(&ttsResp); err != nil {
			resp.Body.Close()
			t.Fatalf("decode response: %v", err)
		}
	} else {
		// Log error body for debugging (e.g., ai_permission_denied from Gemini)
		var errBody map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&errBody); err == nil {
			t.Logf("error response body: %v", errBody)
		}
	}
	resp.Body.Close()

	return resp, ttsResp
}

// pcmToWAV wraps raw L16/24kHz/mono PCM bytes in a WAV header.
func pcmToWAV(pcm []byte) []byte {
	const (
		sampleRate    = 24000
		channels      = 1
		bitsPerSample = 16
	)
	byteRate := sampleRate * channels * bitsPerSample / 8
	blockAlign := channels * bitsPerSample / 8
	dataSize := len(pcm)

	buf := &bytes.Buffer{}
	buf.WriteString("RIFF")
	binary.Write(buf, binary.LittleEndian, uint32(36+dataSize))
	buf.WriteString("WAVE")
	buf.WriteString("fmt ")
	binary.Write(buf, binary.LittleEndian, uint32(16))          // chunk size
	binary.Write(buf, binary.LittleEndian, uint16(1))           // PCM format
	binary.Write(buf, binary.LittleEndian, uint16(channels))    // channels
	binary.Write(buf, binary.LittleEndian, uint32(sampleRate))  // sample rate
	binary.Write(buf, binary.LittleEndian, uint32(byteRate))    // byte rate
	binary.Write(buf, binary.LittleEndian, uint16(blockAlign))  // block align
	binary.Write(buf, binary.LittleEndian, uint16(bitsPerSample))
	buf.WriteString("data")
	binary.Write(buf, binary.LittleEndian, uint32(dataSize))
	buf.Write(pcm)

	return buf.Bytes()
}

// playAudio writes PCM audio to a temp WAV file and plays it.
// Playback is best-effort; failures are logged but do not fail the test.
func playAudio(t *testing.T, pcm []byte, label string) {
	t.Helper()

	wav := pcmToWAV(pcm)

	f, err := os.CreateTemp("", "tts-*.wav")
	if err != nil {
		t.Logf("playAudio: create temp file: %v", err)
		return
	}
	path := f.Name()
	defer os.Remove(path)

	if _, err := f.Write(wav); err != nil {
		f.Close()
		t.Logf("playAudio: write wav: %v", err)
		return
	}
	f.Close()

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("afplay", path)
	case "linux":
		cmd = exec.Command("aplay", path)
	default:
		t.Logf("playAudio: unsupported OS %s, skipping playback", runtime.GOOS)
		return
	}

	t.Logf("Playing %s ...", label)
	if err := cmd.Run(); err != nil {
		t.Logf("playAudio: %v", err)
	}
}

func TestIntegration_TTS_AllCoachVoices(t *testing.T) {
	baseURL := getBaseURL(t)

	coaches := []struct {
		Coach   string
		Dialect string
	}{
		{"Susi", "koelsch"},
		{"Karlshains", "schwaebisch"},
		{"Rene", "hochdeutsch"},
		{"Heiko", "berlinerisch"},
		{"Andreas", "bayerisch"},
		{"Cloudia", "saechsisch"},
	}

	for _, tc := range coaches {
		t.Run(fmt.Sprintf("Coach_%s_%s", tc.Coach, tc.Dialect), func(t *testing.T) {
			resp, ttsResp := postTTS(t, baseURL, AiTtsRequest{
				Text:         "Wie geht es dir heute?",
				VoiceDialect: tc.Dialect,
			})

			if resp.StatusCode != http.StatusOK {
				t.Fatalf("expected 200, got %d", resp.StatusCode)
			}

			if ttsResp.Audio == "" {
				t.Fatal("expected non-empty audio field")
			}

			audioBytes, err := base64.StdEncoding.DecodeString(ttsResp.Audio)
			if err != nil {
				t.Fatalf("audio is not valid base64: %v", err)
			}

			if len(audioBytes) < 100 {
				t.Fatalf("decoded audio too small (%d bytes), expected > 100", len(audioBytes))
			}

			t.Logf("Coach %s (%s): %d bytes of audio", tc.Coach, tc.Dialect, len(audioBytes))
			playAudio(t, audioBytes, fmt.Sprintf("Coach %s (%s)", tc.Coach, tc.Dialect))
		})
	}
}

func TestIntegration_TTS_DefaultDialect(t *testing.T) {
	baseURL := getBaseURL(t)

	resp, ttsResp := postTTS(t, baseURL, AiTtsRequest{
		Text: "Hallo, das ist ein Test ohne Dialekt.",
	})

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	if ttsResp.Audio == "" {
		t.Fatal("expected non-empty audio field")
	}

	audioBytes, err := base64.StdEncoding.DecodeString(ttsResp.Audio)
	if err != nil {
		t.Fatalf("audio is not valid base64: %v", err)
	}

	if len(audioBytes) < 100 {
		t.Fatalf("decoded audio too small (%d bytes), expected > 100", len(audioBytes))
	}

	t.Logf("Default dialect (hochdeutsch fallback): %d bytes of audio", len(audioBytes))
	playAudio(t, audioBytes, "Default dialect (hochdeutsch)")
}

func TestIntegration_TTS_EmptyTextReturns400(t *testing.T) {
	baseURL := getBaseURL(t)

	body, err := json.Marshal(AiTtsRequest{Text: ""})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(baseURL+"/api/v1/ai/tts", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /api/v1/ai/tts: %v", err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}
