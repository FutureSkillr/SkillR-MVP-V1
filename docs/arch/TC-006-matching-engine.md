# TC-006: Matching Engine

**Status:** draft
**Created:** 2026-02-17

## Context
The platform must connect students with opportunities (apprenticeships, companies, perspectives). Matching operates at two distinct levels with different data sources and confidence levels. The engine must respect consent — students control their visibility.

## Decision
Implement a two-level matching engine in the Go backend:

### Level 1: Intention/Interest Matching
- **Input:** Student interest profile (from VUCA journey)
- **Against:** Company Moeglichkeitsraum descriptions, apprenticeship categories, chamber data
- **Confidence:** Lower — based on expressed interest, not demonstrated capability
- **Available:** Early in the journey (after initial interest profile forms)
- **Use case:** "You're interested in X — here are companies and paths in that space"

### Level 2: Verified Skill Matching
- **Input:** Portfolio-backed skill profile (evidenced dimensions)
- **Against:** Company skill requirements, position profiles
- **Confidence:** Higher — based on demonstrated capability with evidence trail
- **Available:** After sufficient journey depth (Stage 3 in transformation model)
- **Use case:** "You've demonstrated skills in X — here are positions that need exactly that"

## Key Requirements
- Both match levels produce results; UI distinguishes between interest matches and skill matches
- Student opts in to matching (no default visibility)
- Student controls which matches to pursue (consent per interaction)
- Companies see match quality score (not raw profile data) until student consents
- Chamber can see aggregate match statistics (anonymized)
- Gegensatzsuche is a matching parameter: also surface "opposite" opportunities

## Consequences
- Two matching algorithms with different data pipelines
- Consent management adds complexity to the data flow
- Match quality depends on both student profile depth and company profile quality
- Cold start: matching value is low until both sides have sufficient profiles

## Alternatives Considered
- Single matching level: simpler but conflates interest and capability
- External matching service (LinkedIn API, etc.): loses control over the evidence chain
- Manual matching by chambers: doesn't scale, defeats the purpose

## Related
- US-011 (Matching on intention/interest and verified skills)
- BC-003 (Chamber visibility and regional matching)
- BC-004 (Company responsibility model)
- FR-008 (Skill profile generation)
