# FR-016: Wikipedia Knowledge Service (Backend)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Scope
Backend service in Go that retrieves and caches Wikipedia summaries and structured data by topic, place, or job title. Serves as a grounding knowledge source for the Gemini dialogue engine and the Job-Navigator. Supports German and English Wikipedia. Provides structured extracts (summary, key facts, related topics) via internal API.

## Intent
Prevent hallucination and ensure factual grounding. When the AI coach talks about a place or explains a job, the information should be verifiable. Wikipedia provides the open, multilingual knowledge backbone that makes this possible without building a custom encyclopedia.

## Dependencies
- TC-002 (Wikipedia data integration)
- FR-005 (Gemini AI dialogue engine)
- US-003 (Job-Navigator)
