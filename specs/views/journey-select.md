# View: journey-select

**Route:** `journey-select` (internal view state)
**Component:** `GlobeNavigation.tsx`
**Layout:** Layout chrome (header with globe, audio toggle, profile, logout)

## Structure

```
┌────────────────────────────────────────────────────────────────┐
│  Layout Header                                                 │
│  ┌──────────┐       ┌──────┐ ┌──────┐  Profil  Admin  Abm.   │
│  │ < SkillR  │       │ 🌐  │ │ 🔊  │                          │
│  └──────────┘       └──────┘ └──────┘                          │
│   LEFT               CENTER (globe+speaker)       RIGHT        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─ Profil-Zwischenergebnis (glass, conditional) ───────────┐  │
│  │  Dein Profil-Zwischenergebnis                             │  │
│  │  "Du interessierst dich fuer Musik und Technik..."        │  │
│  │  [ Musik ] [ Technik ] [ Design ]  (interest pills)       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                │
│              Waehle dein Reiseziel                              │
│         (text-2xl font-bold, centered)                         │
│                                                                │
│  ┌─ 3D Globe ──────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │            ╭─────────────╮                               │   │
│  │          ╱   ● Rom        ╲       ┌─ Stempel: 0/3 ──┐   │   │
│  │        ╱      (blue)       ╲      └──────────────────┘   │   │
│  │       │   ● Berlin          │                            │   │
│  │       │    (orange)         │                            │   │
│  │        ╲                   ╱                             │   │
│  │          ╲  ● New York   ╱                               │   │
│  │            ╰─(purple)──╯                ┌─ ⤢ ─┐         │   │
│  │                                         └─────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ Journey Carousel (horizontal scroll, snap) ────────────┐   │
│  │                                                          │   │
│  │  ┌── w-56 card ───┐  ┌── w-56 card ───┐  ┌── w-56 ──┐  │   │
│  │  │ 🌍             │  │ 🚀             │  │ 🧪       │  │   │
│  │  │ Reise nach     │  │ Gruender-      │  │ Lern-    │  │   │
│  │  │ VUCA           │  │ Werkstatt      │  │ Labor    │  │   │
│  │  │ Weltreise der  │  │ Mach deine     │  │ Werde    │  │   │
│  │  │ Veraenderung   │  │ Ideen real     │  │ dein ... │  │   │
│  │  │                │  │                │  │          │  │   │
│  │  │ Tauche ein in  │  │ Entwickle      │  │ Entdecke │  │   │
│  │  │ lebendige ...  │  │ eigene ...     │  │ Lern...  │  │   │
│  │  │                │  │                │  │          │  │   │
│  │  │ 0/1 Stationen  │  │ 0/1 Stationen  │  │ 0/1 Stat │  │   │
│  │  │ [Empfohlen]    │  │                │  │          │  │   │
│  │  │ ░░░░░░░░░░░░░  │  │ ░░░░░░░░░░░░░  │  │ ░░░░░░░ │  │   │
│  │  └────────────────┘  └────────────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ Two-Level Label Filter ─────────────────────────────────┐  │
│  │                                                           │  │
│  │  Level 1 (toggle pills, centered):                        │  │
│  │  ( 🌍 Reise nach VUCA )  ( 🚀 Gruender-Werkstatt )       │  │
│  │  ( 🧪 Lern-Labor )                                        │  │
│  │                                                           │  │
│  │  Level 2 (dimension pills, shown when L1 active):         │  │
│  │  [ Veraenderung ] [ Ungewissheit ] [ Vernetzung ]         │  │
│  │  [ Vieldeutigkeit ]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─ Station Info Panel (conditional, slide-up) ─────────────┐  │
│  │  ┌────┐ Die Kueche von Rom                                │  │
│  │  │ 🌍 │ Rom · Reise nach VUCA        [ x ]               │  │
│  │  └────┘                                                   │  │
│  │  [ ============ Reise starten ============ ]              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                │
│         [ 🌍 Reise nach VUCA starten ]  (conditional CTA)     │
│                                                                │
│         [ Mein Profil ansehen ]  (conditional)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Design Decisions

### D1: 3D Globe as Primary Selection Metaphor

The journey selection uses an interactive 3D globe (`react-globe.gl`) as the primary visual. Each journey is mapped to a real-world city. This reinforces the "Weltreise" (world travel) metaphor central to SkillR's didactical concept.

- **Library:** `react-globe.gl` (lazy-loaded via `React.lazy`)
- **Fallback:** If WebGL is unavailable, a 2D card list renders instead (`Globe2DFallback`)
- **Texture:** Blue marble earth (`earth-blue-marble.jpg`) + night sky background
- **Atmosphere:** Blue glow (`#3B82F6`, altitude `0.15`)

### D2: Globe Centered on Europe by Default

Initial point of view: `{ lat: 48, lng: 10, altitude: 2.2 }` (Central Europe). Auto-rotate enabled at speed `0.3`. This default is intentional because the target audience is German-speaking youth.

### D3: Station-to-City Mapping

Each journey has one or more stations placed at real-world cities:

| Journey | Station ID | City | Lat | Lng |
|---------|-----------|------|-----|-----|
| Reise nach VUCA | `vuca-01` | Rom | 41.9 | 12.5 |
| Gruender-Werkstatt | `entrepreneur-01` | Berlin | 52.52 | 13.405 |
| Lern-Labor | `self-learning-01` | New York | 40.71 | -74.006 |

Source of truth: `frontend/constants/stationCoordinates.ts`

### D4: Color System per Journey

Each journey type has a consistent color used across the globe markers, carousel cards, filter pills, and glow effects:

| Journey | Color | Hex | Tailwind | Glow |
|---------|-------|-----|----------|------|
| VUCA | Blue | `#60A5FA` | `blue-400` | `rgba(96, 165, 250, 0.4)` |
| Entrepreneur | Orange | `#FB923C` | `orange-400` | `rgba(251, 146, 60, 0.4)` |
| Self-Learning | Purple | `#C084FC` | `purple-400` | `rgba(192, 132, 252, 0.4)` |

### D5: Three Selection Mechanisms

Users can select a journey through three interaction paths — all are synced:

1. **Click a point on the globe** — Opens the station info panel, globe flies to that station
2. **Click a carousel card** — Selects the journey, globe flies to the journey center, CTA button appears
3. **Click a Level-1 filter pill** — Same behavior as carousel card click

All three update `selectedJourney` and `selectedStation` state. Clicking the same item again deselects (toggle behavior).

### D6: Horizontal Carousel Below Globe

Journey cards are displayed in a **horizontal scrolling carousel** below the globe:

- **Card width:** `w-56` (224px), fixed — does not stretch
- **Scroll:** `overflow-x-auto` with `snap-x snap-mandatory` for snapping
- **Card content:** Icon, title, subtitle, description (2-line clamp), station progress, "Empfohlen" badge
- **Selected state:** Color-matched `outline` + `box-shadow` glow
- **Hover:** `scale-[1.02]` + subtle ring

This replaces the earlier flat `JourneySelector` grid. The carousel is more compact and lets the globe remain the visual focal point.

### D7: Two-Level Label Filter

Below the carousel, a two-level filter provides quick navigation:

- **Level 1 — Journey pills:** Rounded pill buttons, one per journey type. Toggleable. Active state shows journey color fill + border.
- **Level 2 — Dimension pills:** Appear only when a Level-1 journey is selected. Show the skill dimensions for that journey (e.g., Veraenderung, Ungewissheit, Vernetzung, Vieldeutigkeit for VUCA). These are informational labels with `title` tooltips, not interactive filters.

Level-1 pills duplicate the carousel's selection behavior intentionally — they serve as a compact, always-visible alternative for users who scroll past the carousel.

### D8: Globe Navigation Button in Header

The globe button (`🌐`) is positioned in the **center** of the Layout header, next to the audio toggle speaker button. It is always visible when logged in.

- **Active state** (on `journey-select` view): Earth-blue glow `shadow-[0_0_14px_rgba(59,130,246,0.5)]`, blue text
- **Inactive state** (other views): Neutral `bg-slate-800/60`, blue on hover
- **Button shape:** `w-10 h-10 rounded-full` — matches the speaker button

This provides a persistent way to return to journey selection from any view.

### D9: Zoom Controls

- **Scroll zoom:** Enabled, range `minDistance: 101` to `maxDistance: 600`
- **Zoom full-out button:** Bottom-right overlay on the globe (expand icon). Resets to default Europe view with auto-rotate re-enabled.
- **Fly-to on selection:** Altitude `1.4` for journey center, altitude `1.2` for specific station

### D10: Content Consolidation

Journey titles and descriptions have a **single source of truth**: `frontend/constants/journeys.ts`. The backend SQL seed (`000015_seed_journeys.up.sql`) was updated to match. No independent backend-only titles exist.

| Journey Type | Canonical Title | Canonical Description |
|---|---|---|
| `vuca` | Reise nach VUCA | Tauche ein in lebendige Orte und erlebe, wie du mit Veraenderung, Unsicherheit und neuen Situationen umgehst. |
| `entrepreneur` | Gruender-Werkstatt | Entwickle eigene Ideen, teste sie an der Realitaet und lerne, was es heisst, etwas Neues zu schaffen. |
| `self-learning` | Lern-Labor | Entdecke Lerntechniken und wende sie direkt auf deine eigenen Interessen an. |

Admin users can override these titles/descriptions via the MetaKursEditor (stored in `localStorage` key `skillr-custom-journeys`).

## Sections

### 1. Profil-Zwischenergebnis (conditional)

Shown only when `insights` is non-null (i.e., onboarding has been completed).

| Element | Style | Content |
|---------|-------|---------|
| Title | `text-lg font-bold` | `Dein Profil-Zwischenergebnis` |
| Summary | `text-slate-300 text-sm` | `insights.summary` |
| Interest pills | `text-xs rounded-full bg-blue-500/10` | `insights.interests[]` |

### 2. Page Title

| Element | Style | Text |
|---------|-------|------|
| Title | `text-2xl font-bold text-center` | `Waehle dein Reiseziel` |

### 3. 3D Globe

- `react-globe.gl` rendered inside `<Suspense>` with "Lade Weltkarte..." fallback
- Responsive sizing: `min(containerWidth, viewportHeight * 0.45)`
- Station points: color-coded per journey, smaller when completed (`0.4` vs `0.6` radius)
- Arcs: Dashed animated arcs between completed stations
- Tooltip on hover: City name, station title, journey title, completion checkmark

**Overlays:**
- **Top-right:** Passport stamp counter (`Stempel: N/M`)
- **Bottom-right:** Zoom full-out button (expand icon)

### 4. Journey Carousel

Horizontal scroll container with 3 journey cards.

| Card Element | Style | Content |
|---|---|---|
| Icon | `text-2xl` | `journey.icon` |
| Title | `font-bold text-sm`, journey color | `journey.title` |
| Subtitle | `text-[10px] text-slate-500` | `journey.subtitle` |
| Description | `text-xs text-slate-400 line-clamp-2` | `journey.description` |
| Station count | `text-[10px] text-slate-500` | `N/M Stationen` |
| "Empfohlen" badge | `text-[9px] rounded-full bg-green-500/20` | Only on recommended journey |
| Progress bar | `h-1 bg-slate-800 rounded-full` | Fill colored per journey |

**Selection:** Click to select/deselect. Selected card shows `outline: 2px solid {color}` + `boxShadow: 0 0 20px {glowColor}`.

### 5. Two-Level Label Filter

**Level 1:** Toggle pills for each journey. Active = colored fill + border. Clicking toggles selection and flies globe.

**Level 2:** Dimension pills, shown with `animate-in fade-in` when a journey is selected. Read-only labels with `title` tooltip showing the dimension description.

### 6. Station Info Panel (conditional)

Slide-up panel (`animate-in slide-in-from-bottom-4`) triggered by clicking a station point on the globe.

| Element | Content |
|---------|---------|
| Icon | Journey icon in tinted background |
| Title | Station title (e.g., "Die Kueche von Rom") |
| Subtitle | `{city} · {journey title}` |
| Close button | `x` icon, top-right |
| CTA | "Reise starten" gradient button (or checkmark if completed) |

### 7. Journey CTA (conditional)

Shown when a journey is selected via carousel/filter but no specific station is selected. Gradient button: `{icon} {title} starten`.

### 8. Profile Button (conditional)

Shown when `completedJourneys.length > 0`. Glass button: "Mein Profil ansehen".

## Interaction Flow

```
landing / any view
   ↓ (click globe button in header)
journey-select
   │
   ├─→ Click carousel card    → selectedJourney set, globe flies to center
   │     └─→ Click CTA        → onSelect(journeyType) → station view
   │     └─→ Click again       → deselect, globe resets
   │
   ├─→ Click Level-1 pill     → same as carousel card
   │
   ├─→ Click globe point      → selectedStation set, info panel opens
   │     └─→ "Reise starten"  → onSelect(journeyType) → station view
   │     └─→ Close panel       → deselect, globe resets
   │
   ├─→ Click zoom-out button  → deselect all, globe resets to Europe
   │
   └─→ "Mein Profil ansehen"  → profile view
```

## Globe Behavior

| Trigger | Auto-Rotate | Altitude | Duration |
|---------|-------------|----------|----------|
| Initial load | On (0.3 speed) | 2.2 | Instant |
| Select journey (carousel/pill) | Off | 1.4 | 800ms |
| Select station (globe click) | Off | 1.2 | 800ms |
| Deselect / zoom-out | On (0.3 speed) | 2.2 | 800ms |

## WebGL Fallback

When `hasWebGL()` returns false, `Globe2DFallback` renders instead:

- Vertical card list (one per station coordinate)
- Each card shows: city name (colored), station title, journey title
- "Empfohlen" and completion badges
- Same `onSelect` behavior — clicking starts the journey
- No carousel or label filter (simplified layout)

## Data Dependencies

| Data | Source |
|------|--------|
| `insights` | `profile.onboardingInsights` from `App` state |
| `completedJourneys` | Derived from `stationResults[]` |
| `completedStations` | `profile.completedStations` string array |
| Journey definitions | `getJourneysAsDefinitions()` via `contentResolver.ts` |
| Station definitions | `getStationsAsRecord()` via `contentResolver.ts` |
| Station coordinates | `STATION_COORDINATES` from `constants/stationCoordinates.ts` |
| Recommended journey | `insights.recommendedJourney` (fallback: `'vuca'`) |

## Related

- `specs/views/profile.md` — Profile view (navigated to via "Mein Profil ansehen")
- `docs/features/FR-009-profile-visualization.md` — Profile feature request
- `frontend/constants/journeys.ts` — Canonical journey definitions
- `frontend/constants/stationCoordinates.ts` — Station-to-city mappings
- `frontend/constants/stations.ts` — First station content per journey
