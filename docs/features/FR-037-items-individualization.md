# FR-037: Items, Individualization & Seasonal Drops

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem

Teenagers want to express themselves. They want their experience to be THEIRS — unique, personalized, and showing status. Items serve three purposes:
1. **Individualization**: Make MY avatar / MY globe / MY passport look different from everyone else's
2. **Inspiration**: Items that give a thematic boost or open new content
3. **Advantage**: Items that provide gameplay benefits (more XP, bonus stations, special access)

## Solution

### Item Categories

| Category | Purpose | Examples |
|---|---|---|
| **Cosmetic** | Personalize avatar and UI | Outfits, hats, buddy skins, passport covers, globe themes, trail effects |
| **Inspiration** | Unlock themed content | "Kochmuetze" unlocks 3 bonus culinary stations; "Werkzeugkasten" unlocks trades stations |
| **Advantage** | Gameplay benefits | "Turbo-Pass" (double XP for 24h), "Entdecker-Kompass" (reveals one hidden station), "Reiseketten-Schutz" (streak freeze) |
| **Social** | Shareable / giftable | "Einladungskarte" (premium invite with bonus XP for friend), "Teambooster" (double team XP for one session) |

### How Items Are Earned

Items are NEVER purchased with real money (our users are minors). They are earned through engagement:

| Source | Item Type | Frequency |
|---|---|---|
| Station completion | Random common item drop | ~30% chance per station |
| Achievement badges | Specific themed item | 1 per badge |
| Streak milestones | Streak-themed items | Every 7 days |
| League promotion | League-tier cosmetics | Per promotion |
| Seasonal events | Limited-edition seasonal items | During season only |
| Team station completion | Team-exclusive items | Per team station |
| Mentor endorsement received | Endorsement-themed items | Per endorsement |

### Seasonal System

Items are available in **Seasons** — limited-time windows that create urgency and freshness.

| Season | Duration | Theme | Example Items |
|---|---|---|---|
| **Fruehling** (Spring) | Mar-May | Nature, growth, new beginnings | Blumen-Outfit, Schmetterlings-Buddy-Skin, Gruener-Globus-Theme |
| **Sommer** (Summer) | Jun-Aug | Travel, adventure, heat | Sonnenbrille, Surfbrett-Trail, Strand-Passport-Cover |
| **Herbst** (Autumn) | Sep-Nov | Harvest, craftsmanship, depth | Handwerker-Set, Goldene-Blaetter-Globus, Laternen-Buddy |
| **Winter** (Dec-Feb) | Warmth, reflection, celebration | Wintermuetze, Schneeflocken-Trail, Gluehwein-Station-Skin |

**Seasonal rules:**
- Each season introduces ~15-20 new items
- Seasonal items are ONLY available during that season — once the season ends, they're gone
- Students who missed a season can trade with friends who have seasonal items (FR-036 partner mode)
- A "Sammelalbum" (collection album) shows all items across all seasons — collectors see what they missed
- Seasonal items return the NEXT year but with a visual variant ("2026 Edition" vs "2027 Edition")

**Why seasons work:**
- **Urgency**: "Ich muss diese Woche noch die Winter-Items holen!" drives daily engagement
- **FOMO without toxicity**: Missing items is disappointing but not game-breaking (all items are cosmetic or minor advantage)
- **Freshness**: New items every 3 months keep the experience feeling alive
- **Social currency**: Rare seasonal items become conversation starters ("Wo hast du DAS her?")

### Item Rarity System

| Rarity | Drop Rate | Visual Indicator | Examples |
|---|---|---|---|
| **Common** | ~30% per station | White border | Basic color variants, simple accessories |
| **Uncommon** | ~10% per station | Green border | Themed outfits, buddy accessories |
| **Rare** | ~3% per station | Blue border | Special effects (trails, glows), premium cosmetics |
| **Legendaer** | ~0.5% or achievement-only | Gold border + glow | Full outfit sets, unique buddy skins, special globe themes |
| **Saisonal** | Season-only, varies | Season color + timer icon | Limited-edition items that don't return in same form |

### Item Advantages (Non-Pay-to-Win)

Advantage items give minor gameplay benefits. They are EARNED, not bought:

| Item | Effect | How Earned |
|---|---|---|
| Turbo-Pass | 2x XP for 24 hours | 14-day streak milestone |
| Entdecker-Kompass | Reveals 1 hidden station on the globe | Complete 10 stations in one continent |
| Reiseketten-Schutz | Prevents streak from halving (1 use) | 7-day streak (1 free), or achievement reward |
| Bonus-Station-Ticket | Unlock 1 extra station beyond daily energy limit | League promotion |
| Team-Boost | 2x XP for entire team for 1 session | Complete 3 team stations |

**Critical rule:** No advantage item is NECESSARY to progress. Every item provides a NICE bonus, not a REQUIRED one. A student without items progresses at normal speed. A student with items progresses slightly faster. The gap is small enough that no student feels disadvantaged.

### Individualization Depth

| What Can Be Customized | Items Involved |
|---|---|
| Avatar appearance | Outfits, hats, glasses, hair colors, accessories |
| Buddy appearance | Skins, colors, size variants, particle effects |
| Passport | Covers, sticker styles, border designs |
| Globe/Map | Color themes, trail effects, marker styles |
| Profile background | Themed backgrounds for the spider diagram |
| Station arrival | Entry animations (how your character appears at a new station) |

## Acceptance Criteria

- [ ] Items drop from stations, achievements, and streaks
- [ ] Items are categorized as Cosmetic, Inspiration, Advantage, or Social
- [ ] Seasonal items are only available during their season
- [ ] A collection album shows all available and earned items
- [ ] Cosmetic items are applied to avatar, buddy, passport, or globe
- [ ] Advantage items provide minor, non-essential gameplay benefits
- [ ] Item rarity is visually indicated (border color + effects)
- [ ] No items are purchasable with real money
- [ ] Items can be viewed by partners and team members (social visibility)

## Dependencies
- FR-035 (Avatar System — items equip on avatar and buddy)
- FR-036 (Team/Partner/Mentor Mode — social items, trading)
- FR-034 (UI Theme System — items adapt to active theme)
- DC-014 (Duolingo Engagement — items as rewards for engagement milestones)
- FR-033 (Datenschutz — item drop mechanics must not constitute gambling under German law)

## Notes
- **Not loot boxes.** Items drop as direct rewards for specific actions, not from purchased random boxes. German gambling law (GluStV) restricts loot box mechanics for minors. Our items are engagement rewards, not random purchases.
- **Seasonal timing aligns with school rhythm**: Fruehling = after winter break energy, Sommer = before/during summer break, Herbst = back-to-school, Winter = holiday season.
