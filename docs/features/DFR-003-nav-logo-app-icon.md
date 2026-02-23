# DFR-003: Use Official App Icon in Navigation and Footer

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem
The WelcomePage nav bar and footer display a gradient-colored "S" letter as a placeholder logo. The Layout header (used for logged-in views) shows only text "SkillR" with no icon. The official SkillR App Icon (`/icons/app-icon.png`) is available but only used for favicon/PWA (DFR-001), not for in-app branding.

## Solution
Replace all "S" text placeholder logos with the official SkillR App Icon image:
- WelcomePage: nav bar logo (top-left)
- WelcomePage: footer logo (bottom-left)
- Layout: header logo (top-left, logged-in views)

Merch product mockups (mug "S", cap "SR", hoodie "S") are decorative illustrations and remain unchanged.

## Acceptance Criteria
- [x] WelcomePage nav bar shows `<img src="/icons/app-icon.png">` instead of gradient "S" div
- [x] WelcomePage footer shows `<img src="/icons/app-icon.png">` instead of gradient "S" div
- [x] Layout header shows app icon before "SkillR" text
- [ ] Icon renders correctly at 40px (nav), 32px (footer), and 28px (layout header)
- [ ] Alt text set to "SkillR" for accessibility

## Dependencies
- DFR-001 (app icon assets already in `frontend/public/icons/`)

## Notes
The app icon is a rounded square with the SkillR "S" mark on white background. It renders well at small sizes due to its simple, high-contrast design.
