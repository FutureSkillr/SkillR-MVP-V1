# TC-035: TTS Region Separation for Vertex AI

**Status:** done
**Created:** 2026-02-23
**Entity:** maindfull.LEARNING + SkillR

## Context

The Go backend's TTS endpoint (`POST /api/v1/ai/tts`) returned HTTP 403 (`PERMISSION_DENIED`) for all 6 coach dialects. Two bugs were identified:

1. **Wrong model name**: Code used `gemini-2.5-flash-preview-tts` (Google AI Studio name). Vertex AI requires `gemini-2.5-flash-tts`.
2. **Unsupported region**: The unified genai client (used for TTS/STT) inherited `GCP_REGION=europe-west3` (Frankfurt). Frankfurt does not support Gemini TTS.

Supported EU regions for Gemini TTS (as of 2026-02-23):
- `europe-west1` (Belgium)
- `europe-west4` (Netherlands)
- `europe-central2` (Warsaw)

## Decision

**Separate TTS/STT region from the main GCP region using a dedicated `GCP_TTS_REGION` environment variable.** Default: `europe-west1` (Belgium).

The genai client (Chat/Generate) stays in `europe-west3` (Frankfurt). The unified genai client (TTS/STT) uses `GCP_TTS_REGION` instead.

### Model Name Fix

Changed `DefaultTTSModel` from `gemini-2.5-flash-preview-tts` to `gemini-2.5-flash-tts` — the GA model name required by Vertex AI.

## Implementation

### New Environment Variable

| Variable | Default | Description |
|----------|---------|-------------|
| `GCP_TTS_REGION` | `europe-west1` | Region for TTS/STT via unified genai SDK |

### Files Changed

| File | Change |
|------|--------|
| `backend/internal/ai/vertexai.go` | Fixed model name; added `ttsRegion` field; `NewVertexAIClient` takes 4th param |
| `backend/internal/config/config.go` | Added `GCPTTSRegion` field, loaded from `GCP_TTS_REGION` |
| `backend/cmd/server/main.go` | Passes `cfg.GCPTTSRegion` to `NewVertexAIClient` |
| `terraform/environments/*/variables.tf` | Added `gcp_tts_region` variable |
| `terraform/environments/*/main.tf` | Added `GCP_TTS_REGION` to Cloud Run env_vars |
| `scripts/deploy.sh` | Added `GCP_TTS_REGION` to ENVEOF block |
| `.env.example` | Documented new env var |

### Why `europe-west1`

| Criterion | Assessment |
|-----------|-----------|
| GDPR compliance | EU region (Belgium) — data stays in EU |
| Latency from Frankfurt | ~5ms network hop (negligible vs ~2s TTS generation) |
| Gemini TTS support | Confirmed supported |
| Fallback behavior | If `GCP_TTS_REGION` is empty, falls back to `GCP_REGION` |

## Consequences

### Benefits

- All 6 coach dialects work (Susi/Kölsch, Karlshains/Schwäbisch, Rene/Hochdeutsch, Heiko/Berlinerisch, Andreas/Bayerisch, Cloudia/Sächsisch)
- Chat/Generate stay in Frankfurt (lowest latency for main workload)
- TTS/STT route to a supported EU region
- No data leaves the EU

### Trade-offs

- Two regions in the config — minor operational complexity
- TTS responses may have ~5ms additional network latency (imperceptible)

## Deployment Prerequisites

### 1. Enable Vertex AI API

The `aiplatform.googleapis.com` API must be enabled on the GCP project. This is now included in `gcp-onboard.sh`'s required APIs list.

```bash
gcloud services enable aiplatform.googleapis.com --project=$GCP_PROJECT_ID
```

### 2. ADC Account Must Match gcloud Auth

**Critical learning:** `gcloud auth login` and `gcloud auth application-default login` maintain **separate credential stores**. The Go SDK uses Application Default Credentials (ADC), not the gcloud CLI credentials. If these are logged into different Google accounts, the SDK will get 403 errors even though `gcloud` commands and `curl` with `gcloud auth print-access-token` work fine.

**Symptoms:** Direct `curl` with `gcloud auth print-access-token` returns 200 + audio. The Go backend returns 403 `PERMISSION_DENIED` for the same endpoint.

**Diagnosis:**
```bash
# gcloud auth (used by curl)
gcloud config get-value account        # e.g., user-a@gmail.com

# ADC (used by Go SDK)
# Check ~/.config/gcloud/application_default_credentials.json
# or run: make check-adc
```

**Fix:**
```bash
gcloud auth application-default login --project=$GCP_PROJECT_ID
# Sign in with the SAME account that has Vertex AI access
```

**Make targets for diagnosis:**
- `make check-adc` — Compare gcloud auth vs ADC account
- `make check-adc-tts` — Test ADC token directly against Vertex AI TTS endpoint

## Dependencies

- [TC-018](TC-018-agentic-backend-vertexai.md) — VertexAI migration (model table updated)
- [FR-010](../features/FR-010-ai-coach-voice.md) — AI Coach Voice (6 dialect coaches)
