# FR-078: Pod Data Viewer

**Status:** done
**Priority:** could
**Created:** 2026-02-21
**Updated:** 2026-02-23
**Entity:** SkillR
**Gate:** MVP4

## Problem
Users need to see what data has been synced to their Pod in a human-readable format, without needing to navigate the raw Turtle files on the Pod server.

## Solution
Provide a Pod data read endpoint and an in-app modal viewer.

### API Endpoint
- `GET /api/v1/pod/data` — Read Pod contents (human-readable JSON)

### Response Format
```json
{
  "profile": {
    "state": "<turtle content>",
    "skill-profile": "<turtle content>",
    "engagement": "<turtle content>"
  },
  "journey": {
    "vuca-state": "<turtle content>"
  },
  "reflections": []
}
```

### Frontend — Pod Data Viewer Modal
A top-level modal (`PodDataViewerModal`) opened from an eye icon in the PodManagementCard header (visible when connected). The modal is rendered at the `CombinedProfile` level, not inside the card.

**Components:**
- `frontend/components/pod/PodDataViewerModal.tsx` — modal component (max-w-3xl, 85vh)
- `frontend/components/pod/PodManagementCard.tsx` — eye icon button, `onViewData` callback
- `frontend/components/CombinedProfile.tsx` — state owner, renders modal at top level

**Modal features:**
- Fetches pod data via `getPodData()` on open
- 3 collapsible sections: Profil (default open), Reise, Reflexionen
- Each resource shown as a labeled `<pre>` block with raw Turtle/RDF content
- Loading spinner, error state, empty state ("Noch keine Daten im Pod")
- Close button top-right, backdrop click to dismiss

### PodManagementCard
- Connected/disconnected status
- Pod URL and last sync time
- Sync status indicator
- Eye icon to open data viewer (when connected)
- "Jetzt synchronisieren" button
- "Trennen" button with confirmation

## Acceptance Criteria
- [x] `GET /api/v1/pod/data` returns Pod contents in structured JSON
- [x] PodManagementCard shows connection status and sync history
- [x] Disconnect has confirmation step to prevent accidental disconnection
- [x] Eye icon appears on PodManagementCard when pod is connected
- [x] Clicking eye icon opens PodDataViewerModal at page level
- [x] Modal shows loading state while fetching
- [x] Modal displays collapsible Profil / Reise / Reflexionen sections
- [x] Empty state shown when pod has no data yet

## Dependencies
- FR-076 (Solid Pod Connection)
- FR-077 (Pod Data Sync)

## Notes
The modal is deliberately rendered at the CombinedProfile level (not inside the card) so it can use full-screen overlay sizing independent of the card's layout.
