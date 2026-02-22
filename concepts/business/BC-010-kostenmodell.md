# BC-010: Kostenmodell (Development & Operating Cost Estimates)

**Status:** draft
**Created:** 2026-02-17

## Context

This document estimates development costs (Entwicklungskosten) and operating costs (Betriebskosten) for Future Skiller, aligned with the revenue target of 150,000 EUR/month (BC-009) and the revenue timeline from MVP to Month 36.

Two scenarios are estimated:
- **Lean**: AI-assisted small team (2-3 technical co-founders/partners), heavy use of code generation tools, equity-based compensation where possible. Reflects the current team reality from the transcript.
- **Standard**: Professional startup team with salaried developers, dedicated sales, and design resources.

All estimates in EUR. Personnel costs assume Germany-based team members.

---

## Infrastructure Costs (Google Cloud Platform)

The platform runs entirely on Google Cloud (Cloud Run, Firebase, Gemini API). Costs scale with user count.

### Gemini API (largest variable cost)

Each VUCA journey interaction ≈ 1,500 tokens input + 800 tokens output.

| Active Users | Interactions/month | Tokens/month | Gemini Cost/month |
|---|---|---|---|
| 100 | 2,000 | 4.6M | ~5 EUR (free tier) |
| 1,000 | 20,000 | 46M | ~80 EUR |
| 5,000 | 100,000 | 230M | ~400 EUR |
| 10,000 | 200,000 | 460M | ~800 EUR |
| 50,000 | 1,000,000 | 2.3B | ~4,000 EUR |

Note: Assumes Gemini 1.5 Pro pricing. With Google Cloud credits ($350k available per transcript), Gemini costs are covered for approximately 18-24 months at growth-phase usage levels.

### Firebase (Firestore + Auth + Storage)

| Active Users | Firestore Reads/month | Storage | Firebase Cost/month |
|---|---|---|---|
| 100 | 300K | 1 GB | ~0 EUR (free tier) |
| 1,000 | 3M | 10 GB | ~15 EUR |
| 5,000 | 15M | 50 GB | ~80 EUR |
| 10,000 | 30M | 200 GB | ~200 EUR |
| 50,000 | 150M | 1 TB | ~1,200 EUR |

### Cloud Run (Backend Compute)

| Active Users | Container Instances | Cloud Run Cost/month |
|---|---|---|
| 100 | 1 | ~0 EUR (free tier) |
| 1,000 | 1-2 | ~30 EUR |
| 5,000 | 2-4 | ~150 EUR |
| 10,000 | 4-8 | ~400 EUR |
| 50,000 | 10-20 | ~1,500 EUR |

### Total Infrastructure Cost

| Active Users | Gemini | Firebase | Cloud Run | Other* | **Total/month** |
|---|---|---|---|---|---|
| **100** | 0 | 0 | 0 | 50 | **~50** |
| **1,000** | 80 | 15 | 30 | 100 | **~225** |
| **5,000** | 400 | 80 | 150 | 200 | **~830** |
| **10,000** | 800 | 200 | 400 | 300 | **~1,700** |
| **50,000** | 4,000 | 1,200 | 1,500 | 500 | **~7,200** |

*Other: CDN, monitoring, email/notification service, domain, SSL

**Infrastructure cost per user at 50,000 scale: ~0.14 EUR/month** — extremely efficient.

---

## Development Costs

### Scenario A: Lean (AI-Assisted Small Team)

The team from the transcript: 2-3 technical people who use AI coding tools heavily (Claude Code, Gemini, Cursor). One product visionary, one architect, one full-stack builder. Compensation is a mix of modest salary + equity.

#### Phase 1: MVP (Months 1-6)

| Role | People | Monthly Cost | Note |
|---|---|---|---|
| Technical Lead / Architect | 1 | 5,000 | Equity-heavy, reduced salary |
| Full-Stack Developer | 1 | 5,000 | Equity-heavy, reduced salary |
| Product / Vision (Founder) | 1 | 2,000 | Minimal draw |
| UX/UI Design (Freelance) | 0.3 | 1,500 | 5h/week freelance |
| Infrastructure | — | 50 | Google free tier |
| Tools & Licenses | — | 300 | AI tools, GitHub, domains |
| **Monthly Total** | | **13,850** | |
| **Phase Total (6 months)** | | **83,100** | |

**Deliverables**: Working VUCA journey, basic profile, auth, web deployment, 100 test users.

#### Phase 2: Proof (Months 7-12)

| Role | People | Monthly Cost |
|---|---|---|
| Technical Lead | 1 | 6,000 |
| Full-Stack Developer | 1 | 6,000 |
| Product / Founder | 1 | 3,000 |
| Junior Developer | 1 | 3,500 |
| Design (Freelance) | 0.3 | 1,500 |
| Sales / Partnerships (part-time) | 0.5 | 2,500 |
| Infrastructure | — | 225 |
| Tools | — | 400 |
| **Monthly Total** | | **23,125** |
| **Phase Total (6 months)** | | **138,750** |

**Deliverables**: Matching prototype, chamber dashboard v1, 1,000 users, first IHK conversations.

#### Phase 3: Traction (Months 13-18)

| Role | People | Monthly Cost |
|---|---|---|
| Technical Lead | 1 | 7,000 |
| Developers (2 mid + 1 junior) | 3 | 14,000 |
| Product / Founder | 1 | 4,000 |
| Design (Freelance) | 0.5 | 2,500 |
| Sales / Partnerships | 1 | 5,000 |
| Infrastructure | — | 830 |
| Tools + Legal/GDPR | — | 1,000 |
| **Monthly Total** | | **34,330** |
| **Phase Total (6 months)** | | **205,980** |

**Deliverables**: Full matching, company profiles, sponsored content v1, 5,000 users, 3-5 chamber partnerships.

#### Phase 4: Growth (Months 19-30)

| Role | People | Monthly Cost |
|---|---|---|
| Tech Lead + Senior Dev | 2 | 16,000 |
| Developers (3 mid) | 3 | 18,000 |
| Product / Founder | 1 | 5,000 |
| Design (in-house) | 1 | 4,500 |
| Sales Team | 2 | 12,000 |
| Customer Success / Support | 1 | 3,500 |
| Infrastructure | — | 4,000 |
| Marketing (minimal) | — | 2,000 |
| Legal / Compliance | — | 1,500 |
| Office / Misc | — | 2,000 |
| **Monthly Total** | | **68,500** |
| **Phase Total (12 months)** | | **822,000** |

#### Phase 5: Target (Months 31-36)

| Role | People | Monthly Cost |
|---|---|---|
| Engineering (6 people) | 6 | 42,000 |
| Product + Design | 2 | 10,000 |
| Sales + Partnerships | 3 | 18,000 |
| Support + Ops | 2 | 7,000 |
| Founder / CEO | 1 | 8,000 |
| Infrastructure | — | 7,200 |
| Marketing + Events | — | 3,000 |
| Legal / Compliance / Audit | — | 2,000 |
| Office / Misc | — | 3,000 |
| **Monthly Total** | | **100,200** |
| **Phase Total (6 months)** | | **601,200** |

#### Lean Scenario: Total Investment

| Phase | Duration | Cost | Cumulative |
|---|---|---|---|
| 1. MVP | 6 months | 83,100 | 83,100 |
| 2. Proof | 6 months | 138,750 | 221,850 |
| 3. Traction | 6 months | 205,980 | 427,830 |
| 4. Growth | 12 months | 822,000 | 1,249,830 |
| 5. Target | 6 months | 601,200 | 1,851,030 |
| **Total to 150k/month** | **36 months** | | **~1.85M EUR** |

---

### Scenario B: Standard (Professional Startup Team)

Salaried team with market-rate compensation, dedicated roles, external agency for design.

#### Phase 1: MVP (Months 1-6)

| Role | People | Monthly Cost |
|---|---|---|
| CTO / Tech Lead | 1 | 10,000 |
| Senior Backend (Go) | 1 | 8,000 |
| Senior Frontend (TS) | 1 | 8,000 |
| Product Owner | 1 | 7,000 |
| UX/UI Agency | — | 5,000 |
| Infrastructure | — | 50 |
| Tools + Legal | — | 800 |
| **Monthly Total** | | **38,850** |
| **Phase Total (6 months)** | | **233,100** |

#### Phase 2: Proof (Months 7-12)

| Role | People | Monthly Cost |
|---|---|---|
| CTO + 2 Senior Devs | 3 | 26,000 |
| Junior Developer | 1 | 4,500 |
| Product Owner | 1 | 7,000 |
| AI/Prompt Engineer | 1 | 8,000 |
| Design Agency | — | 5,000 |
| Sales / BD | 1 | 6,000 |
| Infrastructure | — | 300 |
| Tools + Legal | — | 1,000 |
| **Monthly Total** | | **57,800** |
| **Phase Total (6 months)** | | **346,800** |

#### Phase 3-5: Traction → Target (Months 13-36)

| Phase | Monthly Cost | Duration | Phase Total |
|---|---|---|---|
| 3. Traction | 85,000 | 6 months | 510,000 |
| 4. Growth | 130,000 | 12 months | 1,560,000 |
| 5. Target | 155,000 | 6 months | 930,000 |

#### Standard Scenario: Total Investment

| Phase | Duration | Cost | Cumulative |
|---|---|---|---|
| 1. MVP | 6 months | 233,100 | 233,100 |
| 2. Proof | 6 months | 346,800 | 579,900 |
| 3. Traction | 6 months | 510,000 | 1,089,900 |
| 4. Growth | 12 months | 1,560,000 | 2,649,900 |
| 5. Target | 6 months | 930,000 | 3,579,900 |
| **Total to 150k/month** | **36 months** | | **~3.58M EUR** |

---

## Cost vs. Revenue: Break-Even Analysis

### Lean Scenario

| Month | Revenue/month | Cost/month | Net | Cumulative Burn |
|---|---|---|---|---|
| 6 (end MVP) | 0 | 13,850 | -13,850 | -83,100 |
| 12 (end Proof) | 8,000 | 23,125 | -15,125 | -221,850 |
| 18 (end Traction) | 25,000 | 34,330 | -9,330 | -380,000 |
| 24 (mid Growth) | 60,000 | 68,500 | -8,500 | -480,000 |
| **27** | **90,000** | **68,500** | **+21,500** | **-430,000** |
| 30 (end Growth) | 120,000 | 68,500 | +51,500 | -320,000 |
| 36 (Target) | 150,000 | 100,200 | +49,800 | -50,000 |
| **38** | **155,000** | **100,200** | **+54,800** | **~0 (fully repaid)** |

**Lean: Break-even on monthly costs at Month 27. Cumulative investment repaid by Month 38.**

### Standard Scenario

| Month | Revenue/month | Cost/month | Net | Cumulative Burn |
|---|---|---|---|---|
| 6 | 0 | 38,850 | -38,850 | -233,100 |
| 12 | 8,000 | 57,800 | -49,800 | -580,000 |
| 18 | 25,000 | 85,000 | -60,000 | -940,000 |
| 24 | 60,000 | 130,000 | -70,000 | -1,700,000 |
| 30 | 120,000 | 130,000 | -10,000 | -2,300,000 |
| **32** | **140,000** | **130,000** | **+10,000** | **-2,280,000** |
| 36 | 150,000 | 155,000 | -5,000 | -2,250,000 |

**Standard: Monthly break-even around Month 32, but cumulative investment requires additional growth beyond Month 36 to repay.**

---

## Operating Costs at Target (50,000 Users, 150k Revenue)

### Lean Scenario: Monthly Operating Costs

| Category | Monthly Cost | % of Revenue |
|---|---|---|
| **Personnel** | | |
| Engineering (6 people) | 42,000 | 28% |
| Product + Design (2) | 10,000 | 7% |
| Sales + Partnerships (3) | 18,000 | 12% |
| Support + Ops (2) | 7,000 | 5% |
| Leadership (1) | 8,000 | 5% |
| **Infrastructure** | | |
| Google Cloud (Gemini, Firebase, Run) | 7,200 | 5% |
| **Other** | | |
| Marketing + Events | 3,000 | 2% |
| Legal / GDPR / Audit | 2,000 | 1% |
| Office + Misc | 3,000 | 2% |
| **Total Operating Costs** | **100,200** | **67%** |
| **Operating Profit** | **49,800** | **33%** |

### Standard Scenario: Monthly Operating Costs at Target

| Category | Monthly Cost | % of Revenue |
|---|---|---|
| Personnel (16 people) | 120,000 | 80% |
| Infrastructure | 7,200 | 5% |
| Marketing + Legal + Office | 12,000 | 8% |
| Contingency | 8,000 | 5% |
| **Total Operating Costs** | **147,200** | **98%** |
| **Operating Profit** | **2,800** | **2%** |

**The Standard scenario barely breaks even at 150k — it needs 200k+ revenue to be sustainable. The Lean scenario generates 33% margin at 150k.**

---

## Key Takeaways

### 1. Infrastructure is NOT the bottleneck
At 50,000 users, infrastructure costs only ~7,200 EUR/month (5% of revenue). Google Cloud + Gemini is extremely cost-efficient. The Google Cloud credits ($350k) cover infrastructure costs for approximately the first 24 months.

### 2. People ARE the cost
Personnel is 57-80% of all costs depending on scenario. The decision between Lean and Standard is the single most impactful cost decision.

### 3. Lean is the only viable path to profitability at 150k
The Standard scenario requires ~200k+ monthly revenue to generate meaningful profit. The Lean scenario is profitable at 150k with ~50k monthly margin.

### 4. Total investment to reach 150k target

| Scenario | Total Investment | Monthly Profit at Target | Payback |
|---|---|---|---|
| **Lean** | **~1.85M EUR** | ~50k EUR | Month 38 |
| **Standard** | **~3.58M EUR** | ~3k EUR | 100+ months |

### 5. The Google Credits change everything
$350,000 in Google Cloud credits ≈ 325,000 EUR. This covers:
- ALL infrastructure for ~24 months
- Gemini API costs through the Growth phase
- Effectively eliminates the largest variable cost during the critical build phase

Without the credits, add ~50,000-80,000 EUR to cumulative burn by Month 24.

---

## Scenario C: Corporate (IHK / BMW / Sparkasse beauftragt das Projekt)

What if Future Skiller were built as a corporate project — commissioned by an institution like IHK, BMW, or Sparkasse? This is the "enterprise IT project" scenario with corporate rates, procurement processes, and institutional overhead.

### Corporate Cost Assumptions
- **Developers**: External agency or internal enterprise IT rates (1,200-1,800 EUR/person-day)
- **Project Management**: Dedicated PMO, Scrum Master, Business Analyst
- **Compliance**: Full GDPR audit, ISO 27001 preparation, Betriebsrat involvement
- **Procurement**: Multi-vendor management, enterprise license agreements
- **QA**: Dedicated test team, penetration testing, accessibility audit
- **Corporate overhead**: 25-40% markup on all personnel costs (HR, facilities, management layers)

### Phase 1: MVP (Months 1-9) — Corporate takes longer

| Role | People | Daily Rate | Monthly Cost |
|---|---|---|---|
| Project Lead / PMO | 1 | 1,400 | 28,000 |
| Solution Architect | 1 | 1,600 | 32,000 |
| Senior Backend (Go) | 2 | 1,400 | 56,000 |
| Senior Frontend (TS) | 2 | 1,400 | 56,000 |
| AI/ML Engineer | 1 | 1,600 | 32,000 |
| UX/UI Design Agency | — | — | 15,000 |
| QA Engineer | 1 | 1,200 | 24,000 |
| Business Analyst | 1 | 1,200 | 24,000 |
| GDPR/Compliance Consultant | 0.3 | 1,500 | 9,000 |
| Scrum Master | 1 | 1,200 | 24,000 |
| Corporate Overhead (30%) | — | — | 90,000 |
| Infrastructure | — | — | 200 |
| **Monthly Total** | | | **390,200** |
| **Phase Total (9 months)** | | | **3,511,800** |

Note: Corporate MVP takes 9 months (not 6) due to procurement, compliance requirements, and decision committee cycles.

### Phase 2: Proof of Value (Months 10-18)

| Category | Monthly Cost |
|---|---|
| Extended team (12 external + 3 internal) | 380,000 |
| Corporate overhead (30%) | 114,000 |
| Infrastructure | 500 |
| Compliance / Security audit | 15,000 |
| **Monthly Total** | **509,500** |
| **Phase Total (9 months)** | **4,585,500** |

### Phase 3: Rollout + Scaling (Months 19-36)

| Category | Monthly Cost |
|---|---|
| Full team (18 external + 5 internal) | 520,000 |
| Corporate overhead (30%) | 156,000 |
| Infrastructure (scaling to 50k) | 7,200 |
| Operations / Support Team | 40,000 |
| Marketing / Events (corporate scale) | 30,000 |
| Legal / Compliance / TUeV prep | 20,000 |
| **Monthly Total** | **773,200** |
| **Phase Total (18 months)** | **13,917,600** |

### Corporate Scenario: Total Investment

| Phase | Duration | Cost | Cumulative |
|---|---|---|---|
| 1. MVP | 9 months | 3,511,800 | 3,511,800 |
| 2. Proof | 9 months | 4,585,500 | 8,097,300 |
| 3. Rollout | 18 months | 13,917,600 | 22,014,900 |
| **Total to 150k/month** | **36 months** | | **~22M EUR** |

### Corporate: Operating Costs at Target

| Category | Monthly Cost |
|---|---|
| Team (23 people, mixed internal/external) | 520,000 |
| Corporate overhead | 156,000 |
| Infrastructure | 7,200 |
| Ops / Support / Marketing / Legal | 90,000 |
| **Total Operating Costs** | **773,200** |

At 150k revenue, the corporate scenario runs at **-623,200 EUR/month deficit**. The revenue target would need to be **800k+ EUR/month** to cover corporate cost structures — or the project remains a cost center subsidized by the parent organization.

### Why Corporate Costs Explode

| Factor | Lean Cost | Corporate Cost | Multiplier |
|---|---|---|---|
| One developer, one month | 5,000-6,000 | 28,000-32,000 | **5x** |
| MVP development | 83,100 | 3,511,800 | **42x** |
| Total to target | 1,850,000 | 22,014,900 | **12x** |
| Monthly ops at target | 100,200 | 773,200 | **8x** |

The corporate multiplier comes from:
1. **Agency day rates** vs. equity-compensated co-founders (5x on personnel)
2. **Overhead layers**: PMO, Scrum Master, BA, compliance — roles that don't exist in Lean (3-4 additional FTEs)
3. **30% corporate markup**: HR, facilities, management reporting, committee time
4. **Slower execution**: 9-month MVP vs. 6-month (1.5x timeline)
5. **Risk-averse QA**: Dedicated test team, pen-testing, accessibility audit from day one
6. **Procurement friction**: Vendor selection, contract negotiation, approval chains

### Corporate Scenario: When It Makes Sense

Despite the 12x cost premium, the corporate path makes sense IF:
- The commissioning organization (IHK, BMW, Sparkasse) already has **50,000+ captive users** (employees, apprentices, members) who will be onboarded by mandate
- The project is funded as a **strategic initiative**, not a profit center — ROI is measured in reduced Studienabbrecher-Quote, better apprenticeship placement rates, or employer branding
- The organization needs **institutional-grade compliance** from day one (ISO 27001, TUeV, Betriebsrat approval)
- Revenue is secondary — the value is in **data ownership** and **ecosystem control**

---

## All Three Scenarios Compared

| Metric | Lean | Standard | Corporate |
|---|---|---|---|
| **Team size (at target)** | 14 | 16 | 23+ |
| **MVP cost** | 83k | 233k | 3.5M |
| **MVP timeline** | 6 months | 6 months | 9 months |
| **Total to 150k target** | **1.85M** | **3.58M** | **22M** |
| **Monthly ops at target** | 100k | 147k | 773k |
| **Monthly profit at 150k** | **+50k** | +3k | **-623k** |
| **Break-even revenue** | 100k/mo | 150k/mo | 800k/mo |
| **Payback** | Month 38 | 100+ months | Never (at 150k) |
| **Risk** | Key-person | Burn rate | Institutional inertia |

---

## Recommendation

**Go Lean.** The math is unambiguous:
- 1.85M EUR total investment vs. 3.58M EUR
- 33% margin at target vs. 2% margin
- Payback at Month 38 vs. 100+ months
- Same product, same timeline, same revenue

The Lean approach works because:
1. AI coding tools (Claude Code, Gemini) multiply developer productivity 3-5x
2. The Google/Firebase stack eliminates DevOps overhead
3. Multiplier-driven acquisition eliminates marketing spend
4. The product is content-generated (Gemini), not content-authored (humans)

**The critical hires:** One exceptional architect who can design the system, and one exceptional developer who can build it fast with AI tools. Everything else can scale gradually.

## Related
- BC-009 (Business Model — revenue targets this cost model must support)
- BC-008 (Multiplikatoren-Netzwerk — keeps acquisition costs near zero)
- TC-008 (Auditierbare Methodik — audit/certification costs are in Legal budget)
- FR-013 (Web App Deployment — infrastructure architecture)
