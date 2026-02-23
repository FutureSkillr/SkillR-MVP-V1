# FR-123: Hard-coded Brand Onboarding

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-23

## Problem

New partners go through a two-phase lifecycle: first they're prototyped as hardcoded frontend constants (for rapid iteration and offline fallback), then they need to be persisted to the database so their brand config, content packs, Lernreisen, and brand-pack links are available to the full platform. This manual re-creation is tedious, error-prone, and means content packs are missing until the DB is seeded.

## Solution

### Phase 1: Hardcoded Constants (Frontend)

Each partner is defined as a set of frontend constants in `frontend/constants/partners/`:

| Export | Purpose |
|--------|---------|
| `*_BRAND: BrandConfig` | Full brand config for offline fallback |
| `*_SUMMARY: PartnerSummary` | Lightweight card data for partner listings |
| `*_LERNREISE_IDS: string[]` | Associated Lernreise IDs |
| `*_PARTNER_DESCRIPTION: string` | Preview page copy |
| `*_KEY_FACTS: array` | Key facts for preview page |

The partner service merges API data with hardcoded constants, so partners are always visible even when the backend is unavailable.

### Phase 2: Database Seed (Migration)

A migration seeds the complete partner data into the database:

| Table | Data |
|-------|------|
| `content_packs` | Pack metadata (id, name, description, sponsor) |
| `content_pack_lernreisen` | Lernreise definitions (3 per pack) |
| `brand_configs` | Brand config JSON (theme, legal, contact, etc.) |
| `brand_content_packs` | Link between brand and its content pack |

All INSERTs use `ON CONFLICT DO NOTHING` so they're safe to re-run.

### Phase 3: Admin Panel Onboarding

The admin panel merges hardcoded partners into the brand list. Partners not yet in the DB appear with a "Nur lokal" badge and can be persisted with one click:

```
Hardcoded constant → "Nur lokal" badge in admin
        |
        v
Admin clicks "Bearbeiten" → pre-filled form, slug locked
        |
        v
Admin clicks "In Datenbank speichern" → POST /api/brand
        |
        v
Brand in DB → badge gone, content packs + Lernreisen available
```

### Full Partner Onboarding Checklist

When adding a new partner, complete all steps:

1. **Frontend constants** — create `frontend/constants/partners/<name>.ts`
   - Export `*_BRAND`, `*_SUMMARY`, `*_LERNREISE_IDS`, `*_PARTNER_DESCRIPTION`, `*_KEY_FACTS`
2. **Lernreise definitions** — add 3 entries to `frontend/constants/lernreisen.ts`
   - Each with unique ID, location, character, dimensions
3. **Partner service** — register in `frontend/services/partner.ts`
   - Import constants, add to `HARDCODED_PARTNERS` array, add fallback entry in `fetchPartnerData()`
4. **Database migration** — create `backend/migrations/000NNN_seed_partner_<name>.up.sql`
   - `content_packs` row (pack metadata)
   - `content_pack_lernreisen` rows (3 Lernreisen)
   - `brand_configs` row (full brand config JSON)
   - `brand_content_packs` row (brand → pack link)
5. **Admin panel** — add import to `BrandConfigEditor.tsx` hardcoded array
6. **Run migration** — `migrate up` or restart backend
7. **Verify** — partner card visible, preview page works, admin shows no "Nur lokal" badge, content packs listed

### Merge Logic

```
fetchPartnerList():                    BrandConfigEditor.loadBrands():
  1. Fetch API partners                  1. Fetch DB brands via GET /api/brand
  2. Collect hardcoded summaries         2. Collect hardcoded brands
  3. Deduplicate by slug                 3. Deduplicate by slug
  4. Return merged list                  4. Mark hardcoded-only as createdAt=0
```

## Acceptance Criteria

- [ ] Admin panel shows all hardcoded partners even if not in DB
- [ ] "Nur lokal" badge visible on brands not yet in database
- [ ] Clicking "Bearbeiten" on a local brand opens pre-filled form with locked slug
- [ ] Form shows "In Datenbank speichern" button (not "Brand erstellen")
- [ ] After saving, list refreshes and "Nur lokal" badge is gone
- [ ] Hardcoded constants remain as offline fallback regardless of DB state
- [ ] Partner cards on WelcomePage/LandingPage merge API + hardcoded data
- [ ] Content packs seeded in migration with Lernreisen and brand-pack links
- [ ] Partner preview pages work for all 3 partners (with and without backend)
- [ ] `lernreisenCount` badge shows correct count on partner cards

## Dependencies

- FR-119: Partner preview page
- FR-120: Partner content pack admin

## Database Tables

```
content_packs                    brand_configs
  id (PK)                          slug (PK)
  name                             config (JSONB)
  description                      is_active
  sponsor                          created_at / updated_at
  default_enabled
        |
        v
content_pack_lernreisen          brand_content_packs
  id (PK)                          brand_slug (FK → brand_configs)
  pack_id (FK → content_packs)     pack_id (FK → content_packs)
  title, subtitle, ...             is_active
  dimensions, sort_order           updated_by
```

## Current Partners

| Slug | Brand | Pack ID | Pack Name | Lernreisen | Migration |
|------|-------|---------|-----------|------------|-----------|
| `space-service-intl` | Space Service International | 003 | Abenteuer Weltraum | 3 | 000024, 000025 |
| `carls-zukunft` | Carls Zukunft | 004 | Zukunftsdenken | 3 | 000026 |
| `maindset-academy` | maindset.ACADEMY | 005 | KI-gestuetztes Lernen | 3 | 000026 |

## Files

| File | Purpose |
|------|---------|
| `frontend/constants/partners/spaceServiceIntl.ts` | SSI hardcoded constants |
| `frontend/constants/partners/carlsZukunft.ts` | CZ hardcoded constants |
| `frontend/constants/partners/maindsetAcademy.ts` | MA hardcoded constants |
| `frontend/constants/lernreisen.ts` | All Lernreise definitions (19 total) |
| `frontend/services/partner.ts` | Partner fetch + merge logic |
| `frontend/components/admin/BrandConfigEditor.tsx` | Admin panel with onboarding |
| `backend/migrations/000026_seed_partners_cz_ma.up.sql` | DB seed for CZ + MA |
