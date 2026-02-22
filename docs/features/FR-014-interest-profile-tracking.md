# FR-014: Interest Profile Tracking (Backend)

**Status:** draft
**Priority:** must
**Created:** 2026-02-17

## Scope
Backend service in Go that maintains and updates the student's interest profile in real-time. Every dialogue interaction, navigation choice, and skipped option contributes to the profile. The service receives interaction records from the multimodal storage layer (TC-004), extracts interest signals, and updates profile dimensions (Hard Skills, Soft Skills, Future Skills, Resilience). The profile is stored in Firebase and accessible via API.

## Intent
The interest profile is the product. The backend must ensure that every interaction — no matter how small — is captured, analyzed, and reflected in the profile. This is the engine that turns conversation into self-knowledge.

## Dependencies
- FR-003 (Firebase user data)
- FR-005 (Gemini AI dialogue engine)
- TC-004 (Multimodal storage layer)
- US-001 (Interest profile discovery)
