# TC-005: Response Timing and Intent Analysis

**Status:** draft
**Created:** 2026-02-17

## Context
Level 2 reflection (DC-004) requires analyzing not just what the student says but how they respond. Response timing — how quickly they answer, how long they think, whether they hesitate or respond immediately — is a behavioral signal that enriches the capability profile beyond content analysis alone.

## Decision
Implement frontend timing instrumentation and a backend analysis pipeline that extracts intent and capability signals from response patterns. The Go backend receives timing data from the frontend alongside dialogue content and applies heuristic + ML-based analysis to derive capability indicators.

## Key Requirements
- Frontend captures: prompt display time, first keystroke/voice start, submission time
- Backend computes: think time, response duration, engagement intensity
- Pattern analysis across multiple interactions (not single-response conclusions)
- Capability indicators: analytical depth, creativity, confidence, uncertainty, resilience
- Indicators feed into the skill profile as soft signals (weighted lower than content)
- Privacy: timing data is analyzed in aggregate patterns, not individual keystrokes

## Analysis Heuristics (Initial)
- **Quick, confident response** → familiarity or strong opinion
- **Long pause then detailed response** → deep thinking, analytical engagement
- **Quick dismissal** → low interest or discomfort with topic
- **Revision/correction** → self-reflection, precision
- **Consistent engagement across topics** → broad curiosity
- **Deep engagement in narrow topics** → specialist tendency

## Consequences
- Frontend instrumentation adds complexity to the web app
- Timing data is noisy — environmental factors (bus, distraction) add variance
- Must avoid over-interpreting timing signals (supplement, not replace content analysis)
- Privacy implications of behavioral tracking — must be transparent to user/parents

## Alternatives Considered
- Content analysis only: simpler but misses behavioral dimension
- Eye tracking / attention metrics: too invasive, requires special hardware
- Self-reported engagement: unreliable, especially with teenagers

## Related
- US-005 (Level 2 reflection and capability assessment)
- DC-004 (Level 2 reflection system)
- TC-004 (Multimodal storage layer)
- FR-008 (Skill profile generation)
