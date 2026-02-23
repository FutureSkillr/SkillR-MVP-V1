# OBS-001: "Brand slug already exists" when editing brand details

**Status:** done
**Priority:** must
**Created:** 2026-02-23

## Problem
When editing brand details in the BrandConfigEditor admin panel, clicking "Speichern" returns the error **"Brand slug already exists"** instead of updating the brand.

## Root Cause

The `BrandConfigEditor` merges hardcoded partner brands (SSI_BRAND, CZ_BRAND, MA_BRAND) with DB brands. Hardcoded-only brands get `createdAt: 0`, and `startEdit()` uses this to decide POST (create) vs PUT (update):

```typescript
const notInDb = brand.createdAt === 0;
setIsNew(notInDb); // true → handleSave uses POST
```

**Two failure scenarios:**

1. **Brand seeded by migration but also hardcoded**: SSI brand exists in DB (seeded by migration 000025). If the `/api/brand` list fetch fails silently (`catch { /* ignore */ }`), SSI falls back to hardcoded-only with `createdAt: 0` → POST → 409 conflict.

2. **Previously onboarded brand**: User onboards a hardcoded brand (POST succeeds, brand now in DB). If they later try to edit it again while the DB fetch fails, it appears hardcoded-only again → POST → 409 conflict.

## Fix

In `handleSave()`, when `isOnboarding` is true and POST returns 409 (slug conflict), fall back to PUT (the brand already exists in DB). This makes the save resilient to the "DB fetch failed silently" scenario.

## Affected Files
- `frontend/components/admin/BrandConfigEditor.tsx` — `handleSave()` function

## Acceptance Criteria
- [ ] Editing a seeded brand (e.g., SSI) works even when initially shown as "Nur lokal"
- [ ] Onboarding a hardcoded brand that already exists in DB does not error
- [ ] Normal create (truly new slug) still works
- [ ] Normal edit (brand from DB) still works

## Notes
- The silent `catch { /* ignore */ }` in `loadBrands()` is a contributing factor but not fixed here — a separate improvement could add error feedback when the brand list fails to load.
