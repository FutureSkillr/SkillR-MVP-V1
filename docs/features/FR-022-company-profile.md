# FR-022: Company Moeglichkeitsraum Profile (Backend)

**Status:** draft
**Priority:** could
**Created:** 2026-02-17

## Scope
Backend service for companies to create and manage their Moeglichkeitsraum profile — describing career paths, growth opportunities, learning culture, and open positions. The profile is structured data that feeds into the matching engine and Job-Navigator. Companies must articulate perspectives, not just post listings.

## Intent
Flip the hiring dynamic. Companies that invest in describing their world attract better matches. The structured profile ensures machine-readability for matching while encouraging human-readable depth for students browsing the Moeglichkeitsraum.

## Non-Standard Positions (Novel Berufsbilder)

Companies must be able to register positions that do not yet exist in the standard IHK/HWK catalog. From the transcript (line 392): *"eine Industrie muss in der Lage sein, einen neuen Bedarf, den es bei der IHK noch gar nicht gibt, einspielen zu koennen."*

This is critical because:
- The labor market evolves faster than the official Ausbildungsberufe catalog
- Companies at the intersection of fields (e.g., mechatronics + AI, sustainability + logistics) need to describe novel roles
- Students exploring cutting-edge interests should discover these possibilities, not only traditional catalog entries

### Implementation
- Company profile includes a "Neue Berufsbilder" section for non-catalog positions
- Each novel position requires: title, description, required skill dimensions, link to existing Ausbildungsberufe (closest match), and a free-text "Warum gibt es diesen Beruf?" explanation
- Novel positions are flagged in the Moeglichkeitsraum as "Zukunftsberuf" to distinguish from established catalog entries
- Chamber dashboard (FR-021) shows aggregate demand for novel positions — this feeds back into the IHK's own catalog evolution process
- The matching engine (TC-006) treats novel positions equally to catalog positions for interest-based matching

## Dependencies
- TC-006 (Matching engine)
- BC-004 (Company responsibility model)
- US-008 (Company Moeglichkeitsraum user story)
- FR-018 (Job-Navigator engine)
- FR-021 (Chamber Dashboard — novel position analytics)
- FR-023 (Bedarfserfassung — demand signals for non-catalog roles)
