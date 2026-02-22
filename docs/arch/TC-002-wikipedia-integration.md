# TC-002: Wikipedia Data Integration

**Status:** draft
**Created:** 2026-02-17

## Context
The AI dialogue engine generates content dynamically, but it needs grounded, factual knowledge — especially for explaining places, concepts, and jobs in student-friendly language. Wikipedia provides a vast, multilingual, open knowledge base that covers the topics students will explore. It also serves as the knowledge backbone for the Job-Navigator's explanations.

## Decision
Integrate Wikipedia as a supplementary knowledge source for the Gemini dialogue engine and the Job-Navigator. The Go backend retrieves relevant Wikipedia articles/summaries based on the current journey context and feeds them as grounding data to Gemini prompts.

## Key Requirements
- Retrieve Wikipedia summaries by topic, place, or job title
- Support German and English Wikipedia (primary audience is German-speaking)
- Provide structured extracts (summary, key facts, related topics)
- Use as grounding context for Gemini to avoid hallucination
- Cache frequently accessed articles for performance

## Consequences
- Wikipedia content quality varies — need filtering for age-appropriateness
- API rate limits apply (Wikimedia REST API)
- Content is CC-licensed — attribution requirements must be met
- Adds latency to dialogue if not cached

## Alternatives Considered
- Rely purely on Gemini's training data: risk of hallucination, no grounding
- Licensed encyclopedia APIs (Brockhaus): costly, limited coverage
- Custom knowledge base: massive upfront effort, not feasible for MVP

## Related
- US-003 (Job-Navigator — Wikipedia for job explanations)
- FR-005 (Gemini AI dialogue engine — grounding)
- BC-002 (Job-Navigator)
