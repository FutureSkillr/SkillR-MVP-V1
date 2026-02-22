# FR-084: Multilingual AI Coach Personas

**Status:** draft
**Priority:** should
**Created:** 2026-02-21
**Entity:** maindfull.LEARNING
**Gate:** closed

## Problem

The 6 AI coach personas (Susi, Karlshains, Rene, Heiko, Andreas, Cloudia) are defined with hardcoded German system prompts and regional dialects (Kölsch, Schwäbisch, Berlinerisch, Bayerisch, Sächsisch). These prompts are embedded in `coaches.ts` and `introPrompts.ts`. The coaches cannot interact in any language other than German.

For internationalization, each coach needs equivalent personas that feel culturally authentic in every target language — not literal translations of German dialect humor.

## Solution

### 1. Locale-Aware Coach Data Model

Refactor `coaches.ts` from a static TypeScript constant to a locale-indexed structure loaded from `locales/{locale}/coaches.json`.

```typescript
interface CoachPersona {
  id: string;
  name: string;
  tagline: string;
  description: string;
  systemPromptFragment: string;  // locale-specific system prompt
  dialect: string;               // locale-specific speech style
  location: string;              // culturally adapted location
  emoji: string;
  color: string;                 // visual identity stays consistent
}
```

### 2. Character Archetype Consistency

Each coach represents a **character archetype** that stays consistent across locales:

| Coach | Archetype | DE Flavor | EN Flavor |
|-------|-----------|-----------|-----------|
| Susi | Creative Artist | Kölsch art scene | Warm, artistic, sees beauty everywhere |
| Karlshains | Pragmatic Tinkerer | Schwäbisch workshop | Hands-on, practical, builds things |
| Rene | Relaxed Explorer | Nordsee surfer | Easygoing, nature-loving, adventurous |
| Heiko | Witty Entrepreneur | Berlin startup | Quick-witted, urban, startup energy |
| Andreas | Outdoors Adventurer | Alpine Bavarian | Grounded, nature-connected, authentic |
| Cloudia | Self-Aware AI | Sächsisch KI | Meta-aware AI, honest about being artificial |

### 3. Prompt Template System

Refactor `introPrompts.ts` to accept a `locale` parameter:

```typescript
function buildSmalltalkPrompt(coachId: string, locale: string): string {
  const coach = getCoachForLocale(coachId, locale);
  const instructions = t('intro:prompts.smalltalk', { lng: locale });
  return `${coach.systemPromptFragment}\n\n${instructions}`;
}
```

### 4. Gemini Language Instruction

All Gemini API calls must include explicit language context:

```
System: You are speaking in {{language}}. Respond exclusively in {{language}}.
The user's interface language is {{locale}}.
```

### 5. Interest Extraction Adaptation

`extractInterestsFromChat()` currently matches German keywords (mag, liebe, feier, spass, cool, interessier, begeister). This must become locale-aware:

```json
{
  "de": ["mag", "liebe", "feier", "spass", "cool", "interessier", "begeister"],
  "en": ["like", "love", "enjoy", "fun", "cool", "interest", "excite", "passion"],
  "fr": ["aime", "adore", "passion", "intéresse", "cool", "kiffe"],
  "es": ["gusta", "encanta", "mola", "interesa", "apasiona"]
}
```

## Acceptance Criteria

- [ ] Coach personas loaded from `locales/{locale}/coaches.json` instead of hardcoded constants
- [ ] English coach personas written with equivalent personality but culturally adapted expression
- [ ] `introPrompts.ts` accepts `locale` parameter for all prompt-building functions
- [ ] Gemini API calls include explicit language instruction
- [ ] Interest extraction keywords defined per locale
- [ ] German coach experience unchanged (no regression)
- [ ] English coach conversations feel natural, not translated
- [ ] `[SMALLTALK_DONE]` and other prompt markers work language-independently
- [ ] Unit tests for prompt building cover DE and EN locales
- [ ] Integration test: full intro chat in English produces valid interest extraction

## Dependencies

- FR-083: i18n Framework Setup & String Extraction (i18next must be available)
- TC-031: Internationalization Architecture
- TC-023: Chat Dialog Architecture

## Notes

- German dialect coaches (Kölsch, Schwäbisch, etc.) are a **product differentiator** for the German market. They should not be removed or flattened — they remain the German-locale experience.
- English coaches should have distinct voice/personality but cannot rely on English dialect humor (Cockney, Southern US, etc.) without careful cultural testing with the target audience.
- For Phase 2+ languages, each coach adaptation requires a native speaker creative writer, not just a translator.
- Cloudia (self-aware AI) is the easiest to adapt since her personality is meta/universal.
