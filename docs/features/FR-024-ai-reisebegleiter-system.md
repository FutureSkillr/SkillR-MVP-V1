# FR-024: AI Reisebegleiter Multi-Agent System

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Problem
The current Gemini dialogue engine (FR-005) is a single monolithic interaction layer. The VUCA journey requires different dialogue strategies at different moments: exploration needs curiosity-driven breadth, reflection needs coaching depth, skill verification needs structured evidence gathering, and matching needs consent-mediated facilitation. A single prompt/persona cannot optimally serve all these modes.

## Solution
Implement an agent orchestration layer on top of the Gemini dialogue engine that manages four specialized agent personas:

1. **Entdecker-Agent** — Exploration and curiosity. Active during interest discovery and VUCA navigation. Drives Gegensatzsuche. Warm, playful tone.
2. **Reflexions-Agent** — Level 2 coaching. Triggered by journey milestones or behavioral signals (TC-005). Open-ended probing. Calm, thoughtful tone.
3. **Skill-Agent** — Skill verification and portfolio building. Emerges when interactions accumulate enough evidence. Connects interactions to portfolio entries. Structured but encouraging tone.
4. **Match-Agent** — Matching facilitation. Activates when profile maturity + demand signals suggest match opportunities. Always asks for consent before revealing anything to external parties. Transparent, supportive tone.

The orchestrator:
- Determines which agent is active based on journey state, VUCA bingo progress, and behavioral signals
- Manages transitions between agents seamlessly (no visible "handoff")
- Maintains shared context via the multimodal storage layer (TC-004)
- Ensures all agents contribute to the same profile and portfolio

## Acceptance Criteria
- [ ] Agent orchestration layer selects the appropriate agent persona based on journey state
- [ ] Each agent uses a distinct Gemini system prompt with role-specific instructions
- [ ] Transitions between agents are imperceptible to the student
- [ ] All agent interactions are stored in the multimodal storage layer with agent type metadata
- [ ] The Reflexions-Agent activates at appropriate Level 2 moments (DC-004)
- [ ] The Skill-Agent links interactions to portfolio entries (TC-007)
- [ ] The Match-Agent never reveals student data without explicit consent
- [ ] Agent behavior is age-appropriate and adapts to re-entering adults (US-012)

## Dependencies
- FR-005 (Gemini AI Dialogue Engine — foundation model)
- FR-019 (Multimodal Storage Layer — shared context)
- FR-020 (Level 2 Reflection Engine — triggers Reflexions-Agent)
- TC-004 (Multimodal Storage Layer — data model)
- TC-005 (Response Timing and Intent Analysis — behavioral triggers)
- TC-006 (Matching Engine — Match-Agent interface)
- TC-007 (Portfolio Evidence Layer — Skill-Agent interface)
- DC-006 (Reisebegleiter-Agenten — didactical concept)
- US-013 (AI Reisebegleiter — user story)

## Notes
- All agents share the same Gemini model instance; differentiation is via system prompt and parameters (temperature, top-p)
- The user-facing term is "Reisebegleiter", never "Agent" or "Bot"
- Post-MVP: agents could develop persistent personality traits that evolve with the student's journey history
- This is a "should" priority because the MVP can launch with a single-persona dialogue engine (FR-005) that covers exploration and basic reflection; the full agent ensemble is the target architecture
