# FR-095: Custom Solid Pod Server (Go)

**Status:** draft
**Priority:** must
**Created:** 2026-02-21
**Entity:** SkillR

## Problem

The current Pod implementation (MVP4) depends on Community Solid Server (CSS) v7 — a Node.js reference implementation running as a separate Docker Compose service. This creates:

1. **Dual-runtime complexity:** Go backend + Node.js CSS in separate containers. Two Docker images, two runtimes, two dependency trees.
2. **Limited auth integration:** Firebase JWT → Pod access requires a middleware bridge between Go and CSS. No native Firebase auth support in CSS.
3. **No proxy capability:** CSS cannot proxy requests to external Pods. BYOP users need a different code path entirely.
4. **Deployment overhead:** CSS requires its own Cloud Run service, separate scaling, separate monitoring.

We need a Solid-compliant Pod server written in Go that integrates natively with the SkillR backend.

## Solution

Implement a custom Solid Pod server in Go as a package within the existing backend (`backend/internal/solid/server/`). The server implements the Solid Protocol v0.11.0 (©2019–2025 Inrupt Inc. and imec, https://solidproject.org/TR/protocol) with the following components:

### Core Components

| Component | File | Responsibility |
|-----------|------|---------------|
| **LDP Handler** | `ldp.go` | HTTP resource lifecycle: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE |
| **WAC Engine** | `wac.go` | Web Access Control authorization (ACL parse, mode match, inheritance) |
| **WebID Provider** | `webid.go` | WebID Profile Document management and resolution |
| **Resource Router** | `router.go` | Route to managed store or PodProxy based on user config |
| **Managed Store** | `store.go` | PostgreSQL-backed LDP resource storage |
| **Turtle Parser** | `turtle.go` | RDF/Turtle parsing and serialization |
| **Container Handler** | `container.go` | Container listing with `ldp:contains` triples |

### Solid Protocol Compliance (Phase 1)

Implements these MUST requirements:

- HTTP Semantics (RFC 9110) compliance
- Storage resource with root container and `Link` header advertisement
- Full CRUD: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- LDP Basic Container behavior with containment triples
- Content-Type enforcement on write methods (400 on missing)
- `text/turtle` representation for RDF sources
- Intermediate container creation on PUT/PATCH
- Auxiliary resources (ACL via `Link: <.acl>; rel="acl"`)
- CORS headers (Access-Control-Allow-Origin, Vary: Origin)
- Web Access Control (WAC) with agent, agentClass, agentGroup matching
- ACL inheritance from parent containers to root
- WAC-Allow response header
- Slash-semantics with 301 redirects
- 405 for unsupported methods
- 409 for non-empty container DELETE
- 404/410 for missing/gone resources

### Database Schema

```sql
-- Migration: 000020_pod_resources.up.sql

CREATE TABLE pod_resources (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_owner     TEXT NOT NULL,
    path          TEXT NOT NULL,
    content_type  TEXT NOT NULL DEFAULT 'text/turtle',
    body          BYTEA,
    is_container  BOOLEAN DEFAULT FALSE,
    etag          TEXT NOT NULL,
    size_bytes    BIGINT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    modified_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_owner, path)
);

CREATE TABLE pod_acl (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_owner     TEXT NOT NULL,
    resource_path TEXT NOT NULL,
    acl_body      TEXT NOT NULL,
    modified_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_owner, resource_path)
);

CREATE INDEX idx_pod_resources_owner ON pod_resources(pod_owner);
CREATE INDEX idx_pod_resources_lookup ON pod_resources(pod_owner, path);
CREATE INDEX idx_pod_resources_container ON pod_resources(pod_owner, path)
    WHERE is_container = TRUE;
CREATE INDEX idx_pod_acl_lookup ON pod_acl(pod_owner, resource_path);
```

### Authentication

Phase 1 uses Firebase JWT → WebID mapping (same process, no DPoP):

1. Request arrives with Firebase JWT in `Authorization: Bearer` header
2. Firebase Auth middleware verifies JWT, extracts `uid`
3. PostgreSQL lookup: `uid` → `users.webid`
4. WAC engine evaluates ACL rules against the resolved WebID
5. If authorized, proceed to LDP handler; otherwise 403

### API Surface

The Pod server is mounted at `/pods/` on the same Echo router:

```
GET    /pods/{username}/{path...}     → Read resource
HEAD   /pods/{username}/{path...}     → Resource metadata
OPTIONS /pods/{username}/{path...}    → Supported methods
PUT    /pods/{username}/{path...}     → Create/replace resource
POST   /pods/{username}/{container}/  → Create with server-assigned URI
DELETE /pods/{username}/{path...}     → Delete resource
```

Alternatively, for production with separate subdomain:
```
GET    https://pods.maindset.academy/{username}/{path...}
```

## Acceptance Criteria

- [ ] LDP Handler supports GET, HEAD, OPTIONS, PUT, POST, DELETE for RDF resources
- [ ] Container creation with `ldp:contains` triples in listing response
- [ ] PUT to nested path auto-creates intermediate containers
- [ ] POST to container creates resource with server-assigned URI (UUID-based)
- [ ] Slug header hint respected for POST resource naming
- [ ] Content-Type required on PUT/POST/PATCH — 400 if missing
- [ ] DELETE on non-empty container returns 409
- [ ] DELETE on root container returns 405
- [ ] WAC engine parses ACL Turtle and evaluates access modes (Read, Write, Append, Control)
- [ ] ACL inheritance: resource → parent container → ... → root container
- [ ] WAC-Allow header included in responses
- [ ] Link header with `rel="acl"` pointing to ACL resource
- [ ] Link header with `rel="type"` for LDP container/resource types
- [ ] CORS headers set per Solid Protocol requirements
- [ ] Slash-semantics: `/path` vs `/path/` handled with 301 redirect
- [ ] WebID Profile Document served at `/{username}/profile/card`
- [ ] Pod provisioning creates root container + profile directory + default ACLs
- [ ] PostgreSQL store correctly handles CRUD with ETag generation
- [ ] Firebase JWT → WebID auth bridge works for all LDP operations
- [ ] CSS Docker Compose service removed from `docker-compose.yml`
- [ ] Unit tests for: LDP operations, WAC evaluation, Turtle parsing, container listing
- [ ] Integration tests for: full resource lifecycle, ACL enforcement, WebID resolution
- [ ] Solid Conformance Test Harness passes for implemented requirements

## Dependencies

- [TC-032](../arch/TC-032-custom-solid-pod-server.md) — Architecture concept
- [TC-019](../arch/TC-019-solid-pod-storage-layer.md) — Storage layer architecture
- [FR-076](FR-076-solid-pod-connection.md) — Pod connection (existing, updated)
- [FR-077](FR-077-pod-data-sync.md) — Pod data sync (existing, updated)

## Notes

- Renumbered from FR-086 to FR-095 to resolve number collision with FR-086 (Partner Branding).
- Solid Protocol specification: https://solidproject.org/TR/protocol (v0.11.0)
- Web Access Control specification: https://solidproject.org/TR/wac (v1.0.0)
- Go RDF/Turtle library candidates: `github.com/deiu/rdf2go`, `github.com/knakk/rdf`
- Phase 1 targets Turtle only — JSON-LD content negotiation deferred to Phase 2
- N3 Patch support deferred to Phase 2 — updates via PUT/DELETE in Phase 1
- The custom server replaces CSS entirely — `solid/config/css-config.json` and `scripts/seed-pod.sh` become obsolete
