# FR-112: EU Co-Funding Notice

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-23
**Type:** CFR (Content Feature Request)

## Problem

The project is co-financed by the European Union under the programme "Zukunftsplattform fuer soziale Innovationen und Modellvorhaben". EU co-funding regulations require a visible co-funding notice and the official EU co-funded logo on all public-facing pages.

## Solution

Display the following text prominently on all landing pages:

> Das Projekt wird im Rahmen des Programms "Zukunftsplattform fuer soziale Innovationen und Modellvorhaben" mit einer Zuwendung in Hoehe von 95 % der zuwendungsfaehigen Ausgaben durch die Europaeische Union kofinanziert.

Additionally, display the official "Kofinanziert von der Europaeischen Union" logo (EU flag + text, NEG variant for dark backgrounds).

### Placement

1. **Top center bar** — Below the fixed navigation bar on the WelcomePage, visible on page load.
2. **Footer** — In both the WelcomePage footer and the LegalFooter component used across the app.

### Logo

- **Selected variant:** `Horizontal/PNG/DE Kofinanziert von der Europaeischen Union_NEG.png`
- **Rationale:** NEG variant provides the EU flag (blue + yellow stars) with white text, optimised for the dark background (#0f172a) used across the SkillR UI.
- **Deployed to:** `frontend/public/icons/eu-co-funded-neg.png`

## Acceptance Criteria

- [ ] Co-funding text is displayed below the top navigation on WelcomePage
- [ ] Co-funding text is displayed in the WelcomePage footer
- [ ] Co-funding text is displayed in the LegalFooter component (both full and compact variants)
- [ ] EU co-funded logo (NEG variant) accompanies the text in all placements
- [ ] Logo is readable and appropriately sized on both mobile and desktop
- [ ] Text and logo are centered
- [ ] Logo alt text is descriptive for accessibility

## Dependencies

- None

## Notes

- The co-funding percentage (95%) and programme name must appear exactly as specified.
- The NEG logo variant must be used on dark backgrounds; if a light-background page is added later, the POS variant should be used instead.
- This is a legal/compliance requirement, not a design choice — it must remain visible and unobscured.
