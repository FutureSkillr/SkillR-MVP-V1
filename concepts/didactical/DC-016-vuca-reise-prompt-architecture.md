# DC-016: VUCA Reise — Prompt Architecture & Content Creation Pipeline

**Status:** validated
**Created:** 2026-02-18

## Concept

The VUCA Reise content is **not pre-authored** — it is generated at runtime by a multi-stage AI pipeline. Each stage uses a specialized system prompt with a specific role, tone, and structured output format. Completion markers (`[REISE_VORSCHLAG]`, `[STATION_COMPLETE]`, etc.) signal stage transitions. The pipeline is fully editable at runtime via the MetaKursEditor admin panel.

## Target Group

Jugendliche ab 14 Jahren, deutschsprachig. All user-facing AI output is in German. The terms "Volatilitaet", "VUCA", "Ambiguitaet", "Komplexitaet" are **never** used in user-facing text — replaced by "Veraenderung", "Ungewissheit", "Vernetzung", "Vieldeutigkeit".

## Pipeline Stages

### Stage 1: Onboarding Chat (Interest Discovery)

| Aspect | Detail |
|--------|--------|
| **Prompt** | `ONBOARDING_SYSTEM_PROMPT` (`services/prompts.ts`) |
| **Role** | Friendly AI coach, curious, eye-level |
| **Goal** | Discover interests, strengths, preferred learning style in 5-8 messages |
| **Trigger** | User clicks "Reise starten" on landing page |
| **Starter** | `"Starte das Onboarding. Begruesse mich kurz und frage nach meinen Interessen."` |
| **Completion marker** | `[REISE_VORSCHLAG]` + journey recommendation |
| **Output** | Free-text chat leading to journey recommendation |

### Stage 2: Insight Extraction (Structured Profile)

| Aspect | Detail |
|--------|--------|
| **System prompt** | `"Du bist ein Analyse-Tool. Extrahiere strukturierte Daten aus Gespraechen."` |
| **Input** | Full onboarding chat transcript |
| **Output (JSON)** | `{ interests: string[], strengths: string[], preferredStyle: 'hands-on' | 'reflective' | 'creative', recommendedJourney: 'vuca' | 'entrepreneur' | 'self-learning', summary: string }` |
| **Trigger** | `[REISE_VORSCHLAG]` marker detected in Stage 1 |

### Stage 3: Journey Selection (User Choice)

No AI call. User picks one of three journeys:

| Journey | Type Key | Dimensions |
|---------|----------|------------|
| Reise nach VUCA | `vuca` | Veraenderung, Ungewissheit, Vernetzung, Vieldeutigkeit |
| Gruender-Werkstatt | `entrepreneur` | Kreativitaet, Eigeninitiative, Durchhaltevermoegen, Wertschoepfung |
| Lern-Labor | `self-learning` | Selbstreflexion, Wissenstransfer, Neugier, Ausdauer, Selbststeuerung |

### Stage 4A: VUCA Path — Career Goal Discovery

| Aspect | Detail |
|--------|--------|
| **Prompt** | Inline `ONBOARDING_PROMPT` in `VucaStation.tsx` |
| **Role** | Friendly career advisor for youth (14+) |
| **Goal** | Discover career goal or interest area in 3-5 messages |
| **Completion marker** | `[REISE_VORSCHLAG]` |
| **Output** | Career goal string extracted from chat |

### Stage 4B: VUCA Path — Curriculum Generation

| Aspect | Detail |
|--------|--------|
| **System prompt** | `"Du bist ein Curriculum-Generator fuer die VUCA-Reise."` |
| **Input** | Career goal string from Stage 4A |
| **Output (JSON)** | `{ goal: string, modules: [{ id, title, description, category: 'V'|'U'|'C'|'A', order }] }` |
| **Structure** | 12 modules total — 3 per VUCA dimension |

### Stage 4C: VUCA Path — Course Content Generation (per module)

| Aspect | Detail |
|--------|--------|
| **System prompt** | `"Du bist ein Kurs-Generator. Erstelle Lernmaterial mit Quiz-Fragen."` |
| **Input** | Module title, description, VUCA category, career goal |
| **Output (JSON)** | `{ title, sections: [{ heading, content }], quiz: [{ question, options, correctIndex, explanation }] }` |
| **Trigger** | User clicks a module on the VUCA dashboard |

### Stage 4D: Entrepreneur Path

| Aspect | Detail |
|--------|--------|
| **Prompt** | `ENTREPRENEUR_STATION_SYSTEM_PROMPT` (`services/prompts.ts`) |
| **Role** | Experienced founder-mentor |
| **Flow** | Problem → Ideation (3+ ideas) → Reality check → Pivot → Pitch |
| **Injected vars** | `station.setting`, `station.challenge` |
| **Completion marker** | `[CHALLENGE_COMPLETE]` + idea summary |

### Stage 4E: Self-Learning Path

| Aspect | Detail |
|--------|--------|
| **Prompt** | `SELF_LEARNING_STATION_SYSTEM_PROMPT` (`services/prompts.ts`) |
| **Role** | Learning coach |
| **Flow** | Phase 1: Learn technique (3-4 msgs) → Phase 2: Apply to own interest (4-6 msgs) |
| **Injected vars** | `station.setting`, `station.technique` |
| **Completion marker** | `[EXERCISE_COMPLETE]` + learning summary |

### Stage 5: Station Result Extraction

| Aspect | Detail |
|--------|--------|
| **System prompt** | `"Du bist ein Bewertungs-Tool. Analysiere das Gespraech und vergib Scores."` |
| **Input** | Journey type, station ID, full chat transcript |
| **Output (JSON)** | `{ dimensionScores: Record<string, number>, summary: string }` |
| **Scores** | 0-100 per dimension |

## VUCA Bingo Completion Logic

- 12 modules, 3 per dimension (V, U, C, A)
- Progress per dimension = `completedModules / totalModules * 100`
- Threshold: `VUCA_THRESHOLD = 25%` (at least 1 of 3 modules per dimension)
- **Bingo = all 4 dimensions ≥ 25%**

## Runtime Editability (MetaKursEditor)

All prompts, journeys, and stations can be overridden at runtime via localStorage:
- `future-skiller-custom-prompts` — overrides system prompt texts
- `future-skiller-custom-journeys` — overrides/adds journey definitions
- `future-skiller-custom-stations` — overrides station configurations
- Full export/import via JSON through the admin MetaKursEditor panel

## Traceability

```
User opens app
    → [Stage 1] Onboarding Chat (ONBOARDING_SYSTEM_PROMPT)
    → [Stage 2] extractInsights() → structured profile
    → [Stage 3] JourneySelector → user picks journey
    → [Stage 4A-E] Journey-specific station(s)
    → [Stage 5] extractStationResult() → dimension scores
    → CombinedProfile (radar chart + progress)
```

## Implementation

| File | Role |
|------|------|
| `frontend/services/prompts.ts` | All 4 system prompt templates |
| `frontend/services/gemini.ts` | Gemini API calls: chat, extractInsights, extractStationResult, generateCurriculum, generateCourse |
| `frontend/services/contentResolver.ts` | Runtime override layer (localStorage merge) |
| `frontend/constants/journeys.ts` | Journey definitions with dimensions |
| `frontend/constants/stations.ts` | Station definitions with settings/characters |
| `frontend/components/admin/MetaKursEditor.tsx` | Admin editor for prompts, journeys, stations |

## Related

- DC-001: VUCA Bingo Matrix
- FR-045: Meta Kurs Editor
- TC-001: Firebase Data Model
- US-001: Interest Profile Discovery
