# FR-020: Level 2 Reflection Engine (Backend)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Scope
Backend service in Go that implements the Level 2 reflection system. Triggers proactive reflection questions at appropriate moments during the VUCA journey. Receives response content and timing data from the multimodal storage layer, analyzes patterns, and derives capability indicators (analytical depth, creativity, confidence, resilience). Capability indicators feed into the skill profile alongside interest data.

## Intent
Move beyond "what interests you" to "what you're capable of". Level 2 turns passive exploration into active coaching. By analyzing response patterns — both content and timing — the system surfaces capabilities the student may not recognize in themselves. This is what makes the profile more than a tag cloud of interests.

## Dependencies
- FR-005 (Gemini AI dialogue engine)
- FR-014 (Interest profile tracking)
- FR-019 (Multimodal storage layer)
- TC-005 (Response timing and intent analysis)
- DC-004 (Level 2 reflection system)
- US-005 (Level 2 reflection and capability assessment)
