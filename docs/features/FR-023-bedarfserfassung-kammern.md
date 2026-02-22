# FR-023: Bedarfserfassung der Kammern (Chamber Demand Signal Capture)

**Status:** draft
**Priority:** could
**Created:** 2026-02-17

## Problem
Chambers (IHK, Handwerkskammer) can currently show what apprenticeships exist (FR-021), but they cannot express what they **need**. The matching engine (TC-006) lacks demand signals — it knows what students are interested in but not where the actual gaps and opportunities are from the employer side. Without demand data, matching is one-directional.

"Wir nehmen die Bedarfe auf" — capturing demand is the other half of the matching equation.

## Solution
A demand signal capture system where chamber representatives can:
- Specify apprenticeship categories with current demand levels (high/medium/low)
- Tag demand by region (Einzugsbereich der Kammer)
- Indicate urgency and seasonal patterns (e.g., Ausbildungsstart September)
- Link demand entries to specific member companies (who must have a Moeglichkeitsraum profile per FR-022)

Demand signals feed into the matching engine (TC-006) as a weighting factor: when a student's interest profile aligns with high-demand areas, the match is surfaced with higher relevance — but always transparently and with student consent.

## Acceptance Criteria
- [ ] Chamber representatives can create and update demand entries per apprenticeship category and region
- [ ] Demand entries have structured fields: category, region, demand level, urgency, linked companies
- [ ] The matching engine (TC-006) consumes demand signals as a matching parameter
- [ ] Demand data is visible to chambers in aggregate on their dashboard (FR-021)
- [ ] Students never see raw demand data — it influences match ranking transparently
- [ ] Companies linked to demand entries must have an active Moeglichkeitsraum profile (FR-022)

## Dependencies
- FR-021 (Chamber Dashboard — UI surface for demand management)
- FR-022 (Company Moeglichkeitsraum Profile — companies must participate)
- TC-006 (Matching Engine — consumes demand signals)
- BC-003 (Chamber Visibility and Regional Matching — business model)
- BC-004 (Company Responsibility Model — companies must invest to be matched)

## Notes
- Demand signals are not visible to students directly — they influence match quality, not match existence
- This enables the "Firmen in die Verantwortung nehmen" principle: companies that don't maintain their Moeglichkeitsraum profile won't appear in demand-linked matches even if the chamber registers demand for their category
- Consider periodic demand data refresh cycles (quarterly?) to keep signals current
