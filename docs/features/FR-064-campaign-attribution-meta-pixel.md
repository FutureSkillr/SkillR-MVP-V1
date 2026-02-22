# FR-064: Campaign-Attribution und Meta-Pixel

**Status:** done
**Priority:** could
**Created:** 2026-02-20
**Entity:** maindset.ACADEMY
**Gate:** mvp3

## Problem

Kein Campaign-Attribution (UTM, fbclid). Kein Meta Pixel. ROI von Ad-Kampagnen kann nicht gemessen werden.

## Solution

UTM-Parameter von URL beim ersten Besuch erfassen und in sessionStorage speichern. Meta Pixel nur nach Cookie-Consent laden. UTM-Params an alle Analytics-Events mergen.

### Neue Dateien
| Datei | Zweck |
|-------|-------|
| `frontend/services/campaignAttribution.ts` | UTM-Capture, sessionStorage, Retrieval |
| `frontend/services/metaPixel.ts` | Meta Pixel Init, Standard-Events |

### UTM-Parameter
```typescript
interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
}
```

### Meta Pixel Standard-Events
| Meta Event | App-Trigger | Custom Data |
|-----------|-------------|-------------|
| `PageView` | WelcomePage Mount | — |
| `ViewContent` | Coach ausgewaehlt | coach_id, content_category |
| `InitiateCheckout` | IntroChat gestartet | coach_id, wait_time |
| `CompleteRegistration` | Registrierung erfolgreich | interests |

## Acceptance Criteria

- [x] UTM-Parameter von URL beim ersten Besuch erfasst und in sessionStorage gespeichert
- [x] `fbclid` und `gclid` erfasst
- [x] UTM-Params an alle Analytics-Events in `properties` angehaengt
- [x] Meta Pixel Script nur geladen wenn `META_PIXEL_ID` gesetzt UND Cookie-Consent erteilt
- [x] Meta Standard-Events feuern an korrekten Stellen
- [x] CSP-Headers erlauben Meta Pixel Domains
- [x] Kein Meta Pixel Code wenn `META_PIXEL_ID` leer (Zero Tracking by Default)
- [x] Pixel-ID via `/api/config` geliefert, nie hardcoded im Bundle

## Dependencies

- FR-066 (Cookie-Consent-Banner) — Blocker: muss vor Meta-Pixel-Aktivierung implementiert sein
- FR-063 (Visitor Lifecycle Tracking)

## Notes

Zero Tracking by Default: Ohne `META_PIXEL_ID` env var wird kein externes Tracking geladen.
