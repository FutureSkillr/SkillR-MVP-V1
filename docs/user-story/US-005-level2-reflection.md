# US-005: Level 2 Reflection and Capability Assessment

**Created:** 2026-02-17

## User Story
As a **student**, I want the **AI assistant to actively ask me questions, offer suggestions, and let me respond in my own way** so that **my intent and capabilities are identified through what I say and how I say it — not just through multiple-choice answers**.

## Context
Level 2 is the extended reflection system. Beyond the basic dialogue (Level 1), the assistant shifts into a coaching mode: it poses open-ended questions, offers thought-provoking suggestions, and observes how the student responds. The system analyzes both **content** (what the student says) and **response timing** (how quickly, how long they think, whether they hesitate). This behavioral signal layer enriches the interest profile with capability indicators — not just "interested in X" but "shows analytical thinking when discussing X" or "engages deeply when challenged on Y". All interactions are stored in the multimodal storage layer.

## Acceptance Indicators
- Assistant triggers reflection questions proactively (not just reactive)
- Questions are open-ended, not multiple-choice
- System tracks response timing alongside content
- Capability indicators are derived from response patterns
- Student does not feel tested — it feels like a conversation
- All reflection interactions are persisted in the multimodal storage layer

## Related
- FR-005 (Gemini AI dialogue engine)
- FR-008 (Skill profile generation)
- TC-004 (Multimodal storage layer)
- TC-005 (Response timing and intent analysis)
- DC-004 (Level 2 reflection system)
