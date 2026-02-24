# IFR-002: Video CDN Stage via LFS-Proxy

**Status:** draft
**Priority:** must
**Created:** 2026-02-24
**Entity:** maindset.ACADEMY | SkillR

---

## Problem

Modern learning experiences rely heavily on video content — coach introductions, skill demonstrations, station walkthroughs, and partner-provided training material. The Lerning-Data-Room (IFR-001) provides an LFS-Proxy for large file storage, but has no dedicated video hosting or delivery pipeline. Without a CDN stage, video content would be served directly from origin storage, resulting in:

- High latency for geographically distributed learners.
- No adaptive bitrate streaming — poor experience on mobile networks.
- No caching layer — every request hits origin, increasing cost and load.
- No clear separation between video storage (durable) and video delivery (edge-optimized).

## Solution

Extend the LFS-Proxy to drive a **Video CDN Stage** backed by S3-compatible object storage. The Lerning-Data-Room becomes the single entry point for video content: upload via LFS-Proxy, store in S3, deliver through CDN edge.

### Architecture

```
                    Lerning-Data-Room
┌───────────────────────────────────────────────────┐
│                                                   │
│  ┌────────────┐      ┌───────────┐                │
│  │ KafScale   │      │ KafMirror │                │
│  │ Broker     │      │           │                │
│  └─────┬──────┘      └─────┬─────┘                │
│        │                    │                      │
│  ┌─────┴────────────────────┴──────────────────┐   │
│  │              LFS-Proxy                      │   │
│  │                                             │   │
│  │  ┌─────────────┐    ┌────────────────────┐  │   │
│  │  │ File Store  │    │ Video CDN Stage    │  │   │
│  │  │ (documents, │    │                    │  │   │
│  │  │  exports)   │    │  S3 Origin Bucket  │  │   │
│  │  └─────────────┘    │        │           │  │   │
│  │                     │   CDN Edge Layer   │  │   │
│  │                     │        │           │  │   │
│  │                     │  Edge URLs / HLS   │  │   │
│  │                     └────────────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│                                                   │
│              Custom URLs per sponsor / partner     │
└───────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   App-Instances       Partner Sites
```

### S3 Origin Bucket

- S3-compatible object storage (GCS with S3 interop or native S3).
- Organized by data room: `s3://{room-id}/video/{content-id}/{variant}`.
- Partner/sponsor content isolated by room partition.
- Lifecycle policies: archive after 90 days of no access, delete after retention period.

### Video CDN Stage

The LFS-Proxy manages the video delivery pipeline:

| Responsibility | How |
|----------------|-----|
| **Ingest** | Upload via LFS-Proxy API → stored in S3 origin bucket |
| **Transcode** | On upload, trigger transcoding to adaptive bitrate variants (HLS: 360p, 720p, 1080p) |
| **Edge delivery** | CDN pulls from S3 origin, caches at edge locations |
| **URL signing** | LFS-Proxy generates signed, time-limited CDN URLs for authenticated playback |
| **Per-room isolation** | Each Lerning-Data-Room partition has its own CDN path prefix and URL namespace |
| **Sponsor URLs** | Custom sponsor/partner URLs resolve to their room's CDN path |

### Event Integration

Video lifecycle events flow through the KafScale Broker:

| Event | Producer | Consumer |
|-------|----------|----------|
| `video.raw_uploaded` | LFS-Proxy | Didactics team (review queue), analytics |
| `video.approved` | Didactics team | LFS-Proxy (triggers transcode) |
| `video.rejected` | Didactics team | Sponsor notification, analytics |
| `video.uploaded` | LFS-Proxy | Transcode worker, analytics |
| `video.transcoded` | Transcode worker | LFS-Proxy (updates manifest), app-instances |
| `video.published` | LFS-Proxy | App-instances, sponsor notification |
| `video.played` | App-instance | Analytics, engagement tracking |
| `video.failed` | Transcode worker | Alerting, admin dashboard |

### Sponsor Raw Material Ingest

Sponsors ship raw video material into the Lerning-Data-Room via their custom URL. The maindset.ACADEMY didactics team then curates, edits, and publishes it as learning content.

```
Sponsor                  Lerning-Data-Room              Didactics Team
───────                  ─────────────────              ──────────────
  │                            │                              │
  │  upload raw video          │                              │
  │  via custom sponsor URL    │                              │
  │ ──────────────────────────>│                              │
  │                            │  video.raw_uploaded          │
  │                            │ ────────────────────────────>│
  │                            │                              │
  │                            │                    review, edit, approve
  │                            │                              │
  │                            │  video.approved              │
  │                            │ <────────────────────────────│
  │                            │                              │
  │                            │  trigger transcode           │
  │                            │  (HLS 360p/720p/1080p)      │
  │                            │                              │
  │                            │  video.published             │
  │                            │ ──────> CDN edge             │
  │                            │ ──────> app-instances        │
```

| Stage | Who | What happens |
|-------|-----|--------------|
| **Upload** | Sponsor | Ships raw video via their custom Lerning-Data-Room URL. No transcoding yet — file lands in the raw inbox (`s3://{room-id}/raw/{sponsor-id}/{upload-id}`) |
| **Review** | Didactics team | Receives `video.raw_uploaded` event. Reviews material for didactical fit, legal compliance, and quality |
| **Edit** | Didactics team | Trims, annotates, or combines raw material into learning-ready clips. May request re-upload from sponsor |
| **Approve** | Didactics team | Marks video as approved. Triggers `video.approved` event |
| **Transcode & publish** | LFS-Proxy (automated) | On approval, transcodes to HLS variants and pushes to CDN edge. Emits `video.published` |

This workflow ensures sponsors can contribute content without needing video production expertise — they deliver the raw material, the didactics experts shape it into effective learning content.

### Content Types

| Type | Source | Example |
|------|--------|---------|
| Coach introduction | SkillR platform | AI coach persona video clips |
| Station walkthrough | SkillR platform | VUCA station explainers |
| Skill demonstration | Sponsor/partner (raw → didactics) | "Why this skill matters" videos |
| Lernreise content | maindfull.LEARNING | Curriculum-embedded video modules |
| Sponsor raw material | Sponsor upload | Unedited footage, interviews, facility tours, process demos |
| User-generated | Learner (future) | Reflection recordings, portfolio evidence |

## Acceptance Criteria

- [ ] LFS-Proxy accepts video uploads and stores them in S3 origin bucket
- [ ] Uploaded videos are transcoded to HLS adaptive bitrate (360p, 720p, 1080p)
- [ ] CDN edge layer caches and delivers video content with low latency
- [ ] LFS-Proxy generates signed, time-limited playback URLs
- [ ] Each Lerning-Data-Room partition has isolated S3 paths and CDN URL namespaces
- [ ] Sponsor/partner custom URLs resolve to their room's video content
- [ ] Video lifecycle events (`uploaded`, `transcoded`, `played`, `failed`) published to KafScale Broker
- [ ] App-instances can embed CDN-delivered video via standard HLS playback
- [ ] S3 lifecycle policies enforce archival and retention rules
- [ ] Sponsors can upload raw video material via their custom Lerning-Data-Room URL
- [ ] Raw uploads land in a staging inbox (`s3://{room-id}/raw/{sponsor-id}/`), not on the CDN
- [ ] Didactics team receives `video.raw_uploaded` events and can review, edit, approve, or reject
- [ ] Only approved videos proceed to transcoding and CDN publication
- [ ] Sponsors are notified on `video.published` and `video.rejected` events
- [ ] No video content is served directly from origin in production — all delivery goes through CDN edge

## Dependencies

- IFR-001 (Lerning-Data-Room Integration) — LFS-Proxy, KafScale Broker, room partitioning
- FR-071 (Terraform Infrastructure) — S3 bucket and CDN provisioning
- FR-079 (Sponsor Showrooms) — sponsor video content on custom URLs
- FR-086 (Partner Branding) — partner video content delivery

## Notes

- The LFS-Proxy is the single control plane for all large file operations in the Lerning-Data-Room. The Video CDN Stage is a specialization of LFS-Proxy, not a separate service.
- S3 is chosen for storage interoperability — works with GCS (S3-compatible API), AWS S3, or MinIO for local development.
- Transcoding can be deferred to a background worker (Cloud Run Job, GKE Job, or external service). The LFS-Proxy only needs to trigger it and track status.
- User-generated video (reflection recordings) is a future capability. The infrastructure should support it, but the upload UI is out of scope for V1.
