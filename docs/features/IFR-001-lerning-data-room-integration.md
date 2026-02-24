# IFR-001: Lerning-Data-Room Integration

**Status:** draft
**Priority:** must
**Created:** 2026-02-24
**Entity:** maindset.ACADEMY | SkillR

---

## Problem

SkillR app-instances currently run as isolated deployments with no shared event infrastructure. To integrate with the maindfull.LEARNING platform and its event-based agent environment, we need a shared data layer — the **Lerning-Data-Room** — that connects app-instances, platform services, and partner/sponsor sites through a unified event backbone.

Without this infrastructure:
- App-instances cannot receive content and learning signals from maindfull.LEARNING.
- The agent environment has no event bus for cross-service communication.
- Content sponsors and partner sites have no dedicated access points.
- Large learning artifacts (media, documents) have no managed storage proxy.

## Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Lerning-Data-Room                         │
│                                                             │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────────┐ │
│  │ KafScale     │  │ LFS-Proxy  │  │ KafMirror           │ │
│  │ Broker       │──│ (Large File│──│ (Event replication   │ │
│  │ (Event bus)  │  │  Storage)  │  │  & fan-out)          │ │
│  └──────┬───────┘  └─────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┴─────────────────────┘            │
│                          │                                  │
│              Custom URLs per sponsor / partner              │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│ App-Instance │  │ App-Instance │  │ maindfull.LEARNING    │
│ (SkillR)     │  │ (SkillR)     │  │ Platform              │
│              │  │              │  │                        │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────────────┐  │
│ │ Redis    │ │  │ │ Redis    │ │  │ │ Memory-Service    │  │
│ │ Postgres │ │  │ │ Postgres │ │  │ │ Backend-Services  │  │
│ │ App GW   │ │  │ │ App GW   │ │  │ │ Content Engine    │  │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────────────┘  │
└──────────────┘  └──────────────┘  └──────────────────────┘
```

### Component 1: Lerning-Data-Room

The Lerning-Data-Room is the shared event and data layer. Each room instance is composed of three services:

#### KafScale Broker
- Event bus for the agent environment.
- Handles topic-based publish/subscribe between app-instances and platform services.
- Carries learning signals, content updates, and agent coordination events.

#### LFS-Proxy (Large File Storage Proxy)
- Managed proxy for large learning artifacts (media, documents, exports).
- Decouples storage from the event bus — events reference LFS URIs.
- Provides upload/download endpoints for app-instances and platform services.

#### KafMirror
- Replicates and fans out event streams across Lerning-Data-Room boundaries.
- Enables multi-room topologies where partner sites and sponsor environments maintain their own event streams mirrored from the primary room.

#### Custom URLs
- Each Lerning-Data-Room exposes custom URLs for content sponsors and partner sites.
- Partners access their scoped event streams and content via these URLs.
- URL routing maps sponsor/partner slugs to the correct room partition.

### Component 2: App-Instance Gateway

Each SkillR app-instance includes:

#### Redis
- Session cache, rate limiting, real-time state.
- Powers the app gateway's fast-path operations.

#### PostgreSQL
- Persistent storage for user data, sessions, portfolios, lernreise progress.
- Powers the app gateway's transactional operations.

#### App Gateway
- Routes requests to local services (Redis, Postgres) and upstream to the Lerning-Data-Room.
- Consumes learning signals and content from the event bus.
- Publishes user interaction events back to the Lerning-Data-Room.

### Component 3: maindfull.LEARNING Platform Services

The maindfull.LEARNING platform connects to the same Lerning-Data-Room as the app-instances:

#### Memory-Service
- User identity mapping and context persistence across sessions.
- Provides long-term memory for the AI dialogue engine.

#### Backend-Services
- Content engine, curriculum management, learning path generation.
- Publish content updates and learning signals to the Lerning-Data-Room.
- Consume user interaction events from app-instances.

### Data Flow

1. **Content delivery:** maindfull.LEARNING backend-services publish content and learning signals to the KafScale Broker. App-instances subscribe and receive updates.
2. **User interactions:** App-instances publish interaction events (dialogue turns, VUCA progress, reflections) to the KafScale Broker. maindfull.LEARNING consumes these for analytics and adaptive content.
3. **Large artifacts:** Media and documents flow through the LFS-Proxy. Events carry LFS URIs, not payloads.
4. **Partner access:** KafMirror replicates scoped event streams to partner/sponsor custom URLs. Partners see only their partition.
5. **Memory:** The Memory-Service reads from the Lerning-Data-Room to maintain user context across app-instances.

## Acceptance Criteria

- [ ] KafScale Broker is deployed and reachable from all app-instances and maindfull.LEARNING services
- [ ] LFS-Proxy handles upload/download of learning artifacts with URI-based referencing
- [ ] KafMirror replicates event streams to partner/sponsor endpoints
- [ ] Each Lerning-Data-Room exposes custom URLs per content sponsor and partner site
- [ ] Redis and PostgreSQL are provisioned as part of each app-instance
- [ ] App gateway connects to local Redis/Postgres and upstream Lerning-Data-Room
- [ ] Memory-Service and backend-services from maindfull.LEARNING consume and produce events via the shared Lerning-Data-Room
- [ ] App-instances receive content and learning signals from maindfull.LEARNING
- [ ] App-instances publish user interaction events to the Lerning-Data-Room
- [ ] End-to-end event flow verified: platform publishes content → app-instance receives → user interacts → event published → platform consumes

## Dependencies

- FR-071 (Terraform Infrastructure) — base GCP provisioning
- FR-072 (Honeycomb Service Configuration) — Memory-Service endpoint config
- FR-079 (Sponsor Showrooms) — custom URLs for sponsor sites
- FR-086 (Partner Branding) — partner site URL routing
- TC-029 (Configuration Management) — service endpoint configuration
- TC-034 (Deployment Architecture) — container orchestration

## Notes

- "Lerning-Data-Room" is the canonical name for this shared event/data layer.
- The IFR (Infrastructure Feature Request) prefix distinguishes infrastructure concerns from application features (FR).
- This feature establishes the integration boundary between SkillR app-instances and the maindfull.LEARNING platform. Application-level features (dialogue, profiles, portfolios) remain in FR-scoped documents.
- KafScale, LFS-Proxy, and KafMirror are infrastructure services managed outside the SkillR app codebase. This IFR tracks the integration contract, not the implementation of those services.
