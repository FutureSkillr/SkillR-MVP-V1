# FR-034: UI Theme System (Wrappable Visual Layers)

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem

The product needs two distinct visual modes (DC-012): a 3D globe "World Traveler" mode (80 Days style) and a retro "Retro Explorer" mode (Zak McKracken / HD-2D style). The underlying content engine must be identical — only the visual presentation changes.

## Solution

Build a skinnable UI architecture where the Smart Kurs engine (DC-009) outputs structured data, and the rendering layer interprets it according to the active theme.

### Theme Architecture

```
Smart Kurs Engine → Structured Output → Theme Renderer → Screen
                    {                     ├── Theme A: World Traveler (3D Globe)
                      station: "Rome",    └── Theme B: Retro Explorer (HD-2D Pixel)
                      character: "Chef",
                      dialogue: [...],
                      choices: [...],
                      profile_update: {...}
                    }
```

### Theme A: World Traveler

| Component | Technology |
|---|---|
| Globe | react-globe.gl (Phase 1: Leaflet.js) |
| Station scenes | Illustrated panels (AI-generated or hand-drawn) |
| Dialogue | Conversational text flow (inkle style) |
| Choices | Inline text selections |
| Typography | Clean serif + sans-serif, Art Deco accents |
| Color palette | Warm golds, deep blues, cream whites |

### Theme B: Retro Explorer

| Component | Technology |
|---|---|
| Map | Pixel art world map (PixiJS or Canvas) |
| Station scenes | HD-2D: pixel sprites on 3D background (Three.js) |
| Dialogue | Speech bubbles, retro pixel font |
| Interaction | Radial menu (Look / Use / Talk) on object tap |
| Inventory | Pixel item bar at screen bottom |
| Post-processing | Bloom, depth-of-field, tilt-shift via Three.js EffectComposer |
| Color palette | Vibrant pixel colors, glossy modern sheen, CRT-optional scanline filter |

### Theme Selection UX

- First launch: "Wie willst du reisen?" with preview of both themes
- Settings: switch theme anytime
- Both themes show same progress, profile, passport — visual representation differs

## Acceptance Criteria

- [ ] Student can choose between two visual themes at first launch
- [ ] Theme can be switched at any time without losing progress
- [ ] Same Smart Kurs content renders correctly in both themes
- [ ] Theme A runs at 30+ FPS on mid-range mobile (3D globe)
- [ ] Theme B runs at 30+ FPS on mid-range mobile (HD-2D scenes)
- [ ] Profile, passport, and progress look native in each theme

## Dependencies
- DC-012 (Dual UI Paradigm — design concept)
- DC-009 (Smart Kurse — structured content output)
- FR-031 (3D World Globe — Theme A implementation)
