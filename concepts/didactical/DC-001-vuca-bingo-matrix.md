# DC-001: VUCA Bingo Matrix

**Status:** active
**Created:** 2026-02-17

## Concept
The VUCA Bingo Matrix is the structural backbone of the learning journey. Each student must encounter all four VUCA dimensions — Volatility, Uncertainty, Complexity, Ambiguity — through their own interest topic. The matrix tracks coverage as a 4-column grid. Each dialogue interaction or station visit is tagged to one or more VUCA dimensions. The journey completes when the student has collected a minimum of 4 items per dimension (4x4 minimum grid).

The matrix ensures pedagogical completeness without prescribing a path. Two students with completely different interests both arrive at a full understanding of VUCA — one through wood and craftsmanship, another through cooking and food systems.

## Target Group
Students aged 14+. The matrix operates invisibly for the student (they see progress, not the pedagogy) but is the primary quality gate for the system.

## Implementation
- Each dialogue turn is tagged to 0-n VUCA dimensions by the Gemini engine
- A progress tracker counts items per dimension (V, U, C, A)
- Visualization shows progress as a bingo-style card or progress bars
- Completion threshold: minimum 4 items per dimension
- Journey completion is triggered automatically when all 4 dimensions reach threshold

## Validation
- Can two students with different interests both complete the matrix?
- Does the matrix prevent shallow engagement (just clicking through)?
- Does the student understand what V, U, C, A mean by the time they finish?
- Is the 4-per-dimension threshold achievable in a reasonable session time?

## Related
- US-004 (Trip to VUCA completion)
- FR-007 (VUCA bingo completion matrix)
