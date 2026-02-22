# FR-027: Rollenbasierte App-Ansichten (Role-Based App Views)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Problem
Future Skiller serves four distinct target groups (students, parents, chambers, companies), each with fundamentally different needs and interactions. A single UI cannot serve all roles. Without role-specific views, the app either overwhelms students with institutional features or underwhelms institutional partners with a youth-focused interface.

## Solution
Implement role-based views where each target group sees a dedicated interface tailored to their role in the VUCA-Ökosystem (DC-008).

### View: Entdecker (Student)
- **Primary interface**: The VUCA journey
- Features: Dialogue with AI Reisebegleiter, VUCA bingo, profile visualization, Reisetagebuch
- Tone: Warm, exploratory, gamified, age-appropriate
- NO institutional elements visible (no dashboard, no analytics, no matching controls)
- This IS the app for the student — everything else is invisible infrastructure

### View: Motivator (Parent)
- **Primary interface**: Progress dashboard
- Features: Interest radar, VUCA progress, milestone timeline, activity summary
- Tone: Reassuring, informative, concise
- Privacy boundary: sees aggregated data only, not raw interactions
- Links to child's profile via invite code (FR-025)

### View: Wegweiser (Chamber / Jobagentur)
- **Primary interface**: Landscape management dashboard
- Features: Apprenticeship catalog management, demand signal entry (FR-023), aggregate analytics, match activity overview
- Tone: Professional, data-oriented
- Can manage multiple companies within their Einzugsbereich
- Anonymized student interest trends visible at aggregate level

### View: Mentor/Sponsor (Company)
- **Primary interface**: Company profile and content management
- Features: Moeglichkeitsraum profile editor (FR-022), sponsored content management (FR-028), match notifications
- Tone: Professional, outcome-oriented
- Can see anonymized interest statistics for their industry domain
- Match interactions are consent-gated by the student

### Shared Elements
- Authentication (FR-001, FR-002) with role selection at signup
- Role is set at account creation, cannot be changed without admin action
- API endpoints are role-scoped — a parent token cannot access student raw data, period
- All views share the same design language but with role-appropriate coloring/layout

## Acceptance Criteria
- [ ] Role selection at signup: "Ich bin Schueler / Elternteil / Kammer / Unternehmen"
- [ ] Each role sees only their dedicated view after login
- [ ] Student view contains no institutional elements
- [ ] Parent view cannot access raw interaction data (enforced at API level)
- [ ] Chamber view shows aggregate analytics and landscape management
- [ ] Company view shows profile editor and match notifications
- [ ] All views work on mobile browsers
- [ ] Role-scoped API authorization prevents cross-role data access

## Dependencies
- FR-001, FR-002 (Authentication — role-aware account creation)
- FR-003 (Firebase — role-specific data model)
- FR-021 (Chamber Dashboard — Wegweiser view content)
- FR-022 (Company Profile — Mentor view content)
- FR-025 (Eltern-Dashboard — Motivator view content)
- DC-008 (Rollenbasiertes VUCA-Ökosystem — conceptual foundation)

## Notes
- MVP can launch with Student view only and add other views incrementally
- The Student view is the core product; other views are enablers/supporters
- Consider a "demo mode" for each role that shows how matching would work (for IHK presentations)
