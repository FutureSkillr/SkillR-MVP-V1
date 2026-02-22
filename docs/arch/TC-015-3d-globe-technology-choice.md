# TC-015: 3D Globe Technology Choice

**Status:** accepted
**Created:** 2026-02-19
**Entity:** maindset.ACADEMY + SkillR

## Context

FR-031 requires a 3D globe as the primary navigation interface. Users tap cities on a rotating globe to start stations. The globe must:
- Render at 30+ FPS on mid-range Android phones
- Display station markers with glow/pulse effects
- Support fly-to animations when selecting a station
- Show visited regions with accumulated glow
- Work within the existing React + Vite stack

## Decision

**Use `react-globe.gl` (Three.js-based) with a lightweight configuration, falling back to a 2D CSS globe aesthetic on low-end devices.**

### Why react-globe.gl

| Option | Bundle Size | Mobile FPS | Interactivity | React Integration |
|--------|------------|------------|---------------|-------------------|
| react-globe.gl | ~200KB (gzip) | 30-45 FPS | Points, arcs, labels, custom layers | Native React component |
| Three.js custom | ~150KB | 35-50 FPS | Full control | Manual React bridge |
| Cesium.js | ~800KB | 20-30 FPS | Full GIS | Heavy, enterprise |
| Leaflet.js 2D | ~40KB | 60 FPS | Markers, popups | Mature but flat |
| CSS 3D sphere | ~0KB | 60 FPS | Very limited | Pure CSS |

**react-globe.gl wins** because:
1. Purpose-built for the exact use case (interactive globe with points)
2. React-native API (no imperative Three.js management)
3. Supports custom point rendering, arcs, and labels out of the box
4. Active maintenance, good documentation
5. Reasonable bundle for the visual impact it delivers

### Challenge: Mobile Performance

**Problem:** WebGL on low-end Android can stutter below 30 FPS with high-poly globe + many markers.

**Mitigations:**
1. Low-resolution globe texture (1024x512 natural earth, not 4K)
2. Max 50 point markers (more than enough for MVP2 stations)
3. Disable atmosphere glow on devices with < 4GB RAM (via `navigator.deviceMemory`)
4. `requestAnimationFrame` throttle to 30 FPS cap (saves battery, prevents jank)
5. Fallback: if WebGL context creation fails or FPS drops below 15 for 3 seconds, swap to 2D card-based navigation (current JourneySelector)

### Challenge: Bundle Size

**Problem:** react-globe.gl + three.js adds ~200KB gzipped. Current bundle is ~300KB.

**Mitigation:** Dynamic import with `React.lazy()` — globe only loads when user reaches the navigation screen. Initial page load (welcome/login) stays fast.

### Architecture

```
LandingPage
  └─> GlobeNavigation (lazy-loaded)
        ├─> Globe (react-globe.gl)
        │     ├─> Station markers (pointsData)
        │     ├─> Travel arcs (arcsData)
        │     └─> Labels (labelsData)
        ├─> StationInfoPanel (slide-up on tap)
        └─> 2D fallback (if WebGL unavailable)
```

### Station Coordinates

Each station gets a geographic coordinate (lat/lng) tied to its setting narrative:
- "Die Kueche von Rom" → Rome (41.9, 12.5)
- "Die Schulhof-Challenge" → Berlin (52.5, 13.4)
- "Die Feynman-Methode" → New York (40.7, -74.0)
- Admin-created stations get auto-assigned coordinates or manual override in MetaKursEditor

## Consequences

- **Good:** Visually stunning primary navigation for IHK demo
- **Good:** Interactive — tap cities, fly-to animations, glow effects
- **Good:** Lazy-loaded — doesn't impact initial page load
- **Bad:** +200KB bundle for globe screen (acceptable with lazy loading)
- **Bad:** WebGL may not work on very old devices (fallback covers this)
- **Risk:** First-time globe load takes 1-2s on slow connections. Mitigated with loading skeleton.

## Alternatives Considered

### Custom Three.js Implementation
Rejected: Same bundle cost, more code to maintain, no React integration. react-globe.gl is the maintained abstraction over Three.js for exactly this use case.

### 2D Map Only (Leaflet.js)
Rejected: FR-031 explicitly requires 3D globe as primary navigation. 2D maps don't deliver the "wow" for stakeholder demos. Keep Leaflet as V1.0 option for Theme B.

### CSS 3D Transform Sphere
Rejected: Cannot render textures, markers, or fly-to animations. Looks like a demo, not a product.
