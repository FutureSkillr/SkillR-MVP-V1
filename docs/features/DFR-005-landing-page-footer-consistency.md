# DFR-005: Landing Page App Icon & Reusable Legal Footer

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem

The WelcomePage links to stakeholder-specific landing pages at `/landing/{kids,parents,companies,...}.html`. These landing pages currently:

1. **Missing App Icon** — do not display the official SkillR App Icon (`/icons/app-icon.png`) that the main WelcomePage shows (see DFR-001, DFR-003).
2. **Missing legal footer** — do not include the Impressum, Datenschutz, and Cookie-Einstellungen links that the WelcomePage provides via `LegalFooter`. German law (TMG §5, DSGVO Art. 12) requires these links on every publicly accessible page.
3. **Footer not reusable** — the `LegalFooter` component is a React component. Landing pages served as static HTML cannot consume it directly. A shared, framework-agnostic footer snippet is needed.

Additionally, the `Layout` component (used for logged-in views) has a minimal placeholder footer (`SkillR — Bist Du ein SkillR?`) that does not include legal links. It should also use `LegalFooter`.

## Solution

### 1. Reusable footer HTML partial

Create a static HTML partial that can be included in any page — React-rendered or static HTML landing pages.

**File:** `frontend/public/includes/legal-footer.html` — Create
- Contains the same Impressum / Datenschutz / Cookie-Einstellungen links
- Styled with inline CSS or shared utility classes so it works standalone
- Includes the SkillR App Icon and copyright line
- Can be `<iframe>`-embedded or server-side included into landing pages

### 2. Landing pages: add App Icon and footer

Each landing page in `frontend/public/landing/` (or wherever they are generated):
- Add `<img src="/icons/app-icon.png" alt="SkillR" width="40">` in the header/nav
- Include the shared legal footer at the bottom
- Ensure favicon also uses the official app icon

### 3. Layout footer: integrate LegalFooter

**File:** `frontend/components/Layout.tsx` — Edit
- Replace the placeholder footer (`SkillR — Bist Du ein SkillR?`) with `<LegalFooter variant="compact" />`
- This ensures logged-in views also show Impressum/Datenschutz/Cookie links

## Acceptance Criteria

- [ ] A reusable legal footer partial exists at `frontend/public/includes/legal-footer.html`
- [ ] All landing pages display the official SkillR App Icon in the header
- [ ] All landing pages include the legal footer with Impressum, Datenschutz, and Cookie-Einstellungen links
- [ ] The `Layout` component footer shows `LegalFooter` instead of the placeholder text
- [ ] Footer links open the correct pages (Impressum, Datenschutz) or trigger the Cookie modal
- [ ] Footer renders correctly on mobile (min 44px touch targets, safe-area insets)
- [ ] TMG §5 compliance: Impressum reachable from every publicly accessible page

## Dependencies

- DFR-001 (App Icon assets)
- DFR-003 (App Icon in navigation)
- FR-066 (Cookie consent & legal footer)

## Notes

- The `LegalFooter` component already supports `variant="full"` and `variant="compact"`. Landing pages should use the full variant; the Layout can use compact.
- If landing pages are generated/templated (not hand-written HTML), the footer should be injected during the build step.
- The cookie settings link in static HTML pages may need a lightweight JS snippet to open the modal, or it can link to the main app's cookie settings route.
