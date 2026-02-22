# TC-024: Feature Toggle System

**Status:** accepted
**Created:** 2026-02-19
**Entity:** SkillR

## Context

Future SkillR has 54 features across 5 release phases (MVP1, MVP2, MVP3, V1.0, V2.0). Many features are drafted or in early development but not ready for production. Today there is no formal system to control feature visibility — only an ad-hoc `authUser.role === 'admin'` check for the admin panel (FR-043).

Without a systematic approach, incomplete features leak into production, admin-only features lack consistent gating, and subscription-tier features (V2.0) have no activation mechanism. A feature toggle system provides a single, declarative way to control feature visibility across environments, user roles, and future subscription plans.

## Decision

Adopt a **three-layer gate model** with a lightweight DSL to declaratively annotate each feature request (FR) with its visibility rules.

### Gate DSL Syntax

Format: `<layer>:<value>`, combine with `+` (logical AND).

```
gate   := clause ( "+" clause )*
clause := layer ":" value
layer  := "env" | "role" | "level" | "progress" | "plan"
```

Examples:
- `env:all` — visible in all environments, to all users
- `env:dev` — visible in development and staging only
- `role:admin` — visible only to admin users
- `env:all+level:2` — all environments, requires engagement level 2+
- `env:dev+plan:enterprise` — dev only, requires enterprise plan
- `env:all+progress:onboarding` — all environments, requires completed onboarding

All clauses in a gate expression must be satisfied (AND logic). Features with no `**Gate:**` line default to `env:all`.

### Layer 1 — Environment Gate (`env:`)

Controls feature visibility based on the deployment environment. Prevents unfinished features from appearing in production.

| Value | Meaning | Visible In |
|---|---|---|
| `env:all` | Visible everywhere | production, staging, development |
| `env:dev` | Development only | development, staging |
| `env:staging` | Staging and dev | staging, development |

The environment is determined by the `APP_MODE` environment variable (`production`, `staging`, `development`), falling back to `NODE_ENV` if `APP_MODE` is not set. The hierarchy is: `development > staging > production` — a feature gated at `env:staging` is also visible in `development`.

### Layer 2 — User Gate (`role:`, `level:`, `progress:`)

Gates features by user properties that already exist in the data model.

| Value | Meaning | Data Source |
|---|---|---|
| `role:admin` | Admin users only | `AuthUser.role` in `types/auth.ts` |
| `role:user` | Any authenticated user | `AuthUser` exists |
| `level:N` | Engagement level N or higher (1-5) | `EngagementState.level` in `types/engagement.ts` |
| `progress:onboarding` | User completed onboarding | `UserProfile.onboardingInsights !== null` |
| `progress:journey:vuca` | At least 1 VUCA station completed | `UserProfile.journeyProgress` |

User gates are evaluated after environment gates. A feature gated with `role:admin` is visible in all environments but only to admin users.

### Layer 3 — Plan Gate (`plan:`)

Future subscription tiers. The schema is defined now; implementation is deferred to V2.0 when monetization features are built (FR-021, FR-028, FR-029).

| Value | Target Audience | Model |
|---|---|---|
| `plan:free` | Students (default) | Free forever |
| `plan:pro` | Power users, parents | Monthly subscription |
| `plan:enterprise` | Chambers (IHK), companies | B2B contract |

Until plan gates are implemented, `plan:*` gates evaluate to `false` in production. In development and staging, `plan:*` gates evaluate to `true` to allow testing.

### Gate Metadata on Feature Requests

Every FR document includes a `**Gate:**` metadata line after `**Priority:**`:

```markdown
**Status:** done
**Priority:** must
**Gate:** env:all
**Created:** 2026-02-17
```

This makes feature visibility rules part of the specification, not an afterthought in code.

## Implementation Blueprint

> This section describes the intended code architecture. Implementation follows as a separate task.

### Frontend

1. **Feature flag registry** (`featureFlags.ts`) — a static map of feature IDs to their gate expressions, generated from FR metadata.
2. **`useFeature()` hook** — evaluates a gate expression against the current environment and user context, returns `boolean`.
3. **`<FeatureGate>` component** — wraps UI sections, renders children only when the gate passes.
4. **`FeatureContext` provider** — supplies resolved environment and user data to the hook.
5. **Dev overrides** — reuse the existing `contentResolver.ts` localStorage pattern to allow toggling features in dev tools (`localStorage.setItem('ff:FR-021', 'true')`).

### Backend (Go)

1. **Feature registry** (`feature/flags.go`) — static map of feature IDs to gate expressions.
2. **`FeatureGate()` middleware** — Echo middleware that checks gate expression against request context. Follows the existing `RequireAdmin()` pattern in the auth middleware.
3. **`/api/config` extension** — the existing config endpoint returns resolved feature flags for the authenticated user, so the frontend doesn't need to re-evaluate gates.

### Configuration Flow

```
FR docs (Gate: metadata)
    ↓  build-time extraction
featureFlags.ts / flags.go (static registry)
    ↓  runtime evaluation
useFeature() / FeatureGate() (resolved per request)
    ↓  API response
/api/config { features: { "FR-021": false, "FR-043": true } }
```

## Consequences

**Benefits:**
- Single source of truth for feature visibility (FR docs → code registry)
- Incremental rollout: draft features stay hidden in production automatically
- Admin features get consistent gating instead of ad-hoc checks
- Subscription tier gates are future-proofed without premature implementation
- Dev teams can test any feature locally via localStorage overrides

**Trade-offs:**
- Every new feature must be annotated with a gate — slight overhead per FR
- Gate evaluation adds a small runtime cost per request (mitigated by caching resolved flags per session)
- Plan gate implementation is deferred — `plan:*` features are dev-only until V2.0

## Alternatives Considered

### 1. Third-party feature flag service (LaunchDarkly, Unleash)
Rejected. Adds external dependency, cost, and complexity for a project with 54 features and a small team. The gate model covers our needs with zero infrastructure.

### 2. Database-driven toggle table
Rejected. Requires admin UI for toggle management and adds database dependency for what is fundamentally a deployment concern. Static configuration in code is simpler and version-controlled.

### 3. No toggle system — gate by branch/deployment
Rejected. Already the status quo, and it fails: features at different readiness levels exist in the same branch, and there is no way to show admin features to admins while hiding draft features from users.

## Dependencies

- FR-043 (Admin Panel) — existing `role:admin` pattern
- FR-044 (Role Management) — provides `AuthUser.role`
- TC-014 (Engagement System Data Model) — provides `EngagementState.level`
- TC-017 (Unified Data Model) — provides `UserProfile` structure

## Related

- All 54 FR documents (FR-001 through FR-054) — each annotated with `**Gate:**` metadata
