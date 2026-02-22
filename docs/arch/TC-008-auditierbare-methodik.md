# TC-008: Auditierbare Methodik (Auditable Profiling Methodology)

**Status:** draft
**Created:** 2026-02-17

## Context
The transcript contains an extensive discussion (lines 92-116) about getting Future Skiller's profiling methodology certified by an external authority (TUeV, ISO). The key insight: we don't certify the individual profile — we certify the METHOD by which profiles are created.

Analogy from the transcript: "Wir lassen uns als Firma von der ISO-Zertifizierung, von TUeV, lassen wir uns dahingehend zertifizieren, dass wir klar dokumentieren, wie wir die Berechnung machen." — Just as Econytik had their CO2 calculation methodology certified, Future Skiller would have its profiling methodology certified.

This requires building the entire system with auditability in mind from day one — even if the actual certification is post-MVP.

## Decision
The profiling pipeline must be designed so that every step from raw interaction to profile dimension is **traceable, reproducible, and documentable**:

### Evidence Chain (must be auditable)
```
Raw Interaction → Storage (TC-004) → Portfolio Entry (TC-007) → Skill Dimension → Profile Score
```

At each step, the system must record:
1. **What data was used** — which interactions contributed to which profile dimension
2. **How it was weighted** — what algorithm/heuristic determined the weight
3. **When it was computed** — timestamp of every profile update
4. **What version of the methodology** — versioned rules/algorithms

### Methodology Documentation
The profiling methodology must be formally documented as a "Methodikhandbuch" covering:
- Input taxonomy: what types of interactions exist, how they're categorized
- Dimension mapping: how interactions map to profile dimensions (Hard Skills, Soft Skills, Future Skills, Resilience)
- Weighting rules: how interaction quality, quantity, timing, and depth influence scores
- Confidence scoring: how the system expresses certainty about each dimension
- Bias mitigation: how the Gegensatzsuche and Potpourri principle prevent feedback loops

### Audit Interface (post-MVP)
- An auditor (TUeV, ISO) can trace any profile score back to its source interactions
- The methodology version is pinned to each profile computation
- Changes to the methodology are version-controlled and documented

## Consequences
- **Pro**: Builds trust with institutions (IHK, employers, parents). Differentiates from competitors who "just ask ChatGPT." Enables eventual formal certification.
- **Pro**: Forces disciplined engineering of the profiling pipeline from the start.
- **Con**: Additional complexity in data storage (full audit trail).
- **Con**: Methodology documentation is ongoing work — must evolve as the system learns.
- **Con**: TUeV/ISO certification costs significant time and money (post-MVP).

## Alternatives Considered
- **Skip auditability**: Faster development, but permanently locks us out of institutional trust. Rejected.
- **Third-party certification from day one**: Too expensive and slow for MVP. We build FOR auditability now, CERTIFY later.
- **Self-certification only**: Possible as intermediate step ("Skiller-validated"), but insufficient for IHK partnerships long-term.

## Implementation Notes
- TC-004 (Multimodal Storage) already stores raw interactions — extend with audit metadata
- TC-007 (Portfolio Evidence Layer) already defines evidence chains — formalize as audit trail
- Every profile update must be a versioned event, not an in-place mutation
- The Methodikhandbuch can be a living document in `docs/arch/` initially

## Related
- TC-004 (Multimodal Storage Layer — raw data source)
- TC-007 (Portfolio Evidence Layer — evidence chain)
- BC-005 (Portfolio-Backed Skill Verification — business rationale)
- FR-008 (Skill/Interest Profile Generation — the pipeline to audit)
- FR-014 (Interest Profile Tracking Backend — implementation target)
- DC-004 (Level 2 Reflection — capability signals must be auditable too)
