# FR-072: Honeycomb Service Configuration

**Status:** in-progress
**Priority:** must
**Gate:** env:dev
**Created:** 2026-02-21
**Entity:** SkillR

## Problem

The backend needs to communicate with the external Honeycomb API (learning journey management) and Memory service (user identity mapping). These services require base URLs and API keys configured via environment variables, following the same pattern as existing GCP/VertexAI configuration.

## Solution

Add configuration fields for Honeycomb and Memory service endpoints to the backend config, loaded from environment variables. The services are optional — if not configured, Lernreise routes are not registered.

### Configuration Fields

| Field | Env Var | Required | Description |
|-------|---------|----------|-------------|
| `HoneycombURL` | `HONEYCOMB_URL` | No | Base URL of the Honeycomb API |
| `HoneycombAPIKey` | `HONEYCOMB_API_KEY` | No | API key for Honeycomb (sent as `X-API-KEY` header) |
| `MemoryServiceURL` | `MEMORY_SERVICE_URL` | No | Base URL of the Memory service |
| `MemoryServiceAPIKey` | `MEMORY_SERVICE_API_KEY` | No | API key for Memory service (sent as `X-API-KEY` header) |

## Acceptance Criteria

- [x] `config.go` includes `HoneycombURL`, `HoneycombAPIKey`, `MemoryServiceURL`, `MemoryServiceAPIKey` fields
- [x] Fields loaded from environment variables in `Load()`
- [x] `.env.example` documents the new variables with commented-out defaults
- [x] Server starts without error when variables are not set (Lernreise features disabled)
- [x] No secrets appear in committed code

## Dependencies

- TC-028: Lernreise tracking concept

## Notes

Authentication uses the `X-API-KEY` header pattern defined in the Honeycomb and Memory OpenAPI specs (`integrations/api-spec/honeycomb-services.yml`, `integrations/api-spec/memory-services.yml`).
