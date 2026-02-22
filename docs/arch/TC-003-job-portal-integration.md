# TC-003: Job Portal Data Integration

**Status:** draft
**Created:** 2026-02-17

## Context
The Job-Navigator needs real job data — actual job titles, descriptions, demand signals — to ground the Moeglichkeitsraum in reality. Generic or LLM-hallucinated job descriptions are not sufficient. Job portal APIs provide structured, current data about what jobs exist and what they involve.

## Decision
Integrate one or more German job portal APIs (e.g., Bundesagentur fuer Arbeit API, relevant commercial job APIs) to provide real job data for the Job-Navigator. The Go backend fetches and caches job data by topic/category and serves it to the dialogue engine and Job-Navigator logic.

## Key Requirements
- Retrieve job titles and descriptions by interest/topic category
- Support German job market data (primary audience)
- Provide structured data: title, description, required skills, industry sector
- Enable Gegensatzsuche: ability to find contrasting/opposite job categories
- Cache and refresh data periodically (jobs data changes, but not in real-time)

## Consequences
- Dependency on external job portal API availability and terms of use
- Job data may require normalization across different portal formats
- Rate limits and potential costs for commercial APIs
- Need to filter for age-appropriateness (no adult-only or restricted jobs)

## Alternatives Considered
- Static job database (BERUFENET/BIZ): comprehensive but requires periodic manual updates
- LLM-generated job descriptions only: risk of fabricated job titles
- Scraping job portals: legally problematic, fragile

## Related
- US-003 (Job-Navigator and Moeglichkeitsraum)
- BC-002 (Job-Navigator)
- DC-002 (Gegensatzsuche)
