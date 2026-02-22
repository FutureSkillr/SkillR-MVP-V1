# FR-083: i18n Framework Setup & String Extraction

**Status:** draft
**Priority:** must
**Created:** 2026-02-21
**Entity:** SkillR
**Gate:** closed

## Problem

The app has 500+ hardcoded German strings across 30+ components with no internationalization infrastructure. Adding any second language is currently impossible without duplicating the entire frontend.

## Solution

Install `react-i18next` with supporting packages, configure the i18n system, extract all hardcoded strings into namespaced JSON translation files, and wrap all user-facing text in translation function calls (`t()`).

### Implementation Steps

1. **Install dependencies:**
   - `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`

2. **Create i18n configuration:**
   - `frontend/i18n/index.ts` — init i18next with namespace config, fallback `de`, lazy loading
   - `frontend/i18n/languageDetector.ts` — localStorage → browser → `de` fallback
   - `frontend/i18n/types.ts` — TypeScript types for translation keys (type-safe `t()` calls)

3. **Create German source translation files:**
   - `frontend/locales/de/common.json` — nav, buttons, errors, labels
   - `frontend/locales/de/auth.json` — login, register, password reset
   - `frontend/locales/de/landing.json` — WelcomePage, LandingPage
   - `frontend/locales/de/journey.json` — VUCA stations, bingo, dashboard
   - `frontend/locales/de/profile.json` — skill profile, activity history
   - `frontend/locales/de/intro.json` — intro sequence, coach selection, queue
   - `frontend/locales/de/admin.json` — management console, user admin
   - `frontend/locales/de/legal.json` — cookie consent (not full legal pages)
   - `frontend/locales/de/coaches.json` — coach personas, taglines

4. **Refactor components:**
   - Replace every hardcoded string with `t('namespace:key')`
   - Replace hardcoded `de-DE` locale parameters in date/number formatting with dynamic locale from i18n context
   - Update `firebaseErrors.ts` to use translation keys
   - Update `coaches.ts` and `journeys.ts` constants to load from translation files

5. **Create English translations:**
   - `frontend/locales/en/*.json` — professional English translations of all namespaces

6. **Add `<html lang>` dynamic attribute:**
   - Update `index.html` and React root to set `lang` attribute based on active locale

## Acceptance Criteria

- [ ] `react-i18next` installed and initialized with lazy-loading namespace config
- [ ] All 500+ hardcoded German strings extracted to `locales/de/*.json` files
- [ ] All 30+ components refactored to use `t()` function calls — zero remaining hardcoded user-facing text
- [ ] TypeScript types generated for translation keys — `t()` calls are type-checked
- [ ] All `de-DE` hardcoded locale parameters replaced with dynamic locale
- [ ] `firebaseErrors.ts` uses translation keys
- [ ] English translation files `locales/en/*.json` complete for all namespaces
- [ ] `<html lang>` attribute updates dynamically on language change
- [ ] Fallback chain works: missing EN key falls back to DE string
- [ ] App renders identically in German after extraction (no visual regressions)
- [ ] Unit tests pass with mocked i18n provider
- [ ] Bundle size increase < 50KB gzipped for i18next + 2 language bundles

## Dependencies

- TC-031: Internationalization Architecture (architecture decision)

## Notes

- German is the source language. English is the first target.
- Legal pages (Datenschutz, Impressum) are NOT translated via i18next — they require legally reviewed content per jurisdiction. Only cookie consent UI strings go through i18next.
- Admin console strings are lower priority but should be extracted in the same pass for completeness.
- Coach system prompts in `coaches.json` are treated as translatable content, but require creative adaptation, not literal translation (see FR-084).
