# DFR-004: Coach Select Panel Visual Polish

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem

The Coach Select Panel (`CoachSelectPage.tsx`) has four visual issues:

1. **Unequal card sizes** — cards in the grid vary in height depending on content length (tagline, setting text). This looks uneven, especially on wider screens where all 6 coaches appear side-by-side.
2. **No card deck border** — the coach grid floats without visual containment. A subtle border around the deck would give it a polished "panel" feel.
3. **Cartoon-style avatars** — the `CoachAvatar` component renders inline SVG illustrations (cartoon faces). The design direction requires photographic coach images instead.
4. **Incorrect heading text** — the heading reads `Waehle deinen Coach` (ASCII transliteration) instead of the correct German `Wähle Deinen Coach` with proper umlaut and capitalization.

## Solution

### 1. Equal-height cards
Add `h-full` to the `CoachCard` button element so all cards stretch to the same height within their grid cell. The grid already uses equal-width columns; this ensures equal height.

**File:** `frontend/components/intro/CoachCard.tsx`
- Add `h-full flex flex-col` to the outer `<button>` className
- Move the "Waehlen" CTA to the bottom with `mt-auto`

### 2. Card deck border
Wrap the coach grid in a container with a thin border and subtle rounded corners.

**File:** `frontend/components/intro/CoachSelectPage.tsx`
- Wrap the `<div className="grid ...">` in a container with `border border-slate-700/50 rounded-2xl p-4`

### 3. Photo-based coach images
Replace the inline SVG avatars with photographic images. Each coach gets a photo asset placed in `frontend/public/images/coaches/`.

**Files:**
- `frontend/public/images/coaches/{susi,karlshains,rene,heiko,andreas,cloudia}.jpg` — Add 6 coach photos (square, min 400x400)
- `frontend/types/intro.ts` — Add optional `photoUrl?: string` field to `CoachPersona`
- `frontend/constants/coaches.ts` — Add `photoUrl` to each coach entry pointing to `/images/coaches/<id>.jpg`
- `frontend/components/intro/CoachAvatar.tsx` — If `coach.photoUrl` is set, render an `<img>` with `object-cover rounded-full` instead of the SVG face component. Keep SVG as fallback.

### 4. Fix heading text
Replace `Waehle deinen` with `Wähle Deinen` in the `CoachSelectPage.tsx` heading.

**File:** `frontend/components/intro/CoachSelectPage.tsx`
- Line 51: `Waehle deinen` → `Wähle Deinen`

## Acceptance Criteria

- [ ] All 6 coach cards render at exactly the same height within each grid row
- [ ] The card deck has a thin visible border (`border-slate-700/50`) and `rounded-2xl` corners
- [ ] Coach avatars show photographic images, not cartoon SVG illustrations
- [ ] SVG avatars remain as fallback when no `photoUrl` is configured
- [ ] Heading reads "Wähle Deinen Coach" with proper umlaut and capitalization
- [ ] Cards remain responsive: 2 columns on mobile, 3 columns on desktop
- [ ] No regression in waiting-room mode (queue active → cards greyed out)

## Dependencies

- 6 coach photo assets must be provided/sourced before implementation

## Notes

- The inline SVG faces in `CoachAvatar.tsx` are ~200 lines of hand-drawn SVG per coach. They should be kept as fallback but photo mode should be the default when assets are available.
- The `Waehlen` button text inside `CoachCard.tsx` (line 40) should also be updated to `Wählen` for umlaut consistency.
- Other ASCII-transliterated strings on this page (`Zurueck`, `spaeter`, `waehlen`) should also be fixed to proper German (`Zurück`, `später`, `wählen`) as part of this change.
