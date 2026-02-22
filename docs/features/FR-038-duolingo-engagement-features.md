# FR-038: Duolingo-Style Engagement Features

**Status:** draft
**Priority:** must
**Created:** 2026-02-18

## Problem

EdTech apps average 5-8% D30 retention. Duolingo achieves ~15-20%. The difference is entirely in engagement mechanics: streaks, leagues, XP, notifications, achievements. We need the same mechanics adapted for a journey/exploration context.

## Solution

Implement the full Duolingo engagement stack as described in DC-014, with Future Skiller adaptations.

### Feature 1: Reisekette (Streak)

| Spec | Value |
|---|---|
| Trigger | Complete at least 1 station per calendar day |
| Display | Flame icon + day count, always visible on home screen |
| Milestone rewards | 3d (bronze border), 7d (silver), 14d (gold), 30d (badge), 100d (legendary) |
| Break penalty | Streak halves (not zeros) — gentler than Duolingo |
| Streak freeze | "Reiseketten-Schutz" item, earned at 7-day milestones (1 per milestone) |
| Notification | Day 2 without login: buddy reminder in character |

### Feature 2: Entdecker-Ligen (Leagues)

| Spec | Value |
|---|---|
| League count | 5 tiers: Einsteiger → Entdecker → Navigator → Weltenbummler → Pionier |
| Cycle | Weekly (Monday 00:00 to Sunday 23:59 CET) |
| League size | 30 players per league instance |
| Promotion | Top 10 promote to next tier |
| Demotion | Bottom 5 demote to previous tier |
| XP sources | Station: 10, Deep reflection: +5, VUCA item: +15, Streak day: +5, Endorsement: +20, Invite: +25 |
| Leaderboard | Visible in app, shows avatar + XP + league tier |
| Anti-gaming | XP weighted by engagement depth, not speed. Rushing through stations yields less XP. |

### Feature 3: XP & Entdecker-Level

| Spec | Value |
|---|---|
| XP display | Visible after every interaction, running total on profile |
| Level-up | Celebration animation (confetti, sound, badge display) |
| Level gates | Levels 1-5: local stations. 6-10: continental. 11-15: global. 16-20: hidden stations. 21+: mentor status. |
| Level cap | None (open-ended) |

### Feature 4: Reiseenergie (Daily Energy)

| Spec | Value |
|---|---|
| Free tier | 5 stations per day |
| Regeneration | 1 energy per 4 hours, full refill at midnight CET |
| Premium (parent sub) | Unlimited stations |
| Bonus energy | Earned via Bonus-Station-Ticket item (FR-037) |
| Display | 5 energy dots on home screen, dim when spent |

### Feature 5: Reise-Abzeichen (Achievements)

| Spec | Value |
|---|---|
| Total badges | 20+ at launch, expandable |
| Categories | Journey, Social, Streak, Exploration, Skills |
| Display | Badge wall in profile, shareable as images |
| Notifications | Badge earned → celebration overlay + buddy reaction |

### Feature 6: Smart Notifications

| Spec | Value |
|---|---|
| Frequency | Max 1 per day |
| Voice | Buddy character, in-character messages |
| Content | References specific user data (last station, streak count, nearby milestones) |
| Opt-out | Immediate, respected, GDPR-compliant |
| No guilt | Never passive-aggressive, always inviting |
| Channel | Push notification (if app installed) or browser notification (if PWA) |

## Acceptance Criteria

- [ ] Reisekette tracks consecutive days and displays flame icon + count
- [ ] Streak halves (not zeros) on break
- [ ] Weekly leagues place 30 users per instance, promote top 10, demote bottom 5
- [ ] XP is awarded for stations, reflections, endorsements, and invites
- [ ] Level-up triggers celebration animation
- [ ] Level gates restrict station access by region (local → global)
- [ ] Energy system limits free tier to 5 stations/day
- [ ] 20+ achievement badges are available at launch
- [ ] Push notifications are personalized, max 1/day, opt-out respected
- [ ] D30 retention measured and tracked as primary KPI

## Dependencies
- DC-014 (Duolingo Engagement Model — design specification)
- FR-035 (Avatar System — buddy delivers notifications, avatar on leaderboard)
- FR-037 (Items — streak rewards, achievement items, energy items)
- FR-033 (Datenschutz — notification consent, league data visibility)
- FR-003 (Firebase — engagement data storage)
