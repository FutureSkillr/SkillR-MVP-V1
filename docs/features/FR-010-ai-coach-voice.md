# FR-010: AI Coach Voice Interaction

**Status:** in-progress
**Priority:** should
**Created:** 2026-02-17

## Scope
The AI coach speaks to the user using text-to-speech via Gemini voice models. The voice dialect is determined by the selected coach persona — each coach comes with their own regional dialect. Voice output is critical for the target audience — teenagers engage more naturally with a speaking companion than a text wall.

## Intent
Voice makes the experience personal and immersive. A 14-year-old on a bus can listen instead of read. The coach's dialect gives the interaction a personal, regional flavor. The coach's tone sets the entire emotional register of the product — it must feel like a conversation, not a lecture.

### Dialect-Coach Binding

There is no independent dialect selector. Each coach has a fixed dialect:

| Coach | Dialect |
|-------|---------|
| Susi | Kölsch |
| Karlshains | Schwäbisch |
| Rene | Hochdeutsch |
| Heiko | Berlinerisch |
| Andreas | Bayerisch |
| Cloudia | Sächsisch |

Switching coaches in the profile automatically changes the TTS dialect.

## Acceptance Criteria

- [x] TTS via Gemini voice models with dialect-aware prompts
- [x] Dialect determined by selected coach (no independent selector)
- [x] Browser speechSynthesis fallback when Gemini TTS fails
- [ ] Voice toggle button in app header controls audio output globally

## Dependencies
- FR-005 (Gemini AI dialogue engine — content generation)
- FR-009 (Profile visualization — coach selection UI)

## Notes
- **Vertex AI model**: TTS uses `gemini-2.5-flash-tts` (not the preview variant). The preview name `gemini-2.5-flash-preview-tts` is a Google AI Studio identifier and does not work with Vertex AI.
- **Region requirement**: Gemini TTS is not available in all GCP regions. The backend uses `GCP_TTS_REGION` (default: `europe-west1`) to route TTS/STT to a supported region, separate from the main `GCP_REGION`. See [TC-035](../arch/TC-035-tts-region-separation.md).
- Supported EU regions for Gemini TTS: `europe-west1` (Belgium), `europe-west4` (Netherlands), `europe-central2` (Warsaw).
