# TC-009: Multimodaler Erinnerungsraum (Multimodal Memory Space)

**Status:** draft
**Created:** 2026-02-18

## Context

TC-004 defines the Multimodal Storage Layer — the technical schema for storing interactions. But the storage layer is an infrastructure decision. The **Erinnerungsraum** is the conceptual layer above it: the system's MEMORY of everything a learner has done, experienced, and demonstrated.

The Erinnerungsraum is not a database. It is the learner's accumulated digital memory — every interaction, every choice, every moment of reflection, captured and linked into a coherent narrative of growth.

The name "Erinnerungsraum" (memory space) is deliberate. This is not a "log" or a "record." It is the space where the system REMEMBERS the learner — and where the learner can look back and see their own journey.

## Decision

Build the Erinnerungsraum as a conceptual layer on top of the multimodal storage (TC-004) and portfolio evidence (TC-007) layers. The Erinnerungsraum adds:

1. **Narrative coherence**: Interactions are not just stored — they are linked into a story. "First you explored coffee in Rome, then you discovered supply chains, then you solved a logistics problem in Hamburg — and that's how you developed your understanding of Complexity."

2. **Intent tracking**: Every interaction is linked to the Smart Kurs target matrix (DC-009) that motivated it. The Erinnerungsraum knows not just WHAT happened, but WHY — what learning objective was being pursued.

3. **Multi-source evidence aggregation**: The Erinnerungsraum collects evidence from THREE sources:
   - **System-observed interactions** (AI dialogue, choices, timing — from TC-004)
   - **Third-party endorsements** (trusted people who "give the stamp" — teachers, mentors, Azubibotschafter)
   - **External artifacts** (uploaded documents, project photos, certificates from other institutions, competition results)

4. **Competency derivation**: The profile (FR-008) is not a separate calculation — it is a VIEW onto the Erinnerungsraum. The profile shows the aggregate; the Erinnerungsraum holds the evidence.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           MULTIMODALER ERINNERUNGSRAUM           │
│                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │   System-     │ │  Third-Party │ │  External │ │
│  │   Observed    │ │  Endorsements│ │  Artifacts│ │
│  │   Interactions│ │              │ │           │ │
│  │              │ │  Teacher says │ │  Uploaded  │ │
│  │  AI dialogue │ │  "demonstrated│ │  projects, │ │
│  │  Choices     │ │   leadership" │ │  photos,   │ │
│  │  Timing      │ │              │ │  documents │ │
│  │  Reflections │ │  Mentor says  │ │           │ │
│  │              │ │  "creative    │ │  External  │ │
│  │  (TC-004)    │ │   thinker"   │ │  certs     │ │
│  └──────┬───────┘ └──────┬───────┘ └─────┬─────┘ │
│         │                │               │       │
│         └────────────┬───┘───────────────┘       │
│                      │                            │
│         ┌────────────▼──────────────┐             │
│         │   Portfolio Evidence Layer │             │
│         │   (TC-007)                │             │
│         │                           │             │
│         │   Links evidence to       │             │
│         │   skill dimensions        │             │
│         └────────────┬──────────────┘             │
│                      │                            │
│         ┌────────────▼──────────────┐             │
│         │   Skill/Interest Profile  │             │
│         │   (FR-008)                │             │
│         │                           │             │
│         │   The VIEW onto the       │             │
│         │   Erinnerungsraum         │             │
│         └───────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

## Evidence Sources and Trust Levels

Not all evidence is equal. The Erinnerungsraum assigns trust levels:

| Source | Trust Level | Example | Verification |
|---|---|---|---|
| **System-observed (AI)** | Medium | "Learner demonstrated analytical thinking in 12 interactions" | Auditable via TC-008, but machine-assessed |
| **Third-party endorsement** | High | "Teacher confirms: student led the group project" | Human-verified, identity-confirmed endorser |
| **External artifact** | Variable | "Photo of completed woodworking project" | Depends on artifact type and provenance |
| **Endorsed artifact** | Highest | "Meister Holz confirms: this joint was crafted to professional standard" | Artifact + expert endorsement combined |

The profile confidence score (TC-007) reflects the mix of evidence sources. A profile backed by multiple third-party endorsements is more credible than one backed only by AI-observed interactions.

## Third-Party Endorsement Model

"Real proof for competencies comes from third-party proofed artifacts, from people which are trusted and give the stamp."

### Who Can Endorse

| Endorser Role | How They Enter | What They Can Endorse |
|---|---|---|
| **Teacher** | Invited by school via IHK pilot | Classroom behavior, project outcomes, subject knowledge |
| **Azubibotschafter** | Linked through IHK program | Practical skills observed during school visit or workshop |
| **Mentor (company)** | Through company profile (FR-022) | Domain expertise, work ethic, specific technical skills |
| **Parent** | Linked via parent account (FR-025) | Life skills, self-organization, sustained commitment |
| **Peer** | Through class/group features (future) | Collaboration, creativity, communication |

### Endorsement Mechanism

1. Endorser receives an invitation (link or QR code)
2. Endorser sees: the learner's name + the skill dimension to endorse
3. Endorser writes a brief statement: "I observed [learner] demonstrate [skill] in [context]"
4. Endorser optionally uploads evidence (photo, document)
5. Endorsement is stored in the Erinnerungsraum with endorser identity
6. Learner sees the endorsement and can choose to include it in their visible profile

### The "Stamp" Metaphor

In the Wanderschaft tradition, a journeyman collected stamps in their Wanderbuch from masters at each workshop. Each stamp was a trusted endorsement: "This person worked here and demonstrated skill."

The Erinnerungsraum digitizes this. Each endorsement is a "stamp" from a trusted person. The more stamps, the more credible the profile. But unlike a Wanderbuch, the stamps are linked to specific evidence — not just "was here" but "demonstrated X with evidence Y."

## Data Model Extension (on top of TC-004 and TC-007)

```
endorsement {
  id: string
  learner_id: string
  endorser_id: string
  endorser_role: "teacher" | "mentor" | "azubibotschafter" | "parent" | "peer"
  endorser_verified: boolean  // identity confirmed
  created_at: datetime
  skill_dimensions: map<string, float>
  statement: string           // "I observed..."
  context: string             // where/when observed
  artifact_refs: [string]     // optional attached evidence
  linked_interactions: [interaction_id]  // optional link to system-observed data
}

external_artifact {
  id: string
  learner_id: string
  uploaded_at: datetime
  artifact_type: "photo" | "document" | "video" | "link"
  description: string
  skill_dimensions: map<string, float>
  endorsements: [endorsement_id]  // third-party validations of this artifact
  storage_ref: string             // Firebase Storage reference
}
```

## Consequences

- The Erinnerungsraum is the SINGLE SOURCE OF TRUTH for all competency claims
- TC-004 (storage layer) becomes one INPUT to the Erinnerungsraum, not the whole picture
- TC-007 (portfolio evidence) becomes the STRUCTURING layer within the Erinnerungsraum
- Third-party endorsements add a social/trust dimension that pure AI observation cannot provide
- External artifacts make the portfolio tangible — not just "the system says" but "here's the proof"
- GDPR implications: endorser data + artifact data require additional consent flows
- Storage costs increase with artifacts (photos, documents) — Firebase Storage pricing applies

## Relationship to Existing Architecture

| Component | Role in Erinnerungsraum |
|---|---|
| TC-004 (Multimodal Storage) | Captures system-observed interactions (input) |
| TC-007 (Portfolio Evidence) | Structures evidence into skill claims (structuring) |
| TC-008 (Auditierbare Methodik) | Ensures the derivation chain is auditable (quality) |
| TC-009 (this document) | The conceptual whole — all evidence, all sources, one memory (integration) |
| FR-008 (Profile Generation) | Computes the profile as a view onto the Erinnerungsraum (output) |
| DC-009 (Smart Kurse) | Provides the learning objectives that give interactions meaning (intent) |

## Related
- TC-004 (Multimodal Storage Layer — technical foundation)
- TC-007 (Portfolio Evidence Layer — evidence structuring)
- TC-008 (Auditierbare Methodik — audit trail)
- DC-009 (Smart Kurse — intent-based learning that populates the Erinnerungsraum)
- DC-005 (Interest → Orientation → Skills — progression stages)
- DC-007 (Digitale Wanderschaft — the Wanderbuch/stamp metaphor)
- BC-005 (Portfolio-Backed Skill Verification — verification model)
- FR-008 (Skill Profile Generation — profile as view onto Erinnerungsraum)
- TC-010 (Blockchain-Based Learning Record Verification — tamperproof layer over Erinnerungsraum)
- FR-030 (Third-Party Skill Endorsement — endorsement feature)
