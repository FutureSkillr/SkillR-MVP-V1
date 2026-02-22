# FR-085: Language Selection UI & Locale Persistence

**Status:** draft
**Priority:** must
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY
**Gate:** closed

## Problem

There is no mechanism for users to select their preferred language. The app has no language detection, no locale context provider, and no persistence of language preference. When i18n support lands (FR-083), users need a way to discover and switch languages.

## Solution

### 1. Language Selector Component

A compact language selector in the app header (Layout.tsx), positioned next to the profile/logout controls.

**Design:**
- Globe icon button that opens a dropdown
- Each language shown in its own name: "Deutsch", "English", "Français" (not "German", "English", "French")
- Current language highlighted
- Compact on mobile (icon only, dropdown on tap)
- No page reload — React re-renders instantly with new locale

### 2. Language Detection Priority

Using `i18next-browser-languagedetector` with this priority order:

1. **localStorage** (`fs_language`) — user's explicit prior choice
2. **Firebase user profile** (`preferredLocale` field) — synced across devices
3. **Browser** (`navigator.language`) — OS/browser setting
4. **Default:** `de` — German fallback

### 3. Persistence Strategy

| Storage | When Written | Purpose |
|---------|-------------|---------|
| localStorage `fs_language` | On language switch (immediate) | Fast local persistence |
| Firebase `users/{uid}/preferredLocale` | On next authenticated API call | Cross-device sync |
| URL parameter `?lang=en` | Optional, for sharing links in specific language | Marketing/sharing |

### 4. Pre-Auth Language Handling

Before the user is authenticated:
- Language detected from localStorage → browser → default
- Language selector is available on LoginPage, WelcomePage, LandingPage
- Selection stored in localStorage only
- On successful auth, localStorage preference is synced to Firebase profile

### 5. Context Provider

```typescript
// LocaleProvider wraps the app, provides current locale to all components
<I18nextProvider i18n={i18n}>
  <App />
</I18nextProvider>
```

All components access locale via `useTranslation()` hook — no prop drilling.

### 6. HTML Integration

- `<html lang="de">` → `<html lang="en">` dynamically on switch
- `<meta name="language">` updated
- OpenGraph and social sharing tags include locale

## Acceptance Criteria

- [ ] Language selector component renders in Layout header on all pages
- [ ] Available languages: German (de), English (en) for Phase 1
- [ ] Language names displayed in their own script ("Deutsch", "English")
- [ ] Switching language re-renders UI instantly without page reload
- [ ] Selection persisted to localStorage immediately
- [ ] Selection synced to Firebase `preferredLocale` for authenticated users
- [ ] On fresh visit, language detected from localStorage → browser → `de`
- [ ] `?lang=en` URL parameter overrides detection (one-time, then persisted)
- [ ] `<html lang>` attribute updates on language change
- [ ] Language selector accessible via keyboard and screen reader
- [ ] Mobile: compact icon-only trigger with dropdown
- [ ] Desktop: icon + current language name with dropdown
- [ ] WelcomePage and LoginPage show language selector before auth

## Dependencies

- FR-083: i18n Framework Setup & String Extraction
- TC-031: Internationalization Architecture

## Notes

- Do not add language flags (country flags) as language indicators — flags represent countries, not languages (e.g., Portuguese is spoken in Portugal and Brazil, Spanish in Spain and 20+ countries). Use language names in their own script instead.
- The language selector should be subtle, not prominent — most users will use the auto-detected language. It's an escape hatch, not a primary feature.
- For Phase 2+, the dropdown naturally extends with more languages. Consider grouping by region if the list exceeds 8 languages.
- RTL language support (Arabic, Hebrew) is explicitly out of scope for Phases 1-3 — all target languages use Latin script.
