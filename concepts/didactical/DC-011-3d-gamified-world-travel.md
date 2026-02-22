# DC-011: 3D Gamified World Travel System

**Status:** draft
**Created:** 2026-02-18

## Concept

The VUCA journey is wrapped in a 3D world travel experience. The student sees a rotating globe. They tap a city. The camera flies in. They arrive. A character greets them with a problem. The learning happens through the adventure.

### Inspiration Models

| Model | What We Take | What We Leave |
|---|---|---|
| **80 Days** (inkle) | 3D globe as game board, branching narrative at each city, varied transportation, consequences for choices, time awareness | Steampunk theme, strict time limit |
| **Google Earth Voyager** | Logarithmic fly-to transitions (space → city), story-driven guided tours, sense of real place | Photorealistic rendering (too heavy for mobile) |
| **Carmen Sandiego** | Learning through investigation (not instruction), clue-based progression, geography as gameplay | Detective framing, prescribed path |
| **GeoGuessr** | Being "dropped" into an unfamiliar place, observation-based discovery | Guessing mechanic (not relevant) |
| **Globle** | Visual accumulation on globe (explored areas glow), color-coded progress | Pure geography focus |
| **Duolingo DuoRadio** | Audio-first for transit, micro-sessions, habit streaks | Language-specific mechanics |

### The Core Experience

```
┌──────────────────────────────────────────────────────┐
│                  THE GLOBE VIEW                       │
│                                                       │
│   A stylized 3D globe rotates slowly.                │
│   Your current position glows.                        │
│   Explored stations shimmer in gold.                  │
│   Unexplored regions are dimmed.                      │
│   Travel arcs animate between visited cities.         │
│   Your passport stamp count is visible.               │
│                                                       │
│   You tap Tokyo.                                      │
│                                                       │
│   The globe ZOOMS IN — a smooth fly-to animation.    │
│   The city materializes. A character appears.         │
│                                                       │
│   "Hey, du bist in Tokyo! Hier baut ein Team          │
│    einen Roboter, aber sie streiten sich,             │
│    ob er Kunst oder Technik ist. Hilf ihnen."         │
│                                                       │
│   The station begins.                                 │
│   [5-10 minutes of dialogue/interaction]              │
│                                                       │
│   Station complete. New passport stamp.               │
│   Spider diagram ticks up.                            │
│   Globe ZOOMS OUT. Your travel arc to Tokyo appears.  │
│   The globe shows: where next?                        │
└──────────────────────────────────────────────────────┘
```

### Visual Design Principles

1. **Stylized, not photorealistic.** A painted, warm, inviting globe — like an illustration, not a satellite image. Think Pixar aesthetics, not Google Earth. This is lighter on GPU, more appealing to teens, and creates a distinct brand identity.

2. **The globe accumulates state.** Every visited station glows. Travel arcs connect them. The globe becomes a visual autobiography: "This is where I've been." The more you explore, the more beautiful your globe becomes.

3. **Fly-to transitions create arrival.** The camera movement from space to city is the moment of wonder. It should feel like landing — a logarithmic zoom (fast at first, slowing as you approach) with a slight camera tilt as you arrive.

4. **Minimal text on the globe.** City names appear on hover/tap. No menus. No sidebars. The globe IS the interface.

5. **Two choices always visible.** From any station, two to three next destinations are highlighted on the globe — one nearby (local/vertiefend), one far away (fern/wechselnd). This implements the navigation principle from the transcript without exposing the pedagogy.

### Game Mechanics on the Globe

| Mechanic | Implementation | Purpose |
|---|---|---|
| **Passport stamps** | Visual grid filling up, one stamp per station | Collection/completion drive |
| **Travel arcs** | Animated lines connecting visited cities | Shows personal journey history |
| **Glow intensity** | Explored regions glow brighter | Visual progress feedback |
| **Hidden stations** | Some stations only appear after prerequisites | Discovery/surprise element |
| **Weather events** | "A storm blocks your route — try this detour" | Forced exploration of new areas |
| **Traveler count** | "237 Entdecker haben diese Station besucht" | Social proof/ambient awareness |
| **Route challenges** | "Schaff die Suedamerika-Route in 5 Stationen" | Goal-setting for engaged users |
| **Daily station** | One featured station per day with bonus stamps | Daily return incentive |

### Transit Mode ("Reise-Podcast")

The user who said "I want to use this on the train and don't want to read a lot" defines a critical use case.

**Active Mode** (seated, screen visible):
- Full 3D globe interaction
- Touch navigation, dialogue choices on screen
- Visual-rich, interactive

**Audio Mode** (standing, earphones, train):
- The AI coach SPEAKS the journey via text-to-speech or pre-recorded narration
- The globe shows a minimal ambient animation (slow rotation, glowing current position)
- Student responds via simple taps: two large buttons ("Ja/Nein", "Mehr/Weiter", "Links/Rechts")
- No reading required — everything is spoken
- Session duration: 3-5 minutes (one micro-station)
- Can be interrupted and resumed instantly

**The switch:** A single toggle or auto-detection (earphones plugged in → suggest audio mode).

```
Active Mode:                    Audio Mode:
┌──────────────┐               ┌──────────────┐
│  3D Globe    │               │  Slow Globe  │
│  [tap cities]│               │  [ambient]   │
│              │               │              │
│  Dialogue    │               │  🔊 AI speaks │
│  [text + UI] │               │              │
│              │               │  [Ja] [Nein] │
│  [Choice A]  │               │              │
│  [Choice B]  │               │  ▶ Weiter    │
└──────────────┘               └──────────────┘
```

### Technical Approach

**Recommended stack for the 3D globe:**

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **react-globe.gl** | Lightweight, stylized, React-native, MIT license, supports arcs/points/labels | Limited customization of globe texture | **MVP choice** |
| **three-globe** | Full Three.js control, same data layer as react-globe.gl, more visual flexibility | More code to write | **Phase 2 upgrade** |
| **Mapbox GL JS globe** | Best mobile performance (60 FPS), real geography, offline support | Proprietary, photorealistic (not stylized) | **Alternative if realism needed** |
| **CesiumJS** | Full geospatial engine, terrain, 3D tiles | Heavy (~10MB), overkill for stylized globe | **Not recommended for MVP** |

**Audio/Voice stack:**

| Component | Technology |
|---|---|
| Text-to-speech (AI speaks) | Web Speech API `speechSynthesis` (free, browser-native) or ElevenLabs (higher quality, paid) |
| Speech recognition (student speaks) | Deepgram API (best in noise), fallback to Web Speech API |
| Audio mode detection | `navigator.mediaDevices` (earphone detection), manual toggle |

## Target Group
- **Primary:** Teenagers (14-16) who want an experience, not a curriculum
- **Transit users:** Students commuting by train/bus who have 5-10 minutes and earphones
- **Visual learners:** Students who engage more with images and animation than with text

## Implementation Priority
1. **MVP:** 2D interactive map with fly-to animations (Leaflet.js + CSS transitions) — fastest to build, validates the concept
2. **Phase 2:** 3D globe with react-globe.gl — the full experience
3. **Phase 3:** Audio mode for transit — after the visual mode is proven

Don't build 3D before validating with 2D. The magic moment (proposal.md Part 2) can work with a beautifully animated 2D map. The 3D globe is an enhancement that makes it stunning.

## Validation
- Do students say "Das fuehlt sich an wie ein Spiel" (not "wie eine App")?
- Does the fly-to transition create a visible reaction (lean forward, eyes widen)?
- Do students in the audio mode complete stations at similar rates to active mode?
- Does the globe accumulation (glowing explored regions) motivate continued exploration?

## Related
- DC-010 (Experience-First VUCA — the pedagogical principle the 3D experience serves)
- DC-007 (Digitale Wanderschaft — the journey metaphor made visual)
- DC-009 (Smart Kurse — what happens AT each station)
- FR-031 (3D World Globe Interface — technical feature)
- FR-032 (Transit Audio Mode — audio-first interaction)
- FR-006 (VUCA Navigation — the two-choice navigation pattern)
- FR-026 (Micro-Session UX — session duration and interruption handling)
