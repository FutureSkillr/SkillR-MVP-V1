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

### Raw Video Submission (Partner-facing)

Content partners can submit raw material for a new Lernreise directly from the Content Pack Editor. The submission feeds into the didactics team's review pipeline (IFR-002). Partners do not build the Lernreise themselves — they provide the raw ingredients; our content agents and expert didactics team handle the rest.

#### Video Set Model

Each submission is a **Video Set** consisting of:

| Slot | Required | Purpose |
|------|----------|---------|
| **Video A** — "Video in Scope" | Yes (one of the three input options) | The core learning material — the thing to learn, the skill in action, the process to understand |
| **Video B** — "Runbook" | No | The accompanying guide — explanations, context, background knowledge needed to make sense of Video A |

#### Three Input Options

Partners choose one of three ways to provide their material per slot:

| Option | Input | What the partner provides |
|--------|-------|--------------------------|
| **Raw video upload** | File upload via LFS-Proxy | Raw video file (mp4, mov, webm). Lands in `s3://{room-id}/raw/{partner-id}/` staging inbox |
| **YouTube link** | URL field | Link to an existing YouTube video. Our content agents extract and process it |
| **Text description** | Free-text field | Written description of the intent, the skill, the context. Content agents generate the Lernreise from text alone |

Video A and Video B can each use a different input option (e.g., Video A as YouTube link, Video B as text description).

#### Submission Form

```
┌─────────────────────────────────────────────────┐
│  Neue Lernreise einreichen                      │
│                                                 │
│  Titel (Arbeitstitel)                           │
│  ┌─────────────────────────────────────────┐    │
│  │ e.g. "CNC-Fraesen in der Praxis"       │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ── Video A: Video in Scope ──────────────────  │
│                                                 │
│  ○ Video hochladen  ○ YouTube-Link  ○ Text     │
│  ┌─────────────────────────────────────────┐    │
│  │ [Datei auswaehlen] oder URL oder Text   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ── Video B: Runbook (optional) ──────────────  │
│                                                 │
│  ○ Video hochladen  ○ YouTube-Link  ○ Text     │
│  ┌─────────────────────────────────────────┐    │
│  │ [Datei auswaehlen] oder URL oder Text   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Notizen an das Didaktik-Team                   │
│  ┌─────────────────────────────────────────┐    │
│  │ Freitext: Kontext, Zielgruppe, was      │    │
│  │ die Lernenden mitnehmen sollen ...      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [ Einreichen ]                                 │
│                                                 │
│  Status: Entwurf → Eingereicht → In Pruefung    │
│          → Lernreise erstellt                   │
└─────────────────────────────────────────────────┘
```

#### Submission Lifecycle

| Status | Who | What happens |
|--------|-----|--------------|
| **Entwurf** | Partner | Filling out the form. Can save and return later |
| **Eingereicht** | Partner | Submits the video set. `videoset.submitted` event published to KafScale Broker |
| **In Pruefung** | Didactics team + content agents | Raw material reviewed. Videos processed via IFR-002 pipeline. Content agents extract structure, generate Lernreise draft |
| **Lernreise erstellt** | Didactics team | Lernreise is live in the content pack. Partner notified via `videoset.completed` event |
| **Abgelehnt** | Didactics team | Material unsuitable. Partner notified with feedback via `videoset.rejected` event |

#### Event Integration

| Event | Producer | Consumer |
|-------|----------|----------|
| `videoset.submitted` | Content Pack Editor | Didactics review queue, content agents |
| `videoset.in_review` | Didactics team | Partner notification |
| `videoset.completed` | Didactics team | Partner notification, content pack update |
| `videoset.rejected` | Didactics team | Partner notification with feedback |

### Permissions
- Admin role only for pack/Lernreise CRUD (reuses existing Firebase auth middleware + RequireAdmin)
- Partner role (`sponsor_admin` or `partner_admin`) for raw video submission within their own packs

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
| POST | `/api/admin/content-packs/:id/submissions` | Submit raw video set for Lernreise creation |
| GET | `/api/admin/content-packs/:id/submissions` | List submissions for a pack |
| GET | `/api/admin/content-packs/:id/submissions/:subId` | Get submission detail + status |
| PUT | `/api/admin/content-packs/:id/submissions/:subId` | Update submission (save draft, add notes) |
| POST | `/api/admin/content-packs/:id/submissions/:subId/submit` | Move from Entwurf → Eingereicht |

## Acceptance Criteria

- [ ] "Content Packs" tab visible in Management Console for admin users
- [ ] Admin can create, edit, and delete content packs
- [ ] Admin can add, edit, remove, and reorder Lernreisen within a pack
- [ ] Pack deletion cascades to lernreisen and brand_content_packs links
- [ ] Lernreise card preview updates live while editing
- [ ] Validation prevents invalid data (missing required fields, invalid IDs, out-of-range coordinates)
- [ ] All CRUD operations require admin authentication
- [ ] Changes are immediately reflected in the public content pack API
- [ ] Partner can submit a raw video set (Video A + optional Video B) for Lernreise creation
- [ ] Each video slot accepts one of three input options: file upload, YouTube link, or text description
- [ ] Video A and Video B can use different input options independently
- [ ] Raw video uploads land in the LFS-Proxy staging inbox, not on the CDN
- [ ] Submission form can be saved as draft and resumed later
- [ ] Submitted video sets emit `videoset.submitted` event to KafScale Broker
- [ ] Partner sees submission status (Entwurf → Eingereicht → In Pruefung → Lernreise erstellt / Abgelehnt)
- [ ] Partner receives notification when the didactics team completes or rejects a submission

## Dependencies

- FR-116 (Content Pack) — data model and read API
- FR-119 (Partner Preview Page) — brand-pack junction table
- FR-120 (Partner Content Pack Admin) — brand-scoped read-only view
- FR-123 (Hard-coded Brand Onboarding) — migration-based seeding (replaced by this FR)
- IFR-001 (Lerning-Data-Room Integration) — KafScale Broker for video set events
- IFR-002 (Video CDN Stage) — LFS-Proxy for raw video uploads and the didactics review pipeline

## Notes

- FR-080 (Lernreise Editor) is the future sponsor-facing editor (Professional/Enterprise tier). FR-124 is the admin-facing foundation.
- Migration 000027 adds ON DELETE CASCADE to content_pack_lernreisen.pack_id and brand_content_packs.pack_id foreign keys.
