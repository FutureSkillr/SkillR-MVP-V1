# Architecture Decision Records (ADR)

Architecture Decision Records dokumentieren wichtige technische Entscheidungen, ihren Kontext und ihre Konsequenzen. Sie dienen als institutionelles Gedaechtnis des Projekts und helfen neuen Teammitgliedern zu verstehen, **warum** bestimmte technische Entscheidungen getroffen wurden.

## Was ist ein ADR?

Ein Architecture Decision Record (ADR) beschreibt:

- **Kontext** -- Warum war diese Entscheidung noetig?
- **Entscheidung** -- Was wurde entschieden?
- **Konsequenzen** -- Welche Vor- und Nachteile hat die Entscheidung?
- **Alternativen** -- Was wurde sonst in Betracht gezogen?

## Status-Werte

| Status | Bedeutung |
|--------|-----------|
| `draft` | Entwurf, noch nicht abgestimmt |
| `accepted` | Akzeptiert und in Umsetzung oder umgesetzt |
| `superseded` | Durch einen neueren TC ersetzt |

## Entscheidungs-Index

| TC | Titel | Status | Datum |
|----|-------|--------|-------|
| TC-001 | GeoQB and OpenStreetMap Integration | draft | 2026-02-17 |
| TC-002 | Wikipedia Data Integration | draft | 2026-02-17 |
| TC-003 | Job Portal Data Integration | draft | 2026-02-17 |
| TC-004 | Multimodal Storage Layer | draft | 2026-02-17 |
| TC-005 | Response Timing and Intent Analysis | draft | 2026-02-17 |
| TC-006 | Matching Engine | draft | 2026-02-17 |
| TC-007 | Portfolio Evidence Layer | draft | 2026-02-17 |
| TC-008 | Auditierbare Methodik (Auditable Profiling Methodology) | draft | 2026-02-17 |
| TC-009 | Multimodaler Erinnerungsraum (Multimodal Memory Space) | draft | 2026-02-18 |
| TC-010 | Blockchain-Based Learning Record Verification | draft | 2026-02-18 |
| TC-011 | Cloud Run Deployment Architecture | accepted | 2026-02-18 |
| TC-012 | Clickstream Analytics Architecture | accepted | 2026-02-18 |
| TC-013 | Firestore Persistence Strategy | accepted | 2026-02-18 |
| TC-014 | Engagement System Data Model | accepted | 2026-02-19 |
| TC-015 | 3D Globe Technology Choice | accepted | 2026-02-19 |
| TC-016 | API Gateway Architecture | accepted | 2026-02-19 |
| TC-017 | Unified Data Model | draft | 2026-02-19 |
| TC-018 | Agentic Backend Services & VertexAI Migration | draft | 2026-02-19 |
| TC-019 | SOLID Pod Decentralized Storage Layer | draft | 2026-02-19 |
| TC-020 | Bot Fleet Identity & Purpose-Bound Pod Access | draft | 2026-02-19 |
| TC-021 | Security Inspection Framework (OWASP + DSGVO Gate) | accepted | 2026-02-19 |
| TC-022 | Database Layer Cost Optimization | draft | 2026-02-19 |
| TC-023 | Chat Dialog Architecture | accepted | 2026-02-19 |
| TC-024 | Feature Toggle System | accepted | 2026-02-19 |
| TC-025 | Security Hardening Phase | accepted | 2026-02-20 |
| TC-026 | Warteraum-Queue und Campaign-Tracking Architektur | accepted | 2026-02-20 |
| TC-027 | Infrastructure as Code with Terraform | accepted | 2026-02-20 |
| TC-028 | Lernreise Tracking via Honeycomb Integration | accepted | 2026-02-21 |
| TC-029 | Consolidated Configuration Management | accepted | 2026-02-21 |
| TC-030 | Multi-Tenant Sponsor Showrooms Architecture | draft | 2026-02-21 |

## Kategorisierung

### Infrastruktur & Deployment

| TC | Thema |
|----|-------|
| TC-011 | Cloud Run Deployment |
| TC-016 | API Gateway |
| TC-022 | Database Layer Cost Optimization |
| TC-027 | Infrastructure as Code (Terraform) |
| TC-029 | Configuration Management |

### Sicherheit

| TC | Thema |
|----|-------|
| TC-021 | Security Inspection Framework |
| TC-025 | Security Hardening Phase |

### AI & Dialog

| TC | Thema |
|----|-------|
| TC-005 | Response Timing and Intent Analysis |
| TC-018 | Agentic Backend & VertexAI |
| TC-023 | Chat Dialog Architecture |
| TC-024 | Feature Toggle System |

### Daten & Speicherung

| TC | Thema |
|----|-------|
| TC-004 | Multimodal Storage Layer |
| TC-009 | Multimodaler Erinnerungsraum |
| TC-010 | Blockchain Learning Records |
| TC-013 | Firestore Persistence Strategy |
| TC-017 | Unified Data Model |
| TC-019 | SOLID Pod Storage Layer |

### Externe Integrationen

| TC | Thema |
|----|-------|
| TC-001 | GeoQB / OpenStreetMap |
| TC-002 | Wikipedia Integration |
| TC-003 | Job Portal Integration |
| TC-006 | Matching Engine |
| TC-028 | Lernreise Tracking (Honeycomb) |

### Portfolio & Engagement

| TC | Thema |
|----|-------|
| TC-007 | Portfolio Evidence Layer |
| TC-008 | Auditierbare Methodik |
| TC-012 | Clickstream Analytics |
| TC-014 | Engagement System Data Model |
| TC-015 | 3D Globe Technology |

### Business

| TC | Thema |
|----|-------|
| TC-020 | Bot Fleet Identity |
| TC-026 | Warteraum-Queue & Campaign Tracking |
| TC-030 | Multi-Tenant Sponsor Showrooms |

## Neuen ADR erstellen

1. Naechste freie TC-Nummer ermitteln (aktuell: TC-031)
2. Datei erstellen: `docs/arch/TC-031-kurzer-titel.md`
3. Template verwenden:

```markdown
# TC-031: Titel

**Status:** draft
**Created:** YYYY-MM-DD

## Context
Warum ist diese Entscheidung noetig?

## Decision
Was wurde entschieden?

## Consequences
Welche Vor- und Nachteile hat die Entscheidung?

## Alternatives Considered
Was wurde sonst in Betracht gezogen?

## Dependencies
- Liste verwandter FRs, TCs

## Related
- Verweise auf andere Dokumente
```

4. Status auf `accepted` setzen, sobald die Entscheidung abgestimmt ist
5. Diese Index-Seite aktualisieren

!!! info "Quelldokumente"
    Die vollstaendigen ADR-Dokumente liegen im Repository unter `docs/arch/TC-NNN-*.md`. Diese Index-Seite ist eine Zusammenfassung fuer die interne Dokumentation.
