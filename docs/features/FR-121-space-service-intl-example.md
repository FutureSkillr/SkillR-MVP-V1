# FR-121: Space Service International Example Partner

**Status:** specified
**Priority:** must
**Created:** 2026-02-23

## Problem
The partner system needs a real-world example to validate the design and serve as a demo. Space Service International (SSI) in Mittweida, Germany is the first SkillR Bildungspartner with existing sponsored content (pack 003 "Abenteuer Weltraum", 3 Space Lernreisen).

## Solution
Seed data, brand config, and hardcoded fallback constants for SSI:

### Database (migration 000025)
- `brand_configs` row: slug `space-service-intl`, navy/cyan theme, SSI legal info
- `brand_content_packs` junction: links pack 003 to SSI brand

### Frontend Constants
- `SSI_BRAND: BrandConfig` — full brand config with `#1e3a5f` primary / `#4fc3f7` accent
- `SSI_PARTNER_DESCRIPTION` — museum facts: 152 exhibitions, 100K+ objects, 20M+ visitors, Silberner Meridian 2024
- `SSI_KEY_FACTS` — structured facts array for preview page
- `SSI_LERNREISE_IDS` — 3 IDs for space Lernreisen

### Frontend Fallback
- `fetchPartnerData('space-service-intl')` returns hardcoded data when API is unavailable
- Uses `DEFAULT_LERNREISEN` filtered by SSI IDs

## Partner Facts
- **Company:** Space Service International, Rochlitzer Str. 62, 09648 Mittweida
- **Contact:** Tasillo Roemisch, +49 3727 90811
- **Museum:** 152 Ausstellungen, 100.000+ Objekte, 20 Millionen+ Besucher weltweit
- **Award:** Silberner Meridian 2024

## Content Pack 003: Abenteuer Weltraum
| Lernreise | Journey Type | Location |
|-----------|-------------|----------|
| Kosmonautentraining | VUCA | Mittweida |
| Gagarins Spuren folgen | Unternehmergeist | Baikonur |
| Mission Mars | Selbstlernen | Cape Canaveral |

## Acceptance Criteria
- [ ] SSI brand seeded in `brand_configs` via migration 000025
- [ ] Pack 003 linked to SSI in `brand_content_packs`
- [ ] Frontend fallback returns 3 Lernreisen for `space-service-intl`
- [ ] `?partner=space-service-intl` renders navy/cyan themed preview
- [ ] API endpoint returns SSI data when DB is available

## Dependencies
- FR-119: Partner Preview Page
- FR-116: Lernreise Content Pack
- Migration 000024: content_packs_meta (pack 003 seed)
- Migration 000025: brand_content_packs (SSI brand + link)

## Notes
- SSI serves as the template for future partner onboarding
- Hardcoded fallback ensures the demo works even without a running backend
