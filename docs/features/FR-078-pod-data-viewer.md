# FR-078: Pod Data Viewer

**Status:** done
**Priority:** could
**Created:** 2026-02-21
**Entity:** SkillR
**Gate:** MVP4

## Problem
Users need to see what data has been synced to their Pod in a human-readable format, without needing to navigate the raw Turtle files on the Pod server.

## Solution
Provide a Pod data read endpoint that fetches the user's Pod contents and returns them as structured JSON.

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

### Frontend Integration
The PodManagementCard in the profile page shows:
- Connected/disconnected status
- Pod URL and last sync time
- Sync status indicator
- "Jetzt synchronisieren" button
- "Trennen" button with confirmation

## Acceptance Criteria
- [ ] User can view Pod contents in human-readable format via API
- [ ] PodManagementCard shows connection status and sync history
- [ ] Disconnect has confirmation step to prevent accidental disconnection

## Dependencies
- FR-076 (Solid Pod Connection)
- FR-077 (Pod Data Sync)

## Notes
Full in-app Pod data viewer UI is V2.0 scope. MVP4 provides the API endpoint and basic status display in the profile card.
