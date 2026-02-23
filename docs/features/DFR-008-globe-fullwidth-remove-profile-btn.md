# DFR-008: Full-Width Globe Universe & Remove Profile Button

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem
1. The "Mein Profil ansehen" button at the bottom of the globe universe view is unnecessary clutter — profile access is available elsewhere.
2. The globe universe area is constrained to `max-w-5xl` (~1024px) — it should stretch full-width to be more immersive.
3. The area below the globe (carousel, filter pills) lacks visual separation from the rest of the page.

## Current Design

```
┌─────────────────────────────────────────┐
│         max-w-5xl mx-auto               │
│                                         │
│     "Waehle dein Reiseziel"             │
│     ┌─────────────────────┐             │
│     │      🌍 Globe       │             │
│     └─────────────────────┘             │
│     < Card Carousel >                   │
│     [Filter Pills]                      │
│     [Mein Profil ansehen]  ← remove     │
│                                         │
└─────────────────────────────────────────┘
```

## Target Design

```
┌─────────────────────────────────────────────────────────┐
│ full width, gradient bg                                 │
│                                                         │
│           "Waehle dein Reiseziel"                       │
│     ┌───────────────────────────────┐                   │
│     │         🌍 Globe              │                   │
│     └───────────────────────────────┘                   │
│     < Card Carousel (full width) >                      │
│     [Filter Pills]                                      │
│     ↕ subtle gradient fade-out at bottom                │
└─────────────────────────────────────────────────────────┘
```

## Changes

### 1. Remove "Mein Profil ansehen" button
- **GlobeInner** (line ~578-588): Delete the `{/* Profile Button */}` block
- **Globe2DFallback** (line ~718-727): Delete the equivalent block
- `onViewProfile` prop remains in the interface (used by other callers) but is no longer rendered inside the globe view

### 2. Stretch to full width
- **GlobeInner outer div** (line 264): Change `className="max-w-5xl mx-auto space-y-4 py-2"` to `className="w-full space-y-4 py-2"`
- The globe container, carousel, and filter pills inherit the full width

### 3. Add gradient background
- Wrap the globe universe section in a container with a subtle gradient:
  - `bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950/80`
  - Provides a visual "grounding" effect below the globe
  - Fades out at the bottom edge for a smooth transition to whatever is below

## Acceptance Criteria
- [ ] "Mein Profil ansehen" button is removed from both GlobeInner and Globe2DFallback
- [ ] Globe universe stretches full width (no max-w constraint on outer container)
- [ ] A subtle gradient background is applied to the universe area below the globe
- [ ] Carousel arrows remain accessible and not cut off at full width
- [ ] Globe responsive sizing still works correctly
- [ ] No horizontal scrollbar introduced

## Dependencies
- FR-116: Lernreise Content Pack (carousel content)

## Notes
- The `onViewProfile` callback remains in the component interface for API compatibility — it's just not rendered as a button anymore.
- The gradient should be subtle enough to blend with the dark page background.
