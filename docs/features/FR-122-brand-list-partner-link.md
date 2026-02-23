# FR-122: Brand List — Partner Page Link

**Status:** in-progress
**Priority:** should
**Created:** 2026-02-23

## Problem
In the admin Brand list view, each partner row shows only "Bearbeiten" and "Deaktivieren" actions. There is no quick way to preview the partner's public-facing page (`?partner=slug`) from the admin panel.

## Solution
Add a "Partner-Seite" link to each brand row in the BrandConfigEditor list view. The link opens the partner preview page (`?partner=<slug>`) in a new tab.

## Acceptance Criteria
- [ ] Each brand row shows a "Partner-Seite" link between the brand info and the edit/deactivate actions
- [ ] Link opens `?partner=<slug>` in a new browser tab (`target="_blank"`)
- [ ] Link is only shown for active brands (inactive brands have no public page)
- [ ] Visual style matches existing action links (text-xs, subtle color)

## Dependencies
- FR-119: Partner Preview Page (provides the `?partner=slug` route)

## Notes
- Uses an external-link icon to signal "opens in new tab"
