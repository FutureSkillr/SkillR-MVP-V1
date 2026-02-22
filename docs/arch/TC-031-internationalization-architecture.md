# TC-031: Internationalization (i18n) Architecture

**Status:** draft
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY + SkillR

## Context

Future SkillR currently has **zero i18n infrastructure**. All 500+ user-facing strings are hardcoded in German across 30+ components, 6 AI coach personas use fixed German regional dialects, date/number formatting is hardcoded to `de-DE`, and there is no language selection mechanism.

The product targets German-speaking youth today, but the vision requires:
- **Phase 1:** German + English (immediate)
- **Phase 2:** EU languages — French, Spanish, Italian, Portuguese, Polish, Dutch, Swedish (medium-term)
- **Phase 3:** South American languages — Brazilian Portuguese, Latin American Spanish, plus Quechua, Guaraní for cultural reach (long-term)

This TC defines the architecture for a scalable, maintainable internationalization system.

## Current State Assessment

### i18n Readiness: 1.5/10

| Dimension | Score | Finding |
|-----------|-------|---------|
| i18n Library | 0/10 | None installed |
| Translation Files | 0/10 | No locale directories or files |
| Component Text | 2/10 | 30+ components with 500+ embedded German strings |
| Error Messages | 2/10 | 15+ Firebase error codes hardcoded in German |
| Date/Time Formatting | 3/10 | Uses `toLocaleDateString()` but hardcoded to `de-DE` |
| RTL Support | 0/10 | No RTL attributes or layout considerations |
| Font System | 5/10 | Standard web fonts, no dynamic switching |
| AI Coach Prompts | 1/10 | 6 coaches with hardcoded German dialect prompts |
| Language Context | 0/10 | No locale provider or language selection UI |
| Constants/Labels | 2/10 | Journey names, dimensions, coach data all German |

### Affected Components (complete inventory)

**Authentication & Onboarding:**
- `LoginPage.tsx` — 15+ strings (labels, buttons, errors)
- `IntroRegisterPage.tsx` — 20+ strings (age check, form labels, legal hints)
- `CoachSelectPage.tsx` — 10+ strings (headings, descriptions)
- `IntroChat.tsx` — prompt fragments
- `WaitingSection.tsx` — 20+ strings (queue UI, tips, booking)
- `EmailBookingForm.tsx` — 8+ strings

**Landing & Marketing:**
- `WelcomePage.tsx` — 100+ strings (stakeholder descriptions, coach personas, VUCA dimensions, merch, CTAs)
- `LandingPage.tsx` — 30+ strings (journey cards, CTAs, explanations)

**Core Journey:**
- `VucaStation.tsx` — 20+ strings
- `EntrepreneurStation.tsx` — 15+ strings
- `SelfLearningStation.tsx` — 15+ strings
- `VucaDashboard.tsx` — 15+ strings
- `VucaBingo.tsx` — 10+ strings
- `ReflectionDialog.tsx` — 10+ strings
- `OnboardingChat.tsx` — 10+ strings

**Profile & Progress:**
- `CombinedProfile.tsx` — 20+ strings (relative time, activity history)
- `Layout.tsx` — 12+ strings (navigation, mode toggles)

**Admin:**
- `AdminConsole.tsx` — 10+ strings
- `UserAdmin.tsx` — 8+ strings
- `RoleManager.tsx` — 8+ strings
- `AnalyticsDashboard.tsx` — 5+ strings
- `MetaKursEditor.tsx` — 10+ strings
- `BusinessConfigTab.tsx` — 8+ strings
- `PromptLogPanel.tsx` — 15+ strings

**Legal & Compliance:**
- `CookieConsentBanner.tsx` — 8+ strings
- `DatenschutzPage.tsx` — 50+ strings
- `ImpressumPage.tsx` — 50+ strings
- `CookieSettingsModal.tsx` — 15+ strings
- `LegalFooter.tsx` — 8+ strings

**Shared:**
- `ChatBubble.tsx`, `ChatInput.tsx`, `SocialLoginButton.tsx`, `QueueIndicator.tsx`, `EngagementBar.tsx`, `SessionTimer.tsx`

**Constants & Services:**
- `coaches.ts` — 6 full coach personas with German dialect system prompts
- `journeys.ts` — journey names, descriptions, dimension labels
- `introPrompts.ts` — prompt building functions with German markers
- `firebaseErrors.ts` — 15+ Firebase error message translations

## Decision

### 1. Translation Framework: react-i18next

**Choice:** `react-i18next` (React bindings for i18next)

**Rationale:**
- Most widely adopted React i18n solution (5M+ weekly npm downloads)
- Supports namespaces (grouping translations by feature area)
- Lazy-loading of language bundles (critical for 10+ languages)
- Pluralization, interpolation, context-aware translations built in
- ICU MessageFormat support for complex plurals (needed for Portuguese, Polish)
- Active maintenance and ecosystem (i18next-browser-languagedetector, i18next-http-backend)

**Alternatives considered:**
- `react-intl` (FormatJS) — strong for date/number formatting but weaker namespace/lazy-loading story
- `Lingui` — excellent DX with macro-based extraction, but smaller ecosystem
- Custom solution — not justified given mature library landscape

### 2. Translation File Structure

```
frontend/
├── locales/
│   ├── de/                          ← German (default / source language)
│   │   ├── common.json              ← shared: nav, buttons, errors, labels
│   │   ├── auth.json                ← login, register, password reset
│   │   ├── landing.json             ← WelcomePage, LandingPage
│   │   ├── journey.json             ← VUCA stations, bingo, dashboard
│   │   ├── profile.json             ← skill profile, activity history
│   │   ├── intro.json               ← intro sequence, coach selection, queue
│   │   ├── admin.json               ← management console, user admin
│   │   ├── legal.json               ← Datenschutz, Impressum, cookies
│   │   └── coaches.json             ← coach personas, system prompts
│   ├── en/
│   │   ├── common.json
│   │   ├── auth.json
│   │   └── ...                      ← same structure as de/
│   └── [locale]/                    ← future languages follow same pattern
│       └── ...
├── i18n/
│   ├── index.ts                     ← i18next initialization & config
│   ├── languageDetector.ts          ← browser language detection logic
│   └── types.ts                     ← TypeScript types for translation keys
```

**Namespace strategy:** One namespace per feature area. This enables:
- Lazy-loading only the namespaces needed for the current route
- Parallel translation work by different translators
- Clear ownership boundaries matching component structure

### 3. Translation Key Convention

```
namespace:section.element.variant
```

Examples:
```json
{
  "auth.login.title": "Melde dich an, um deine Reise fortzusetzen.",
  "auth.login.button": "Anmelden",
  "auth.login.forgotPassword": "Passwort vergessen?",
  "auth.register.title": "Erstelle ein Konto, um loszulegen.",
  "auth.register.button": "Konto erstellen",
  "auth.errors.invalidEmail": "Ungültige E-Mail-Adresse.",
  "auth.errors.networkError": "Netzwerkfehler. Bitte prüfe deine Internetverbindung."
}
```

### 4. AI Coach Internationalization Strategy

The coaches are the most complex i18n challenge. Each coach has a **personality, regional dialect, and cultural identity** that is intrinsically German.

**Approach: Locale-Adaptive Coach Personas**

```
coaches.json structure per locale:
{
  "susi": {
    "name": "Susi",
    "tagline": "Kreativ, warmherzig, sieht Kunst in allem",
    "systemPrompt": "Du bist Susi, eine warmherzige Künstlerin...",
    "dialect": "kölsch",
    "location": "Köln-Ehrenfeld"
  }
}
```

**Phase 1 (DE/EN):**
- German: Keep existing dialect-rich personas unchanged
- English: Create equivalent personas with English-speaking cultural anchors
  - Susi (Köln) → Susi (creative artist, warm, sees art in everything) — standard English with artistic flair
  - Karlshains (Schwaben) → Karl (hands-on tinkerer, pragmatic) — practical English
  - Coach personality is preserved; dialect flavor is adapted, not literally translated

**Phase 2+ (EU/SA):**
- Each language gets culturally adapted coach personas
- French Susi might speak with Parisian art-world references
- Brazilian Susi might reference São Paulo street art culture
- The *character archetype* stays consistent; the *cultural expression* adapts

**Technical implementation:**
- `coaches.json` per locale contains full persona definitions
- `introPrompts.ts` refactored to accept `locale` parameter
- System prompts include `{{language}}` and `{{dialect}}` template variables
- Gemini API calls include explicit language instruction: `"Respond in {{locale}} language."`

### 5. Date, Number & Formatting

**Use `Intl` API with dynamic locale:**

```typescript
// Centralized formatting utilities
const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

const formatRelativeTime = (date: Date, locale: string) =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(diff, unit);

const formatNumber = (num: number, locale: string) =>
  new Intl.NumberFormat(locale).format(num);
```

Replace all 3 hardcoded `de-DE` date formatting calls (UserAdmin, EmailBookingForm, CombinedProfile) and the custom relative-time logic in CombinedProfile.

### 6. Language Detection & Selection

**Detection priority (i18next-browser-languagedetector):**
1. User preference stored in localStorage (`fs_language`)
2. User profile setting (Firebase, if authenticated)
3. Browser `navigator.language`
4. Default fallback: `de`

**Language selector UI:**
- Globe icon in Layout header, next to profile/logout
- Dropdown with language name in its own script (e.g., "Deutsch", "English", "Français")
- Selection persisted to localStorage immediately, synced to Firebase profile on next auth event
- Page does NOT reload — React re-renders with new translations

### 7. HTML & Accessibility

```html
<html lang="de" dir="ltr">  <!-- dynamic based on locale -->
```

- `lang` attribute updated on `<html>` element when locale changes
- `dir` attribute set to `rtl` only if future Arabic/Hebrew support is added (not in scope for EU/SA phases)
- All `aria-label` attributes must use translated strings
- Font stack: Current `Outfit` + system sans-serif works well for Latin-script languages; no change needed for Phase 1-3

### 8. Translation Workflow

**Source of truth:** `locales/de/*.json` — German is the source language.

**Workflow:**
1. Developer adds/modifies German strings in `locales/de/*.json`
2. CI extracts changed keys and creates translation tasks
3. Professional translators (or AI-assisted + human review) produce target locale files
4. PR with new translations reviewed and merged
5. Missing keys fall back: target locale → `de` (German default)

**Translation tools (recommended):**
- **Phase 1:** Manual JSON editing (manageable for 2 languages)
- **Phase 2+:** Integrate with Crowdin, Lokalise, or Phrase for translator collaboration and TM (Translation Memory)

### 9. Legal Content Strategy

Legal pages (Datenschutz, Impressum, Cookie Policy) require **legally accurate** translations per jurisdiction, not just language translations.

- Datenschutz → Privacy Policy (GDPR-compliant English version)
- Impressum → Legal Notice (required by German law; other jurisdictions may not need this)
- Cookie consent text must comply with local ePrivacy regulations

**Approach:** Legal content stored as separate markdown/HTML files per locale, loaded dynamically. NOT translated via i18next — these require legal review per jurisdiction.

```
frontend/locales/de/legal/datenschutz.md
frontend/locales/en/legal/privacy-policy.md
frontend/locales/fr/legal/politique-confidentialite.md
```

## Language Rollout Plan

### Phase 1: DE + EN (MVP i18n)

| Step | Scope | Effort |
|------|-------|--------|
| 1 | Install react-i18next, configure, create `locales/de/` | S |
| 2 | Extract strings from 10 most critical components | L |
| 3 | Extract remaining 20+ components | L |
| 4 | Refactor coaches.ts → locale-aware coaches.json | M |
| 5 | Refactor introPrompts.ts with locale parameter | M |
| 6 | Replace hardcoded `de-DE` date formatting | S |
| 7 | Add language selector to Layout | S |
| 8 | Create `locales/en/` with all English translations | L |
| 9 | Create English coach personas | M |
| 10 | English legal content (legal review required) | M |

**Estimated: 500+ translation keys to extract, ~30 files to modify**

### Phase 2: EU Languages

| Language | Code | Priority | Notes |
|----------|------|----------|-------|
| French | fr | High | France + Belgium + Switzerland |
| Spanish | es | High | Spain (distinct from Latin American) |
| Italian | it | Medium | Italy + Swiss Italian |
| Portuguese | pt | Medium | Portugal (distinct from Brazilian) |
| Polish | pl | Medium | Large youth population |
| Dutch | nl | Medium | Netherlands + Belgium |
| Swedish | sv | Low | Nordics pilot |

- Coach personas culturally adapted per language
- Professional translation via Crowdin/Lokalise
- Legal content reviewed per jurisdiction

### Phase 3: South American Languages

| Language | Code | Priority | Notes |
|----------|------|----------|-------|
| Brazilian Portuguese | pt-BR | High | Largest SA market, distinct from pt |
| Latin American Spanish | es-419 | High | Covers most of SA, distinct from es |
| Quechua | qu | Low | Cultural inclusion, Peru/Bolivia/Ecuador |
| Guaraní | gn | Low | Cultural inclusion, Paraguay |

- Brazilian/LatAm coaches need entirely new cultural personas
- Consider local education system context in journey content
- Quechua/Guaraní may be AI-generated + community-reviewed (limited professional translators)

## Consequences

### Positive
- Product becomes accessible to 500M+ additional users across Europe and South America
- i18next is battle-tested, well-documented, TypeScript-native
- Namespace-based lazy loading keeps bundle size manageable even with 15+ languages
- Cultural coach adaptation creates authentic user experience per locale
- Fallback chain (target → de) ensures no blank strings during incremental translation

### Negative
- Significant upfront extraction effort (~500 strings across 30+ files)
- Every new feature must add translation keys — adds friction to development workflow
- Coach persona adaptation requires creative writing, not just translation
- Legal content requires jurisdiction-specific legal review (cost)
- Translation management tooling adds operational complexity in Phase 2+

### Risks
- **Quality risk:** Machine-translated strings feel inauthentic for a youth product
- **Dialect loss:** German coach dialects (Kölsch, Schwäbisch, Berlinerisch) are a unique product differentiator that doesn't translate
- **Maintenance burden:** N languages × M namespaces = N×M files to keep in sync
- **AI prompt quality:** Gemini's response quality may vary by language

### Mitigations
- Use professional translators for user-facing content; AI-assist only for first drafts
- Preserve dialect coaches as German-exclusive; create equivalent personality archetypes per locale
- Automated CI checks for missing translation keys
- Per-language Gemini prompt quality testing as part of QA

## Alternatives Considered

### 1. Translate entire app via Gemini at runtime
- **Rejected:** Latency (every string = API call), cost, inconsistency, no caching story, legal content cannot be AI-translated

### 2. Use browser-native `<meta translate>` + Google Translate widget
- **Rejected:** No control over quality, breaks React hydration, legal compliance impossible, terrible UX

### 3. Maintain separate codebases per language
- **Rejected:** Unmaintainable, divergent features, exponential cost

### 4. Start with English as source language
- **Rejected:** Current product identity is German-first; switching source language is disruptive and unnecessary. German remains source, English is first target.

## Dependencies

- FR-083: i18n Framework Setup & String Extraction
- FR-084: Multilingual AI Coach Personas
- FR-085: Language Selection UI & Locale Persistence
- FR-034: UI Theme System (language selector placement)
- FR-066: Cookie Consent Banner (must be translated)
- FR-067: Legal Placeholder Admin (legal content per locale)

## Related

- TC-023: Chat Dialog Architecture (prompts must become locale-aware)
- TC-020: Bot Fleet Identity (coach personas per locale)
- FR-005: Gemini Dialogue Engine (language parameter injection)
- FR-010: AI Coach Voice (TTS language must match UI locale)
- FR-054: Intro Sequence (heavily string-dependent)
- DC-001: VUCA Bingo Matrix (dimension names per language)
