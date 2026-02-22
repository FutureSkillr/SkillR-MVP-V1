# FR-088: SkillR Profile Pod Storage

**Status:** draft
**Priority:** must
**Created:** 2026-02-21
**Entity:** SkillR

## Problem

Today, the SkillR skill profile exists only in platform-controlled storage (Firestore + PostgreSQL). Users have no sovereign ownership of their most valuable asset — their skill profile. The MVP4 Pod sync (FR-077) writes a copy to the Pod, but:

1. **The app remains source of truth** — The Pod version is a secondary mirror, not canonical.
2. **No bidirectional sync** — Changes made directly on the Pod (e.g., via a third-party Solid app) are not reflected in SkillR.
3. **No profile portability** — Users cannot take their profile to another platform that understands the SkillR/Solid vocabulary.
4. **Manual sync only** — Users must click a button; profile changes are not automatically persisted to the Pod.

The goal is to make the user's Pod the canonical store for the SkillR skill profile, with the app reading from and writing to the Pod as the primary source.

## Solution

Evolve the Pod integration from "transparency mirror" (app-primary) to "Pod-canonical" (Pod-primary) for the SkillR skill profile and related entities.

### Pod-Canonical Architecture

```
Before (MVP4):           After (FR-088):
App → Pod (copy)          Pod ← → App (canonical)
App = source of truth     Pod = source of truth
Manual sync               Event-driven sync
Write-only                Bidirectional
```

### Pod Container Structure for SkillR Profile

```
/{username}/
├── profile/
│   ├── card                # WebID Profile Document
│   ├── skill-profile       # fs:SkillProfile (canonical)
│   ├── interests           # fs:InterestProfile (canonical)
│   └── engagement          # fs:EngagementState
├── journey/
│   ├── vuca-state          # fs:VucaState (VUCA bingo progress)
│   └── progress/
│       └── {journey-id}    # fs:JourneyProgress per journey
├── journal/
│   └── reflections/
│       └── {reflection-id} # fs:ReflectionResult
└── skillr/                 # SkillR-specific metadata
    ├── sync-state          # Last sync timestamp, version vector
    └── export/
        └── profile.ttl     # Self-contained profile export
```

### Write Path (App → Pod)

Triggered automatically on profile-changing events:

| Event | Entities Written to Pod |
|-------|----------------------|
| Station complete | VucaState, JourneyProgress |
| Reflection submitted | ReflectionResult, SkillProfile (recomputed) |
| Profile recomputation | SkillProfile, InterestProfile |
| XP/streak change | EngagementState |
| User profile update | WebID Profile Document |

```
1. Event fires in Go backend (e.g., station_complete)
2. Backend updates Pod (canonical): PUT /{username}/journey/vuca-state
3. Backend async-mirrors to Firestore (cache): SET users/{uid}/state/vuca
4. Backend async-indexes in PostgreSQL: UPSERT vuca_progress WHERE user_id = ...
```

### Read Path (Pod → App)

For profile data, the Pod is the primary read source:

```
1. Frontend requests profile data via Go API
2. Go API reads from Pod: GET /{username}/profile/skill-profile
3. If Pod is available → return Pod data (canonical)
4. If Pod is unavailable → fallback to Firestore cache (stale)
5. Response includes X-Data-Source header: "pod" or "cache"
```

### Bidirectional Sync

When a user edits their Pod directly (via a third-party Solid app):

```
1. User modifies /{username}/profile/skill-profile on their Pod
2. SkillR reconciliation job detects change via ETag comparison
3. Reconciliation validates the change against fs: vocabulary schema
4. If valid → update Firestore mirror + PostgreSQL index
5. If invalid → log warning, keep previous valid version, notify user
```

Reconciliation runs:
- **On-demand:** When user opens their profile page (lazy check)
- **Periodic:** Every 15 minutes for active users (background job)
- **Event-driven:** On Solid Notifications webhook (Phase 4, when available)

### Profile Export

Users can download their complete skill profile as a self-contained archive:

```
GET /api/v1/pod/export

Response: application/zip containing:
  profile.ttl          — SkillProfile + InterestProfile
  engagement.ttl       — EngagementState
  journey/             — All journey progress
  reflections/         — All reflection results
  README.md            — Human-readable summary
  metadata.json        — Export metadata (date, version, SkillR instance)
```

The export is fully portable — any Solid-compatible application that understands the `fs:` vocabulary can import it.

### Vocabulary Validation

The Pod server validates writes against the SkillR vocabulary schema:

```
Validation rules for fs:SkillProfile:
  - MUST have exactly 4 fs:skillCategory entries
  - Each fs:skillCategory MUST have fs:key ∈ {hard-skills, soft-skills, future-skills, resilience}
  - Each fs:score MUST be xsd:decimal in range [0, 100]
  - fs:completeness MUST be xsd:decimal in range [0.0, 1.0]
  - dcterms:modified MUST be a valid xsd:dateTime

Validation rules for fs:InterestProfile:
  - fs:topInterest MUST be non-empty list of xsd:string
  - fs:topStrength MUST be non-empty list of xsd:string

Validation rules for fs:VucaState:
  - fs:vucaDimension MUST be ∈ {volatility, uncertainty, complexity, ambiguity}
  - fs:completedItems MUST be xsd:integer in range [0, 4] per dimension
```

Validation is applied on writes to managed Pods. For external Pods (via PodProxy), validation is advisory — warnings are logged but writes are not blocked.

## Acceptance Criteria

- [ ] SkillProfile write to Pod triggered automatically on profile recomputation
- [ ] InterestProfile write to Pod triggered automatically on interest update
- [ ] VucaState write to Pod triggered on station completion
- [ ] EngagementState write to Pod triggered on XP/streak change
- [ ] ReflectionResult write to Pod triggered on reflection submission
- [ ] Async Firestore mirror update after Pod write (non-blocking)
- [ ] Async PostgreSQL index update after Pod write (non-blocking)
- [ ] Profile read from Pod as primary source (with Firestore fallback)
- [ ] X-Data-Source response header indicates "pod" or "cache"
- [ ] ETag-based change detection for bidirectional sync
- [ ] Reconciliation job: on-demand (profile page load) + periodic (15-min for active users)
- [ ] Vocabulary validation on managed Pod writes (reject invalid, return 422)
- [ ] Advisory validation on PodProxy writes (log warning, allow write)
- [ ] Profile export endpoint: GET /api/v1/pod/export returns ZIP archive
- [ ] Export contains Turtle files for all profile entities + README + metadata
- [ ] Export is importable on another Solid server (self-contained, no external references)
- [ ] Sync state tracking: last sync timestamp, version vector per entity
- [ ] Conflict resolution: Pod wins for profile data, log conflicts
- [ ] Frontend: profile page shows data source indicator (Pod vs cache)
- [ ] Frontend: Pod data viewer shows last sync time and entity-level status
- [ ] Unit tests for: event-driven sync, vocabulary validation, export generation, reconciliation
- [ ] Integration tests for: write round-trip (event → Pod → Firestore), bidirectional sync, export/import

## Dependencies

- [TC-032](../arch/TC-032-custom-solid-pod-server.md) — Custom Solid Pod Server architecture
- [TC-019](../arch/TC-019-solid-pod-storage-layer.md) — Four-tier storage model (Tier S canonical)
- [FR-086](FR-086-custom-solid-pod-server.md) — Custom Solid Pod Server (prerequisite)
- [FR-087](FR-087-podproxy-federation-layer.md) — PodProxy (for external Pod writes)
- [FR-077](FR-077-pod-data-sync.md) — Pod data sync (superseded by this FR for profile entities)
- [FR-008](FR-008-skill-profile-generation.md) — Skill profile generation (triggers profile write)
- [FR-007](FR-007-vuca-bingo-matrix.md) — VUCA bingo (triggers VucaState write)

## Notes

- The `fs:` namespace vocabulary is defined in TC-019: `https://vocab.maindset.academy/ns/`
- FR-077 (Pod Data Sync) is not superseded entirely — it continues to handle manual sync for non-profile entities (engagement, journey). FR-088 specifically makes the **profile** Pod-canonical with automatic sync.
- Profile export format should include a `@context` for JSON-LD compatibility even though the primary serialization is Turtle
- The reconciliation job should be lightweight — ETag comparison only, no full body diff unless ETags differ
- For external Pods: if the user has restricted SkillR's write access, profile sync degrades gracefully to read-only mode with local storage fallback
- Consider Solid Notifications Protocol (https://solidproject.org/TR/notifications-protocol) for real-time bidirectional sync in a future phase
