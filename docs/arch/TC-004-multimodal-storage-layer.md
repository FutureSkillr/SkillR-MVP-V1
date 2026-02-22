# TC-004: Multimodal Storage Layer

**Status:** draft
**Created:** 2026-02-17

## Context
The system captures more than text dialogue. Voice interactions, response timing, navigation choices, skipped options, journey state, and profile snapshots all need to be stored, linked, and retrievable. A simple chat log is insufficient — the storage layer must support multimodal records with metadata.

## Decision
Design a unified multimodal storage layer on top of Firebase Firestore that stores all interaction types in a structured, queryable format. Each interaction record includes: content (text/transcript), modality (text/voice), timing metadata (request timestamp, response timestamp, duration), journey context (current place, VUCA dimension, interest topic), and profile impact (which profile dimensions were affected).

## Key Requirements
- Store text dialogue, voice transcripts, and interaction metadata in a unified schema
- Capture response timing: request sent → user starts responding → response complete
- Link every interaction to journey state (place, VUCA dimension, interest)
- Support retrieval by user, session, time range, VUCA dimension, or modality
- Enable the "travel journal" view: chronological replay of the entire journey
- Feed into profile generation (FR-008) and Level 2 analysis (DC-004)

## Data Model (Draft)
```
interaction {
  id: string
  user_id: string
  session_id: string
  timestamp: datetime
  modality: "text" | "voice" | "choice"
  content: {
    user_input: string
    assistant_response: string
    transcript_raw: string (voice only)
  }
  timing: {
    prompt_shown_at: datetime
    response_started_at: datetime
    response_completed_at: datetime
    think_time_ms: int
  }
  context: {
    place: string
    interest_topic: string
    vuca_dimensions: ["V" | "U" | "C" | "A"]
    journey_step: int
  }
  profile_impact: {
    dimensions_affected: map<string, float>
  }
}
```

## Consequences
- Firebase Firestore document size limits (1 MB) — voice transcripts may need sub-collection storage
- Query performance depends on index design — must plan indexes for common access patterns
- Storage costs scale with interaction volume and modality richness
- Timing capture requires frontend instrumentation (not just backend)

## Alternatives Considered
- Simple chat log in Firestore: insufficient for timing and multimodal data
- Separate stores per modality: complex joins, harder to maintain consistency
- BigQuery for analytics + Firestore for operational: good long-term but over-engineered for MVP

## Related
- US-006 (Multimodal interaction tracking)
- US-005 (Level 2 reflection)
- FR-003 (Firebase user data)
- FR-012 (Session continuity)
- TC-005 (Response timing and intent analysis)
