# FR-028: Sponsored Content Integration

**Status:** draft
**Priority:** could
**Created:** 2026-02-17

## Problem
The VUCA journey generates all content dynamically via the LLM (FR-005), which is powerful but lacks real-world authenticity. Meanwhile, companies have deep domain expertise they want to share, and need a non-advertising channel to reach future talent. Without a sponsoring mechanism, companies remain passive listing providers instead of active ecosystem participants.

## Solution
A system where companies can contribute educational content that integrates naturally into the VUCA journey, transparently labeled as sponsored.

### Content Types
1. **Domain Expertise Snippets**: Short factual contributions about the company's industry (e.g., coffee processing, wood technology, logistics). Fed to the LLM as grounding data for relevant journey stations.
2. **Real-World Challenges**: Practical problems from the company's domain that the student can explore (e.g., "How would you optimize delivery routes in a city?"). Integrated into the journey as optional deep-dive activities.
3. **Behind-the-Scenes Stories**: Day-in-the-life content, apprenticeship stories, workshop tours (text, image, video links). Available when a student's exploration touches the company's domain.
4. **Station Sponsoring**: A company sponsors an entire journey station (e.g., "Station: Kaffeekultur in Brasilien — supported by [Company]"). The LLM weaves the company's expertise into the generated content.

### Integration Flow
1. Company uploads content through their Mentor/Sponsor view (FR-027)
2. Content is tagged with domain keywords and quality-reviewed
3. When a student's journey intersects with the domain, the LLM incorporates sponsored content as grounding data
4. The interaction is labeled "Supported by [Company]" in the UI
5. Student engagement with sponsored content creates an anonymized interest signal
6. If the student opts into matching, this signal feeds the matching engine (TC-006)

### Transparency Rules
- All sponsored content is visibly labeled — no hidden sponsoring
- The student can skip any sponsored content without penalty
- Sponsored content must pass educational quality threshold
- The LLM maintains editorial independence — it uses sponsored content as data, not as script

## Acceptance Criteria
- [ ] Companies can upload domain expertise content through their view
- [ ] Content is tagged and categorized for contextual matching
- [ ] The LLM can incorporate sponsored content as grounding data for relevant stations
- [ ] Sponsored interactions are labeled "Supported by [Company]" in the UI
- [ ] Student can skip sponsored content without losing progress
- [ ] Engagement with sponsored content generates anonymized signals for matching
- [ ] Quality review process exists before content goes live
- [ ] JMStV compliance: content qualifies as educational, not promotional

## Dependencies
- FR-005 (Gemini Dialogue Engine — LLM incorporates sponsored grounding data)
- FR-022 (Company Moeglichkeitsraum Profile — company identity)
- FR-027 (Rollenbasierte App-Ansichten — Mentor/Sponsor content upload interface)
- TC-006 (Matching Engine — receives engagement signals)
- BC-007 (Bildungssponsoring — business model)

## Notes
- Priority "could" because MVP can launch without sponsoring — but it's the primary B2B revenue channel post-MVP
- Start with text-based content; expand to multimedia later
- Consider a content marketplace where companies compete to provide the best educational content for a domain
