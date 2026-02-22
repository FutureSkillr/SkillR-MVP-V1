# FR-025: Eltern-Dashboard

**Status:** draft
**Priority:** could
**Created:** 2026-02-17

## Problem
Parents are enablers of the youth journey but currently have no visibility into what their child does in the app. Without insight, parents may perceive the app as "just another screen time distraction" and withdraw support. The Checkliste.md requires: "Eltern koennen nachvollziehen, was ihr Kind gemacht hat."

## Solution
A dedicated parent view that shows aggregated journey progress without exposing private interaction details.

### Parent Dashboard Features
- **Interest Radar**: Cluster visualization of the child's emerging interest areas (e.g., "Natur", "Technik", "Kreatives") — derived from profile dimensions, not from raw conversations
- **VUCA Bingo Progress**: How far along is the journey? Which dimensions are explored?
- **Milestone Timeline**: Key events ("Erste Station in Shanghai besucht", "Dimension Complexity abgeschlossen")
- **Activity Summary**: "Dein Kind war diese Woche 3x aktiv, jeweils ca. 8 Minuten" — frequency and duration, not content
- **Interest Trend**: How interests evolve over time (month-over-month changes in interest clusters)

### Privacy Boundary
- Parent sees: interest clusters, VUCA progress, activity frequency, milestones
- Parent does NOT see: dialogue content, specific questions/answers, raw portfolio entries, timing data
- Student can optionally share specific portfolio entries with parent (explicit action)
- Privacy boundary is technical, not just policy — parent API endpoint physically cannot access interaction data

### Linking
- Student initiates parent link (generates invite code)
- Parent creates account and enters invite code
- One parent account can link to multiple children
- Student can revoke parent access at any time

## Acceptance Criteria
- [ ] Student can generate a parent invite code
- [ ] Parent can create account and link to child via invite code
- [ ] Parent dashboard shows interest radar, VUCA progress, milestones, activity summary
- [ ] Parent cannot access raw dialogue content or portfolio entries
- [ ] Student can optionally share specific portfolio entries
- [ ] Student can revoke parent link at any time
- [ ] Multi-child support for one parent account
- [ ] GDPR-compliant: parental consent required for under-16 data processing

## Dependencies
- FR-001 / FR-002 (Authentication — parent account creation)
- FR-003 (Firebase User Data — parent data model)
- FR-008 (Skill/Interest Profile — source for interest radar)
- FR-007 (VUCA Bingo — source for progress display)
- FR-027 (Rollenbasierte App-Ansichten — parent view)

## Notes
- Priority "could" because MVP can launch without parent view — but it's essential for institutional trust (IHK demo, school partnerships)
- The privacy boundary is a key differentiator: "Wir geben Eltern Einblick, nicht Kontrolle"
- Consider push notifications for milestones (opt-in)
