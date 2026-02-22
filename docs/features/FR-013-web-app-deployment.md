# FR-013: Web App Deployment

**Status:** draft
**Priority:** must
**Created:** 2026-02-17

## Scope
The MVP runs as a web application accessible via browser — no app store, no installation. Deployed on Google Cloud Run. Must work on mobile and desktop browsers. Target: first ~100 test users within Google Cloud free tier. The app is reached via a URL with a start button on the landing page.

## Intent
Zero friction to first use. A link in a WhatsApp group should be enough to onboard a test user. No app store review, no install barrier, no platform lock-in. Cloud Run provides scale-to-zero economics for the MVP phase.

## Dependencies
- All other FRs (this is the delivery vehicle)
