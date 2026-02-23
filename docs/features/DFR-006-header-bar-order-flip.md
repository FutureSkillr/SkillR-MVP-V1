# DFR-006: Header Bar Order Flip — EU Notice on Top

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-23

## Problem
The current WelcomePage header has two fixed bars stacked vertically:
1. **Bar 1 (top)**: Navigation — SkillR logo + "Anmelden" button
2. **Bar 2 (below)**: EU co-funding notice — EU flag + Kofinanzierung text

EU funding guidelines require the co-funding notice to have maximum visibility. Moving it to the topmost position ensures compliance and gives it the prominence it deserves.

## Current Design (Before)

```
┌──────────────────────────────────────────────────────┐
│ [S] SkillR                              [Anmelden]   │  ← Bar 1: nav, glass bg, fixed top-0, z-50
├──────────────────────────────────────────────────────┤
│ 🇪🇺 Kofinanziert von der EU ...                      │  ← Bar 2: EU notice, bg-slate-900/80, top-[72px], z-40
└──────────────────────────────────────────────────────┘
```

### Bar 1 — Navigation (currently top)
- **Position:** `fixed top-0 w-full z-50`
- **Background:** `glass` (frosted glass effect)
- **Padding:** `px-4 sm:px-6 py-4`
- **Height:** ~72px (determines Bar 2 offset)
- **Content:** App icon (40x40 rounded-xl) + "SkillR" text (Outfit font, text-xl bold) | "Anmelden" button (blue-to-purple gradient, rounded-xl)
- **Layout:** `flex items-center justify-between`, `max-w-6xl mx-auto`

### Bar 2 — EU Co-Funding (currently below)
- **Position:** `fixed top-[72px] w-full z-40`
- **Background:** `bg-slate-900/80 backdrop-blur-sm`
- **Border:** `border-b border-white/5`
- **Padding:** `px-4 sm:px-6 py-2`
- **Height:** ~48px (smaller than nav)
- **Content:** EU flag image (`/icons/eu-co-funded-neg.png`, h-8 sm:h-10) + Kofinanzierung text (text-[10px] sm:text-xs, text-slate-400)
- **Layout:** `flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4`, `max-w-6xl mx-auto`

## Target Design (After)

```
┌──────────────────────────────────────────────────────┐
│ 🇪🇺 Kofinanziert von der EU ...                      │  ← Bar 1: EU notice, moved to top-0, z-50
├──────────────────────────────────────────────────────┤
│ [S] SkillR                              [Anmelden]   │  ← Bar 2: nav, moved below EU bar, z-40
└──────────────────────────────────────────────────────┘
```

### Rules
1. **Flip position only** — EU bar moves to `top-0`, nav bar moves below it
2. **Keep each bar's own styling** — colors, backgrounds, padding, borders, content layout unchanged
3. **Update z-index** — EU bar gets `z-50` (now on top), nav bar gets `z-40`
4. **Update offsets** — EU bar: `top-0`; nav bar: `top-[~48px]` (height of EU bar)
5. **Update hero section padding** — `pt-36 sm:pt-32` may need adjustment for the new stacking order
6. **Mobile**: EU bar stacks vertically (flag + text), nav bar stays horizontal

## Implementation

**File:** `frontend/components/WelcomePage.tsx`

### Changes required:
1. Move the `{/* EU Co-Funding Notice */}` block BEFORE the `{/* Nav */}` block
2. Change EU bar: `fixed top-0 w-full z-50` (was `fixed top-[72px] w-full z-40`)
3. Change nav bar: `fixed top-[48px] w-full z-40` (was `fixed top-0 w-full z-50`), keep `glass` background
4. Verify hero section `pt-` values still provide enough clearance

## Acceptance Criteria
- [ ] EU co-funding bar renders at the very top of the page
- [ ] Navigation bar (logo + Anmelden) renders directly below the EU bar
- [ ] EU bar retains its dark background (`bg-slate-900/80 backdrop-blur-sm`)
- [ ] Nav bar retains its glass effect background
- [ ] "Anmelden" button retains its blue-to-purple gradient
- [ ] EU flag and text remain centered with current sizing
- [ ] Hero section content is not overlapped by the header bars
- [ ] Mobile layout remains functional (no overflow, touch targets >= 44px)

## Dependencies
- FR-112: EU Co-Funding Notice (original implementation)
- DFR-003: Nav Logo App Icon

## Notes
- The EU bar height on mobile (flex-col) may differ from desktop (flex-row). The nav bar's `top-[Xpx]` offset may need a responsive value or a CSS variable.
- This is a visual-only change — no API or data model impact.
