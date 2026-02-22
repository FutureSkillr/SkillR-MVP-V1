# DC-012: Dual UI Paradigm — 3D Globe + Retro Adventure

**Status:** draft
**Created:** 2026-02-18

## Concept

The VUCA journey supports TWO visual modes that the student can switch between. Both share the same Smart Kurs engine (DC-009), the same Erinnerungsraum (TC-009), and the same profile system. Only the presentation layer changes.

### Mode A: "World Traveler" — 80 Days Style

A stylized 3D globe as the primary interface. Art Deco-inspired, hand-drawn illustration panels, clean typography. Text flows in conversational rhythm (inkle's "text is a visual medium" principle). The experience feels like a glossy travel magazine meets interactive fiction.

**Visual reference:** 80 Days by inkle — Art Deco steampunk, 3D globe you can spin, illustrated city arrivals, inline text choices.

| Element | Implementation |
|---|---|
| Navigation | 3D globe (react-globe.gl), tap cities, fly-to transitions |
| Station arrival | Full-screen illustrated panel (hand-drawn or AI-generated art style) |
| Dialogue | Conversational text flow, tap to advance, inline choices highlighted |
| Choices | 2-3 options as tappable text within the narrative |
| Profile | Spider diagram overlaid on globe corner, pulses on update |
| Travel between stations | Animated arc on globe, optional transport choice (train, plane, boat) |
| Visual tone | Warm, sophisticated, Art Deco palette, gold accents |

### Mode B: "Retro Explorer" — Zak McKracken / HD-2D Style

A modernized point-and-click adventure with pixel art characters on glossy 3D backgrounds. The student sees a side-view scene at each station — a kitchen in Rome, a workshop in Tokyo, a lab in the Amazon. Characters are pixel sprites. The environment has modern lighting, bloom, and depth-of-field (HD-2D technique).

**Visual references:**
- **Zak McKracken** (LucasArts, 1988) — globe-trotting adventure, multiple locations, verb-based interaction, travel by airplane
- **Thimbleweed Park** — "how you remember old games, not how they actually were" — pixel art with modern shaders
- **Octopath Traveler HD-2D** — pixel sprites on 3D backgrounds with bloom, depth-of-field, volumetric lighting
- **Sea of Stars** — "retro plus" — pixel art with dynamic lighting that doesn't feel bolted on

| Element | Implementation |
|---|---|
| Navigation | 2D world map (pixel art), tap locations, airplane animation between cities |
| Station arrival | Side-view pixel scene (HD-2D: pixel sprites + 3D background + modern lighting) |
| Dialogue | Speech bubbles over pixel characters, retro font with modern readability |
| Interaction | Tap objects in scene, radial menu (Look / Use / Talk) — adapted SCUMM verbs for touch |
| Inventory | Collectible items displayed in a pixel inventory bar (like classic adventures) |
| Profile | Pixel-art "Reisepass" that fills with stamps |
| Visual tone | Glossy, shiny, pixel-sharp — modern lighting on retro sprites |

### The Switch

The student chooses their mode at first launch ("Wie willst du reisen?") and can switch at any time in settings. The same journey, the same content, the same Smart Kurs objectives — just different visual clothes.

This serves TWO audiences:
- **Mode A** appeals to students who want a modern, sophisticated, "adult" experience
- **Mode B** appeals to students who love retro gaming aesthetics and want something playful

### Technical Architecture: Skinnable UI

```
┌──────────────────────────────────────────┐
│          SMART KURS ENGINE (DC-009)       │
│    Same content, same objectives,         │
│    same AI dialogue, same profile         │
└──────────────────┬───────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌────────▼────────┐
│  Mode A:       │  │  Mode B:        │
│  World Traveler│  │  Retro Explorer │
│                │  │                 │
│  3D Globe      │  │  Pixel Scenes   │
│  Illustrations │  │  HD-2D Lighting │
│  Ink text flow │  │  Speech Bubbles │
│  Art Deco UI   │  │  Radial Menus   │
│                │  │  Inventory Bar  │
│  (react-globe) │  │  (Three.js +    │
│                │  │   PixiJS/Canvas) │
└────────────────┘  └─────────────────┘
```

### HD-2D in the Browser (Technical Feasibility)

The Octopath Traveler HD-2D style is achievable in WebGL/Three.js:

| HD-2D Component | Web Implementation |
|---|---|
| Pixel sprites as billboards | Three.js Sprite or PlaneGeometry, always facing camera |
| 3D environment | Three.js scene with glTF models |
| Bloom/glow | Three.js UnrealBloomPass (EffectComposer) |
| Depth of field | Three.js BokehPass |
| Tilt-shift (diorama effect) | Custom GLSL shader pass |
| Dynamic lighting | Three.js PointLight + SpotLight with shadow maps |
| Particle effects (dust, sparks) | Three.js Points / BufferGeometry particles |

A "lite HD-2D" approach (pixel sprites + 3D bg + bloom + DoF, without full volumetric lighting) runs well on mid-range mobile browsers.

### Interaction Model for Mode B (Touch-Adapted SCUMM)

The classic 15-verb SCUMM interface is reduced to a touch-friendly radial menu:

```
Classic SCUMM (1988):          Modern Touch (2026):
┌──────────────────┐           ┌──────────┐
│ Open  Close Push │           │  [Tap    │
│ Pull  Give  Pick │    →      │   object]│
│ Read  What  Use  │           │          │
│ Unlock On   Off  │           │  ◐ Look  │
│ Fix   NewKid     │           │  ◑ Use   │
└──────────────────┘           │  ◒ Talk  │
                               └──────────┘
```

- **Tap object** → radial menu appears at touch point (3 options: Look / Use / Talk)
- **Long press** → instant "Look at" (description appears)
- **Drag item to object** → "Use [item] with [object]" (inventory combination)
- **Tap character** → auto "Talk to"
- **Double-tap ground** → walk there

This preserves the adventure game puzzle spirit (WHICH action on WHICH object?) while being fully touch-native.

## Target Group
- **Mode A:** Students who prefer clean, modern aesthetics and narrative flow
- **Mode B:** Students who love gaming, retro culture, pixel art, and interactive exploration
- **Both:** The ability to CHOOSE creates ownership — "this is MY way of playing"

## Validation
- Do students have a clear preference? (A/B split in pilot)
- Does Mode B increase engagement for gaming-oriented students?
- Is the content equally compelling in both modes?
- Can a student switch mid-journey without confusion?

## Related
- DC-011 (3D Gamified World Travel — Mode A concept)
- DC-009 (Smart Kurse — the content layer that both modes share)
- DC-010 (Experience-First VUCA — VUCA is invisible in both modes)
- FR-031 (3D World Globe Interface — Mode A implementation)
- FR-034 (UI Theme System — the technical skinning architecture)
