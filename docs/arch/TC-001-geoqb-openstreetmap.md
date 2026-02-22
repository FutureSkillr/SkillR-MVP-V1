# TC-001: GeoQB and OpenStreetMap Integration

**Status:** draft
**Created:** 2026-02-17

## Context
The VUCA journey is a geographic exploration — students "travel" to real places connected to their interests. This requires a spatial data layer that can resolve interest topics to relevant geographic locations. OpenStreetMap (OSM) provides the open geographic data. The GeoQB project provides spatial query capabilities for interest-to-location mapping.

## Decision
Use OpenStreetMap as the primary geographic data source and integrate the GeoQB project for spatial queries. The backend (Go) queries GeoQB to find places relevant to the student's current interest and journey context. Results are used to populate navigation options (local vs. global, thematic locations).

## Key Requirements
- Resolve interest topics to geographically relevant places (e.g., "Holz" → Black Forest, Scandinavian timber regions, Japanese woodcraft towns)
- Support "near me" (local) and "far away" (global) result sets
- Provide place metadata (name, description, coordinates, relevance to topic)
- Integrate with the Gemini dialogue engine for context-aware place suggestions

## Consequences
- Dependency on GeoQB project availability and API stability
- OSM data is open but requires processing/caching for performance
- Place suggestions are only as good as the topic-to-location mapping logic

## Alternatives Considered
- Google Maps API: proprietary, costly at scale, licensing restrictions
- Static place database: low maintenance but no dynamic discovery
- Pure LLM-generated places: risk of hallucinated locations without grounding

## Related
- US-002 (Contextual exploration across places)
- FR-006 (VUCA navigation and exploration)
