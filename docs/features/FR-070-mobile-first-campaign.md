# FR-070: Mobile-First Campaign UI Redesign

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-20
**Entity:** maindset.ACADEMY

## Problem

The current UI was designed desktop-first and is only ~75% responsive. The target audience (14+ youth) primarily uses smartphones for web browsing. Key issues include undersized touch targets, horizontal overflow on narrow viewports, iOS zoom on input focus, and missing safe-area inset support for notched devices. Without a mobile-first approach, the product fails to meet its core audience where they actually are.

## Solution

Perform a comprehensive mobile-first responsive redesign:

- **Tailwind CDN to npm migration** — Replace the CDN-loaded Tailwind with a proper npm install and build-time compilation for tree-shaking and custom configuration.
- **Mobile-first responsive redesign** — Rewrite all component styles starting from the smallest breakpoint (375px) and scaling up, rather than the current desktop-down approach.
- **PWA manifest** — Add a `manifest.json` with app name, icons, theme color, and display mode to enable "Add to Home Screen" on mobile browsers.
- **Touch target sizing** — Ensure all interactive elements (buttons, links, inputs) meet the minimum 44x44px touch target guideline.
- **Safe-area insets** — Apply `env(safe-area-inset-*)` CSS for proper rendering on iPhone X+ and other notched devices.
- **iOS zoom prevention** — Set all input font sizes to >= 16px to prevent automatic zoom on focus in iOS Safari.
- **Thumb-zone navigation** — Position primary navigation and coach selection within the natural thumb reach zone at the bottom of the screen.
- **Small-screen chart optimization** — Ensure the profile radar chart (FR-009) remains readable and interactive on screens as small as 375px wide.

## Acceptance Criteria

- [ ] All touch targets are >= 44x44px on every interactive element
- [ ] No horizontal scroll at 375px viewport width
- [ ] Chat input does not zoom on iOS (font-size >= 16px on all inputs)
- [ ] Safe-area insets work correctly on iPhone X+ (no content hidden behind notch or home indicator)
- [ ] PWA "Add to Home Screen" works on iOS Safari and Android Chrome
- [ ] Voice input (FR-011) works on mobile browsers
- [ ] Coach selection page supports thumb-only navigation
- [ ] Profile radar chart is readable on small screens (375px width)
- [ ] Tailwind is installed via npm with build-time compilation (no CDN)

## Device Test Matrix

| Device            | Screen Width | OS          | Notes                        |
|-------------------|-------------|-------------|------------------------------|
| iPhone SE         | 375px       | iOS         | Minimum supported width      |
| iPhone 12/14      | 390px       | iOS         | Notch + safe-area insets     |
| Samsung Galaxy A  | 360–412px   | Android     | Most common budget Android   |
| iPad Mini         | 768px       | iPadOS      | Tablet breakpoint threshold  |

## Dependencies

- FR-005 (Gemini Dialogue Engine) — Chat UI must be mobile-optimized
- FR-009 (Profile Visualization) — Radar chart must be responsive
- FR-011 (Text/Voice Mode) — Voice input must work on mobile
- FR-048 (Journey Progress Cards) — Cards must be touch-friendly

## Notes

The 14+ target demographic in Germany has a smartphone penetration rate above 95%. Desktop usage among this age group is secondary, primarily for school-related tasks. The mobile experience is not an afterthought — it is the primary experience.
