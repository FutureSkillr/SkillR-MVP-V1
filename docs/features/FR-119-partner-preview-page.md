# FR-119: Partner Preview Page

**Status:** specified
**Priority:** must
**Created:** 2026-02-23

## Problem
Partners who sponsor content packs (per BC-007 Bildungssponsoring) need a visible, public-facing page to showcase their contribution to SkillR. Currently there is no partner-facing preview that shows branding, sponsored Lernreisen, and a call-to-action.

## Solution
A URL-parameter-driven partner preview page accessible via `?partner=slug`. The page renders outside the main app Layout (like WelcomePage) and shows:

1. **Hero** — gradient using partner theme colors, partner name, tagline, "SkillR Bildungspartner" badge
2. **Partner info** — company description, key facts (for SSI: 152 Ausstellungen, 100K+ Objekte, 20M+ Besucher, Silberner Meridian 2024)
3. **Lernreisen showcase** — responsive card grid with icon, title, subtitle, location, journey type color coding
4. **Content Pack** — pack name and description
5. **CTA** — "Reise starten" button that redirects to `?sponsor=slug` so BrandContext activates partner branding
6. **Footer** — partner legal info, back-to-SkillR link

Uses partner theme colors via inline styles (not BrandContext).

## API
- `GET /api/v1/content-pack/brand/:slug` — returns partner's packs + Lernreisen (public, no auth)
- `GET /api/brand/:slug` — returns BrandConfig for partner (existing endpoint)
- Frontend fallback: hardcoded SSI data when API unavailable

## Acceptance Criteria
- [ ] `?partner=space-service-intl` renders full preview page with navy/cyan SSI theme
- [ ] 3 Lernreise cards displayed: Kosmonautentraining, Gagarins Spuren, Mission Mars
- [ ] "Reise starten" redirects to main app with SSI branding active
- [ ] `?partner=nonexistent` shows "Partner nicht gefunden" state
- [ ] Page works without backend via hardcoded SSI fallback
- [ ] Mobile-responsive layout

## Dependencies
- FR-116: Lernreise Content Pack (pack infrastructure)
- FR-086*: Partner Branding (brand system)
- BC-007: Bildungssponsoring

## Notes
- Space Service International (Mittweida) is the first example partner
- Starfield decoration in hero section creates cosmic atmosphere for SSI
