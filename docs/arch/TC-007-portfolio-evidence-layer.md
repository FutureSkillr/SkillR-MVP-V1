# TC-007: Portfolio Evidence Layer

**Status:** draft
**Created:** 2026-02-17

## Context
The skill profile must be more than a self-assessment. Every skill dimension requires traceable evidence — a reference to the interaction record that supports the claim. This evidence layer transforms the profile from "I think I'm good at X" into "the system observed X in interactions Y and Z."

## Decision
Build a portfolio evidence layer on top of the multimodal storage layer (TC-004). Portfolio entries are curated subsets of interaction records that are tagged as evidence for specific skill dimensions. The evidence chain is: **Profile → Skill Dimension → Portfolio Entries → Raw Interactions**.

## Key Requirements
- Portfolio entries are derived from multimodal interaction records (TC-004)
- Each entry is tagged with: skill dimension(s) it evidences, confidence score, interaction context
- Entries are immutable once created (append-only — corrections add new entries, not modify old ones)
- The evidence chain is auditable end-to-end
- Student can view their portfolio: "Here's why the system says I have skill X"
- With consent, third parties can verify the evidence chain
- Portfolio grows automatically from journey interactions — no manual upload required

## Data Model (Draft)
```
portfolio_entry {
  id: string
  user_id: string
  created_at: datetime
  source_interactions: [interaction_id, ...]  // refs to TC-004
  skill_dimensions: map<string, float>        // what this evidences
  evidence_type: "dialogue" | "reflection" | "choice_pattern" | "timing_signal"
  summary: string                              // human-readable evidence summary
  confidence: float                            // 0.0–1.0
  context: {
    journey_stage: "interest" | "orientation" | "skills"
    vuca_dimensions: ["V" | "U" | "C" | "A"]
    interest_topic: string
  }
}
```

## Consequences
- Storage overhead: portfolio entries are additional Firestore documents alongside raw interactions
- Confidence scoring requires careful calibration (avoid inflated or deflated scores)
- Immutability means storage grows monotonically — need retention/archival strategy long-term
- Privacy: portfolio entries are personal data — GDPR applies

## Alternatives Considered
- No evidence layer (profile as opaque score): simpler but not verifiable
- Manual portfolio upload (like LinkedIn): high friction, defeats the "learning IS documenting" principle
- Blockchain-based evidence: technically interesting but over-engineered for MVP

## Related
- US-010 (Portfolio-backed skill verification)
- BC-005 (Portfolio-backed skill verification concept)
- TC-004 (Multimodal storage layer)
- DC-005 (Interest-Orientation-Skills transformation)
