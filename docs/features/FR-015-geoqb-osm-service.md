# FR-015: GeoQB / OpenStreetMap Service (Backend)

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Scope
Backend service in Go that integrates the GeoQB project and OpenStreetMap data to resolve interest topics into geographically relevant places. Provides an API for the dialogue engine to request "places related to topic X" with support for local (near user) and global (far away) result sets. Returns place name, coordinates, description, and relevance context.

## Intent
The VUCA journey is a geographic exploration. Without real places, the journey is abstract. GeoQB/OSM grounds every step in a real location — the student "travels" somewhere tangible, which makes the learning experience concrete and memorable.

## Dependencies
- TC-001 (GeoQB and OpenStreetMap integration)
- FR-006 (VUCA navigation)
- US-002 (Contextual exploration across places)
