# FR-032: Transit Audio Mode (Reise-Podcast)

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem

A user said: *"I want to use the app on the train, and I don't want to read a lot."*

Many students commute by train, tram, or bus (especially in Sachsen with DVB/OEPNV). Commute time is 10-30 minutes of potential engagement — but the environment (standing, crowded, noisy) doesn't support full visual interaction or text-heavy reading.

## Solution

Build a "Transit Audio Mode" (working name: Reise-Podcast) where the AI coach speaks the journey through earphones and the student responds with minimal touch input.

### How It Works

1. **Student plugs in earphones** (or taps "Audio Mode" toggle)
2. **The globe shows ambient animation** — slow rotation, current position glowing, no interaction required
3. **The AI coach speaks** — narrates the station scenario, asks questions, responds to choices
4. **The student responds with taps** — two large buttons on screen (e.g., "Ja / Nein", "Mehr / Weiter", "Option A / Option B")
5. **No reading required** — all content is spoken; buttons use icons + short labels
6. **Session duration: 3-5 minutes** (one micro-station, aligned with FR-026)
7. **Interruptible** — if the student arrives at their stop, the session pauses and resumes next time

### Interaction Modes

| Mode | Visual | Audio | Input | Use Case |
|---|---|---|---|---|
| **Active** | Full globe + dialogue UI | Optional TTS | Touch + optional voice | Seated, screen visible |
| **Audio** | Ambient globe animation | AI speaks all content | 2 large tap buttons | Standing on train, earphones |
| **Passive** | Minimal (lock screen OK) | AI narrates a story | None (listen-only) | Relaxing, no interaction |

### Technical Stack

| Component | Technology | Notes |
|---|---|---|
| Text-to-speech | Web Speech API `speechSynthesis` (free) | MVP — browser-native German voices |
| Text-to-speech (premium) | ElevenLabs or Google Cloud TTS | Phase 2 — more natural voices |
| Speech recognition (optional) | Deepgram API | Only in quiet environments |
| Earphone detection | `navigator.mediaDevices.enumerateDevices()` | Suggest audio mode when earphones connected |
| Audio session state | Same session model as FR-012 | Interrupt/resume seamless |

### Audio Content Design

The AI coach voice for audio mode should be:
- **Warm and conversational** — like a friend telling a story, not a narrator reading
- **German-language** — native-sounding, not robotic
- **Age-appropriate** — casual register, short sentences, Jugendsprache where natural
- **Pause-aware** — leaves space after questions for the student to think before tapping

Audio stations are SHORTER than active stations:
- Active station: 5-10 minutes, 8-15 dialogue turns
- Audio station: 3-5 minutes, 4-8 spoken segments with tap responses
- Passive listen: 2-3 minutes, pure narration (story or recap of previous journeys)

### Screen During Audio Mode

```
┌──────────────────────┐
│                      │
│   [Slow rotating     │
│    globe with        │
│    glowing position] │
│                      │
│                      │
│  🔊 "Du bist gerade │
│   in Mumbai. Hier    │
│   gibt es ein        │
│   Problem..."        │
│                      │
│  ┌────────┐ ┌──────┐ │
│  │  JA    │ │ NEIN │ │
│  │  ✓     │ │  ✗   │ │
│  └────────┘ └──────┘ │
│                      │
│       ▶ WEITER       │
│                      │
└──────────────────────┘
```

Buttons are LARGE (minimum 60px tap target), high-contrast, and have both icon and word. The student can respond without looking closely at the screen.

## Acceptance Criteria

- [ ] AI coach speaks all station content via text-to-speech in German
- [ ] Student can complete a station using only 2-button tap responses (no typing, no reading)
- [ ] Audio mode sessions are 3-5 minutes
- [ ] Sessions can be interrupted mid-station and resumed at the exact point
- [ ] The globe shows ambient animation during audio mode (not blank screen)
- [ ] Audio mode is suggested when earphones are detected
- [ ] Audio mode works offline for pre-downloaded stations (Phase 2)
- [ ] Speech quality is acceptable to teenagers (not robotic — test with real users)

## Dependencies
- FR-005 (Gemini Dialogue Engine — generates station content for audio)
- FR-012 (Session Continuity — interrupt/resume)
- FR-026 (Micro-Session UX — session duration constraints)
- FR-031 (3D Globe — ambient animation mode)
- DC-010 (Experience-First VUCA — audio must be experiential, not lecture)
- DC-011 (3D Gamified World Travel — audio is one mode of the travel system)

## Notes
- Phase 1: Browser-native TTS (free, lower quality). Test with teenagers — if they say "klingt komisch", invest in ElevenLabs/Google Cloud TTS for Phase 2.
- Passive listen mode (no interaction, just story) is the lowest-effort entry: "Hoer mal rein, was andere Entdecker in Tokyo erlebt haben." This could be a separate content type — curated audio stories from the community's best journeys.
- Voice INPUT (student speaks answers) is explicitly deferred. Transit environments are too noisy. Tap input is reliable in any environment.
