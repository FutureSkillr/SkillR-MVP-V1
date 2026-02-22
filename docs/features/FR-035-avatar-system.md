# FR-035: Avatar System (Buddy + Self-Representation)

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem

Teenagers need a visual identity in the app — something that represents THEM and something that accompanies them. Two avatar needs:

1. **Self-representation**: "This is ME in the game" — a customizable character that appears on the globe, in stations, and in social features
2. **Buddy**: "This is my companion" — a small AI character that travels with them, gives hints, celebrates achievements, and creates emotional attachment

## Solution

### The Self-Avatar

A customizable character that represents the student in the world.

| Feature | Details |
|---|---|
| Creation | Simple character builder at first launch (face, hair, skin, outfit) |
| Appearance | Adapts to active theme: illustrated in Theme A, pixel art in Theme B |
| Position | Visible on the globe (Theme A) or in scenes (Theme B) |
| Customization | Unlockable outfits, accessories, and items (FR-037) |
| Social visibility | Visible to friends in team/partner mode (FR-036) |
| Growth | Avatar visually evolves with profile level (subtle changes at level milestones) |

### The Buddy

A small companion character that travels with the student. Think: Duolingo's Duo owl, but as a travel companion.

| Feature | Details |
|---|---|
| Character | A small, expressive creature (not human — abstract/cute, like a fox, compass spirit, or orb) |
| Personality | Reflects the student's journey: curious at start, more knowledgeable over time |
| Role | Hints, celebrations, encouragement, tutorial guidance |
| Dialogue | Short lines in speech bubbles: "Hey, schau mal da drueben!" / "Krass, neuer Stempel!" |
| Notifications | The buddy is the "voice" of push notifications (DC-014) |
| Customization | Buddy skins/colors unlockable through items (FR-037) |
| Emotional bond | The buddy remembers: "Erinnerst du dich an Rom? Das war cool." |

### Buddy Behaviors

| Context | Buddy Action |
|---|---|
| New station arrived | Points excitedly at the new location |
| Dialogue choice | Tilts head, as if thinking along |
| Profile update | Jumps and celebrates |
| Streak milestone | Does a little dance |
| Long absence | Sleeps when you open the app, wakes up happy |
| Level 2 reflection | Sits quietly, listening |
| Achievement unlocked | Holds up the badge proudly |

### Technical Implementation

| Component | Theme A (World Traveler) | Theme B (Retro Explorer) |
|---|---|---|
| Self-avatar | Illustrated character on globe | Pixel sprite in scenes |
| Buddy | Illustrated mascot overlay | Pixel companion sprite |
| Character builder | SVG-based layered compositing | Pixel-part selection grid |
| Animations | CSS/Lottie animations | Spritesheet frame animations |
| Storage | Avatar config in Firebase (JSON: parts, colors, items) | Same |

## Acceptance Criteria

- [ ] Student creates a self-avatar at first launch (< 2 minutes)
- [ ] Avatar is visible on the globe/map and in social features
- [ ] Buddy companion appears during journey and reacts to events
- [ ] Buddy delivers notifications in character
- [ ] Avatar and buddy adapt visually to the active theme (Theme A / Theme B)
- [ ] Unlocked items (FR-037) are wearable on the avatar
- [ ] Avatar config is stored in Firebase and syncs across devices

## Dependencies
- FR-034 (UI Theme System — avatar adapts to theme)
- FR-037 (Items & Individualization — unlockable avatar customization)
- FR-036 (Team/Partner/Mentor Mode — avatar visible to others)
- DC-006 (Reisebegleiter-Agenten — buddy is the visible face of the AI companion)
- DC-014 (Duolingo Engagement — buddy delivers engagement mechanics)
