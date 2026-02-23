# BC-011: Content-Pack

**Status:** draft
**Created:** 2026-02-23

## Concept

A **Content-Pack** is the curated bundle of Lernreisen that is currently offered to a user. It is the delivery vehicle for all learning experiences visible in the globe view.

### Phase 1 — Static Default Pack

In the initial release, the Content-Pack is **static**: every user sees the same 10 default Lernreisen alongside the 3 abstract journey types. This seed pack establishes the format and proves the user experience. The backend serves it via `GET /api/v1/content-pack`; the frontend falls back to hardcoded defaults if the API is unavailable.

### Phase 2 — Dynamic Personalized Packs

As the platform matures, the Content-Pack becomes **dynamic and personalized**. The system assembles a unique pack for each user based on their profile, history, and pedagogical goals. The pack is refreshed periodically (e.g., weekly) and may differ for every user.

## Content Categories

Each Content-Pack contains Lernreisen organized into categories:

| Category | Purpose | Selection Logic |
|----------|---------|----------------|
| **Latest Additions** | Newly created Lernreisen | Sorted by `created_at` descending; anything added since the user's last visit |
| **Hot Topics** | Trending or popular Lernreisen | Based on completion rates, engagement metrics, or editorial curation |
| **Controversial** | Provocative or debate-worthy topics | Editorially curated; designed to challenge assumptions and spark reflection |
| **Contrary** | Deliberately opposite to the user's current interests | Gegensatzsuche principle (DC-002): selected by inverting the user's strongest dimensions to expand their horizon |

The **Contrary** category is the most distinctive — it implements the Gegensatzsuche (deliberate opposite search) at the content level. If a user's profile shows strong technical/analytical interests, the Contrary section might surface Lernreisen about art, nature, or social work. This ensures the Moeglichkeitsraum (DC-003) remains wide and prevents filter-bubble narrowing.

## Pack Assembly Rules

1. **Minimum variety**: A pack must contain Lernreisen from at least 2 of the 3 journey types (vuca, entrepreneur, self-learning).
2. **Contrary quota**: At least 20% of the pack must be from the Contrary category.
3. **No repetition**: Completed Lernreisen may appear (as "done") but do not count toward the minimum pack size.
4. **Freshness**: At least 1 item from Latest Additions if any exist.
5. **Pack size**: 8-15 Lernreisen per pack (enough for choice, not overwhelming).

## Data Model

The Content-Pack is stored in `content_pack_lernreisen` (PostgreSQL). Each Lernreise has:
- Metadata: id, title, subtitle, description, icon, location, coordinates
- Pedagogical mapping: journey_type, dimensions
- Narrative: setting, character_name, character_desc
- Ordering: sort_order

In Phase 2, a `content_pack_assignments` table maps users to their personalized packs.

## Value Proposition

- **For users**: A fresh, curated selection that grows with them and challenges them
- **For the platform**: A lever for engagement, retention, and pedagogical depth
- **For sponsors (BC-007)**: Branded or sponsored Lernreisen can be injected into packs for specific user segments

## Related Concepts

- DC-002: Gegensatzsuche — underpins the Contrary category
- DC-003: Moeglichkeitsraum — Content-Pack keeps it wide
- BC-001: Life-Long Learning Trajectory — pack evolves with the user's trajectory
- FR-116: Initial implementation with 10 default Lernreisen
