# TC-013: Firestore Persistence Strategy

**Status:** accepted
**Created:** 2026-02-18
**Entity:** SkillR

## Context

The app currently persists all user state (journey progress, VUCA station state, voice preferences) in `localStorage`. This means:
- State is lost when switching devices
- State is lost when clearing browser data
- No server-side backup exists
- Admin cannot observe user progress

FR-003 (Firebase Persistence) and FR-012 (Session Continuity) require state to survive device switches. The MVP1 exit criteria explicitly require: "State persists in Firebase across sessions."

## Decision

**Approach: Client-side Firestore SDK with localStorage fallback.**

We write directly to Firestore from the browser using the Firebase JS SDK. When Firebase is not configured (local dev without credentials), we fall back to localStorage transparently.

### Data Model

```
firestore/
  users/{uid}/
    state/journey     → AppState (view, profile, stationResults, activeJourney, activeStation)
    state/vuca        → VucaStationState (view, goal, curriculum, progress, activeModuleId)
    state/preferences → { voiceEnabled, voiceDialect }
```

### Why Client-Side Firestore (Not Server-Routed)

| Factor | Client-Side Firestore | Server-Routed |
|--------|----------------------|---------------|
| Latency | Direct, no extra hop | +1 HTTP round trip |
| Offline | Built-in offline persistence | Requires custom offline queue |
| Security | Firestore rules scoped to uid | Must validate tokens on server |
| Complexity | Firebase SDK already in bundle | Need new server endpoints |
| Dev mode | Falls back to localStorage | Need to maintain parallel storage |

**Challenge considered:** Client-side Firestore means security rules must be airtight. Mitigation: rules enforce `request.auth.uid == resource.data.userId` and only allow writes to `users/{uid}/**` where `uid == request.auth.uid`.

**Challenge considered:** Firestore writes on every state change could be expensive. Mitigation: debounce writes (500ms) and only write changed subcollections. At MVP scale (< 100 users), cost is negligible.

**Challenge considered:** Mixing localStorage and Firestore creates dual-source-of-truth risk. Mitigation: on login, Firestore is authoritative. On logout or missing Firebase config, localStorage is authoritative. Clear migration path: on first Firestore-enabled login, if Firestore doc is empty and localStorage has data, migrate localStorage data to Firestore once.

## Consequences

- **Good:** State survives device switch immediately after implementation
- **Good:** No new server endpoints needed
- **Good:** Offline capability comes free with Firestore persistence
- **Bad:** Requires Firestore security rules deployment (separate from code)
- **Bad:** `firebase/firestore` adds ~40KB to bundle (acceptable for MVP)
- **Risk:** If security rules are misconfigured, user data could be exposed. Mitigated by rule templates in repo.

## Alternatives Considered

### 1. Server-Side SQLite via Express API
Rejected: Would require session tokens on every API call, doubling the server surface area. The Go backend (planned for MVP2) would need to reimplement the same endpoints.

### 2. Firebase Realtime Database
Rejected: Firestore has better querying, offline persistence, and is the recommended Firebase product for new projects.

### 3. Keep localStorage Only
Rejected: Fails the MVP1 exit criterion "State persists in Firebase across sessions."
