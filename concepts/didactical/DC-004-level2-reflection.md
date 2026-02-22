# DC-004: Level 2 Reflection System

**Status:** draft
**Created:** 2026-02-17

## Concept
The Level 2 Reflection System extends the basic dialogue (Level 1: information exchange) into a coaching interaction. The AI assistant shifts from providing content to probing understanding:

- **Level 1 (Dialogue):** Student asks or explores, system responds with information and station-based interactions. Content-driven.
- **Level 2 (Reflection):** System asks open-ended questions, offers thought-provoking suggestions, and observes how the student responds. The student's response — both its content and its behavioral characteristics (timing, depth, hesitation) — becomes signal.

Level 2 is triggered by the assistant at appropriate moments, not by the student. The transition should feel natural — like a travel companion who asks "What did you think about that?" after visiting a place.

What Level 2 captures:
- **Content analysis:** What the student says reveals understanding, interest depth, and reasoning patterns
- **Timing analysis:** Response latency, time spent thinking, and engagement duration reveal confidence, uncertainty, and genuine interest vs. surface compliance
- **Capability indicators:** Patterns across many Level 2 interactions reveal emerging competencies (analytical thinking, creativity, resilience, etc.)

## Target Group
All students during the VUCA journey. Level 2 reflection intensifies as the journey progresses — early interactions are lighter, later ones probe deeper.

## Implementation
- The Gemini engine triggers Level 2 transitions based on journey progress and dialogue context
- Response timing is captured at the frontend and stored in the multimodal storage layer
- Content + timing are analyzed together to produce capability indicators
- Capability indicators feed into the skill profile alongside interest data
- The student never sees "Level 2" — they experience a natural conversation

## Validation
- Does the student feel coached, not interrogated?
- Does response timing analysis produce meaningful differentiation?
- Are capability indicators stable across sessions (not noise)?
- Does Level 2 engagement correlate with richer profiles?

## Related
- US-005 (Level 2 reflection and capability assessment)
- TC-004 (Multimodal storage layer)
- TC-005 (Response timing and intent analysis)
- FR-005 (Gemini AI dialogue engine)
- FR-008 (Skill profile generation)
