# DFR-001: App Icon Integration

**Status:** done
**Priority:** must
**Created:** 2026-02-22

## Problem
The SkillR brand team delivered a complete logo/icon set in `frontend/graphx-design/SKILLR Logo Set/` but none of these assets are used in the app. The current app uses a generic blue-gradient "S" letter SVG as app icon, an old `frontend/images/favicon.ico` PNG file, and no app icon/logo graphic on the Login/OAuth screen.

## Solution
Integrate the official SkillR App Icon into all icon/favicon touchpoints and the OAuth Login screen:
- Replace generic SVG icons with official SkillR PNG icons from the brand set
- Update favicon to official SkillR favicon
- Update PWA manifest to use official icons
- Add App Icon visual to the Login page

## Acceptance Criteria
- [ ] Official SkillR favicon shown in browser tab
- [ ] PWA manifest references official PNG icons (192x192, 512x512)
- [ ] Apple touch icon uses official asset
- [ ] Login/OAuth screen displays the App Icon above the heading
- [ ] Old generic SVG icons removed
- [ ] Old favicon.ico from `frontend/images/` removed

## Dependencies
- Brand assets in `frontend/graphx-design/SKILLR Logo Set/`
- DFR-002 (brand name consistency — title tag update)

## Notes
Assets copied to `frontend/public/icons/` and `frontend/public/favicon.ico` for serving.
