# SkillR-MVP-V1 — Feature Scope Matrix

**Created:** 2026-02-22
**Purpose:** Classify every feature from the maindfull.LEARNING roadmap for the SkillR-MVP-V1 fork.
**Origin:** Hard fork from `mvp72` (maindfull-learning-v2 platform repo).

---

## How to Use This Document

Each feature, concept, and architecture decision is classified into one of three scopes:

| Tag | Meaning | Action |
|-----|---------|--------|
| **`[CORE]`** | SkillR MVP V1 order — must ship | Already built or must be completed |
| **`[SELECT]`** | Available for SkillR — can be toggled on | Add to a future sprint when needed |
| **`[PLATFORM]`** | maindfull.LEARNING platform feature — not in SkillR repo | Removed from this fork. Lives in maindfull-learning-v2 |

**To rescope a feature:** Change its tag. Move `[SELECT]` items to `[CORE]` when you decide to build them.

---

## Feature Requests

### MVP1 — "Es funktioniert" (All CORE — already built)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-001 | Social Login (Google) | `[CORE]` | partial | Google OAuth works; Apple/Meta deferred |
| FR-002 | Email-Password Login | `[CORE]` | done | Firebase email auth + password reset |
| FR-003 | Firebase Persistence | `[CORE]` | done | Firestore + localStorage fallback |
| FR-004 | Interest-Based Journey Entry | `[CORE]` | done | |
| FR-005 | Gemini AI Dialogue Engine | `[CORE]` | done | |
| FR-006 | VUCA Navigation | `[CORE]` | done | Gegensatzsuche |
| FR-007 | VUCA Bingo Matrix | `[CORE]` | done | |
| FR-008 | Skill Profile Generation | `[CORE]` | done | |
| FR-009 | Profile Visualization | `[CORE]` | done | Radar chart |
| FR-010 | AI Coach Voice Interaction | `[CORE]` | done | |
| FR-011 | Text and Voice Mode Switching | `[CORE]` | done | |
| FR-012 | Session Continuity | `[CORE]` | done | |
| FR-013 | Web App Deployment | `[CORE]` | done | |
| FR-014 | Interest Profile Tracking | `[CORE]` | done | Frontend service |
| FR-039 | Prompt Log Viewer | `[CORE]` | done | Admin with export, stats, filters |
| FR-040 | Docker & Cloud Run Deployment | `[CORE]` | done | |
| FR-041 | Project Makefile | `[CORE]` | done | |
| FR-042 | GitHub Actions CI/CD | `[CORE]` | done | |
| FR-043 | Admin Panel | `[CORE]` | done | 5-tab console |
| FR-044 | Role Management | `[CORE]` | done | Firebase custom claims |
| FR-046 | User Administration | `[CORE]` | done | |
| FR-047 | Management Console | `[CORE]` | done | |
| FR-048 | Journey Progress Cards | `[CORE]` | done | |
| FR-049 | Profile + Activity History | `[CORE]` | done | |
| FR-050 | Clickstream Analytics | `[CORE]` | done | |

### MVP2 — "Das bin ich" (All CORE — already built)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-020 | Level 2 Reflection Engine | `[CORE]` | done | Post-station reflection |
| FR-026 | Micro-Session UX | `[CORE]` | done | 5-minute mode |
| FR-031 | 3D World Globe Interface | `[CORE]` | done | react-globe.gl + 2D fallback |
| FR-032 | Transit Audio Mode | `[CORE]` | done | TTS narration |
| FR-038 | Duolingo-Style Engagement | `[CORE]` | done | Streaks, XP, 5 levels |
| FR-045 | Meta Kurs Editor | `[CORE]` | done | Prompt & journey manager |
| FR-054 | Intro-Sequenz mit KI-Coach | `[CORE]` | done | |
| FR-055 | Dev TLS Support | `[CORE]` | done | |

### MVP3 — "Sicher unterwegs" (All CORE — security hardening)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-051 | Gemini API Proxy Gateway | `[CORE]` | done | Keys server-side |
| FR-052 | Docker Compose Local Staging | `[CORE]` | done | |
| FR-056 | Server Auth Session Management | `[CORE]` | done | |
| FR-057 | Admin Access Control Hardening | `[CORE]` | done | |
| FR-058 | API Input Validation | `[CORE]` | done | |
| FR-059 | Security Headers, CORS | `[CORE]` | done | |
| FR-060 | Rate Limiting | `[CORE]` | done | |
| FR-061 | Supply Chain Hardening | `[CORE]` | done | |
| FR-062 | Warteraum-Integration | `[CORE]` | done | |
| FR-063 | Visitor Lifecycle Tracking | `[CORE]` | done | |
| FR-064 | Campaign Attribution | `[CORE]` | done | |
| FR-065 | Flood Detection | `[CORE]` | done | |
| FR-066 | Cookie Consent & Legal Pages | `[CORE]` | done | |
| FR-067 | Legal Placeholder Admin | `[CORE]` | done | |
| FR-068 | Health Check Monitoring | `[CORE]` | done | |
| FR-069 | GCP Credential Management | `[CORE]` | done | |

### MVP4 — "Meine Daten, Mein Pod" (CORE — in progress / done)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-070 | Mobile-First Campaign UI Redesign | `[CORE]` | in-progress | |
| FR-071 | Terraform Infrastructure | `[CORE]` | in-progress | |
| FR-072 | Honeycomb Service Configuration | `[CORE]` | in-progress | |
| FR-073 | User Context Synchronization | `[CORE]` | in-progress | |
| FR-074 | Lernreise Catalog Selection | `[CORE]` | in-progress | |
| FR-075 | Lernprogress Tracking | `[CORE]` | in-progress | |
| FR-076 | Solid Pod Connection | `[CORE]` | done | |
| FR-077 | Pod Data Sync | `[CORE]` | done | |
| FR-078 | Pod Data Viewer | `[CORE]` | done | |
| FR-127 | Pod Connection Health Gate | `[CORE]` | draft | Hide Pod-Link panel when infra unavailable; 503 instead of 500; readiness probe |
| FR-086* | Partner Branding | `[CORE]` | done | Brand config system |

### V1.0 — "Zeig es der Welt" (Mixed: CORE for production, SELECT for nice-to-have)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-033 | Datenschutz for Minors (DSGVO) | `[CORE]` | draft | Legal requirement for launch |
| FR-027 | Rollenbasierte App-Ansichten | `[CORE]` | draft | Student/parent/admin views |
| FR-025 | Eltern-Dashboard | `[CORE]` | draft | Parent visibility + consent |
| FR-001+ | Apple + Meta Social Login | `[CORE]` | draft | Required for broad reach |
| FR-067 | Legal Placeholder Management | `[CORE]` | done | Already built |
| FR-016 | Wikipedia Knowledge Service | `[SELECT]` | draft | Grounding — nice to have |
| FR-017 | Job Portal Data Service | `[SELECT]` | draft | Real job data from Bundesagentur |
| FR-018 | Job-Navigator Engine | `[SELECT]` | draft | Depends on FR-017 |
| FR-015 | GeoQB / OpenStreetMap Service | `[SELECT]` | draft | Location-based features |
| FR-019 | Multimodal Storage Layer | `[SELECT]` | draft | Go backend multimodal |
| FR-024 | AI Multi-Agent Reisebegleiter | `[SELECT]` | draft | Advanced AI coaching |
| FR-034 | UI Theme System | `[SELECT]` | draft | Visual customization |
| FR-035 | Avatar System | `[SELECT]` | draft | Visual representation |
| FR-030 | Third-Party Skill Endorsement | `[SELECT]` | draft | External validation |
| FR-036 | Team, Partner & Mentor Mode | `[SELECT]` | draft | Social features |
| FR-037 | Items & Seasonal Drops | `[SELECT]` | draft | Gamification extras |
| FR-053 | Agent Consent Dashboard | `[SELECT]` | draft | Advanced consent management |

### MVP5 — "Sponsor Showrooms" (SELECT — available for SkillR B2B)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-079 | Sponsor Showrooms | `[SELECT]` | draft | Multi-tenant B2B platform |
| FR-080 | Lernreise Editor (Tiered) | `[SELECT]` | draft | Content customization |
| FR-081 | Sponsor Analytics Dashboard | `[SELECT]` | draft | B2B analytics |
| FR-082 | Stripe Subscription Management | `[SELECT]` | draft | Payment integration |
| FR-022 | Company Profile (absorbed into FR-079) | `[SELECT]` | absorbed | |
| FR-028 | Sponsored Content (absorbed into FR-079) | `[SELECT]` | absorbed | |
| FR-029 | Multiplikatoren-Onboarding (adapted) | `[SELECT]` | adapted | |

### MVP6 — "Oekosystem" (PLATFORM — chamber ecosystem)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-021 | Chamber Dashboard | `[PLATFORM]` | draft | Chamber-specific features |
| FR-023 | Bedarfserfassung Kammern | `[PLATFORM]` | draft | Chamber demand capture |

### V2.0 — "SkillR on maindfull.LEARNING" (Mixed: PLATFORM for multi-tenant, SELECT for SkillR-specific)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-083 | Skill-Dependency-Graph | `[PLATFORM]` | draft | Platform engine feature |
| FR-084 | Lernziel-Katalog-Management | `[PLATFORM]` | draft | Platform catalog |
| FR-085 | Rahmenlernplan-Import | `[PLATFORM]` | draft | German vocational mapping |
| FR-086 | Back-Propagation Lernpfad | `[PLATFORM]` | draft | Platform path planning |
| FR-087 | Content-Lifecycle-Engine | `[PLATFORM]` | draft | Platform content mgmt |
| FR-088 | Lehrunterweisungen-Registry | `[PLATFORM]` | draft | Platform teaching registry |
| FR-089 | Smart-Kurs-Varianten | `[PLATFORM]` | draft | Platform course variants |
| FR-090 | Drei-Schichten-Rollenmodell | `[PLATFORM]` | draft | Platform role system |
| FR-091 | SkillR-Client-Branding-Layer | `[SELECT]` | draft | SkillR brand overlay on platform |
| FR-092 | Content-Quality-Scoring | `[PLATFORM]` | draft | Platform quality system |
| FR-093 | Experiment & Routine Tracking | `[PLATFORM]` | draft | Platform tracking |
| FR-094 | Exploratorium Datenmodell | `[PLATFORM]` | draft | Cross-client discovery |
| FR-095 | Honeycomb Learning Context | `[PLATFORM]` | draft | Platform learning space |
| FR-096 | Coaching Projection | `[PLATFORM]` | draft | Platform coaching view |
| FR-097 | Lernreise-Provider Self-Service | `[PLATFORM]` | draft | Platform partner mgmt |
| FR-098 | Skill-Item-Sponsoring Workflow | `[PLATFORM]` | draft | Platform sponsoring |
| FR-099 | Partner API Key Issuance | `[PLATFORM]` | draft | Platform auth |
| FR-100 | @maindfull/client-shell NPM | `[PLATFORM]` | draft | Platform package |
| FR-101 | @maindfull/shared NPM | `[PLATFORM]` | draft | Platform package |
| FR-102 | Partner Document Sync | `[PLATFORM]` | draft | Platform CI sync |
| FR-103 | Partner App Template | `[PLATFORM]` | draft | Platform scaffolding |
| FR-104 | Themed Skill Room Engine | `[PLATFORM]` | draft | Platform skill rooms |
| FR-105 | Skill Room Exploratorium | `[PLATFORM]` | draft | Platform discovery |
| FR-106 | Skill Room Domain Theming | `[PLATFORM]` | draft | Platform theming |
| FR-107 | Cross-Tenant Skill Room Discovery | `[PLATFORM]` | draft | Platform cross-tenant |
| FR-108 | @maindfull/mock-server | `[PLATFORM]` | draft | Platform mock server |
| FR-109 | Integration Guide Pipeline | `[PLATFORM]` | draft | Platform docs |
| FR-110 | Partner Doc Sync Automation | `[PLATFORM]` | draft | Platform CI |
| FR-111 | Frontend Passive Rendering | `[CORE]` | specified | No active components — all data from Go API |
| FR-112 | EU Co-Funding Notice | `[CORE]` | in-progress | CFR: EU co-funding text + logo on landing pages and footers |
| FR-113 | Meta Ad Campaign Tracking | `[CORE]` | in-progress | Campaign management admin panel + UTM/Meta Pixel wiring |
| FR-119 | Partner Preview Page | `[CORE]` | specified | Public `?partner=slug` page showing partner branding + Lernreisen |
| FR-120 | Partner Content Pack Admin | `[CORE]` | specified | Admin `?partner-admin=slug` page for managing partner content |
| FR-121 | Space Service International Example Partner | `[CORE]` | specified | SSI seed data, brand config, fallback constants |
| FR-126 | Infrastructure Health LED | `[CORE]` | draft | KafScale + LFS-Proxy status LED in Content Pack Editor; disables submission when unavailable |

### V2.0 — SkillR-Specific Features (SELECT)

| FR | Title | Scope | Status | Notes |
|----|-------|-------|--------|-------|
| FR-083* | i18n Framework | `[SELECT]` | draft | Multilingual support |
| FR-084* | Multilingual Coach Personas | `[SELECT]` | draft | Coach in multiple languages |
| FR-085* | Language Selection UI | `[SELECT]` | draft | Locale picker |
| FR-095* | Custom Solid Pod Server | `[SELECT]` | draft | SkillR-hosted Pod (renumbered from FR-086*) |
| FR-087* | PodProxy Federation Layer | `[SELECT]` | draft | Pod federation |
| FR-088* | SkillR Profile Pod Storage | `[SELECT]` | draft | Profile in Pod |
| FR-089* | Lernreise Content CLI | `[SELECT]` | draft | Content tooling |
| FR-090* | ER1 Synchronization | `[SELECT]` | draft | External system sync |
| FR-091* | AI Candidate Generation | `[SELECT]` | draft | AI content generation |
| FR-092* | Memory Insights Processor | `[SELECT]` | draft | Learning analytics |
| FR-093* | Lernreise REST API | `[SELECT]` | draft | API for Lernreisen |
| FR-094* | Report Generation Pipeline | `[SELECT]` | draft | Automated reports |

> Note: FRs marked with `*` have number collisions with V2.0 platform FRs. In the SkillR roadmap, these will be renumbered using `FR-S*` prefix.

### Infrastructure Feature Requests (IFR)

| IFR | Title | Scope | Status | Notes |
|-----|-------|-------|--------|-------|
| IFR-001 | Lerning-Data-Room Integration | `[CORE]` | draft | KafScale Broker, LFS-Proxy, KafMirror, app-instance gateway (Redis + Postgres), maindfull.LEARNING platform services |
| IFR-002 | Video CDN Stage via LFS-Proxy | `[CORE]` | draft | S3 video hosting, HLS transcoding, CDN edge delivery — LFS-Proxy drives the Video CDN Stage |

### Design Feature Requests (DFR)

| DFR | Title | Scope | Status | Notes |
|-----|-------|-------|--------|-------|
| DFR-001 | App Icon Integration | `[CORE]` | done | SkillR app icons |
| DFR-002 | Brand Name Consistency | `[CORE]` | done | SkillR brand naming |
| DFR-004 | Coach Select Panel Polish | `[CORE]` | done | Equal cards, photos, border, umlaut fix |
| DFR-005 | Landing Page Footer Consistency | `[CORE]` | done | App Icon + reusable legal footer on all pages |

---

## Concepts

### Didactical Concepts (kept in fork)

| DC | Title | Scope | In Fork |
|----|-------|-------|---------|
| DC-001 | VUCA Bingo Matrix | `[CORE]` | Yes |
| DC-002 | Gegensatzsuche | `[CORE]` | Yes |
| DC-003 | Moeglichkeitsraum | `[CORE]` | Yes |
| DC-004 | Level 2 Reflection | `[CORE]` | Yes |
| DC-005 | Interest→Orientation→Skills | `[CORE]` | Yes |
| DC-006 | Reisebegleiter-Agenten | `[PLATFORM]` | Removed |
| DC-007 | Digitale Wanderschaft | `[PLATFORM]` | Removed |
| DC-008 | Rollenbasiertes VUCA-Oekosystem | `[PLATFORM]` | Removed |
| DC-009 | Smart Kurse | `[PLATFORM]` | Removed |
| DC-010 | Experience-First VUCA | `[CORE]` | Yes |
| DC-011 | 3D Gamified World Travel | `[CORE]` | Yes |
| DC-012 | Dual UI Paradigm | `[SELECT]` | Yes |
| DC-013 | Lernreise Unternehmergeist | `[SELECT]` | Yes |
| DC-014 | Duolingo Engagement Model | `[CORE]` | Yes |
| DC-015 | Three Core Training Matrices | `[SELECT]` | Yes |
| DC-016 | VUCA Reise Prompt Architecture | `[CORE]` | Yes |

### Business Concepts (kept in fork)

| BC | Title | Scope | In Fork |
|----|-------|-------|---------|
| BC-001 | Life-Long-Learning Trajectory | `[CORE]` | Yes |
| BC-002 | Job-Navigator | `[SELECT]` | Yes |
| BC-003 | Chamber Visibility | `[PLATFORM]` | Removed |
| BC-004 | Company Responsibility | `[PLATFORM]` | Removed |
| BC-005 | Portfolio Skill Verification | `[CORE]` | Yes |
| BC-006 | Eltern als Enabler | `[CORE]` | Yes |
| BC-007 | Bildungssponsoring | `[SELECT]` | Yes |
| BC-008 | Multiplikatoren-Netzwerk | `[PLATFORM]` | Removed |
| BC-009 | Business Model Sichtbarkeit | `[PLATFORM]` | Removed |
| BC-010 | Kostenmodell | `[CORE]` | Yes |
| BC-011 | Sponsor Showrooms | `[SELECT]` | Yes |
| BC-012 | Partner Branding | `[SELECT]` | Yes |

### maindset.ACADEMY Concepts (reference copies)

| MA | Title | Scope | In Fork |
|----|-------|-------|---------|
| MA-001 | Brand and Mission | `[CORE]` | Yes (reference) |
| MA-002 | Lernreise Portfolio | `[CORE]` | Yes (reference) |
| MA-003 | Flexible Skill Sets | `[PLATFORM]` | Removed |
| MA-004 | Learning Paths | `[PLATFORM]` | Removed |
| MA-005 | SkillR Partnership Model | `[CORE]` | Yes |
| MA-006 | maindfull.LEARNING Integration | `[PLATFORM]` | Removed |
| MA-007 | Multi-Client Platform Architecture | `[PLATFORM]` | Removed |

### Technical Architecture (kept in fork)

| TC | Title | Scope | In Fork |
|----|-------|-------|---------|
| TC-001..TC-028 | Various (Firebase, API, Gemini, Pod, etc.) | `[CORE]` | Yes |
| TC-030 | Multi-Tenant Showrooms | `[PLATFORM]` | Removed |
| TC-034 | Partner Branding System | `[PLATFORM]` | Removed |
| TC-035 | maindfull.LEARNING Role Model | `[PLATFORM]` | Removed |
| TC-036 | Multi-Client Repository Restructuring | `[PLATFORM]` | Removed |
| TC-037 | Multi-Layer DevOps Operations | `[PLATFORM]` | Removed |
| TC-038 | Diode Architecture | `[PLATFORM]` | Removed |

---

## Summary

| Scope | FRs | Concepts | Architecture |
|-------|-----|----------|-------------|
| **`[CORE]`** | 55 | 17 (9 DC + 4 BC + 2 MA + 2 DFR) | TC-001..TC-028 |
| **`[SELECT]`** | 28 | 8 (3 DC + 3 BC + 1 MA + 1 FR-095*) | — |
| **`[PLATFORM]`** | 30 | 10 (4 DC + 4 BC + 4 MA) | 6 TCs removed |

**SkillR-MVP-V1 ships with 55 CORE features (41 done, 7 in-progress, 7 draft).**
**28 SELECT features are available to toggle on when needed.**

---

## How to Promote a Feature

To move a `[SELECT]` feature to `[CORE]`:

1. Change its tag in this document from `[SELECT]` to `[CORE]`
2. Create an `FR-SNNN` feature request in `docs/features/` if it needs SkillR-specific adaptation
3. Add it to the SkillR roadmap (`docs/ROADMAP.md`)
4. Implement, test, deploy

To request a `[PLATFORM]` feature for SkillR:

1. Write an `FR-SNNN` feature request describing SkillR's need
2. Submit to the maindfull-learning-v2 platform team for evaluation
3. If accepted, the platform team implements and publishes in the next API version
4. SkillR consumes via the Platform API
