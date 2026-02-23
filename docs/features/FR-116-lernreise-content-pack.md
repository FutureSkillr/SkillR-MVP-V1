# FR-116: Lernreise Content Pack

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-23

## Problem
The globe view shows only 3 abstract journey types with single station markers. Users need concrete, themed Lernreisen as hands-on experiences at real-world locations to make the Reise nach VUCA tangible and engaging for 14+ youth.

## Solution
1. Add 10 default Lernreisen as a "Content Pack" — each with a real-world location, narrative setting, and local guide character.
2. Center the journey carousel cards (currently left-aligned horizontal scroll).
3. Serve the content pack via backend API (`GET /api/v1/content-pack`) with PostgreSQL storage.
4. Frontend fetches from API with fallback to hardcoded defaults.

## The 10 Lernreisen

| # | Title | Location | Journey Type |
|---|-------|----------|-------------|
| 1 | Loeten | Nuernberg, DE | entrepreneur |
| 2 | Lachs angeln | Tromsoe, NO | vuca |
| 3 | Baeume faellen | Schwarzwald, DE | vuca |
| 4 | Gold finden | Dawson City, CA | entrepreneur |
| 5 | Boot bauen | Flensburg, DE | entrepreneur |
| 6 | Kleider naehen | Florenz, IT | self-learning |
| 7 | Rehkitz pflegen | Bayerischer Wald, DE | self-learning |
| 8 | Schneemobil fahren | Rovaniemi, FI | vuca |
| 9 | Einbaum segeln | Samoa, Pazifik | vuca |
| 10 | Wildpferde reiten | Mongolei | self-learning |

## Acceptance Criteria
- [ ] Journey cards are centered in the carousel
- [ ] 10 Lernreise cards render after the 3 journey type cards
- [ ] Each Lernreise card shows location badge and parent journey color
- [ ] Clicking a Lernreise card flies the globe to its coordinates
- [ ] 13 total markers visible on the globe (3 original + 10 new)
- [ ] Backend serves `GET /api/v1/content-pack` with 10 Lernreisen from PostgreSQL
- [ ] Frontend falls back to hardcoded constants if API unavailable
- [ ] Go backend builds and tests pass
- [ ] Frontend type-check passes

## Dependencies
- FR-074: Lernreise catalog (existing journey framework)
- FR-075: Lernreise instances

## Notes
Each Lernreise maps to one of the 3 journey types for color coding:
- **vuca** (blue): Lachs angeln, Baeume faellen, Schneemobil fahren, Einbaum segeln
- **entrepreneur** (orange): Loeten, Gold finden, Boot bauen
- **self-learning** (purple): Kleider naehen, Rehkitz pflegen, Wildpferde reiten
