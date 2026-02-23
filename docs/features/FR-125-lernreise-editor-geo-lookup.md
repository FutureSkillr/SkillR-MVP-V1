# FR-125: Lernreise Editor — Geo-Lookup for Station Locations

**Status:** open
**Priority:** could
**Created:** 2026-02-23
**Entity:** SkillR
**Gate:** MVP4

## Problem
When editing a Lernreise station, the admin must manually enter latitude and longitude for the station location. This is error-prone (coordinates default to 0/0) and requires the admin to look up coordinates externally.

## Solution
Add a geocoding search to the station location section of the Lernreise editor. The admin types a search query (e.g. "06217 Frankleben DE") and picks from matching results in a modal. The selected result auto-fills the Location, Breitengrad (lat), and Laengengrad (lng) fields.

### Search Input
- A single text field accepting `ZIP City (Country)` queries, e.g. `06217 Frankleben DE`
- A "Suchen" button triggers the lookup
- Uses **Google Geocoding API** (Places API / Geocoding API) — requires GCP API key with billing enabled

### Results Modal
- Opens after search with a list of matching locations
- Each result shows: display name, coordinates, country
- Admin clicks a result to select it
- On selection: Location, lat, lng fields are auto-filled and the modal closes

### Fallback
- Manual coordinate entry remains available for edge cases
- If no results found, show "Keine Ergebnisse" message

## Acceptance Criteria
- [ ] Location section in Lernreise editor has a search field with "Suchen" button
- [ ] Clicking "Suchen" queries Nominatim with the entered text
- [ ] Results modal shows matching locations with display name and coordinates
- [ ] Selecting a result fills Location, lat, lng fields automatically
- [ ] Manual coordinate entry still works as before
- [ ] Empty/failed search shows appropriate feedback

## Dependencies
- FR-124 (Content Pack Editor) — the Lernreise editor where this is integrated
- OBS-001 (Gemini Quota) — GCP billing must be active (same prerequisite)

## Notes
- Uses **Google Geocoding API** via GCP: `https://maps.googleapis.com/maps/api/geocode/json?address=...&key=API_KEY`
- Requires `geocoding` or `places` API enabled in GCP project
- API key should be restricted to Geocoding API and referrer-locked to the admin domain
- Geocoding calls should be proxied through the Go backend to avoid exposing the API key in the browser
- Pricing: $5 per 1,000 requests (first $200/month free via GCP credit) — negligible for admin-only usage
