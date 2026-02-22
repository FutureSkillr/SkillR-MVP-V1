# FR-030: Third-Party Skill Endorsement

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem

System-observed interactions (AI dialogue) provide medium-confidence evidence for competency claims. But real proof comes from real people — a teacher who watched a student lead a group, a Meister who assessed a crafted piece, an Azubibotschafter who observed genuine curiosity during a school visit.

The profile needs a mechanism for trusted third parties to "give the stamp" — to endorse specific skill claims with their identity and credibility attached.

## Solution

Build an endorsement system within the Multimodaler Erinnerungsraum (TC-009) that allows trusted people to validate learner competencies.

### Endorsement Flow

1. **Learner or system generates endorsement request**: "Ask [Herr Mueller, Werkstattleiter] to confirm your woodworking skill"
2. **Endorser receives a link** (email, QR code, or in-app if they have an account)
3. **Endorser sees**: Learner name, skill dimension, and optionally the relevant interaction evidence
4. **Endorser writes a brief statement** and selects confidence level
5. **Endorsement is stored** in the Erinnerungsraum, linked to the learner's profile
6. **Learner reviews and approves** the endorsement for their visible profile

### Endorser Types

| Type | Identity Verification | Endorsement Weight |
|---|---|---|
| **IHK-linked** (Azubibotschafter, Ausbilder, Pruefer) | Verified via IHK partnership | Highest |
| **School-linked** (Teacher, Berufsberater) | Verified via school pilot | High |
| **Company-linked** (Mentor, Werkstattleiter) | Verified via company profile (FR-022) | High |
| **Parent** | Verified via parent account (FR-025) | Medium |
| **Peer** | Linked via class/group | Low (supplementary) |

### External Artifact Upload

In addition to text endorsements, learners can upload artifacts:
- Photos of completed projects (woodworking, cooking, code)
- Documents (competition certificates, volunteer records)
- Links (GitHub repos, published articles, video demonstrations)

Artifacts can be endorsed by third parties: "I confirm this project was completed by [learner] to [standard]." An endorsed artifact carries the highest trust level.

## Acceptance Criteria

- [ ] A teacher can endorse a student's skill via a link (no account required for first endorsement)
- [ ] Endorsements appear in the learner's Erinnerungsraum with endorser identity
- [ ] Learner can choose which endorsements are visible in their profile
- [ ] Profile confidence score reflects the mix of evidence sources (AI-only vs. endorsed)
- [ ] An Azubibotschafter can endorse skills observed during a school visit
- [ ] Artifacts (photos, documents) can be uploaded and linked to skill dimensions
- [ ] An endorsed artifact (artifact + third-party validation) is marked as highest-trust evidence
- [ ] GDPR: endorser consents to data storage; learner consents to endorsement visibility

## Dependencies
- TC-009 (Multimodaler Erinnerungsraum — storage and conceptual framework)
- TC-007 (Portfolio Evidence Layer — evidence structuring)
- FR-008 (Skill Profile Generation — profile confidence scoring)
- FR-022 (Company Profile — company-linked endorsers)
- FR-025 (Eltern-Dashboard — parent-linked endorsers)
- BC-005 (Portfolio-Backed Skill Verification — verification model)

## Notes
- MVP scope: endorsement via link (no endorser account required). Endorser creates a minimal identity (name + email) to give the stamp.
- Phase 2: endorser accounts with persistent identity and endorsement history.
- The endorsement mechanism directly supports the IHK Dresden Azubibotschafter integration (proposal.md Part 9): after a school visit, the Azubibotschafter can endorse students they interacted with.
