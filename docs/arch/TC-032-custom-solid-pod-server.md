# TC-032: Custom Solid Pod Server & PodProxy Federation

**Status:** draft
**Created:** 2026-02-21
**Entity:** SkillR

## Context

TC-019 introduced SOLID Pods as the canonical store for personal and company data. The MVP4 implementation relies on the Community Solid Server (CSS) v7 — a Node.js reference implementation maintained by the Solid project. While CSS served well for prototyping, it introduces operational complexity: a separate runtime (Node.js alongside Go), limited customization for our domain-specific needs (SkillR profiles, Firebase auth bridge), and no built-in proxy/federation capability for external Pods.

We now aim to implement our own Solid-compliant Pod server in Go, built against the official Solid specifications published by Inrupt and the W3C Solid Community Group:

- **Solid Protocol v0.11.0** — https://solidproject.org/TR/protocol
- **Web Access Control v1.0.0** — https://solidproject.org/TR/wac
- **Solid-OIDC v0.1.0** — https://solidproject.org/TR/oidc
- **Solid WebID Profile v1.0.0** — https://solid.github.io/webid-profile/
- **Solid Notifications Protocol v0.3.0** — https://solidproject.org/TR/notifications-protocol

**Specification Reference:** ©2019–2025 Inrupt Inc. and imec — https://solidproject.org/

**Why build our own?**

1. **Unified runtime:** Single Go binary serves both the application backend and the Pod server. No Node.js dependency. One deployment artifact on Cloud Run.
2. **Deep integration:** Firebase JWT → WebID mapping, SkillR vocabulary enforcement, and domain-specific validation happen natively — no middleware bridge between two runtimes.
3. **PodProxy / Federation:** A custom server can act as a proxy to external Pod providers, enabling users who already have a Pod elsewhere to use it with SkillR. The same proxy mechanism enables Pod federation — discovering and aggregating data across multiple Pod servers.
4. **Performance:** Go's concurrency model (goroutines) maps naturally to the Pod server's concurrent resource access pattern. No V8 overhead.
5. **Control:** We control the specification compliance surface — implementing exactly the subset of the Solid Protocol that SkillR requires, with clear conformance documentation.

---

## Decision

We build a custom Solid-compliant Pod server in Go (`backend/internal/solid/server/`) that implements the Solid Protocol specification. The server operates in two modes:

1. **Managed Mode** — The server stores Pod data directly (PostgreSQL-backed LDP resources). This is the default for users who don't have their own Pod.
2. **Proxy Mode** — The server acts as a transparent proxy to an external Solid Pod, adding Firebase auth bridging and SkillR-specific caching. This enables BYOP (Bring Your Own Pod) and Pod federation.

Both modes are accessible through a unified API surface. From the SkillR application's perspective, every user has a Pod — the server abstracts whether it's managed or proxied.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Go Backend (Cloud Run)                       │
│                                                                   │
│  ┌──────────────┐   ┌──────────────────────────────────────────┐ │
│  │ SkillR API   │   │ Solid Pod Server (TC-032)                │ │
│  │ /api/v1/*    │   │                                          │ │
│  │              │   │  ┌─────────┐  ┌──────────┐  ┌─────────┐ │ │
│  │ Gemini proxy │   │  │ LDP     │  │ WAC      │  │ WebID   │ │ │
│  │ Auth         │   │  │ Handler │  │ Engine   │  │ Provider│ │ │
│  │ Admin        │   │  └────┬────┘  └────┬─────┘  └────┬────┘ │ │
│  │ Lernreise    │   │       │            │             │       │ │
│  └──────┬───────┘   │  ┌───┴────────────┴─────────────┴────┐  │ │
│         │           │  │          Resource Router            │  │ │
│         │           │  └───────┬──────────────┬─────────────┘  │ │
│         │           │          │              │                │ │
│         │           │   ┌──────▼──────┐ ┌────▼──────────┐     │ │
│         │           │   │ Managed     │ │ Proxy         │     │ │
│         │           │   │ Store       │ │ (PodProxy)    │     │ │
│         │           │   │ (PostgreSQL)│ │ → External Pod│     │ │
│         │           │   └─────────────┘ └───────────────┘     │ │
│         │           └──────────────────────────────────────────┘ │
│         │                                                         │
│  ┌──────▼─────────────────────────────────────────────────────┐  │
│  │  Shared Infrastructure                                      │  │
│  │  PostgreSQL · Firestore · Firebase Auth · Secret Manager    │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼───────┐ ┌────▼────┐ ┌────────▼───────┐
     │ User's Browser │ │ External│ │ Federated      │
     │ (SkillR App)   │ │ Solid   │ │ Pod Servers    │
     │                │ │ Pod     │ │ (discovery)    │
     └────────────────┘ └─────────┘ └────────────────┘
```

---

## Solid Protocol Compliance

### Specification Subset (Phase 1)

We implement the following MUST requirements from the Solid Protocol v0.11.0:

| Requirement | Solid Protocol Section | Status |
|-------------|----------------------|--------|
| HTTP Semantics (RFC 9110) | §1.1 | Phase 1 |
| Storage resource with root container | §2.1 | Phase 1 |
| GET, HEAD, OPTIONS on all resources | §3.1 | Phase 1 |
| PUT, POST, PATCH, DELETE on resources | §3.2 | Phase 1 |
| Container management (LDP Basic Container) | §4 | Phase 1 |
| Containment triples (1:1 path correspondence) | §4.1 | Phase 1 |
| Content-Type enforcement on write methods | §3.2 | Phase 1 |
| Intermediate container creation (PUT/PATCH) | §4.2 | Phase 1 |
| `text/turtle` representation for RDF sources | §5.1 | Phase 1 |
| `application/ld+json` representation | §5.1 | Phase 2 |
| N3 Patch support (`text/n3`) | §5.2 | Phase 2 |
| Allow + Accept-* response headers | §3 | Phase 1 |
| Auxiliary resources (ACL, description) | §6 | Phase 1 |
| CORS (Access-Control-* headers) | §7 | Phase 1 |
| Web Access Control (WAC) | §8 ref WAC spec | Phase 1 |
| Solid-OIDC authentication | §9 ref OIDC spec | Phase 2 |
| Slash-semantics / 301 redirects | §2.2 | Phase 1 |
| Link header for storage type advertisement | §2.1 | Phase 1 |
| ETag for RDF representations | §3.3 | Phase 2 |
| Solid Notifications Protocol | separate spec | Phase 3 |

### Deferred Specifications (Phase 3+)

| Specification | Reason for Deferral |
|--------------|-------------------|
| Access Control Policy (ACP) | WAC sufficient for current needs |
| Shape Trees | No interop partners yet requiring shape validation |
| Solid DID Method | Not needed until cross-platform federation |
| Solid-PREP | Experimental |

---

## Component Design

### 1. LDP Handler (`solid/server/ldp.go`)

Implements the Linked Data Platform resource lifecycle:

```
Resource Types:
  - RDF Source (text/turtle, application/ld+json)
  - Non-RDF Source (binary blobs, images)
  - Container (LDP Basic Container)

Operations:
  GET    /{path}        → Read resource or container listing
  HEAD   /{path}        → Metadata without body
  OPTIONS /{path}       → Supported methods + content types
  PUT    /{path}        → Create/replace resource
  POST   /{container}/  → Create resource with server-assigned URI
  PATCH  /{path}        → Partial update (N3 Patch for RDF)
  DELETE /{path}        → Remove resource (409 if non-empty container)

Headers (response):
  Allow: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
  Accept-Patch: text/n3
  Accept-Post: text/turtle, application/ld+json
  Accept-Put: text/turtle, application/ld+json
  Link: <.acl>; rel="acl"
  Link: <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"  (containers)
  Link: <http://www.w3.org/ns/ldp#Resource>; rel="type"       (resources)
```

**Container listing** returns Turtle with `ldp:contains` triples and resource metadata (`stat:mtime`, `dcterms:modified`, `stat:size`).

**Intermediate container creation:** PUT to `/alice/profile/card` auto-creates `/alice/` and `/alice/profile/` if they don't exist.

**Slug header:** POST to a container with `Slug: my-resource` hints at the desired URI segment. Server may modify it for uniqueness.

### 2. WAC Engine (`solid/server/wac.go`)

Implements Web Access Control v1.0.0:

```
Access Modes:
  acl:Read     → GET, HEAD
  acl:Write    → PUT, POST, PATCH, DELETE (superclass of Append)
  acl:Append   → POST, PATCH (add-only, subclass of Write)
  acl:Control  → Read/write ACL resources

Agent Matching:
  acl:agent         → Specific WebID URI
  acl:agentClass    → foaf:Agent (public) or acl:AuthenticatedAgent
  acl:agentGroup    → vcard:Group membership

ACL Discovery:
  1. Check resource-specific ACL (/{path}.acl)
  2. If none, inherit from parent container's acl:default rules
  3. Traverse up to root container
  4. Root container MUST have an ACL with acl:Control

Response Headers:
  Link: <{path}.acl>; rel="acl"
  WAC-Allow: user="read write", public="read"
```

**Firebase Auth Bridge:** The WAC engine maps Firebase JWT claims to a WebID URI for authorization decisions. The mapping is: `firebase_uid → PostgreSQL users.webid → acl:agent match`.

### 3. WebID Provider (`solid/server/webid.go`)

Manages WebID Profile Documents:

```
WebID URI Format:
  https://pods.maindset.academy/{username}/profile/card#me

Profile Document (Turtle):
  @prefix foaf:  <http://xmlns.com/foaf/0.1/> .
  @prefix solid: <http://www.w3.org/ns/solid/terms#> .

  <#me>
      a foaf:Person ;
      foaf:name "Max Mustermann" ;
      solid:oidcIssuer <https://accounts.google.com> ;
      solid:account <https://pods.maindset.academy/max-mustermann/> .
```

**WebID resolution:** When an external service dereferences a user's WebID URI, the server returns the profile document with proper content negotiation (Turtle or JSON-LD).

### 4. Resource Router (`solid/server/router.go`)

Routes requests to the appropriate storage backend:

```
Decision Logic:
  1. Parse request path → extract Pod owner
  2. Look up Pod owner in PostgreSQL → get pod_provider
  3. If pod_provider == "managed" → route to Managed Store
  4. If pod_provider == "external" → route to PodProxy
  5. Apply WAC authorization before forwarding
```

### 5. Managed Store (`solid/server/store.go`)

PostgreSQL-backed storage for managed Pods:

```sql
CREATE TABLE pod_resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_owner   TEXT NOT NULL,               -- username / Pod root
    path        TEXT NOT NULL,               -- resource path within Pod
    content_type TEXT NOT NULL,              -- MIME type
    body        BYTEA,                       -- resource content
    is_container BOOLEAN DEFAULT FALSE,
    etag        TEXT NOT NULL,               -- content hash for conditional requests
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_owner, path)
);

CREATE TABLE pod_acl (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_owner   TEXT NOT NULL,
    resource_path TEXT NOT NULL,             -- path this ACL applies to
    acl_body    TEXT NOT NULL,               -- Turtle content of .acl resource
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_owner, resource_path)
);

CREATE INDEX idx_pod_resources_owner_path ON pod_resources(pod_owner, path);
CREATE INDEX idx_pod_resources_container ON pod_resources(pod_owner, path) WHERE is_container = TRUE;
```

### 6. PodProxy (`solid/server/proxy.go`)

Transparent proxy to external Solid Pod servers:

```
PodProxy Flow:
  1. Client request arrives at /alice/profile/card
  2. Router determines alice uses external Pod (e.g., https://solidcommunity.net/alice/)
  3. PodProxy rewrites the path: /alice/profile/card → https://solidcommunity.net/alice/profile/card
  4. PodProxy forwards the request with proper auth:
     a. If user is the Pod owner → use stored OAuth2/DPoP credentials
     b. If platform agent → use agent DPoP credentials (if Pod owner granted access)
  5. PodProxy returns the response with SkillR-specific caching headers
  6. Optionally: PodProxy caches read responses in Redis (configurable TTL)

Configuration per user:
  users.pod_provider = 'external'
  users.pod_url = 'https://solidcommunity.net/alice/'
  users.pod_access_token = <encrypted in Secret Manager>
  users.pod_refresh_token = <encrypted in Secret Manager>
```

**PodProxy caching:** Read responses from external Pods are cached in Redis with a configurable TTL (default: 60s). Cache invalidation happens on write-through or on explicit refresh.

**Error handling:** If the external Pod is unreachable, the PodProxy returns a 502 (Bad Gateway) with a SkillR-specific error body indicating Pod provider status. The SkillR app falls back to local cache (Firestore mirror) for reads.

---

## PodFederation

Pod federation enables the SkillR platform to discover and aggregate data from multiple Pod servers. This is the foundation for cross-platform interoperability.

### Federation Model

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  SkillR Pod      │     │  External Pod A  │     │  External Pod B  │
│  Server (managed)│     │  (solidcommunity │     │  (inrupt.net)    │
│                  │     │   .net)           │     │                  │
│  alice/          │     │  bob/            │     │  carol/          │
│  dave/           │     │                  │     │                  │
└───────┬──────────┘     └────────┬─────────┘     └────────┬─────────┘
        │                        │                         │
        └────────────┬───────────┘                         │
                     │                                     │
              ┌──────▼─────────────────────────────────────▼──┐
              │           PodProxy Federation Layer            │
              │                                                │
              │  • Unified resource access across providers    │
              │  • WebID-based identity resolution             │
              │  • Cross-pod endorsement forwarding            │
              │  • Skill profile aggregation                   │
              └────────────────────────────────────────────────┘
```

### Federation Use Cases

| Use Case | Description | Phase |
|----------|-------------|-------|
| **BYOP Profile Sync** | User's SkillR profile synced to their external Pod | Phase 1 |
| **Cross-Pod Endorsements** | Endorser on Pod A endorses learner on Pod B | Phase 2 |
| **Federated Discovery** | Platform discovers journey definitions across company Pods | Phase 3 |
| **Profile Portability** | User migrates from managed Pod to external Pod (or vice versa) | Phase 2 |
| **Multi-Pod Aggregation** | User has SkillR data across multiple Pods (e.g., one per institution) | Phase 3 |

### Federation Protocol

1. **WebID Resolution:** Dereference a user's WebID to discover their Pod location and supported features.
2. **Pod Discovery:** Follow `solid:account` link from WebID profile to locate the Pod root.
3. **Capability Negotiation:** Check Pod server's `Accept-*` headers and supported auth mechanisms.
4. **Authorized Access:** Obtain access via Solid-OIDC or pre-configured DPoP credentials.
5. **Data Exchange:** Read/write resources using standard LDP operations.

---

## Authentication Architecture

### Phase 1: Firebase Auth Bridge

For managed Pods, authentication bridges Firebase JWT to WebID:

```
Browser → Firebase JWT → Go Backend → WebID lookup → Pod access (direct, no DPoP)
```

The Go backend is both the API server and the Pod server. Since they share the same process, Pod access for managed Pods doesn't require DPoP — the backend directly accesses PostgreSQL-stored resources after verifying the Firebase JWT and mapping it to a WebID.

### Phase 2: Solid-OIDC for External Pods

For external Pods (BYOP), the platform authenticates using Solid-OIDC:

```
1. User connects external Pod → OAuth2 consent flow
2. Platform receives access_token + refresh_token
3. Platform stores tokens in Secret Manager
4. PodProxy uses DPoP-bound tokens for external Pod access
5. Token refresh handled automatically by PodProxy
```

### Phase 3: Full Solid-OIDC on Managed Pods

For interoperability, managed Pods also expose Solid-OIDC:

```
1. External app wants to access a SkillR user's managed Pod
2. External app discovers OIDC issuer from WebID profile
3. SkillR acts as OpenID Provider (or delegates to Firebase)
4. External app authenticates via Solid-OIDC + DPoP
5. WAC engine authorizes access based on ACL rules
```

---

## Implementation Phases

### Phase 1: Managed Pod Server (FR-086)

**Goal:** Replace CSS with a Go-native Solid server for managed Pods.

**Scope:**
- LDP resource lifecycle (CRUD on containers and resources)
- Turtle serialization/deserialization
- PostgreSQL storage backend (`pod_resources`, `pod_acl` tables)
- WAC authorization engine
- WebID Profile Documents
- Firebase JWT → WebID auth bridge
- Container listing with `ldp:contains` triples
- CORS headers per Solid Protocol
- Link headers (ACL, type)
- Intermediate container creation
- Slash-semantics with 301 redirects

**Not in Phase 1:**
- JSON-LD content negotiation (Turtle only)
- N3 Patch (PUT/DELETE only for updates)
- ETag / conditional requests
- Solid-OIDC (uses Firebase auth bridge)

**Deliverables:**
- `backend/internal/solid/server/` package
- Database migrations for `pod_resources` and `pod_acl`
- Unit tests for all LDP operations and WAC decisions
- Integration tests against the Pod server
- Update Docker Compose to remove CSS service

### Phase 2: PodProxy & BYOP (FR-087)

**Goal:** Enable users to connect external Pods via a proxy layer.

**Scope:**
- PodProxy transparent forwarding
- External Pod connection flow (OAuth2/Solid-OIDC consent)
- Token storage in Secret Manager
- Token refresh lifecycle
- Read caching (Redis, optional)
- Pod migration: managed → external, external → managed
- Error handling for unreachable external Pods
- Fallback to Firestore mirror on proxy failure

**Deliverables:**
- `backend/internal/solid/server/proxy.go`
- Updated `users` table with external Pod credentials reference
- Integration tests with mock external Pod
- Admin console: Pod provider statistics

### Phase 3: SkillR Profile in Pod (FR-088)

**Goal:** Users store their SkillR skill profile as the canonical record in their Pod.

**Scope:**
- Automatic profile sync on profile update (app → Pod)
- Bidirectional sync for users who edit their Pod directly
- Full SkillR vocabulary (TC-019 `fs:` namespace) enforcement
- Profile completeness validation
- Pod-first reads for profile data (with Firestore cache)
- Profile export as self-contained Turtle/JSON-LD archive
- Profile portability: download and re-import on another Solid server

**Deliverables:**
- Updated sync service with event-driven triggers
- Profile validation against `fs:` vocabulary schema
- Frontend Pod data viewer with profile preview
- Integration tests for sync round-trip

### Phase 4: Federation (future)

**Goal:** Cross-Pod discovery and data exchange.

**Scope:**
- Federated WebID resolution
- Cross-pod endorsement flow
- Company Pod discovery
- Journey definition federation
- Solid Notifications for real-time cross-pod events

---

## Consequences

### Benefits

- **Single runtime:** One Go binary, one Docker image, one Cloud Run service. Eliminates CSS (Node.js) dependency entirely.
- **Deep domain integration:** SkillR vocabulary validation, Firebase auth bridge, and profile semantics are native — no adapter layers.
- **PodProxy enables true BYOP:** Users with existing Pods on Inrupt, solidcommunity.net, or self-hosted instances can use them with SkillR without migration.
- **Federation-ready:** The PodProxy architecture naturally extends to cross-Pod discovery and data exchange.
- **Specification compliance:** Building against the official Solid Technical Reports ensures interoperability with the broader Solid ecosystem.
- **Performance:** Go's efficiency eliminates V8 overhead. PostgreSQL-backed storage scales with Cloud SQL.

### Trade-offs

- **Implementation effort:** Building a Solid-compliant server from scratch is significantly more work than deploying CSS. Mitigated by phased approach — Phase 1 implements only the required subset.
- **Specification tracking:** We must monitor Solid Protocol updates (currently v0.11.0 CG-DRAFT) and adapt. Mitigated by targeting stable MUST requirements only.
- **Testing burden:** Must verify compliance against the Solid specification, not just our own test suite. Consider using the Solid Test Suite (https://github.com/solid-contrib/conformance-test-harness) for validation.
- **Turtle parsing:** Requires a robust RDF/Turtle parser in Go. Options: `github.com/deiu/rdf2go`, `github.com/knakk/rdf`, or custom parser for the subset we need.

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Spec changes break our server | Pin to Solid Protocol v0.11.0; track changelog |
| Turtle parsing edge cases | Use established Go RDF library; fuzz-test parser |
| External Pod auth complexity | Phase 2; start with managed-only in Phase 1 |
| Performance under load | PostgreSQL indexes; connection pooling; Redis cache for proxy |
| WAC decision correctness | Property-based testing of ACL evaluation; conformance tests |

---

## Alternatives Considered

### 1. Continue with CSS (Community Solid Server)

Keep CSS as a sidecar service. Rejected because:
- Dual-runtime complexity (Go + Node.js)
- No proxy/federation capability built-in
- Limited customization for Firebase auth bridge
- Additional Docker image and Cloud Run service cost

### 2. Fork CSS and customize

Fork CSS v7 and add our features. Rejected because:
- Maintaining a Node.js fork alongside a Go backend
- Upstream merge complexity
- Still requires dual-runtime deployment

### 3. Use Inrupt's Enterprise Solid Server (ESS)

Deploy ESS as a managed service. Rejected because:
- Commercial licensing cost
- Vendor dependency
- Less control over auth bridge and domain customization
- Overkill for our scale

### 4. Implement only PodProxy (no managed storage)

Only proxy external Pods, require all users to get a Pod from an external provider. Rejected because:
- High friction for onboarding (users must create a Pod elsewhere first)
- Dependency on external Pod availability
- No control over performance or data locality

---

## Dependencies

- [TC-019](TC-019-solid-pod-storage-layer.md) — Four-tier storage architecture (this concept refines Tier S)
- [TC-020](TC-020-bot-fleet-identity.md) — Bot fleet identity (agent WebIDs interact with Pod ACLs)
- [FR-076](../features/FR-076-solid-pod-connection.md) — Pod connection (updated to use custom server)
- [FR-077](../features/FR-077-pod-data-sync.md) — Pod data sync (updated for bidirectional)
- [FR-086](../features/FR-086-custom-solid-pod-server.md) — Custom Solid Pod Server implementation
- [FR-087](../features/FR-087-podproxy-federation-layer.md) — PodProxy federation layer
- [FR-088](../features/FR-088-skillr-profile-pod-storage.md) — SkillR profile Pod storage

## Notes

- Solid Technical Reports Index: https://solidproject.org/TR/
- Solid Protocol v0.11.0: https://solidproject.org/TR/protocol
- Web Access Control v1.0.0: https://solidproject.org/TR/wac
- Solid-OIDC v0.1.0: https://solidproject.org/TR/oidc
- Solid WebID Profile v1.0.0: https://solid.github.io/webid-profile/
- Solid Conformance Test Harness: https://github.com/solid-contrib/conformance-test-harness
- Go RDF libraries: `github.com/deiu/rdf2go`, `github.com/knakk/rdf`
- The `fs:` namespace (`https://vocab.maindset.academy/ns/`) defined in TC-019 is used for all SkillR-specific RDF classes and properties
- The custom server runs on the same Cloud Run instance as the main backend, exposed under the `/pods/` path prefix (or on a separate subdomain `pods.maindset.academy` via path-based routing)
