# MA-005: SkillR Partnership Model

**Status:** active
**Created:** 2026-02-21

## Entity Context

| Entity | Role in This Concept |
|--------|---------------------|
| **SkillR** | Kids education brand & sub-branding provider — app on top of maindfull.LEARNING by maindset.ACADEMY |
| **maindset.ACADEMY** | New learning education brand — Lernreisen, skill validation, skill signatures, frontend, content. Owns maindfull.LEARNING |
| **maindfull.LEARNING** | New learning AI engine by maindset.ACADEMY — agent ensemble powering smart courses |

## Concept

**SkillR** is the kids education brand & sub-branding provider. It builds its app on top of the **maindfull.LEARNING** engine by **maindset.ACADEMY**. This document defines the partnership model.

### SkillR's Role

SkillR is the kids education brand. It provides:
- **App & Distribution:** Builds a branded app on top of maindfull.LEARNING, offers smart courses to kids and families through its app on the maindfull.LEARNING platform
- **Solid Pod Profiles:** Lifelong profiles stored in personal Solid Pods, guiding the user throughout life
- **Learning-Sponsoring Module:** SkillR branded module for learning sponsorship, resellable to third parties
- **Sub-Branding:** Creates branded experiences for sponsors on the platform

SkillR is NOT the infrastructure provider — it is a consumer of the platform.

### maindset.ACADEMY's Role

maindset.ACADEMY is the new learning education brand. It owns and operates the platform:
- **Lernreisen:** Structured learning journeys as the core product
- **Dedicated Frontend:** The frontend that SkillR builds its app on
- **Skill Validation:** Validates skills achieved along a Lernreise
- **Skill Signatures:** Issues proof of skill achievement
- **Content Strategy:** Lernreise design, skill set curation, editorial oversight
- **Stakeholder Ecosystem:** Schools, chambers, sponsors, parents
- **maindfull.LEARNING Engine:** Owns and operates the AI engine
- **Infrastructure:** Deployment, monitoring, scaling, security (GCP/Cloud Run)
- **Data Platform:** Firebase, analytics pipeline, user data management

### maindfull.LEARNING's Role

maindfull.LEARNING is the new learning AI engine by maindset.ACADEMY. It provides:
- **Smart Course Delivery:** Adaptive, intent-based learning content
- **Agent Ensemble:** Orchestrated AI agents for coaching, reflection, and recommendation
- **VUCA Tracking:** Bingo matrix progress computation
- **Profile Generation:** Skill/interest profiles from journey data

### Partnership Model

| Aspect | Details |
|--------|---------|
| Core model | maindset.ACADEMY (new learning brand) owns maindfull.LEARNING (AI engine); SkillR (kids education brand) builds its app on top |
| SkillR profile | Solid Pod-based lifelong profile, one of the profiling systems supported by maindset.ACADEMY |
| Learning-sponsoring | SkillR branded module, resellable to third parties independently |
| Revenue model | See BC-009 for revenue split details |

## Target Group

- SkillR team (brand, sales, and product decisions)
- maindset.ACADEMY team (content, validation, and frontend decisions)
- Third-party sponsors and resellers (learning-sponsoring module)

## Related

- MA-001 (Brand and Mission)
- MA-006 (maindfull.LEARNING Integration)
- BC-009 (Revenue Model)
- BC-010 (Kostenmodell)
