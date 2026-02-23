# FR-124: Content Pack Editor

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-23

## Problem

Content packs and their Lernreisen can currently only be created via SQL migrations. The admin UI (BrandConfigEditor) only supports toggling pack activation per brand — there is no way to create, edit, or manage packs or Lernreisen through the interface. This forces every content change through a developer, blocking partner onboarding velocity.

## Solution

Add a "Content Packs" tab to the Management Console with full CRUD for packs and their Lernreisen. This is the **admin-facing** foundation that FR-080 (Lernreise Editor) will later build on for sponsor-facing tiers.

### Pack CRUD
- List all content packs with Lernreise count
- Create new content pack (id, name, description, sponsor, default_enabled)
- Edit existing pack metadata
- Delete pack (CASCADE removes lernreisen + brand links)

### Lernreise CRUD
- List Lernreisen within a pack, ordered by sort_order
- Add Lernreise to a pack (all 15 fields: id, title, subtitle, description, icon, journeyType, location, lat, lng, setting, character_name, character_desc, dimensions, sort_order, pack_id)
- Edit Lernreise fields
- Remove Lernreise from a pack

### Lernreise Reordering
- Up/down controls for sort_order within a pack
- Batch reorder via PUT endpoint

### Inline Preview
- Live Lernreise card preview while editing (icon, title, subtitle, location, journey type badge)

### Validation
- Unique IDs (pack and Lernreise)
- Required fields: id, name (pack); id, title, journeyType, packId (Lernreise)
- Valid journey types: vuca, entrepreneur, self-learning
- Lat/lng ranges: lat -90..90, lng -180..180
- Dimension whitelist: complexity, uncertainty, curiosity, self-direction, reflection, creativity, initiative, adaptability, resilience, volatility, ambiguity

### Permissions
- Admin role only (reuses existing Firebase auth middleware + RequireAdmin)

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/content-packs` | List all packs with Lernreise count |
| POST | `/api/admin/content-packs` | Create new pack |
| PUT | `/api/admin/content-packs/:id` | Update pack metadata |
| DELETE | `/api/admin/content-packs/:id` | Delete pack + cascade |
| GET | `/api/admin/content-packs/:id/lernreisen` | List Lernreisen in a pack |
| POST | `/api/admin/content-packs/:id/lernreisen` | Add Lernreise to pack |
| PUT | `/api/admin/content-packs/:id/lernreisen/:lrId` | Edit Lernreise |
| DELETE | `/api/admin/content-packs/:id/lernreisen/:lrId` | Remove Lernreise |
| PUT | `/api/admin/content-packs/:id/lernreisen/order` | Reorder Lernreisen |

## Acceptance Criteria

- [ ] "Content Packs" tab visible in Management Console for admin users
- [ ] Admin can create, edit, and delete content packs
- [ ] Admin can add, edit, remove, and reorder Lernreisen within a pack
- [ ] Pack deletion cascades to lernreisen and brand_content_packs links
- [ ] Lernreise card preview updates live while editing
- [ ] Validation prevents invalid data (missing required fields, invalid IDs, out-of-range coordinates)
- [ ] All CRUD operations require admin authentication
- [ ] Changes are immediately reflected in the public content pack API

## Dependencies

- FR-116 (Content Pack) — data model and read API
- FR-119 (Partner Preview Page) — brand-pack junction table
- FR-120 (Partner Content Pack Admin) — brand-scoped read-only view
- FR-123 (Hard-coded Brand Onboarding) — migration-based seeding (replaced by this FR)

## Notes

- FR-080 (Lernreise Editor) is the future sponsor-facing editor (Professional/Enterprise tier). FR-124 is the admin-facing foundation.
- Migration 000027 adds ON DELETE CASCADE to content_pack_lernreisen.pack_id and brand_content_packs.pack_id foreign keys.
