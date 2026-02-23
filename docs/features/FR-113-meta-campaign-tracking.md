# FR-113: Meta Ad Campaign Tracking

**Status:** in-progress
**Priority:** must
**Created:** 2026-02-23

## Problem

The project has existing but dead campaign infrastructure: `captureUTM()` in `campaignAttribution.ts` and Meta Pixel events in `metaPixel.ts` are never called. UTM params are never merged into analytics events. There is no way for an admin to define campaigns or see their performance.

## Solution

1. **Activate UTM capture** — Call `captureUTM()` on App mount so URL parameters are stored in sessionStorage
2. **Merge UTM into analytics** — Spread stored UTM params into every analytics event's `properties`
3. **Activate Meta Pixel** — Initialize pixel after marketing consent, fire lifecycle events (ViewContent, InitiateCheckout, CompleteRegistration)
4. **Campaign management** — New `campaigns` table, CRUD API routes, and admin "Kampagnen" tab
5. **Performance tracking** — Stats endpoint that queries `user_events` by `utm_campaign` for conversion funnel metrics

## Acceptance Criteria

- [ ] Opening `/?utm_source=meta&utm_campaign=test1` stores UTM params in sessionStorage
- [ ] All analytics events include UTM params in their properties when present
- [ ] Meta Pixel loads only after marketing consent is granted
- [ ] Pixel fires ViewContent on coach select, InitiateCheckout on intro start, CompleteRegistration on login
- [ ] Admin can create, edit, and archive campaigns via Kampagnen tab
- [ ] Campaign form auto-generates UTM link with copy button
- [ ] Stats view shows visitor count, registration count, cost-per-visitor, cost-per-registration, and funnel
- [ ] `npx tsc --noEmit` passes with zero new errors

## Dependencies

- FR-064 (Campaign Attribution & Meta Pixel — dead code that this FR activates)
- FR-066 (Cookie Consent — consent gating for pixel)
- FR-050 (User Behavior Tracking — analytics event infrastructure)

## Notes

- Campaign URLs use the pattern `https://skillr.app?utm_source=...&utm_campaign=...`
- Stats are derived from existing `user_events` table via `json_extract` on the `properties` JSONB column
- Soft-delete pattern: campaigns are archived (status='archived'), never hard-deleted
