# FR-131: Video Upload via LFS-Proxy in Content Pack Editor

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-24

## Problem

The Content Pack Editor (FR-124) specifies optional raw video uploads per Lernreise (Video A "Video in Scope" + Video B "Runbook"), but the actual upload mechanism is not yet implemented. The browser needs a way to upload large video files (potentially multi-GB) with progress tracking, retry, and integration with the Lerning-Data-Room's LFS-Proxy.

The E72 Browser LFS SDK demo (`frontend/integration-modules/E72_browser-lfs-sdk-demo/`) provides a proven reference implementation for browser-native large file uploads via LFS-Proxy. This FR captures the integration of that upload capability into the Content Pack Editor's Lernreise form.

## Solution

Integrate the E72 Browser LFS SDK pattern into the Content Pack Editor so that partners and admins can optionally upload reference videos when creating or editing a Lernreise. Uploaded videos land in the LFS-Proxy staging inbox for didactics team review — they do not go directly to the CDN.

### Video Set Model (per Lernreise)

Each Lernreise can optionally include a **Video Set** consisting of two slots:

| Slot | Required | Purpose |
|------|----------|---------|
| **Video A** — "Video in Scope" | Optional (one of three input options) | The core learning material — the thing to learn, the skill in action, the process to understand |
| **Video B** — "Runbook" | Optional | The accompanying guide — explanations, context, background knowledge needed to make sense of Video A |

### Three Input Options per Slot

Partners choose one of three ways to provide material per video slot:

| Option | Input | What the partner provides |
|--------|-------|--------------------------|
| **Raw video upload** | File upload via LFS-Proxy (E72 SDK) | Raw video file (mp4, mov, webm). Lands in `s3://{room-id}/raw/{partner-id}/` staging inbox |
| **YouTube link** | URL field | Link to an existing YouTube video. Content agents extract and process it |
| **Text description** | Free-text field | Written description of the intent, the skill, the context. Content agents generate the Lernreise from text alone |

Video A and Video B can each use a different input option independently.

### Upload Integration (E72 SDK Pattern)

The upload component adapts the `LfsProducer` class from E72:

```typescript
// Adapted from E72_browser-lfs-sdk-demo/index.html LfsProducer
const producer = new LfsProducer({
  endpoint: '/api/lfs/produce',   // Proxied through backend to LFS-Proxy
  timeout: 600000,                // 10 min for large files
  retries: 3,
});

const envelope = await producer.produce('videoset-raw', file, {
  key: `${packId}/${lernreiseId}/${slot}/${file.name}`,
  headers: { 'Content-Type': file.type },
  onProgress: (p) => setUploadProgress(p.percent),
});
```

**Key protocol details (from E72):**
- HTTP POST to `/lfs/produce` with binary body
- Headers: `X-Kafka-Topic`, `X-Kafka-Key` (base64-encoded), `X-LFS-Size`, `X-LFS-Mode` (single/multipart threshold at 5 MB)
- Response: JSON envelope with `kfs_lfs`, `bucket`, `key`, `size`, `sha256`, `content_type`
- Progress tracking via XHR `upload.onprogress`
- Retry with exponential backoff for 5xx errors
- Accepted file types: `video/mp4`, `video/quicktime`, `video/webm` (max 6 GB)

### Submission Form (Lernreise Editor Extension)

The existing Lernreise editor form (ContentPackEditor.tsx, Level 3) gets a new optional fieldset:

```
┌─────────────────────────────────────────────────┐
│  Referenzmaterial (optional)                     │
│                                                  │
│  ── Video A: Video in Scope ──────────────────── │
│                                                  │
│  ( ) Video hochladen  ( ) YouTube-Link  ( ) Text │
│  ┌─────────────────────────────────────────┐     │
│  │ [Datei auswaehlen] oder URL oder Text   │     │
│  │ ████████████░░░░░░ 64%                  │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ── Video B: Runbook (optional) ──────────────── │
│                                                  │
│  ( ) Video hochladen  ( ) YouTube-Link  ( ) Text │
│  ┌─────────────────────────────────────────┐     │
│  │ [Datei auswaehlen] oder URL oder Text   │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  Notizen an das Didaktik-Team                    │
│  ┌─────────────────────────────────────────┐     │
│  │ Freitext: Kontext, Zielgruppe, was      │     │
│  │ die Lernenden mitnehmen sollen ...      │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

### Didactician Workflow

1. Partner/admin fills out Lernreise form with optional video uploads
2. Videos land in LFS-Proxy staging inbox (`s3://{room-id}/raw/{partner-id}/`)
3. `videoset.submitted` event published to KafScale Broker
4. Didactics team reviews raw material, edits, approves or rejects
5. On approval: videos transcoded via IFR-002 pipeline → CDN publication
6. Final Lernreise content assembled by didactics team + content agents
7. Partner notified of status changes

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `VideoSlotInput` | `frontend/components/admin/VideoSlotInput.tsx` | Reusable input for one video slot (upload/YouTube/text radio + input area + progress bar) |
| `LfsUploader` | `frontend/services/lfsUpload.ts` | TypeScript wrapper around E72 LfsProducer pattern |

### Backend Proxy

The backend proxies LFS-Proxy requests to avoid CORS issues:

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/lfs/produce` | Proxy upload to LFS-Proxy with auth |
| POST | `/api/lfs/download` | Proxy download/presign requests |

The proxy adds auth headers and routes to the configured LFS-Proxy endpoint (`LFS_PROXY_URL` env var).

## Acceptance Criteria

- [ ] Lernreise editor form includes optional "Referenzmaterial" fieldset
- [ ] Video A slot supports three input options: file upload, YouTube link, text description
- [ ] Video B slot supports the same three input options independently
- [ ] File upload uses E72 LFS SDK pattern (XHR with progress tracking)
- [ ] Upload progress bar shows percentage and bytes transferred
- [ ] Upload retries on transient errors (5xx) with exponential backoff
- [ ] Uploaded files land in LFS-Proxy staging inbox, not on CDN
- [ ] Upload envelope (bucket, key, sha256) stored with Lernreise metadata
- [ ] Accepted video types: mp4, mov, webm (max 6 GB)
- [ ] YouTube link validated as valid YouTube URL
- [ ] "Notizen an das Didaktik-Team" free-text field available
- [ ] Submission emits `videoset.submitted` event to KafScale Broker
- [ ] Backend proxy route `/api/lfs/produce` forwards to LFS-Proxy with auth
- [ ] Works in local dev (LFS-Proxy via port-forward or Docker)

## Dependencies

- FR-124 (Content Pack Editor) — parent editor, Lernreise CRUD
- IFR-001 (Lerning-Data-Room Integration) — KafScale Broker, LFS-Proxy infrastructure
- IFR-002 (Video CDN Stage) — raw video ingest, transcoding, CDN publication pipeline
- E72 (Browser LFS SDK Demo) — reference implementation at `frontend/integration-modules/E72_browser-lfs-sdk-demo/`

## Notes

- The E72 demo uses an inline `LfsProducer` class. For SkillR integration, this is extracted into a typed `frontend/services/lfsUpload.ts` module.
- CORS is handled by proxying through the Go backend rather than configuring LFS-Proxy CORS directly. This keeps auth centralized.
- Video upload is entirely optional. A Lernreise can be created without any reference material — the video set is an enhancement for partner onboarding.
- The 2-video model (Video A + Video B) follows the didactical concept: Video A is "what to learn", Video B is "how to understand it". A didactician processes both into the final Lernreise content.
- For files > 5 MB, the E72 SDK sets `X-LFS-Mode: multipart`, signaling the proxy to use S3 multipart upload internally.
