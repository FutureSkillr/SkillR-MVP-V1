---
name: api-sync
description: Verify OpenAPI specs match actual backend routes — detect drift between spec and implementation
allowed-tools: Read, Glob, Grep, Bash
---

# API Sync — Spec vs Implementation Drift Detector

Compare the OpenAPI specifications in `integrations/api-spec/` with the actual routes registered in `backend/internal/server/routes.go` and handler implementations.

## When to Run

After adding or modifying API endpoints. Run periodically to catch spec drift.

## Procedure

### 1. Extract Registered Routes

Parse all routes from `routes.go`:

```bash
grep -E '\.(GET|POST|PUT|PATCH|DELETE)\(' backend/internal/server/routes.go | grep -oE '"[^"]+"' | sort -u
```

This gives the complete list of backend route paths.

### 2. Extract OpenAPI Paths

For each spec file in `integrations/api-spec/`:

```bash
grep -E '^\s+/api/' integrations/api-spec/*.yaml integrations/api-spec/*.json 2>/dev/null | sort -u
```

Parse the paths and methods defined in the spec.

### 3. Compare Routes

Build three lists:

**A. In backend but NOT in spec** (undocumented endpoints):
- Routes registered in `routes.go` that have no corresponding OpenAPI path
- These are API endpoints that clients can call but have no documentation

**B. In spec but NOT in backend** (stale/phantom endpoints):
- OpenAPI paths that have no matching route in `routes.go`
- These are documented endpoints that don't actually exist

**C. Matched** (documented and implemented):
- Routes that appear in both places

### 4. Check Request/Response Schemas

For matched routes, spot-check that:
- Handler functions accept the parameters described in the spec
- Response types match the spec's schema definitions
- Required fields in the spec are validated in the handler

Read the handler source for 3-5 key endpoints and compare with the spec.

### 5. Check Auth Requirements

Compare auth middleware on each route group with the spec's security definitions:
- Routes with `RequireAdmin()` should have `security: [adminAuth]` in spec
- Routes with `FirebaseAuth` should have `security: [bearerAuth]` in spec
- Public routes should have no security requirement

### 6. Generate Report

```
# API Sync Report — {YYYY-MM-DD}

## Summary

| Metric | Count |
|--------|-------|
| Backend routes | {N} |
| Spec paths | {N} |
| Matched | {N} |
| Undocumented (backend only) | {N} |
| Stale (spec only) | {N} |

## Undocumented Endpoints (backend → spec needed)

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | /api/auth/me | AuthHandler.Me | Firebase |
| ... | ... | ... | ... |

## Stale Spec Entries (spec → remove or implement)

| Method | Path | Spec File |
|--------|------|-----------|
| ... | ... | ... |

## Auth Mismatches

| Path | Backend Auth | Spec Auth | Issue |
|------|-------------|-----------|-------|
| ... | ... | ... | ... |

## Schema Spot-Check

| Endpoint | Match? | Notes |
|----------|--------|-------|
| ... | ... | ... |

## Action Items

- [ ] {Add spec for undocumented endpoints}
- [ ] {Remove stale spec entries}
- [ ] {Fix auth mismatches}
```
