# FR-031: 3D World Globe Interface

**Status:** draft
**Priority:** must
**Created:** 2026-02-18

## Problem

The VUCA journey needs a visual home — an interface that makes exploration feel like TRAVEL, not like navigating a menu. Students should see a world they want to explore, tap a place, and feel like they're arriving there.

## Solution

Build a 3D interactive globe as the primary navigation interface for the VUCA journey.

### Globe Features

| Feature | Description |
|---|---|
| **Rotating globe** | Stylized (painted, warm) 3D globe that rotates slowly when idle |
| **Tap to explore** | Tap any highlighted city to start a station |
| **Fly-to transition** | Smooth logarithmic zoom from orbital view to city level |
| **Travel arcs** | Animated lines connecting visited stations |
| **Glow accumulation** | Explored regions glow gold; unexplored regions are dimmed |
| **Passport overlay** | Stamp grid visible as an overlay, fills as stations are completed |
| **Profile spider** | Small spider diagram in corner, pulses when it grows |
| **Next destinations** | 2-3 highlighted cities as suggested next stations (lokal/fern choice) |
| **Traveler count** | Ambient: "237 Entdecker waren hier" at each station marker |
| **Hidden stations** | Appear after prerequisites are met — discovery reward |
| **Daily station** | One featured station highlighted per day |

### Implementation Phases

**Phase 1 (MVP):** 2D interactive map (Leaflet.js or Mapbox) with animated transitions between stations. Validates the concept without 3D rendering complexity.

**Phase 2:** 3D globe with `react-globe.gl` or `three-globe`. Stylized texture, arcs, points, labels. The full experience.

**Phase 3:** Enhanced visuals — weather effects, day/night cycle, animated transportation between stations, richer station arrival sequences.

### Technical Stack

| Component | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Globe rendering | Leaflet.js + CSS | react-globe.gl | three-globe (custom) |
| Transitions | CSS animations | Three.js camera | Custom fly-to shader |
| Station markers | Leaflet markers | Globe.GL points | Custom 3D markers |
| Travel arcs | Leaflet polyline | Globe.GL arcs | Animated particles |
| Performance target | 30 FPS mobile | 30 FPS mobile | 60 FPS mobile |

### Mobile Performance Budget

The globe must render at 30+ FPS on a mid-range Android phone (the most common device among German teenagers). This means:
- Max 50 visible station markers at once
- Simplified geometry for the globe mesh
- Texture resolution capped at 2048x1024
- No real-time shadows or complex shaders in Phase 1-2
- Lazy-load station detail on tap (not pre-rendered)

## Acceptance Criteria

- [ ] Student sees a globe/map they can interact with
- [ ] Tapping a city starts a smooth transition to that station
- [ ] Visited stations are visually distinct from unvisited ones
- [ ] Travel history is visible as arcs/lines between stations
- [ ] The globe runs at 30+ FPS on a 2023 mid-range Android phone
- [ ] Two to three "next destination" suggestions are highlighted after each station
- [ ] Passport stamp count is visible on the globe view
- [ ] The globe works in a mobile browser (Chrome, Safari) — no app store required

## Dependencies
- FR-005 (Gemini Dialogue Engine — what happens at each station)
- FR-006 (VUCA Navigation — lokal/fern choice logic)
- FR-007 (VUCA Bingo Matrix — invisible tracking of dimension coverage)
- FR-026 (Micro-Session UX — session duration at each station)
- DC-011 (3D Gamified World Travel — design concept)
- DC-010 (Experience-First VUCA — VUCA labels are hidden)
