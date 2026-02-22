# FR-019: Multimodal Storage Layer (Backend)

**Status:** draft
**Priority:** must
**Created:** 2026-02-17

## Scope
Backend service in Go that implements the unified multimodal storage layer on Firebase Firestore. Stores all interaction types (text dialogue, voice transcripts, navigation choices, timing metadata) in a structured, queryable schema. Every interaction record includes content, modality, timing data, journey context (place, VUCA dimension, interest topic), and profile impact. Supports retrieval by user, session, time range, dimension, or modality.

## Intent
The travel journal is the raw material from which the skill profile is built. Without a comprehensive, structured storage layer, profile generation is incomplete and session continuity breaks. This is the foundation everything else builds on.

## Dependencies
- FR-003 (Firebase user data)
- TC-004 (Multimodal storage layer architecture)
- US-006 (Multimodal interaction tracking)
