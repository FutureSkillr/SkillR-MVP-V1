# FR-086: Partner Branding System

**Status:** done
**Priority:** should
**Created:** 2026-02-22

## Problem

All brand text (name, taglines, copyright, contact emails, logos) was hardcoded across ~15 frontend components. Partners and sponsors need branded showrooms at `{slug}.maindset.academy` subdomains without code changes per TC-030.

## Solution

Runtime branding system with:
- `BrandConfig` type with 16 brandable tokens
- `BrandProvider` React context with `useBrand()` hook
- Subdomain-based tenant resolution
- Brand CRUD API (`/api/brand/:slug`)
- SQLite storage for brand configs
- Admin UI (BrandConfigEditor) in Management Console
- CSS custom properties for theme colors
- AI prompt parameterization for per-brand coach identity

## Acceptance Criteria

- [x] BrandConfig interface defined with all 16 tokens
- [x] Default brand constants file with Future SkillR defaults
- [x] Subdomain resolution: `{slug}.maindset.academy` in production, `?sponsor=slug` in dev
- [x] BrandProvider wraps App, resolves brand on mount
- [x] CSS custom properties `--brand-primary` and `--brand-accent` set at runtime
- [x] Brand CRUD API: GET public, POST/PUT/DELETE admin-only
- [x] SQLite `brand_configs` table created on startup
- [x] All 11 components migrated from hardcoded text to `useBrand()`
- [x] `prompts.ts` converted to parameterized functions
- [x] BrandConfigEditor with WCAG contrast preview in admin console
- [x] Sponsor label ("Supported by ...") in footer for partner brands
- [x] Default brand loads unchanged when no partner slug present

## Dependencies

- TC-034: Partner Branding System (architecture decision)
- TC-030: Multi-Tenant Showrooms (specifies subdomain approach)
- BC-011: Sponsor Showrooms (business concept)

## Notes

### Files Created
- `frontend/types/brand.ts` — BrandConfig interface
- `frontend/constants/defaultBrand.ts` — DEFAULT_BRAND
- `frontend/services/tenant.ts` — subdomain slug resolution
- `frontend/contexts/BrandContext.tsx` — BrandProvider + useBrand()
- `frontend/server/routes/brand.ts` — CRUD API
- `frontend/components/admin/BrandConfigEditor.tsx` — admin editor UI

### Files Modified
- `frontend/index.tsx` — wrapped App in BrandProvider
- `frontend/styles/globals.css` — added CSS custom property defaults
- `frontend/server/db.ts` — added brand_configs table
- `frontend/server/index.ts` — registered brand routes
- `frontend/types/admin.ts` — added 'branding' tab type
- `frontend/types/index.ts` — exported brand types
- `frontend/components/admin/AdminConsole.tsx` — added Branding tab
- `frontend/services/prompts.ts` — converted to parameterized functions
- 9 components migrated to useBrand()

### Partner Onboarding Procedure
1. Partner provides: org name, logo, primary color, contact email, legal details
2. Admin creates brand via Branding tab in Management Console
3. System validates slug format, WCAG contrast, required fields
4. DNS wildcard `*.maindset.academy` serves all subdomains
5. Partner accesses `{slug}.maindset.academy` — BrandProvider loads their config
