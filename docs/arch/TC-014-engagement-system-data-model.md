# TC-014: Engagement System Data Model

**Status:** accepted
**Created:** 2026-02-19
**Entity:** maindset.ACADEMY + SkillR

## Context

FR-038 calls for Duolingo-style engagement features: streaks, XP, levels, leagues, energy, badges. Full parity with Duolingo's system would require months. We need a scoped engagement system that delivers visible gamification (streaks + XP + levels) for the MVP2 demo while being extensible for leagues/badges/energy later.

**Key question:** How much gamification is enough to make the IHK stakeholder say "users will come back"?

## Decision

**Scope for MVP2: Streaks + XP + Levels. Defer leagues, energy, and badges to V1.0.**

### Rationale for Scoping Down

| Feature | User Visibility | Impl. Effort | MVP2? |
|---------|----------------|-------------|-------|
| Streaks | Very high — flame icon, daily counter | Low | Yes |
| XP | High — earned per action, visible accumulation | Low | Yes |
| Levels | High — progression gates, unlocks | Medium | Yes |
| Leagues | Medium — weekly competition | High (needs 30+ users) | No — needs real user base |
| Energy | Medium — limits daily play | Medium | No — limiting play hurts MVP demo |
| Badges | Medium — achievement collection | Medium | No — needs content curation |

**Challenge considered:** Leagues need 30 players per bracket. With < 100 MVP users, leagues would feel empty or fake. Deferring to V1.0 when user base supports it.

**Challenge considered:** Energy systems (5 free stations/day) limit engagement during demos. Counter-productive for MVP2 where we want stakeholders to play freely. Defer to V1.0 monetization phase.

### Data Model

```typescript
interface EngagementState {
  // Streak
  currentStreak: number;        // consecutive days
  longestStreak: number;        // all-time max
  lastActiveDate: string;       // ISO date "2026-02-19"
  streakFreezeAvailable: boolean;

  // XP
  totalXP: number;              // lifetime XP
  weeklyXP: number;             // resets each Monday
  weekStartDate: string;        // ISO date of current week start

  // Level
  level: number;                // 1-based
  levelTitle: string;           // human-readable name
}
```

### XP Awards Table

| Action | XP |
|--------|----|
| Complete onboarding | 50 |
| Start a station | 10 |
| Complete a station | 100 |
| Complete VUCA module | 30 |
| Pass quiz (per question correct) | 10 |
| Daily login (streak maintained) | 20 |
| View profile | 5 |

### Level Progression

| Level | Title | XP Required | Unlocks |
|-------|-------|-------------|---------|
| 1 | Entdecker | 0 | Local stations |
| 2 | Reisender | 100 | All base journeys |
| 3 | Abenteurer | 300 | Reflection prompts |
| 4 | Wegbereiter | 600 | All stations |
| 5 | Weltenbummler | 1000 | Mentor features |

### Streak Logic

- **Increment:** User performs any XP-earning action on a new calendar day
- **Halve (not zero):** If a day is missed, streak = floor(streak / 2). Kinder than Duolingo's full reset — matches the product's encouraging tone.
- **Freeze:** One streak freeze per 7-day streak. Consume before halving.
- **Timezone:** Use browser's local date (Intl.DateTimeFormat) — no server clock dependency.

### Storage

Same pattern as TC-013: Firestore `users/{uid}/state/engagement` with localStorage fallback. Updated via the existing `saveUserState`/`loadUserState` functions.

## Consequences

- **Good:** Visible gamification in 3 components (streak flame, XP counter, level badge)
- **Good:** Simple to implement — no server-side logic needed, all client-side
- **Good:** Extensible — leagues/badges/energy slot into the same model later
- **Bad:** No social competition yet (leagues deferred)
- **Bad:** No daily limits (energy deferred) — but this is actually good for demos

## Alternatives Considered

### Full Duolingo Parity (All 6 Subsystems)
Rejected: 3-4 weeks of effort for features that need a real user base to work (leagues) or that hurt demo experience (energy limits).

### Server-Side XP Validation
Rejected for MVP2: Client-side XP is auditable but not tamper-proof. Acceptable for MVP2 demo. Server validation belongs in V1.0 Go backend.

### No Gamification (Focus on Content)
Rejected: Exit criteria explicitly require "Streaks and XP visible; user feels pull to return." Stakeholders expect visible engagement mechanics.
