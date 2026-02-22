# FR-087: PodProxy Federation Layer

**Status:** draft
**Priority:** should
**Created:** 2026-02-21
**Entity:** SkillR

## Problem

Users who already have a Solid Pod (e.g., on solidcommunity.net, Inrupt Pod Spaces, or self-hosted CSS instances) cannot use their existing Pod with SkillR. The current implementation only supports managed Pods (hosted by SkillR). This creates two problems:

1. **Data fragmentation:** Users with existing Pods must maintain a separate SkillR-managed Pod alongside their personal Pod. Their SkillR profile is isolated from the rest of their Solid ecosystem.
2. **No federation:** SkillR cannot discover or interact with data on external Pods — no cross-platform endorsements, no federated journey discovery, no profile portability beyond the SkillR platform.

The PodProxy bridges this gap: a transparent proxy layer in the SkillR backend that forwards LDP requests to external Pod servers, enabling BYOP (Bring Your Own Pod) and laying the foundation for Pod federation.

## Solution

Implement a PodProxy component (`backend/internal/solid/server/proxy.go`) within the custom Solid Pod server (FR-086). The PodProxy operates as a transparent forwarding layer that:

1. **Translates internal Pod paths to external Pod URLs** — A request to `/pods/alice/profile/card` is forwarded to `https://solidcommunity.net/alice/profile/card` if Alice uses an external Pod.
2. **Manages authentication to external Pods** — Stores and refreshes OAuth2/DPoP credentials obtained during the BYOP connection flow.
3. **Applies SkillR-specific caching** — Caches read responses from external Pods to reduce latency and handle temporary unavailability.
4. **Enables federation** — The same proxy mechanism extends to cross-Pod discovery and data exchange.

### BYOP Connection Flow

```
1. User clicks "Eigenen Pod verbinden" in SkillR settings
2. User enters their Pod URL (e.g., https://solidcommunity.net/alice/)
3. SkillR discovers Pod's OIDC issuer from .well-known/openid-configuration
4. SkillR initiates Solid-OIDC authorization flow:
   a. Redirect to Pod's OIDC provider
   b. User grants SkillR access to their Pod
   c. SkillR receives authorization code
   d. Exchange for DPoP-bound access token + refresh token
5. SkillR stores tokens securely (GCP Secret Manager)
6. SkillR verifies access by reading the Pod's root container
7. SkillR initializes SkillR-specific containers if they don't exist:
   - /{webid}/skillr/profile/
   - /{webid}/skillr/journey/
   - /{webid}/skillr/journal/reflections/
8. Connection complete — user's Pod is now accessible through PodProxy
```

### PodProxy Request Flow

```
Client → SkillR Backend → PodProxy → External Pod

1. Request: GET /pods/alice/profile/card
2. Router: users.pod_provider = 'external' → route to PodProxy
3. PodProxy:
   a. Rewrite path: /pods/alice/profile/card
      → https://solidcommunity.net/alice/profile/card
   b. Attach DPoP proof + access token
   c. Forward request
   d. Cache response (if GET, configurable TTL)
   e. Return response to client
```

### Pod Migration

Users can migrate between managed and external Pods:

**Managed → External:**
1. User connects external Pod via BYOP flow
2. SkillR copies all Pod resources to the external Pod (preserving paths)
3. SkillR updates `users.pod_provider` from 'managed' to 'external'
4. SkillR retains managed Pod data for 30 days (grace period)
5. After 30 days, managed Pod data is purged

**External → Managed:**
1. User disconnects external Pod
2. SkillR provisions a new managed Pod
3. SkillR copies accessible data from external Pod to managed Pod
4. SkillR updates `users.pod_provider` from 'external' to 'managed'
5. External Pod retains user's data (user's responsibility)

### Federation Discovery

For future cross-Pod features:

```
PodFederation Discovery:
  1. Given a WebID URI (e.g., https://solidcommunity.net/bob/profile/card#me)
  2. Dereference WebID → get profile document
  3. Extract solid:account → locate Pod root
  4. Check for SkillR namespace containers (/{webid}/skillr/)
  5. If present → user has SkillR data on this Pod
  6. Index discovered WebID ↔ Pod mapping in PostgreSQL
```

### Error Handling & Resilience

| Scenario | Behavior |
|----------|----------|
| External Pod returns 5xx | Return 502 to client; serve from cache if available |
| External Pod unreachable (timeout) | Return 504; serve stale cache with `Warning` header |
| DPoP token expired | Auto-refresh using stored refresh token; retry request |
| Refresh token revoked | Return 401; mark Pod as "disconnected"; notify user |
| External Pod returns 403 | Return 403; log access denial; suggest re-authorization |
| Network error during migration | Partial migration tracked; resume on next attempt |

## Acceptance Criteria

- [ ] PodProxy forwards GET, HEAD, PUT, POST, DELETE to external Pods
- [ ] PodProxy rewrites internal paths to external Pod URLs correctly
- [ ] DPoP proof generation for external Pod authentication
- [ ] OAuth2 token storage in GCP Secret Manager (not in database)
- [ ] Automatic token refresh on 401 responses from external Pods
- [ ] BYOP connection flow: discover OIDC issuer, authorize, store tokens
- [ ] BYOP disconnection: revoke tokens, clear references, update pod_provider
- [ ] Read caching with configurable TTL (default: 60s)
- [ ] Cache invalidation on write-through (PUT/POST/DELETE invalidate affected paths)
- [ ] 502 response with SkillR error body when external Pod is unavailable
- [ ] Stale cache serving with `Warning` header when Pod is temporarily down
- [ ] Pod migration: managed → external (copy resources, update provider)
- [ ] Pod migration: external → managed (copy accessible data, provision managed Pod)
- [ ] Migration progress tracking (partial migration resume)
- [ ] SSRF prevention on external Pod URLs (block private networks, metadata endpoints)
- [ ] Admin console: list users by Pod provider, show proxy error rates
- [ ] Unit tests for: path rewriting, DPoP proof generation, cache logic, error handling
- [ ] Integration tests for: BYOP flow (mock external Pod), migration, proxy forwarding

## Dependencies

- [TC-032](../arch/TC-032-custom-solid-pod-server.md) — Architecture concept
- [FR-086](FR-086-custom-solid-pod-server.md) — Custom Solid Pod Server (prerequisite)
- [FR-076](FR-076-solid-pod-connection.md) — Pod connection (updated for BYOP)
- [FR-056](FR-056-server-auth-session-management.md) — Server auth (token management patterns)
- [FR-069](FR-069-gcp-credential-management.md) — GCP credential management (Secret Manager)

## Notes

- Solid-OIDC specification: https://solidproject.org/TR/oidc (v0.1.0)
- DPoP specification: RFC 9449
- The PodProxy must handle content negotiation — external Pods may return JSON-LD where SkillR expects Turtle. The proxy should request `Accept: text/turtle` explicitly.
- External Pod providers known to work with Solid-OIDC: solidcommunity.net (CSS), Inrupt Pod Spaces (ESS), self-hosted CSS v7+
- PodProxy caching uses Redis when available, in-memory LRU cache as fallback
- Federation discovery is opt-in: users must explicitly grant SkillR discovery access on their external Pod
- Rate limiting: PodProxy respects external Pod's rate limits (429 responses) and implements backoff
