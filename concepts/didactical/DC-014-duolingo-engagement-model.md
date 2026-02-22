# DC-014: Duolingo Engagement Model (Adapted for Future Skiller)

**Status:** draft
**Created:** 2026-02-18

## Concept

Duolingo is the gold standard for engagement mechanics in education apps. Their D30 retention is ~15-20% — top 1% of all apps. We copy their proven mechanics and adapt them for a journey/exploration context instead of language learning.

### The Duolingo Mechanics We Copy

#### 1. Streaks (Daily Return Incentive)

**Duolingo:** Consecutive days of practice. Losing a streak is emotionally painful — users pay real money for "streak freezes."

**Our adaptation: "Reisekette" (Travel Chain)**

Every day you visit at least one station, your Reisekette grows. The chain is visible as a number + flame icon, exactly like Duolingo.

| Chain Length | Reward |
|---|---|
| 3 days | Bronze passport border |
| 7 days | Silver passport border |
| 14 days | Gold passport border |
| 30 days | Special "Weltreisender" badge |
| 100 days | Legendary traveler status |

**Critical difference from Duolingo:** We do NOT punish breaks as harshly. A broken streak drops to half (not zero). A 30-day chain broken becomes a 15-day chain, not 0. Reason: our target audience is younger and has less control over their daily schedule (school, family). Punishing them for a family vacation is counterproductive.

"Reisekette-Schutz" (streak freeze): Earned by completing bonus challenges, not by paying money. One free protection per 7-day streak. This keeps the mechanic engagement-driven, not monetization-driven.

#### 2. Leagues / Leaderboards (Social Competition)

**Duolingo:** Weekly leagues (Bronze → Silver → Gold → Sapphire → Ruby → Emerald → Amethyst → Pearl → Obsidian → Diamond). Top 10 promote, bottom 5 demote. Creates weekly urgency.

**Our adaptation: "Entdecker-Ligen"**

Weekly leagues based on XP earned (stations completed, reflections depth, profile growth). Same promotion/demotion structure.

| League | Rank Range |
|---|---|
| Einsteiger (Beginner) | Entry league |
| Entdecker (Explorer) | Top 10 promote |
| Navigator | Top 10 promote |
| Weltenbummler (Globetrotter) | Top 10 promote |
| Pionier (Pioneer) | Top league |

**Key design choice:** Leagues are based on ENGAGEMENT (stations visited, reflection depth), not on SPEED or CORRECTNESS. There are no "wrong answers" in Future Skiller. You can't game the league by rushing through stations — quality of engagement matters.

League XP sources:
- Station completed: 10 XP
- Deep reflection (Level 2, >3 exchanges): +5 XP bonus
- New VUCA dimension item: +15 XP
- Consecutive day bonus: +5 XP per streak day
- Third-party endorsement received: +20 XP
- Friend invited and completed first station: +25 XP

#### 3. Hearts / Energy System (Pacing)

**Duolingo:** Limited hearts that deplete on mistakes, regenerate over time. Forces deliberate engagement.

**Our adaptation: "Reiseenergie" (Travel Energy)**

You get 5 stations per day in the free tier. Completing a station costs 1 energy. Energy regenerates at 1 per 4 hours, or instantly refills at midnight.

This prevents binge-and-burn-out (a student doing 30 stations in one day and never returning) and creates daily return incentive. It also establishes a natural free/premium boundary:
- Free: 5 stations/day
- Premium (parent subscription): unlimited stations

**Design principle:** Energy is GENEROUS in the free tier. 5 stations at 5-10 min each = 25-50 min of daily content. That's more than enough for most users. The energy system is a pacing tool, not a paywall.

#### 4. XP and Levels (Progression)

**Duolingo:** XP for every lesson, visible level number, level-up celebrations.

**Our adaptation: "Entdecker-Level"**

Cumulative XP translates to a level number. Level-up triggers a celebration animation (confetti, achievement screen, new passport page unlocked).

| Level | XP Required | Unlocks |
|---|---|---|
| 1-5 | 0-500 | Local exploration (nearby cities) |
| 6-10 | 500-1500 | Continental exploration (Europe) |
| 11-15 | 1500-3500 | Global exploration (all continents) |
| 16-20 | 3500-7000 | Hidden stations, special challenges |
| 21-30 | 7000-15000 | Mentor status (can endorse others) |
| 30+ | 15000+ | Legendary explorer, community features |

Level gates also unlock new content: you can't fly to Tokyo at Level 2 (you start local, expand globally). This mirrors the VUCA journey's local→global progression naturally.

#### 5. Notifications (Re-engagement)

**Duolingo:** Famous for aggressive push notifications. "These reminders seem to be working! ... You made Duo sad."

**Our adaptation: Gentle, character-driven**

The AI companion (DC-006) sends notifications IN CHARACTER:

- Day 2 without login: *"Hey, dein Koch in Rom fragt, ob du nochmal vorbeikommst!"*
- Day 4: *"Du hast 3 Stempel in deinem Pass. Nur noch einer bis zum naechsten Level!"*
- Day 7: *"Deine Reisekette ist bald weg... willst du sie retten?"*
- Weekly: *"Diese Woche haben 47 Entdecker die gleiche Station besucht wie du. Willst du sehen, was sie entdeckt haben?"*

**No guilt-tripping.** No sad mascot. No passive aggression. The notifications are invitations, not guilt trips. They reference SPECIFIC things the student did (their Rome chef, their stamp count) — personalized, not generic.

Notification frequency: max 1 per day, opt-out respected immediately, GDPR-compliant.

#### 6. Achievements / Badges

**Duolingo:** Various achievements for milestones (first lesson, 7-day streak, 100 lessons, etc.)

**Our adaptation: "Reise-Abzeichen"**

| Badge | Trigger |
|---|---|
| Erster Schritt | Complete first station |
| Weltenbummler | Visit all continents |
| VUCA-Meister | Complete the VUCA Bingo Matrix |
| Teamplayer | Complete a team station with a friend |
| Botschafter | Invite 3 friends who complete their first station |
| Gruender | Complete the Entrepreneur Journey |
| Ausdauernd | 30-day Reisekette |
| Vielseitig | Visit 10 different interest domains |
| Tiefgang | Complete 5 Level 2 reflections |

Badges are visible on the profile and shareable (as images for social media or messaging).

### What We Explicitly Do NOT Copy from Duolingo

| Duolingo Mechanic | Why We Skip It |
|---|---|
| **Aggressive monetization** | Minors should not feel pressured to pay. Energy system is generous. |
| **Guilt-based notifications** | "You made Duo sad" is manipulative. We invite, not guilt. |
| **Super Duolingo ads** | No ads, ever. Our revenue is B2B, not ad-supported. |
| **Leaderboard toxicity** | Leagues reward engagement quality, not speed. No incentive to rush. |
| **Punitive streak loss** | Streaks halve instead of zeroing. Younger audience needs gentler stakes. |

## Target Group
All users. Engagement mechanics are universal — they work regardless of age, interest, or learning style.

## Implementation Priority
1. **MVP:** Streaks (Reisekette) + XP/Levels + basic achievements — minimum viable engagement
2. **Phase 2:** Leagues + notifications + streak freeze
3. **Phase 3:** Full achievement system + social features (friend challenges)

## Validation
- D7 retention with engagement mechanics vs. without (A/B test)
- D30 retention target: >15% (Duolingo-level)
- Average sessions per user per week: >3
- Streak length distribution: >20% of active users maintaining 7+ day streaks

## Related
- DC-011 (3D Gamified World Travel — the visual layer these mechanics operate on)
- DC-013 (Entrepreneur Journey — separate XP track possible)
- FR-035 (Avatar System — visual identity for leagues and badges)
- FR-036 (Team/Partner/Mentor Mode — social mechanics)
- FR-037 (Items & Individualization — cosmetic rewards)
- FR-038 (Duolingo-Style Engagement Features — technical implementation)
