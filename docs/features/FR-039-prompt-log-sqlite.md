# FR-039: SQLite Prompt Tracking + VUCA HeRo-App Parity

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-18

## Problem
Every Gemini API call (requests, prompts, responses) should be logged for debugging, analytics, and development. Currently there is zero logging beyond `console.error`. Additionally, the VUCA journey was a simple chat dialogue instead of the full HeRo-App flow with curriculum generation, module-based courses, quizzes, and VUCA Bingo progress tracking.

## Solution

### Part 1: SQLite Prompt Tracking
- In-browser SQLite database (sql.js) with IndexedDB persistence
- Two tables: `sessions` (tracking dialogue sessions) and `prompt_logs` (tracking every API call)
- Logging wrapper around `geminiService` that captures: system prompts, user messages, chat history, raw responses, structured responses, latency, retry count, token estimates
- Debug panel overlay (Ctrl+Shift+L) with stats bar, filters, expandable rows, CSV export

### Part 2: VUCA HeRo-App Parity
- Onboarding chat discovers career goal (3-5 messages)
- Gemini generates 12-module curriculum (3 per VUCA dimension)
- Dashboard shows module cards + VUCA Bingo progress grid
- Module selection generates course content + 3 quiz questions
- Quiz completion marks module done, updates VUCA progress
- All 4 dimensions at threshold triggers completion

## Acceptance Criteria
- [x] sql.js installed and WASM copied to public/
- [x] `services/db.ts` — SQLite init, IndexedDB persistence, CRUD
- [x] `services/geminiWithLogging.ts` — logging wrapper for all geminiService methods
- [x] `hooks/usePromptLogSession.ts` — session lifecycle hook
- [x] `types/promptlog.ts` — TypeScript interfaces for sessions and logs
- [x] `components/debug/PromptLogPanel.tsx` — debug overlay with stats, filters, expand/collapse, CSV export
- [x] All 4 chat components wired up with prompt logging
- [x] `gemini.ts` modified: `onRetry` callback, `generateCurriculum()`, `generateCourse()`
- [x] `types/vuca.ts` — Module, CourseContent, QuizQuestion, VucaProgress types
- [x] `services/vuca.ts` — VUCA state machine (completeModule, calculateProgress)
- [x] `VucaStation.tsx` rewritten: onboarding → curriculum → dashboard → course → bingo → complete
- [x] `VucaDashboard.tsx` — module cards grid with category colors
- [x] `VucaBingo.tsx` — 4-dimension progress grid
- [x] `VucaCourseView.tsx` — course sections + multiple-choice quiz

## Dependencies
- FR-005-gemini-dialogue-engine
- FR-006-vuca-navigation
- FR-007-vuca-bingo-matrix

## Notes
- Debug panel is dev-only, toggled via Ctrl+Shift+L
- SQLite DB persists across page refreshes via IndexedDB
- VUCA state persisted to localStorage separately from main app state
- Favicon added to index.html from images/favicon.ico
