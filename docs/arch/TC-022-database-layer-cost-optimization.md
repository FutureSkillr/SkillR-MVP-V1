# TC-022: Database Layer Cost Optimization

**Status:** draft
**Created:** 2026-02-19
**Entity:** SkillR

## Context

A Cloud SQL instance (`future-skillr-db`, Postgres 16, `db-f1-micro`, `europe-west3-a`) was provisioned in project `gen-lang-client-0456368718` and is currently in `PENDING_CREATE` state. Once running, this instance will cost approximately **€12–20/month** (24/7 billing).

Per [TC-017](TC-017-unified-data-model.md), PostgreSQL (Tier B) is not needed until **Phase 3: V1.0 Start**. The current project phase is **MVP3**, where all persistence needs are covered by:

- **Firebase Firestore** (Tier A) — user state, prompts, agent configs ([TC-013](TC-013-firestore-persistence-strategy.md))
- **SQLite** (Express dev-server) — auth, sessions, analytics, prompt logs

The Cloud SQL instance was provisioned prematurely. It serves no current workload and generates unnecessary cost.

### Billing Risk

The instance runs on project `gen-lang-client-0456368718`. Billing ownership and budget for this project must be verified:

```bash
gcloud beta billing projects describe gen-lang-client-0456368718
```

If this project has limited credits or is not under the team's billing account, charges could become a problem quickly.

## Decision

**Delete the Cloud SQL instance immediately. Defer PostgreSQL provisioning until V1.0 development begins.**

### Immediate Action

```bash
gcloud sql instances delete future-skillr-db --project=gen-lang-client-0456368718
```

This stops all billing immediately.

### MVP3 Storage Strategy (Current Phase)

| Data Category | Storage | Cost |
|---------------|---------|------|
| User state (journey, VUCA, engagement, profile) | Firebase Firestore (client SDK) | Free tier (< 50K reads/day) |
| User preferences | Firebase Firestore | Free tier |
| Prompts & agent configs | Firebase Firestore | Free tier |
| Auth / sessions | Express SQLite (dev-server) | €0 |
| Analytics / clickstream | Express SQLite (dev-server) | €0 |
| Prompt logs | Express SQLite (dev-server) | €0 |

**Total MVP3 database cost: €0**

### V1.0 Storage Strategy (When PostgreSQL Is Needed)

When relational queries are actually required (endorsements, job matching, cross-user features), re-evaluate with these options:

| Option | Monthly Cost | Pros | Cons |
|--------|-------------|------|------|
| **Neon Serverless Postgres** | €0–5 | Free tier generous, serverless (no idle cost), Postgres-compatible | Vendor lock-in to Neon, cold start latency |
| **Supabase** | €0 (free) / €25 (pro) | Free Postgres + auth + API, generous free tier | Opinionated platform, may conflict with existing Firebase auth |
| **Cloud SQL db-f1-micro** | €12–20 | GCP-native, private networking, managed backups | Expensive for dev/prototype, 24/7 billing |
| **AlloyDB Omni on Cloud Run** | ~€5–10 | Postgres-compatible, GCP-native, better scaling | More complex setup, newer product |
| **Cloud Run + embedded SQLite (Litestream)** | ~€0 | Simplest, cheapest, works for single-writer | No concurrent writes, not suitable for multi-instance |

**Recommended V1.0 approach:** Start with **Neon free tier** for development and staging. Evaluate Cloud SQL only when production traffic justifies the cost (> 100 concurrent users, private networking requirements, or compliance needs).

## Consequences

### Benefits
- **Immediate savings:** €12–20/month eliminated
- **No impact on current work:** MVP3 has zero dependency on Cloud SQL
- **Aligned with phased migration:** TC-017 already defines PostgreSQL as a V1.0 concern
- **Forced intentionality:** When V1.0 starts, the team must explicitly choose and justify the database tier

### Trade-offs
- **Re-provisioning delay:** When V1.0 needs PostgreSQL, there will be a ~5 minute setup time
- **No early integration testing:** Cannot test Go backend + PostgreSQL queries until V1.0 phase begins
- **Schema migration tooling deferred:** Database migration setup (e.g., golang-migrate, Atlas) is postponed

### Risks
- If V1.0 timeline accelerates, PostgreSQL setup could be on the critical path. Mitigation: Neon free tier can be provisioned in < 2 minutes with zero cost.

## Alternatives Considered

### 1. Keep Cloud SQL Running for Future Use
Rejected. At €12–20/month with zero current utilization, this is pure waste. The instance can be recreated in minutes when needed.

### 2. Downgrade to Cloud SQL Free Trial
Not available. Google removed the Cloud SQL free tier. The smallest paid tier (`db-f1-micro`) is the current instance.

### 3. Replace Cloud SQL with Firestore for Everything
Partially adopted for MVP3. However, Firestore alone cannot serve V1.0 requirements (relational joins for job matching, cross-user endorsement queries, leaderboard rankings). A relational database will be needed eventually — just not now.

### 4. Use Supabase as Full Firebase Replacement
Rejected for now. The project already has Firebase deeply integrated (auth, Firestore, storage). Replacing Firebase would be a large migration with no clear benefit at this stage.

## Dependencies

- [TC-013](TC-013-firestore-persistence-strategy.md) — Firestore persistence (covers MVP storage needs)
- [TC-017](TC-017-unified-data-model.md) — Unified data model (defines when PostgreSQL is needed)
- [TC-018](TC-018-agentic-backend-vertexai.md) — Agentic backend (will need PostgreSQL in V1.0)

## Action Items

- [ ] Verify billing ownership: `gcloud beta billing projects describe gen-lang-client-0456368718`
- [ ] Delete Cloud SQL instance: `gcloud sql instances delete future-skillr-db --project=gen-lang-client-0456368718`
- [ ] Confirm deletion: `gcloud sql instances list --project=gen-lang-client-0456368718`
- [ ] Update TC-017 Phase 3 to reference this ADR for PostgreSQL re-provisioning guidance
- [ ] When V1.0 begins: evaluate Neon vs Cloud SQL based on actual requirements

## Notes

- The instance was observed in `PENDING_CREATE` state on 2026-02-19, meaning it may not have fully provisioned yet. Deleting now avoids any further charges.
- The Express dev-server SQLite database handles all current non-Firestore needs adequately for the MVP phase.
- This decision does not change the long-term architecture in TC-017 — it only defers PostgreSQL provisioning to when it is actually needed.
