# SkillR-MVP-V1 — Product Roadmap

**Created:** 2026-02-22
**Origin:** Forked from maindfull.LEARNING platform roadmap. Scoped to SkillR features only.
**Feature Backlog:** See `SCOPE-MATRIX.md` for the full feature classification.

---

## Phase Overview

| Phase | Codename | Goal | Status | CORE FRs |
|-------|----------|------|--------|----------|
| **SkillR V1.0** | "Erste Reise" | Production-ready SkillR app for IHK pilot | In Progress | 55 FRs (41 done, 7 in-progress, 7 draft) |
| **SkillR V1.1** | "Mehr entdecken" | Enhanced experience — selectable features toggled on | Planned | SELECT features as needed |
| **SkillR V2.0** | "Partner & Sponsoren" | B2B sponsor integration, payment, advanced features | Planned | MVP5-derived SELECT features |

---

## SkillR V1.0 — "Erste Reise"

> **Goal:** Production-ready SkillR app. DSGVO-compliant, role-based views, parent dashboard. Ready for IHK pilot with 100+ users.

### Already Built (41 FRs done)

All MVP1, MVP2, MVP3, and MVP4 features are complete:

- Authentication (Google OAuth + email)
- VUCA journey with 3D globe navigation
- AI coach dialogue (text + voice)
- Skill profile generation and visualization
- Duolingo-style engagement (streaks, XP, levels)
- Level 2 reflection engine
- Micro-session UX (5-minute mode)
- Transit audio mode
- Solid Pod connection + data sync + viewer
- Admin console (users, roles, prompt logs, Meta Kurs editor)
- API gateway with server-side keys
- Security hardening (rate limiting, CORS, input validation)
- Cookie consent + legal pages
- Docker + Cloud Run deployment
- Health monitoring

### In Progress (7 FRs)

| FR | Title | Priority |
|----|-------|----------|
| FR-070 | Mobile-First Campaign UI Redesign | must |
| FR-071 | Terraform Infrastructure | should |
| FR-072 | Honeycomb Service Configuration | must |
| FR-073 | User Context Synchronization | must |
| FR-074 | Lernreise Catalog Selection | must |
| FR-075 | Lernprogress Tracking | must |
| FR-001 | Social Login (complete Apple + Meta) | must |

### Remaining for V1.0 (7 FRs draft)

| FR | Title | Priority | Why CORE |
|----|-------|----------|----------|
| FR-033 | Datenschutz for Minors (DSGVO) | must | Legal requirement for production |
| FR-027 | Rollenbasierte App-Ansichten | should | Student/parent/admin views |
| FR-025 | Eltern-Dashboard | could | Parent visibility + consent |
| FR-001+ | Apple + Meta Social Login | must | Broad reach for teens |
| DFR-001 | App Icon Integration | done | SkillR branding |
| DFR-002 | Brand Name Consistency | done | SkillR naming |
| FR-086* | Partner Branding | done | Brand config system |

### V1.0 Exit Criteria

- [ ] DSGVO-compliant: parental consent flow for under-16
- [ ] Role-specific views: student, parent, admin
- [ ] Parents can see child's progress (privacy-respecting)
- [ ] All in-progress FRs completed
- [ ] 100 concurrent users without degradation
- [ ] Deployed to SkillR GCP project
- [ ] Health monitoring active
- [ ] All CORE tests passing

---

## SkillR V1.1 — "Mehr entdecken"

> **Goal:** Enhanced experience. Toggle on SELECT features that improve the user journey.

### Candidate Features (from SELECT pool)

| FR | Title | Impact | Effort |
|----|-------|--------|--------|
| FR-016 | Wikipedia Knowledge Service | Grounds AI responses with facts | Medium |
| FR-017 | Job Portal Data Service | Real German job data | Medium |
| FR-018 | Job-Navigator Engine | Shows career possibilities | High |
| FR-024 | AI Multi-Agent Reisebegleiter | Advanced coaching | High |
| FR-034 | UI Theme System | Visual customization | Medium |
| FR-030 | Third-Party Skill Endorsement | External validation | Medium |
| FR-015 | GeoQB / OpenStreetMap | Location-based features | Low |
| FR-019 | Multimodal Storage Layer | Richer content | Medium |
| FR-053 | Agent Consent Dashboard | Advanced consent | Low |

### Candidate Concepts

| Concept | Title | Value for SkillR |
|---------|-------|-----------------|
| DC-012 | Dual UI Paradigm | Retro adventure mode as alternative to 3D globe |
| DC-013 | Lernreise Unternehmergeist | Entrepreneur journey as second journey type |
| DC-015 | Three Core Training Matrices | Full three-Lernreise model |
| BC-002 | Job-Navigator | Real job data integration |

### V1.1 Selection Criteria

To promote a feature from SELECT to CORE for V1.1:
1. Does it directly improve the user experience for teens (14+)?
2. Does it create demonstrable value for the IHK pilot?
3. Can it be built within 1–2 sprints?
4. Does it NOT require platform-level infrastructure changes?

---

## SkillR V2.0 — "Partner & Sponsoren"

> **Goal:** B2B sponsor integration. Companies sponsor skills and learning journeys. Revenue through Bildungssponsoring.

### Candidate Features (from SELECT pool)

| FR | Title | Notes |
|----|-------|-------|
| FR-079 | Sponsor Showrooms | Multi-tenant sponsor micro-sites |
| FR-080 | Lernreise Editor (Tiered) | Content customization for sponsors |
| FR-081 | Sponsor Analytics Dashboard | B2B analytics |
| FR-082 | Stripe Subscription Management | Payment integration |
| FR-035 | Avatar System | Visual gamification |
| FR-036 | Team, Partner & Mentor Mode | Social features |
| FR-037 | Items & Seasonal Drops | Engagement extras |

### V2.0 Prerequisite

SkillR V2.0 depends on V1.0 being production-stable with real users. Sponsor integration requires a proven user base.

---

## Dependency Graph (Critical Path)

```
Authentication (FR-001/002)
  └→ Firebase (FR-003)
       ├→ Session Continuity (FR-012)
       ├→ Interest Tracking (FR-014)
       └→ DSGVO (FR-033) → Parent Dashboard (FR-025)

Dialogue Engine (FR-005)
  ├→ VUCA Navigation (FR-006) → Bingo (FR-007) → Globe (FR-031)
  ├→ Voice (FR-010/011)
  └→ API Gateway (FR-051) → Local Staging (FR-052)

Engagement (FR-038)
  └→ Mobile Redesign (FR-070)

Solid Pod (FR-076..078)
  └→ Already complete
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| DSGVO for minors delays launch | Cannot go live | Start legal review now |
| Gemini rate limits on free tier | Blocks core UX | Response caching; upgrade to paid tier |
| Go backend not fully exercised | FR-014, FR-019 depend on backend | Frontend service implemented as bridge |
| TTS model availability | Voice features unreliable | Browser fallback implemented |
| Single-instance deployment | No horizontal scaling | Cloud Run auto-scaling configured |

---

## Next Actions

1. **Complete in-progress FRs** (FR-070..FR-075)
2. **Implement FR-033** (DSGVO for minors) — legal blocker for production
3. **Implement FR-027** (Role-based views) — enables parent/admin separation
4. **Implement FR-025** (Parent dashboard) — parental consent + oversight
5. **Deploy to SkillR GCP** — own project, own domain
6. **IHK pilot** — 100+ users, validate core loop
