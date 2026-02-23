# OBS-002: "Nur lokal" badge persists after brand was saved to DB

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem
After successfully onboarding a hardcoded brand into the database, the "Nur lokal" badge still appears next to the brand name in the BrandConfigEditor list.

## Root Cause

Two contributing factors:

### 1. `loadBrands()` silently swallows fetch errors
```typescript
try {
  const res = await fetch('/api/brand', { headers });
  if (res.ok) dbBrands = await res.json();
} catch { /* ignore */ }
```
If the fetch fails (network, auth, server error) or returns non-200, `dbBrands` stays empty. All hardcoded brands then appear as "extras" with `createdAt: 0`, showing "Nur lokal" — even for brands that ARE in the database.

### 2. No optimistic state update after save
After `handleSave` succeeds, `loadBrands()` is called but not awaited. The list briefly shows old state with `createdAt: 0`. If the re-fetch fails silently, the badge persists permanently until a page reload with a working API.

## Fix

1. **Surface `loadBrands` errors**: When the DB fetch fails, show a warning banner so the admin knows the list may be stale.
2. **Optimistic update after onboarding**: After successful onboarding save, update the brand in local `brands` state with `createdAt: Date.now()` so "Nur lokal" disappears immediately, independent of the re-fetch.

## Affected Files
- `frontend/components/admin/BrandConfigEditor.tsx` — `loadBrands()` and `handleSave()`

## Acceptance Criteria
- [ ] After onboarding a brand, "Nur lokal" badge disappears immediately
- [ ] If `/api/brand` fetch fails, a warning message is shown to the admin
- [ ] Brands from the DB never show the "Nur lokal" badge

## Dependencies
- OBS-001: Brand slug conflict on edit (same area of code)
