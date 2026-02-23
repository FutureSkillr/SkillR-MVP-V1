# View: profile

**Route:** `profile` (internal view state)
**Component:** `CombinedProfile.tsx`
**Layout:** Layout chrome (header with back/profile/voice/logout buttons)

## Structure

```
┌─────────────────────────────────────────────────────┐
│  Layout Header (back, profile, voice toggle, logout) │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Dein Profil                             │
│       (text-3xl font-bold, centered)                │
│                                                     │
│   Deine Fähigkeiten auf einen Blick.               │
│       (text-slate-400, centered)                    │
│                                                     │
│  ┌─ Fähigkeiten-Radar (glass, rounded-2xl) ──────┐ │
│  │                                                 │ │
│  │          Spider/Radar Diagram                   │ │
│  │     (Recharts, responsive 3-tier sizing)        │ │
│  │                                                 │ │
│  │  Empty state: "Schliesse deine erste Station    │ │
│  │  ab, um dein Profil zu sehen."                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Reise-Fortschritt (glass) ────────────────────┐ │
│  │  🌊 VUCA Reise           2 Stationen           │ │
│  │  ████████░░░░░░░░                               │ │
│  │  🚀 Entrepreneur Reise   0 Stationen           │ │
│  │  ░░░░░░░░░░░░░░░░                               │ │
│  │  💡 Self-Learning Reise  1 Station             │ │
│  │  █████░░░░░░░░░░░                               │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Interessen ──────┐  ┌─ Stärken ──────────────┐ │
│  │ Musik  Technik     │  │ Kreativität  Teamwork  │ │
│  │ Design  Sport      │  │ Ausdauer  Neugier      │ │
│  └────────────────────┘  └────────────────────────┘ │
│                                                     │
│  ┌─ Dein Coach (glass) ──────────────────────────┐  │
│  │                                                │  │
│  │  Jeder Coach hat seinen eigenen Stil und       │  │
│  │  Dialekt. Du kannst jederzeit wechseln.        │  │
│  │                                                │  │
│  │  ┌─ border border-slate-700/50 rounded-2xl ──┐ │  │
│  │  │                                            │ │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │  │
│  │  │  │  Susi   │ │Karlshains│ │  Rene   │      │ │  │
│  │  │  │ ACTIVE  │ │ dimmed  │ │ dimmed  │      │ │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘      │ │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │  │
│  │  │  │  Heiko  │ │ Andreas │ │ Cloudia │      │ │  │
│  │  │  │ dimmed  │ │ dimmed  │ │ dimmed  │      │ │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘      │ │  │
│  │  │                                            │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Aktivitäten (glass) ─────────────────────────┐  │
│  │  ● Onboarding abgeschlossen      Gerade eben  │  │
│  │  │                                             │  │
│  │  ● VUCA Station 1 abgeschlossen  Vor 2 Std.   │  │
│  │  │                                             │  │
│  │  ● Self-Learning Station 1       Gestern       │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
│       [ Zurück ]    [ Nächste Reise starten ]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Sections

### 1. Header
| Element | Style | Text |
|---------|-------|------|
| Title | `text-3xl font-bold` centered | `Dein Profil` |
| Subtitle | `text-slate-400 text-sm` centered | Onboarding summary or fallback |

### 2. Fähigkeiten-Radar
- Recharts `RadarChart` with `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`
- Responsive sizing: 220px (<400px), 280px (400-640px), 350px (640px+)
- Shows all skill dimensions aggregated from station results
- Empty state when no stations completed

### 3. Reise-Fortschritt
- One progress bar per journey type (VUCA, Entrepreneur, Self-Learning)
- Journey icon + title + station count
- Progress bar with gradient fill

### 4. Interessen & Stärken
- Two-column grid (stacked on mobile)
- Tag pills from `onboardingInsights.interests` and `.strengths`
- Only shown when onboarding is complete

### 5. Coach Selection
- Full 6-coach grid reusing `CoachCard` component
- **Selected coach**: Full color, border glow, checkmark
- **Other coaches**: `dimmed` — grayscale + 50% opacity
- **On hover (dimmed)**: Temporarily shows full color (`hover:grayscale-0 hover:opacity-100`)
- **On click**: Switches coach, fires `coach_change` analytics event
- Dialect is derived from coach — no independent dialect selector
- Wrapped in `border border-slate-700/50 rounded-2xl p-4 sm:p-6` container (no outer glass panel)
- Grid: 1 col mobile, 2 cols from `sm` (640px+), 3 cols from `lg` (1024px+)
- Profile container: `max-w-4xl` (wider than other sections to give cards room)

### 6. Aktivitäten
- Chronological timeline (newest first)
- Dot + line visualization
- Color-coded by journey type
- Relative timestamps ("Gerade eben", "Vor 5 Min.", etc.)

### 7. Actions
- "Zurück" → navigates to `landing`
- "Nächste Reise starten" → navigates to `journey-select`

## Coach Change Behavior

When the user clicks a dimmed coach card:
1. `profile.coachId` updates to the new coach
2. `profile.voiceDialect` is derived via `getDialectForCoach(newCoachId)`
3. A `coach_change` analytics event fires with `previous_coach_id` and `new_coach_id`
4. All subsequent TTS output uses the new coach's dialect
5. The card grid re-renders: new coach is active, all others dimmed

## Flow

```
landing
   ↓ ("Mein Profil" / after station complete)
profile
   ├─→ "Zurück"                → landing
   └─→ "Nächste Reise starten" → journey-select
```

## Data Dependencies

| Data | Source |
|------|--------|
| `profile.coachId` | Set during intro flow, changeable in profile |
| `profile.voiceDialect` | Derived from `coachId` via `getDialectForCoach()` |
| `profile.onboardingInsights` | Set after onboarding chat |
| `stationResults[]` | Accumulated from completed stations |
| `profile.journeyProgress` | Updated per station completion |
