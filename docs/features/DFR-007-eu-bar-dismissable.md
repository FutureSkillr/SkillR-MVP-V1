# DFR-007: Dismissable EU Co-Funding Bar with Hover Reveal

**Status:** done
**Priority:** should
**Created:** 2026-02-23

## Problem
The EU co-funding notice bar at the top of the page takes up vertical space permanently. Users who have read it should be able to dismiss it. Additionally, the same EU info is duplicated in the footer, which is redundant when the top bar is visible.

## Solution
1. Add a small (x) dismiss button to the EU top bar.
2. When dismissed, the bar collapses to a thin hover-trigger strip. Hovering over it reveals the bar again temporarily.
3. When the top EU bar is visible (not dismissed), remove the EU info from the footer to avoid duplication.
4. The nav bar shifts up to `top-0` when the EU bar is dismissed.

## Design Details

### Dismiss button
- Small `x` icon, right-aligned inside the EU bar
- `text-slate-500 hover:text-white`, 20x20px, min touch target 44px
- Clicking sets `euBarDismissed = true`

### Collapsed state
- EU bar becomes a 4px tall strip at `top-0` (invisible but hoverable)
- On hover, the full bar slides back in (CSS transition, `max-height` or `translate`)
- Nav bar moves to `top-0` when collapsed, `top-[48px]` when expanded

### Footer logic
- The footer EU section is rendered only when `euBarDismissed === true` (fallback: always show somewhere)
- This ensures the EU notice is always visible in at least one location

## Acceptance Criteria
- [ ] EU bar has a visible (x) dismiss button
- [ ] Clicking (x) collapses the EU bar
- [ ] Nav bar shifts to top-0 when EU bar is dismissed
- [ ] Hovering near the top of the page reveals the EU bar again
- [ ] Footer EU section is hidden when top bar is visible (not dismissed)
- [ ] Footer EU section appears when top bar is dismissed
- [ ] EU notice is always accessible from at least one location on the page

## Dependencies
- DFR-006: Header bar order flip
- FR-112: EU Co-Funding Notice
