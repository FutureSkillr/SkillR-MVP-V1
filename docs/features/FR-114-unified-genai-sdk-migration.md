# FR-114: Migrate to Unified Google GenAI Go SDK

**Status:** draft
**Priority:** should
**Created:** 2026-02-23

## Problem

The Go backend uses two Google AI SDKs simultaneously:

| SDK | Package | Used For | Status |
|-----|---------|----------|--------|
| Classic Vertex AI | `cloud.google.com/go/vertexai/genai` | Chat, Generate, Ping | **Deprecated** (removal: 2026-06-24) |
| Unified GenAI | `google.golang.org/genai` | TTS, STT | Current |

Google deprecated the classic SDK on 2025-06-24 with a 12-month removal window. The backend logs a warning at every startup:

```
WARNING: Starting on June 24, 2025, the cloud.google.com/go/vertexai/genai package is deprecated
and will be removed on June 24, 2026.
```

## Solution

Migrate all AI calls from `cloud.google.com/go/vertexai/genai` to `google.golang.org/genai` (the unified SDK already used for TTS/STT). After migration, remove the classic SDK dependency entirely.

### Scope

| Method | Current SDK | Target SDK | Notes |
|--------|------------|------------|-------|
| `Chat()` | classic `genai.Client` | unified `ugenai.Client` | System instructions, safety settings, chat history |
| `Generate()` | classic `genai.Client` | unified `ugenai.Client` | Structured output (JSON mime type) |
| `Ping()` | classic `genai.Client` | unified `ugenai.Client` | Lightweight health check |
| `TextToSpeech()` | unified (already done) | — | No change |
| `SpeechToText()` | unified (already done) | — | No change |

### Key Migration Points

1. **Client consolidation**: Remove `client *genai.Client` field; use `uclient *ugenai.Client` for everything
2. **Safety settings**: Translate `genai.SafetySetting` to `ugenai.SafetySetting` format
3. **Chat history**: Translate `genai.Content` to `ugenai.Content` format
4. **System instructions**: Use `ugenai.GenerateContentConfig.SystemInstruction`
5. **Region handling**: The unified client uses a single `Location` — decide if Chat/Generate stay in `europe-west3` or move to `europe-west1` with TTS

### Migration Guide

Google provides a migration guide: https://cloud.google.com/vertex-ai/generative-ai/docs/deprecations/genai-vertexai-sdk

## Acceptance Criteria

- [ ] All `Chat()`, `Generate()`, `Ping()` calls use `google.golang.org/genai`
- [ ] `cloud.google.com/go/vertexai/genai` removed from `go.mod`
- [ ] Deprecation warning no longer appears in startup logs
- [ ] JMStV safety settings preserved (youth protection)
- [ ] All existing unit tests pass
- [ ] Integration tests pass (`make e2e-TTS-VertexAI`)
- [ ] No behavior change for end users

## Dependencies

- TC-018 (Agentic Backend VertexAI — architecture)
- TC-035 (TTS Region Separation — unified SDK already used for TTS)
- FR-010 (AI Coach Voice — TTS dialect support)

## Notes

- **Deadline:** The classic SDK is removed 2026-06-24. This migration must complete before then.
- The unified SDK supports both `BackendVertexAI` and `BackendGoogleAI`, which may simplify future multi-backend support.
- Consider whether Chat/Generate need their own region (`europe-west3`) separate from TTS (`europe-west1`), or if everything can run in one region on the unified client.
