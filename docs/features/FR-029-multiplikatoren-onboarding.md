# FR-029: Multiplikatoren-Onboarding

**Status:** draft
**Priority:** could
**Created:** 2026-02-17

## Problem
Future Skiller reaches youth through multipliers (teachers, Arbeitsamt counselors, chamber representatives, parents). Each multiplier type has different technical comfort levels and different contexts where they introduce the app. Without dedicated onboarding flows and distribution tools, multipliers won't adopt the platform because it's too complex to explain or distribute.

## Solution
Role-specific onboarding flows and distribution tools for each multiplier type.

### Distribution Tools

#### QR-Code Cards (Physical)
- Multiplier generates a personalized QR code through their dashboard
- QR code links to the app with the multiplier's referral ID embedded
- Physical cards can be printed (template provided) for events: Tag der Ausbildung, school visits, counseling sessions
- "Der 50-jaehrige Berater vom Arbeitsamt mit diesen Kaertchen" — familiar, low-tech, effective

#### Referral Links (Digital)
- Unique referral URL per multiplier for digital sharing
- Embeddable in emails, school websites, institutional newsletters
- Tracks conversion: how many students signed up through this multiplier?

#### Class/Group Codes
- A teacher generates a class code (e.g., "9B-GYMNASIUM-DD")
- Students enter the code at signup to be associated with the class
- Teacher can see aggregate class progress (not individual data)
- Useful for Ganztagsangebote, Berufsorientierungswoche, IT-Unterricht

### Onboarding Flows by Multiplier Type

#### Arbeitsamt Counselor
1. Create account as "Wegweiser"
2. Select "Berufsberatung" role
3. Receive QR-code card template (PDF, printable)
4. Brief tutorial: "So stellen Sie Future Skiller Ihren Klienten vor"
5. Dashboard: see how many referrals activated, aggregate interest trends

#### Teacher
1. Create account as "Wegweiser"
2. Select "Lehrkraft" role
3. Create class code
4. Brief tutorial: "So nutzen Sie Future Skiller im Unterricht"
5. Dashboard: class progress (aggregate), VUCA dimension coverage

#### Chamber Representative
1. Create account as "Wegweiser" (links to FR-021)
2. Full chamber dashboard with landscape management
3. Generate event-specific QR codes for Tag der Ausbildung etc.
4. Aggregate analytics across all referred students

#### Parent (as multiplier to other parents)
1. Already has parent account (FR-025)
2. "Empfehlen" button generates a shareable referral link
3. Reward: none needed — the value is social ("Mein Kind macht was Sinnvolles")

## Acceptance Criteria
- [ ] QR-code generation available for all multiplier roles
- [ ] QR codes link to app with referral tracking
- [ ] Printable card template (PDF) available for download
- [ ] Class/group code generation for teachers
- [ ] Referral link generation for digital sharing
- [ ] Referral tracking dashboard: activations per multiplier
- [ ] Role-specific onboarding tutorials (2-3 minute walkthroughs)
- [ ] Works without technical knowledge ("der 50-jaehrige Berater")

## Dependencies
- FR-001, FR-002 (Authentication — multiplier account creation)
- FR-021 (Chamber Dashboard — chamber multiplier interface)
- FR-025 (Eltern-Dashboard — parent multiplier interface)
- FR-027 (Rollenbasierte App-Ansichten — multiplier views)
- BC-008 (Multiplikatoren-Netzwerk — strategy)

## Notes
- Priority "could" because MVP can launch with direct signup — but multiplier-driven acquisition is the primary growth channel
- The QR-code card is deliberately low-tech: it works in contexts where digital tools don't (school hallway, Arbeitsamt waiting room, Ausbildungsmesse)
- Track multiplier effectiveness per type to optimize go-to-market strategy
