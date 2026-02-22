# US-010: Portfolio-Backed Skill Verification

**Created:** 2026-02-17

## User Story
As a **student**, I want my **skill profile to reference specific portfolio entries as evidence** so that **every skill claim is traceable to a real interaction, reflection, or demonstrated understanding — not just a self-assessment**.

## Context
A skill profile without evidence is just a list of words. Future Skiller builds the profile differently: every skill dimension links back to the portfolio entries that justify it. A portfolio entry is a record of a meaningful interaction — a dialogue where the student demonstrated understanding, a reflection where they showed analytical depth, a choice pattern that reveals genuine engagement.

When someone looks at the profile and asks "why does it say 'analytical thinking'?", the answer is a reference to specific portfolio entries: "In dialogue X about forest ecosystems, the student connected three domains unprompted. In reflection Y, response timing and depth indicated sustained analytical engagement."

This evidence chain is what makes the profile credible — and eventually certifiable. It's not what the student claims. It's what the system observed, backed by data.

## Acceptance Indicators
- Every skill dimension in the profile links to supporting portfolio entries
- Portfolio entries are immutable records of interactions (from the multimodal storage layer)
- Evidence chain is auditable: profile → skill → portfolio entry → raw interaction
- Student can view their portfolio and understand why each skill appears
- Third parties (with consent) can verify the evidence chain

## Related
- BC-005 (Portfolio-backed skill verification)
- TC-004 (Multimodal storage layer — source of portfolio entries)
- FR-008 (Skill profile generation)
- FR-019 (Multimodal storage layer)
- US-009 (Interest-to-skill transformation)
