# FR-118: Chat Playback Controls (Play/Pause + Volume)

**Status:** done
**Priority:** should
**Created:** 2026-02-23

## Problem
Every assistant message shows a small speaker icon that fires TTS, but there is no way to pause, resume, or control volume. Clicking the speaker always starts from the beginning and there is no stop button. Users need proper audio controls.

## Solution
Add play/pause toggle and volume slider to every assistant chat bubble:
- **Play/Pause toggle** — start reading, pause mid-playback, resume from paused position
- **Speaker icon with volume slider** — popup range slider (0-1), persisted in localStorage

### Components Changed
- `frontend/types/speech.ts` — new `SpeechControls` interface
- `frontend/hooks/useSpeechSynthesis.ts` — added `isPaused`, `volume`, `activeText`, `pause()`, `resume()`, `setVolume()`
- `frontend/components/shared/ChatBubble.tsx` — new `speech` prop with per-bubble active detection, play/pause button, volume popup
- `frontend/components/stations/VucaStation.tsx` — switched to `speech` prop
- `frontend/components/stations/SelfLearningStation.tsx` — switched to `speech` prop
- `frontend/components/stations/EntrepreneurStation.tsx` — switched to `speech` prop
- `frontend/components/intro/IntroChat.tsx` — switched to `speech` prop
- `frontend/components/OnboardingChat.tsx` — switched to `speech` prop

### Backward Compatibility
Old `onSpeak` + `isSpeaking` props still supported via legacy rendering path.

## Acceptance Criteria
- [x] Assistant bubbles show play and speaker buttons; user bubbles show nothing
- [x] Click play starts TTS; shows spinner while loading, pause icon while playing
- [x] Click pause pauses audio; click play resumes from paused position
- [x] Speaker icon opens volume slider popup
- [x] Volume changes apply immediately and persist across reload (localStorage key `skillr-tts-volume`)
- [x] Playing a different bubble stops the current one
- [x] Minimum 44px touch targets on all controls
- [x] German tooltips on all buttons

## Dependencies
- Uses existing backend TTS endpoint (unchanged)
- Requires `pcmToWavBlob` from `services/audioUtils`

## Notes
- `AudioModeStation.tsx` is unaffected (custom UI, no ChatBubble)
- `ChatInput.tsx` is unaffected (speech input, not output)
