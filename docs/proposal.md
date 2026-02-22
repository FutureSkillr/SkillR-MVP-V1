# Proposal: How to Win This Game

**Created:** 2026-02-17
**Context:** Response to [challenge.md](challenge.md) — the investor's hard questions. This document is the answer, the plan, and the imaginary trip through building Future Skiller if I were in charge.

---

## Part 1: The Investor Meeting

You're sitting across from me. You've read the challenge document. You ask:

> "You need 50,000 teenagers, 200 companies, 25 chambers, and 30 months. Convince me."

Here's what I say:

**I don't need any of that to start. I need 25 teenagers, 1 classroom, and 4 weeks.**

Everything else is a consequence of what happens in those 4 weeks. If those 25 kids come back voluntarily on day 5 — we have a company. If they don't — no amount of business model sophistication will save us.

So I'm not asking you to fund a 30-month plan. I'm asking you to fund a **90-day proof** that teenagers care. Here's what the 90 days look like, and here's what I'll show you at the end.

---

## Part 2: The Imaginary Trip

### Week 0: Forget Everything

I put away all 29 Feature Requests, 8 Didactical Concepts, and 10 Business Concepts. They're valuable, but they're answers to questions I haven't validated yet.

I write one question on the wall:

> **"What would make a 14-year-old say 'Das ist krass' within 90 seconds of opening this?"**

Not "what would be pedagogically sound." Not "what would chambers pay for." Not "what aligns with the VUCA framework."

What makes a teenager's eyes light up.

### Week 1: Build the Magic Moment

I don't build a platform. I build **one experience** — the smallest thing that creates wonder.

Here's what I build:

**You open the app. You see a world map. You're standing at your school. You tap Rome.** The screen transitions — not a page load, a JOURNEY. You're in Rome. The Colosseum is in the background. An AI voice says:

> *"Hey, du bist in Rom gelandet! Hier hat ein Koch gerade ein Problem — sein Sous-Chef ist krank und er muss fuer 200 Gaeste kochen. Er braucht deine Hilfe. Bist du dabei?"*

You say yes. The AI chef walks you through a real problem — ingredient sourcing, kitchen logistics, time pressure. You're learning about supply chains, leadership under pressure, and food science — but you don't KNOW you're learning. You're helping a chef in Rome.

After 8 minutes, the chef says:

> *"Wow, gut gemacht. Du hast gerade Volatilitaet erlebt — wenn der Plan nicht aufgeht und du trotzdem liefern musst. Willst du wissen, was noch auf dich wartet?"*

Your profile updates. A spider diagram ticks up. Your passport gets its first stamp. And the map shows: 147 other stations are waiting.

**That's the MVP. Nothing else.**

No login. No Firebase. No matching. No company profiles. No chamber dashboard. No parent view. No payment system. Just: map → tap → wonder → profile → want more.

**Build time: 3 weeks.** One frontend dev, one backend dev, one Gemini prompt engineer. Total cost: ~15,000 EUR.

### Week 2-3: Build It

The technical stack for the magic moment:

| Component | Implementation | Time |
|---|---|---|
| World map | Leaflet.js or Mapbox on a single page | 3 days |
| Station selection | Tap a city → load a scenario | 2 days |
| AI dialogue | Gemini with a curated scenario skeleton + dynamic generation | 5 days |
| Profile spider diagram | Chart.js or D3, updates after each station | 2 days |
| Passport / stamp collection | Simple state, visual grid of visited places | 2 days |
| VUCA tagging | Backend tags each interaction to V/U/C/A (invisible to user) | 1 day |
| Mobile-first responsive UI | Tailwind CSS, feels like an app | 3 days |

No auth needed for testing. Data stored in localStorage for now. The test version runs on a single Cloud Run instance.

**Critical design decision: The AI doesn't feel like a chatbot.**

The AI is a CHARACTER. In Rome, it's a chef. In Tokyo, it's an engineer. In the Amazon, it's a biologist. Each station has a persona, a problem, and a story arc. The student isn't "chatting with an AI about career exploration" — they're **helping characters solve real problems in real places**.

This is the difference between "educational platform" and "edutainment on the next level." The learning is real. The packaging is adventure.

### Week 4: The 25-Kid Test

I go to ONE Realschule. Not 50 schools. Not a Kultusministerium pilot. One teacher who's willing to give me 2 hours of Berufsorientierung time. (Every school has mandatory BO hours — this is the wedge.)

Day 1: 25 students, Klasse 8 or 9. I put them in front of the app. I say nothing. I watch.

**What I measure:**

| Metric | Target | Why It Matters |
|---|---|---|
| **Time to first "wow"** | <90 seconds | If they're not hooked in 90 seconds, the UX is wrong |
| **Session duration** | >15 minutes avg | Voluntary engagement, not compliance |
| **Stations visited** | >2 per session | They WANT to explore, not just try once |
| **Show-a-friend moment** | >30% turn their screen to a neighbor | Organic virality signal |
| **"Can I keep going?"** | >50% ask when session ends | Retention predictor |
| **Unprompted return** | >20% come back voluntarily within 48h | The only metric that really matters |

Day 5: I give them access at home. No requirement, no homework, no teacher instruction. Just the URL.

Day 14: I check who came back.

**If 5+ out of 25 came back voluntarily at home: I have product-market fit for engagement.**

If not: I redesign. I don't scale. I don't raise money. I don't build chamber dashboards.

### Week 5-6: The IHK Conversation

Armed with engagement data from 25 real teenagers, I walk into the IHK Geschaeftsfuehrung and say:

> "25 Schueler in Klasse 8 der Realschule [X] haben freiwillig durchschnittlich 40 Minuten mit unserer Berufsorientierungs-App verbracht. 8 davon sind zu Hause von sich aus nochmal reingegangen. Hier ist, was sie erkundet haben. Hier sind die Interessen-Daten, die dabei entstanden sind. Wollen Sie das fuer Ihren ganzen Kammerbezirk sehen?"

The IHK person doesn't need a matching engine or aggregate analytics dashboard. They need to see ONE thing: **teenagers voluntarily engaging with career-adjacent content.** That's the thing they can't achieve with their Messe-Stand, their Flyer, or their Tag der Ausbildung.

I don't ask for 15,000 EUR/year. I ask for:

1. **A pilot agreement**: 10 schools in their Kammerbezirk, 6 months, 5,000 EUR
2. **Access to their Ausbildungsbetriebe list**: So I can start populating the Moeglichkeitsraum with real companies
3. **A letter of intent**: "If engagement metrics hold at scale, we intend to formalize a partnership"

**That's Month 2. I have: revenue (5k), institutional validation, and a deployment channel.**

### Week 7-8: The Game Design Sprint

Now — and only now — I invest in retention mechanics. Because now I have real data on what kids actually do.

**The Four Loops:**

#### Loop 1: The Daily Passport

You can visit one new station per day. Each stamp is permanent — you're building a collection. Your passport fills up visibly. It takes 60 days to fill a page. When you fill a page, you unlock a new continent.

This is Duolingo's streak, adapted: not "don't break the chain" (which punishes) but "add to your collection" (which rewards). The psychology is different — loss aversion vs. accumulation pride.

**Why this works for our case**: Duolingo's D30 retention is ~15-20%, driven almost entirely by the streak mechanic. But Duolingo's streak punishes you for missing a day. Our passport NEVER goes backward — you just add slower. This is gentler and more appropriate for a non-daily-use product.

#### Loop 2: The Social Map

You can see (anonymized) how many Entdecker visited each station.

- "237 Entdecker waren hier" — social proof
- "Du bist einer von nur 12 Entdeckern, die diese Station gefunden haben" — exclusivity
- You can leave a one-line message at a station for the next traveler — a guestbook
- You can challenge a friend: "Schaffst du die Asien-Route vor mir?"

No accounts needed for this. No social network. Just ambient social presence on the map — like seeing other players' ghosts in a game.

#### Loop 3: The Profile Evolution

Your spider diagram grows after every station. But here's the trick: **you don't know what the dimensions mean until you've experienced them.**

At first, the diagram just shows unnamed axes growing. After you complete your first VUCA dimension, the label appears. After all four VUCA dimensions are revealed, a new layer appears: your skill dimensions (Hard Skills, Soft Skills, Future Skills, Resilience).

The profile isn't just data — it's a **discovery**. "What is this new axis? How do I grow it? What stations affect which axis?" This creates curiosity-driven exploration.

#### Loop 4: The Random Event

Every 3-5 sessions, something unexpected happens:

- *"Ein Sturm hat den Hafen in Hamburg gesperrt — waehle eine neue Route!"* (Forces exploration of unfamiliar territory)
- *"Ein Meisterkoch in Tokyo hat von dir gehoert und will dich herausfordern!"* (Pulls you to a high-quality curated station)
- *"Du hast eine versteckte Station entdeckt, die nur 3% aller Entdecker finden!"* (Creates stories worth sharing)

These events create STORIES. And stories are what teenagers share with each other. Not features, not profiles, not career insights — stories. "Du glaubst nicht, was mir in der App passiert ist..."

### Week 9-12: The 200-Kid Validation

Deploy to the 10 IHK pilot schools. 200 students. No marketing. Just the teacher saying "Macht mal" in the BO-Stunde.

**What I measure now:**

| Metric | Kill Target | Stretch Target |
|---|---|---|
| D1 retention | >40% | >60% |
| D7 retention | >20% | >35% |
| D30 retention | >10% | >20% |
| Avg sessions per user (30d) | >5 | >12 |
| Voluntary home usage | >15% | >30% |
| Teacher NPS | >30 | >50 |
| Student says "better than Planet Beruf" | >60% | >80% |

**Industry benchmarks for context:**
- Average EdTech app D30 retention: ~5-8%
- Duolingo D30: ~15-20% (top of class)
- Average mobile game D30: ~10-15%

If we hit >15% D30 retention, we're in Duolingo territory. For a career orientation tool. That's fundable.

If we hit the kill targets but miss stretch: iterate on game loops, don't scale yet.
If we miss kill targets: the product isn't right. Redesign before spending another euro.

---

## Part 3: The Investor Proof at Day 90

At the end of 90 days, I show you:

### The Numbers

| What | Number |
|---|---|
| Students who used the product | 225 |
| Voluntary return rate (unprompted) | X% |
| D30 retention | Y% |
| Average session duration | Z minutes |
| Stations explored per user | N |
| IHK pilot agreements signed | 1 (with LOI for expansion) |
| Revenue | 5,000 EUR (pilot fee) |
| Total spend | ~50,000 EUR |

### The Qualitative Proof

Video recordings (with consent) of teenagers using the app. Unscripted reactions. The moment they lean forward. The moment they show their screen to their friend. The moment they ask "Kann ich weitermachen?"

This is worth more than any business model slide.

### The Artifacts I Haven't Built (and Why)

| Not Built | Why |
|---|---|
| Chamber dashboard | Doesn't matter until 1,000+ users generate data |
| Company profiles | Doesn't matter until students care about matching |
| Matching engine | Doesn't matter until profiles are rich enough |
| Parent dashboard | Doesn't matter until parents hear about it organically |
| Sponsored content | Doesn't matter until engagement proves the platform has attention worth sponsoring |
| Payment system | Doesn't matter until someone wants to pay |
| Multi-agent personas | The single AI with scenario-specific characters works better than four "agent personas" |

Everything in the 29 Feature Requests is real and needed eventually. But building them before proving engagement is **building the house before testing the foundation.**

---

## Part 4: The Funding Ask

### Seed: 150,000 EUR (Months 1-6)

| Use | Amount |
|---|---|
| Magic Moment build (Week 1-3) | 15,000 |
| Game loop build (Week 7-8) | 20,000 |
| 2 developers (4 months, equity-heavy) | 60,000 |
| 1 product/design (4 months, equity-heavy) | 30,000 |
| Infrastructure, tools, legal | 10,000 |
| IHK pilot operations, school visits | 10,000 |
| Buffer | 5,000 |

**What 150k buys:**
- A working product tested with 200+ real teenagers
- Retention data that proves (or disproves) engagement
- 1 signed IHK pilot with LOI for expansion
- A clear go/no-go decision before spending more

**What 150k does NOT buy:**
- 50,000 users (that's Phase 2)
- Revenue (beyond pilot fees)
- The full platform (matching, dashboards, etc.)

### If Day 90 proves engagement: Series Seed — 500,000 EUR (Months 7-18)

| Use | Amount |
|---|---|
| Scale to 5,000 users via IHK school deployments | — |
| Build company profile + matching v1 | 80,000 |
| Build chamber dashboard v1 | 40,000 |
| Team scale (4 devs + 1 sales + 1 design) | 280,000 |
| Infrastructure scale | 20,000 |
| IHK partnership development (5-8 chambers) | 40,000 |
| Legal (GDPR, JMStV compliance review) | 20,000 |
| Buffer | 20,000 |

**What 500k buys:**
- 5,000 active students with real profiles
- 5-8 IHK partnerships worth 50-100k ARR
- First company subscriptions (20-40 companies)
- 25-40k MRR by Month 18

---

## Part 5: The Hard Answers to the 7 Challenges

### Challenge 1: "Why would a 14-year-old use this?"

**Answer:** Because it doesn't feel like education. It feels like a game where you're a traveler solving real problems in real places. The pedagogy is invisible. The adventure is visible. We prove this with actual teenagers before scaling.

**The deeper answer:** We don't compete with TikTok for entertainment time. We compete with Planet Beruf, Berufe.net, and the IHK Lehrstellenboerse for Berufsorientierung time. Every student in Germany has mandatory BO hours. Currently, those hours are spent on boring multiple-choice questionnaires. We replace THAT — not TikTok.

This reframes the acquisition problem. We're not a consumer app fighting for attention. We're a **school tool that's so good students keep using it at home.** Kahoot did exactly this — free for teachers, viral in classrooms, 9 billion cumulative participants. Kahoot didn't need Instagram-level growth. They needed teacher-to-teacher word of mouth in a captive-audience setting.

### Challenge 2: "3-year retention is a fantasy"

**Answer:** Correct. We don't plan for 3-year retention of individual users. We plan for **cohort cycling**.

Each school year, a new Klasse 8 enters Berufsorientierung. The school deploys Future Skiller in BO-Stunden. 200-300 new students per school per year. If we're in 200 schools, that's 40,000-60,000 new students annually — regardless of individual retention.

The LVL calculation changes:
- Individual retention: 8-12 months average (realistic)
- Cohort replacement: new students every year (guaranteed if institutionally deployed)
- Long-tail re-entry: some users return at career transitions (bonus, not required)

The business model doesn't need individual 5-year retention. It needs **institutional stickiness** — the school keeps using it year after year because teachers say "das funktioniert." Institutional churn is <10%/year once embedded in curriculum.

### Challenge 3: "Chicken-and-egg cold start"

**Answer:** We don't start as a marketplace. We start as a **single-player experience**.

Phase 1 (MVP): Pure student experience. AI-generated content. No companies, no chambers, no matching. The product is self-contained.

Phase 2 (Proof): Add the Moeglichkeitsraum with REAL data — but sourced from public databases (IHK Lehrstellenboerse, Berufenet, Arbeitsagentur APIs), not from company sign-ups. The landscape exists without companies manually populating it.

Phase 3 (Traction): NOW companies add value by enhancing their listings. But the baseline works without them.

The cold start is solved by **not needing all three sides on day one.** Students come through schools (institutional deployment). Data comes from public sources. Companies come last — AFTER there are profiles worth matching against.

### Challenge 4: "Your trust-based sponsoring is just content marketing"

**Answer:** You're right that the line is thin. Here's how we stay on the right side:

1. **No sponsored content in MVP.** The first 5,000 students never see a company name. This proves the product works without commercial influence.

2. **When sponsoring starts, it's opt-in by the SCHOOL.** The teacher decides whether sponsored stations appear in their classroom deployment. Schools that want pure BO keep it pure. Schools that opt in get enhanced content.

3. **JMStV compliance: we get a formal legal opinion BEFORE launching sponsored content.** Not after. Budget 20,000 EUR for a specialist Jugendmedienrecht lawyer. If the model doesn't pass legal review, we redesign.

4. **The real revenue isn't sponsoring anyway.** Looking at BC-009, company subscriptions and chamber partnerships are 74% of revenue. Sponsored content is a nice-to-have, not the foundation. We can drop it entirely and the business still works.

### Challenge 5: "AI quality will break the experience"

**Answer:** We don't rely on pure generation. We use **curated skeletons + dynamic flesh.**

Each station has a human-authored scenario frame:
- **Setting**: Rome, kitchen, chef has a problem
- **Problem arc**: 3 beats (setup → complication → resolution)
- **VUCA mapping**: This scenario covers Volatility and Complexity
- **Key facts**: Vetted, correct domain knowledge baked into the prompt
- **Character voice**: Personality, speech patterns, age-appropriate language

The AI fills in the dynamic parts: the dialogue flow, follow-up questions, responses to unexpected student input, the Level 2 reflection moments.

This means:
- The factual backbone is human-verified (no hallucinated facts)
- The experience structure is designed (not random)
- The AI adds personality, adaptability, and responsiveness
- Quality assurance is on the skeleton, not on every generated word

**50 curated station skeletons** cover the MVP. Each takes ~2 hours to author. That's 100 hours of content design — one person, 2-3 weeks. Not a content team. Not a publisher. One person who understands teenagers and VUCA.

**Quality feedback loop:** After every station, one question: "War das interessant? Ja / Nein / Ging so." Three taps. Stations below 60% "Ja" get flagged for skeleton revision. This is an automated quality gate that uses students as evaluators.

### Challenge 6: "No validation gates in the revenue timeline"

**Answer:** Here they are:

| Gate | Deadline | Metric | If MISS |
|---|---|---|---|
| **Gate 0: Magic works** | Week 4 | 5/25 students return voluntarily | Redesign UX from scratch |
| **Gate 1: Product retains** | Month 3 | D30 >10% in 200-user test | Rebuild game loops before scaling |
| **Gate 2: Institution buys** | Month 5 | 1 signed IHK pilot (any price) | Pivot to B2C or school-direct |
| **Gate 3: Revenue starts** | Month 9 | 3,000 EUR MRR from any source | Cut team, extend runway, investigate |
| **Gate 4: Revenue scales** | Month 15 | 25,000 EUR MRR | If <15k: stay lean, don't hire sales team |
| **Gate 5: Unit economics work** | Month 20 | CAC < 3-month LTV | Reduce burn, focus on retention |

**The rule: no gate, no next phase.** If we miss Gate 1, we don't build company profiles. If we miss Gate 2, we don't hire a sales team. Every phase unlocks only after the previous gate is passed.

Maximum loss if we fail at each gate:
- Gate 0: ~15,000 EUR (the magic moment build)
- Gate 1: ~50,000 EUR (90-day proof)
- Gate 2: ~100,000 EUR (6-month seed)

Compare to the current plan: 222,000 EUR spent by Month 12 with the first real validation point.

### Challenge 7: "Zero moat during buildup"

**Answer:** Three moats that exist from Day 1:

1. **Institutional relationships.** Once we're deployed in 50 schools via an IHK pilot, a competitor needs to replicate not just the technology but the RELATIONSHIP. IHK relationships take years to build. LinkedIn launching "LinkedIn Zukunft" doesn't help them — they have zero presence in German Realschulen.

2. **Curated station library.** 50 curated scenario skeletons, tested with real teenagers, refined based on engagement data. This is a content library that improves over time. A competitor starts from zero — and doesn't have our engagement data to know what works.

3. **Speed.** We ship in 3 weeks. A corporate competitor (Google, LinkedIn, Bundesagentur) takes 12-18 months to go through procurement, compliance, and committee approval. By the time they ship, we have 12 months of engagement data and 10 IHK partnerships.

The real moat isn't technology. It's **the combination of institutional trust + proven engagement data + speed of iteration.** Nobody can buy all three simultaneously.

---

## Part 6: What the MVP Actually Is

### The 72-Hour Definition

If I could only build for 72 hours straight, this is what I'd build:

1. **A world map** you can tap (Leaflet.js, ~20 cities pre-loaded)
2. **A scenario engine** that loads a curated skeleton + Gemini generates the dialogue
3. **A passport** that collects stamps (localStorage, visual grid)
4. **A profile spider diagram** that grows after each station (Chart.js)
5. **A single "War das interessant?" feedback button** after each station

No login. No database. No backend beyond the Gemini API proxy. No matching. No company anything. No parent anything.

**This is the product. Everything else is distribution and monetization.**

### What Makes It "Edutainment on the Next Level"

The current landscape of Berufsorientierung in Germany:

| Tool | Experience |
|---|---|
| Planet Beruf | Multiple-choice quiz → PDF result |
| Berufe.net | Text database you search like Wikipedia |
| IHK Lehrstellenboerse | Job listings for teenagers |
| Berufsberatung | 45-minute conversation with a counselor |
| Tag der Ausbildung | Walk around a Messe hall, collect Flyer |

**Future Skiller:**
You're a traveler. You land in Rome. A chef needs your help. You solve a real problem. You learn without knowing you're learning. Your profile grows. Your passport fills. You discover hidden stations. Your friend challenges you to race through Asia. You find a career path you never knew existed — not because someone recommended it, but because you DISCOVERED it while helping a marine biologist in the Great Barrier Reef.

That's the level difference. Not incremental improvement. **Category creation.**

The learning is REAL (VUCA dimensions, skill assessment, interest mapping). The experience is ADVENTURE. The technology is AI (unlimited content, personalized pace, dynamic dialogue). The distribution is INSTITUTIONAL (schools, chambers, mandatory BO hours).

No one else combines all four. That's the edge.

---

## Part 7: The 12-Month Roadmap (If We Pass All Gates)

| Month | Focus | Deliverable | Gate |
|---|---|---|---|
| 1 | Build magic moment | Working prototype, 20 stations | — |
| 2 | Test with 25 kids | Engagement data, iteration | Gate 0 |
| 3 | Game loops + 200-kid test | D30 retention data, IHK conversations | Gate 1 |
| 4-5 | IHK pilot deployment | 10 schools, 500+ students | Gate 2 |
| 6 | Auth + persistence + scale | Firebase, Google OAuth, real accounts | — |
| 7-8 | Moeglichkeitsraum v1 | Public data integration, landscape view | — |
| 9 | Chamber dashboard v1 | Aggregate interest analytics | Gate 3 |
| 10-11 | Company profiles v1 | First 20-40 companies onboarded | — |
| 12 | Matching v1 | Interest-based matching prototype | Gate 4 |

**Total spend Month 1-12: ~200,000 EUR** (Lean scenario, gated)
**Expected MRR at Month 12: 10-25k EUR** (from IHK pilots + first company subscriptions)

Compare to original plan: 222k spent, 8k MRR, no validated engagement proof.

---

## Part 8: Why This Wins

The original plan says: "Build the full platform, acquire users, hope they stay, sell to companies."

This proposal says: **"Prove teenagers care. Then build only what the data demands."**

| Original Plan | This Proposal |
|---|---|
| 29 features planned upfront | 5 features in MVP, rest earned by gates |
| First real validation at Month 12 | First real validation at Week 4 |
| 222k spent before knowing if it works | 15k spent before knowing if it works |
| Acquires users through multipliers (push) | Acquires users through schools (institutional pull) |
| Retains through "interesting journey" (hope) | Retains through game loops (mechanics) |
| Revenue from 3 simultaneous B2B channels | Revenue from 1 channel first (IHK), expand later |
| Needs 50,000 users to work | Needs 200 users to prove it works |

The challenge document asked: "Build the proof that teenagers care. Everything else follows from that — or doesn't."

This proposal IS that proof. 90 days. 50,000 EUR. A clear yes or no.

If yes: the rest of the plan is de-risked and every BC, DC, TC, and FR we've written becomes the roadmap for a proven product.

If no: we saved 1.8 million EUR and learned something real.

---

## Part 9: Convincing the IHK Dresden — Bildungsmarketing

### What They Already Do (and Where It Breaks)

The IHK Dresden runs an impressive operation. Here's the reality:

| Activity | Reach | Frequency | Cost to IHK |
|---|---|---|---|
| **Aktionstag Ausbildung** | ~3,000 visitors | Once/year (Sep 26, 2026 is the 32nd) | Significant (venue, logistics, staff) |
| **Azubibotschafter** | 25 kids per school visit, 2-3 visits/year per ambassador | A few dozen visits/year | Training workshops + coordination (Jana Reimer's team) |
| **Azubi-Speed-Dating** | ~20 companies, ~100 students per event | 5-8 events/year, creative formats (DVB tram, Ferris wheel) | Event logistics |
| **SCHAU REIN!** | 1,500 companies, 5,000+ offers | 1 week/year (Mar 9-14, 2026 is the 20th edition) | Statewide coordination |
| **#koennenlernen / @die.azubis** | 75,000 TikTok followers, hundreds of millions of views | Ongoing | National DIHK campaign, shared cost |
| **Karriere Rockt** (Lehrstellenboerse) | Online search portal (3 Saxon IHKs) | Always-on | Joint platform cost |
| **IHK-Kompetenzcheck** | Online quiz, "Teste deine Staerken" | Always-on | Financed by IHK Dresden directly |
| **Ausbildungsatlas** | Map view of training companies | Always-on | Data from IHK master records |

**The problem they can't solve:**

Sachsen has **2,250 unfilled apprenticeship positions** and **969 unplaced youth** simultaneously. In Dresden alone: **287 unfilled positions**. The ratio is roughly **4 open positions per unplaced applicant.** The issue isn't supply — it's MATCHING.

The Aktionstag reaches 3,000 people once a year. The Azubibotschafter reach 25 kids per visit. The Kompetenzcheck is a traditional strengths quiz that produces a PDF. Karriere Rockt is a search portal — useful, but only if you already know what you're looking for.

**Nobody is solving the gap between "I don't know what I want" and "Here are 287 open positions."** That gap is called Berufsorientierung, and the IHK's current digital answer (a multiple-choice quiz) is from 2010.

### The Pitch: "Wir machen euren Azubibotschafter digital — und er ist 365 Tage im Jahr unterwegs"

Here's what we say to Annett Knuepfer (Ausbildungsberatung) and Jana Reimer (Berufsorientierung):

> "Ihr habt ein Azubibotschafter-Programm, das funktioniert. Ein Azubi geht in eine Klasse, erzaehlt von seinem Beruf, und ploetzlich leuchten Augen. Das Problem: Ihr schafft 2-3 Schulbesuche pro Botschafter pro Jahr. Wir machen daraus 365 Tage im Jahr, fuer jeden Schueler individuell."

> "Future Skiller ist kein Ersatz fuer eure Azubibotschafter. Es ist deren digitaler Verstaerker. Der Botschafter besucht die Klasse — und hinterlaesst einen Link. Ab jetzt kann jeder Schueler die Reise weitermachen. Zu Hause. Im Bus. Am Wochenende. Und jede Interaktion baut ein Interessenprofil auf, das IHR sehen koennt."

### Why This Works for IHK Dresden (Even Without Geld)

**We don't ask for money. We ask for drei Dinge:**

| What we ask | What it costs IHK | What we get |
|---|---|---|
| **1. Zugang zu 10 Schulen** im Kammerbezirk fuer einen Piloten | 0 EUR — IHK hat bestehende Schulpartnerschaften (Susanne Diezel koordiniert sie bereits) | 200-300 Test-Schueler |
| **2. Daten aus dem Ausbildungsatlas** | 0 EUR — die Daten sind bereits oeffentlich auf derausbildungsatlas.de | Realer Moeglichkeitsraum fuer den Kammerbezirk Dresden |
| **3. Ein LOI** (Letter of Intent) | 0 EUR — nur eine Absichtserklaerung: "Wenn die Engagement-Daten stimmen, formalisieren wir die Partnerschaft" | Investor-Validierung |

**What IHK Dresden gets for free:**

| What they get | Why it matters |
|---|---|
| **Live-Daten ueber Schueler-Interessen** in ihrem Kammerbezirk | Sie wissen erstmals, was Jugendliche WIRKLICH interessiert — nicht was sie in einem Quiz ankreuzen |
| **Digitale Verlaengerung des Azubibotschafter-Programms** | Der Schulbesuch ist nicht mehr ein Event, sondern der Start einer digitalen Reise |
| **Ein Tool fuer die Passgenaue Besetzung** | Jessica Heinicker kann Schueler-Profile nutzen, um bessere Matches zu machen — mit Einverstaendnis |
| **Content fuer @die.azubis und #koennenlernen** | "Schaut mal, was die Schueler in Dresden erkunden" — authentische Geschichten fuer Social Media |
| **Integration in SCHAU REIN! 2027** | Schueler bereiten sich mit Future Skiller VOR dem Unternehmensbesuch vor — und gehen NACH dem Besuch digital weiter |
| **Ammo fuer den Bildungspolitik-Dialog** | Torsten Koehler (Bildungsdirektor) kann dem Kultusministerium echte Daten zeigen statt Anekdoten |

### The Specific Integration Points

**1. Azubibotschafter + Future Skiller**

The current flow:
```
Azubi besucht Klasse → Vortrag (45 min) → Ende
```

The new flow:
```
Azubi besucht Klasse → Vortrag (45 min)
    → "Und wenn ihr weitermachen wollt: hier ist der Link"
    → Schueler erkunden Future Skiller zu Hause
    → Ihre Interessen-Profile entstehen
    → IHK sieht aggregierte Daten
    → Naechster Azubi-Besuch ist GEZIELT auf Interessen der Klasse abgestimmt
```

The Azubibotschafter becomes 10x more effective because the next visit builds on what the students already explored. Jana Reimer's team can see: "In Klasse 9a der Realschule X interessieren sich 8 Schueler fuer Technik, 5 fuer Gastronomie, 3 fuer Gesundheit." The next Botschafter-Einsatz bringt genau diese Berufe mit.

**2. Aktionstag Ausbildung + Future Skiller**

Currently: 3,000 visitors walk around, collect Flyer, go home, forget.

With Future Skiller:
- Every booth has a QR code: "Scann mich und starte deine Reise mit [Unternehmen X]"
- Students who engaged with a company's station at the Aktionstag continue the journey digitally
- The event is not a dead-end — it's the START of a relationship
- IHK can track: "Von 3,000 Besuchern haben 800 die digitale Reise fortgesetzt — davon 120 mit konkretem Matching-Interesse"

**3. SCHAU REIN! Sachsen + Future Skiller**

SCHAU REIN! (Mar 9-14, 2026): 1,500 companies open doors for one week.

Problem: Students visit 2-3 companies max. They miss 1,497 others.

With Future Skiller: Students explore the ENTIRE landscape digitally before AND after the physical visits. The physical visit becomes the HIGHLIGHT of an ongoing digital journey, not a standalone event.

**4. Karriere Rockt + Future Skiller**

Karriere Rockt is a search portal. You need to know WHAT to search for.

Future Skiller is the discovery engine BEFORE the search. Students explore interests → interests map to Berufsfelder → Berufsfelder link to Karriere Rockt listings.

We don't replace Karriere Rockt. We feed it qualified traffic. Students who arrive at a Karriere Rockt listing via Future Skiller have a demonstrated interest profile — they're not random browsers.

### The One-Pager for Annett Knuepfer

```
FUTURE SKILLER x IHK DRESDEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problem:  287 offene Lehrstellen in Dresden.
          969 unversorgte Jugendliche in Sachsen.
          Das Problem ist nicht Angebot — es ist Matching.

Loesung:  Eine KI-gestuetzte Reise, die Jugendliche spielerisch
          ihre Interessen entdecken laesst. Kein Quiz. Kein
          Fragebogen. Ein Abenteuer.

Kosten fuer IHK:  0 EUR.

Was wir brauchen:
  ✓ Zugang zu 10 Schulen ueber bestehende Partnerschaften
  ✓ Oeffentliche Daten aus dem Ausbildungsatlas
  ✓ Eine Absichtserklaerung (LOI)

Was IHK Dresden bekommt:
  ✓ Live-Daten ueber Schueler-Interessen im Kammerbezirk
  ✓ Digitale Verlaengerung des Azubibotschafter-Programms
  ✓ Integration in Aktionstag, SCHAU REIN!, Speed-Dating
  ✓ Content fuer #koennenlernen und @die.azubis
  ✓ Ein Tool fuer die Passgenaue Besetzung

Pilot:  10 Schulen, 6 Monate, 200-300 Schueler
Start:  Sofort — wir sind bereit

Kontakt: [Deine Daten]
```

---

## Part 10: Convincing Parents — "Warum soll mein Kind das nutzen?"

### The Parent Reality in Sachsen

Parents in Sachsen face a specific situation:

1. **The apprenticeship market is FAVORABLE** — more positions than applicants. But parents don't know this. They still think "Studium ist sicherer."
2. **Berufsorientierung happens too late** — most structured BO starts in Klasse 9. By then, peer pressure and parental expectations have already narrowed the horizon.
3. **Parents are the #1 influence** on career decisions of teenagers. Not teachers. Not counselors. Not TikTok. Parents. (Every IHK study confirms this.)
4. **But parents' knowledge is 20 years out of date.** They know the careers that existed when THEY were 14. They don't know what a "Fachinformatiker fuer Daten- und Prozessanalyse" does. They don't know that a Mechatroniker earns more than many Bachelors.

### The Parent Pitch: Not "Career Tool" — "Entdeckungsreise"

Parents don't want another app for their kid. They especially don't want an app that tells their kid what to become. Here's the reframe:

**WRONG pitch to parents:**
> "Future Skiller hilft Ihrem Kind, den richtigen Beruf zu finden."

Parents hear: "Another career quiz. My kid already did Planet Beruf. It said 'Tierpfleger' and we all laughed."

**RIGHT pitch to parents:**
> "Ihr Kind reist digital um die Welt und loest echte Probleme — einem Koch in Rom helfen, einem Ingenieur in Tokyo, einem Biologen am Great Barrier Reef. Dabei entsteht ganz nebenbei ein Profil, das zeigt, was Ihr Kind wirklich interessiert und wo seine Staerken liegen. Kein Test. Kein Fragebogen. Ein Abenteuer, das schlauer macht."

Parents hear: "My kid learns something real while having fun. And I get to see what interests them."

### The Three Parent Fears (and How We Address Them)

**Fear 1: "Schon wieder Bildschirmzeit"**

Answer: Future Skiller sessions are 5-10 minutes. This is not TikTok-level screen addiction. Compare: 5 minutes solving a problem with a virtual chef in Rome vs. 5 minutes scrolling Instagram Reels. Same screen. Completely different brain activity.

More importantly: the sessions are FINITE. A station ends. The passport stamps one entry. Tomorrow there's a new one. There is no infinite scroll.

**Fear 2: "Wer sieht die Daten meines Kindes?"**

Answer: Nobody sees individual data without explicit consent. The IHK sees aggregate trends ("40% der Schueler in Klasse 9 interessieren sich fuer Technik") — never individual profiles. Companies see nothing until the student is 16+ and explicitly opts into matching. GDPR for minors is non-negotiable.

The parent has a dashboard (FR-025). They see: interest clusters, journey progress, engagement level. They do NOT see: individual conversations, specific answers, or the raw profile. Privacy boundary: parents see the map of where their child traveled, not the conversations they had at each station.

**Fear 3: "Lenkt das nicht vom Lernen ab?"**

Answer: This IS learning. The IHK-Kompetenzcheck ist ein Test. Future Skiller ist Lernen durch Erleben. Every station teaches real-world knowledge — supply chains, engineering problems, biological systems, cultural differences. The VUCA dimensions (Volatility, Uncertainty, Complexity, Ambiguity) are exactly the competencies that the Kultusministerium Sachsen defines as Zukunftskompetenzen.

And: it happens during BO-Stunden at school. It's not extra. It replaces the boring Planet-Beruf-Quiz that teachers currently use to fill those hours.

### The Parent Entry Points

**Entry Point 1: The School BO-Stunde (Primary)**

The teacher says: "Wir machen heute Berufsorientierung mit einer neuen App." Kids come home and say "Das war cool." Parents ask: "Was habt ihr gemacht?" Kid shows the passport. Parents go: "Hm, zeig mal." Parent downloads the app, links their account.

This is organic. No marketing needed. The kid IS the marketing.

**Entry Point 2: The IHK Event (Secondary)**

At the Aktionstag Ausbildung (Sep 26, 2026), parents come WITH their kids. The IHK booth has Future Skiller as an interactive demo. Parent sees kid engage. Parent gets a flyer: "Ihr Kind kann zu Hause weitermachen."

**Entry Point 3: The Elternabend (Tertiary)**

IHK's Berufsorientierung team already does Elternabende. Jana Reimer or Susanne Diezel present Future Skiller as "das neue Tool, das eure Kinder in der Schule nutzen." Parents see the dashboard. Parents see: "Mein Kind interessiert sich offenbar fuer Lebensmitteltechnik und Logistik — das wusste ich gar nicht."

THAT moment — when a parent discovers something new about their child's interests — is the conversion moment. Not a feature list. Not a price. A genuine insight about their kid.

### The Parent Premium: Later, Not Now

BC-006 describes a parent freemium model (4.99 EUR/month premium). This is correct but it's a Phase 3 feature. In the pilot:

- Parents get basic access for free (milestone notifications, journey summary)
- No premium tier during the pilot
- If engagement proves itself, the premium tier adds: detailed interest analytics, multi-child management, trend visualization
- But the FIRST job is: get parents to SEE the value before asking them to PAY for anything

### The Elternabend Script

For Jana Reimer or a teacher presenting to parents:

> **"Kennen Sie das? Ihr Kind kommt von der Schule und Sie fragen: Was willst du mal werden? Und die Antwort ist: Weiss ich nicht. Oder: Irgendwas mit Medien."**
>
> [Parents laugh. They all know this.]
>
> **"Wir haben ein neues Tool, das anders funktioniert als ein Berufstest. Ihr Kind reist digital um die Welt, loest echte Probleme, und dabei entsteht ein Profil — nicht von einem Fragebogen, sondern von echten Erlebnissen."**
>
> **"Lassen Sie mich Ihnen zeigen, was ein Schueler aus Klasse 9 in zwei Wochen erkundet hat..."**
>
> [Show a real example profile — spider diagram, passport stamps, interest clusters]
>
> **"Dieser Schueler wusste vorher nicht, was ihn interessiert. Jetzt sieht er: Technik und Nachhaltigkeit. Und wir koennen ihm zeigen: In deiner Region gibt es 47 Ausbildungsplaetze, die genau dazu passen."**
>
> **"Das Beste: Ihr Kind entscheidet selbst, was es erkundet. Niemand sagt, wo es lang geht. Kein Berufsberater, kein Algorithmus, kein Elternteil. Die Neugier fuehrt."**
>
> **"Fuer Sie als Eltern gibt es ein Dashboard — Sie sehen, was Ihr Kind interessiert, ohne die einzelnen Gespraeche zu lesen. Sie sehen die Karte, nicht das Tagebuch."**

---

## Part 11: The Dresden Pilot — Concrete Plan

### Why Dresden First

1. **IHK Dresden has the infrastructure**: 10+ active school partnerships (coordinated by Susanne Diezel), Azubibotschafter program (coordinated by Jana Reimer), annual Aktionstag (3,000 visitors), Karriere Rockt platform
2. **The matching problem is acute**: 287 unfilled positions in Dresden alone, 4:1 ratio of open positions to unplaced youth
3. **SCHAU REIN! Sachsen** (March 2026, 20th edition) is a perfect launch context — 1,500 companies, statewide attention
4. **Passgenaue Besetzung** runs until 2027 — Jessica Heinicker's team is actively looking for better matching tools
5. **IHK Dresden funds the Kompetenzcheck** — they understand the value of digital BO tools and already allocate budget for them

### The 6-Month Dresden Pilot Timeline

| Month | Action | IHK Role | Our Role |
|---|---|---|---|
| **1** | Kick-off meeting with Annett Knuepfer + Jana Reimer | Introduction, identify 10 pilot schools | Build magic moment prototype |
| **2** | Test with 1 class (25 students) at one school | Teacher introduction via school partnership | Run test, measure engagement |
| **3** | Refine + expand to 10 schools (200-300 students) | Distribute via Azubibotschafter school visits | Deploy, measure D7/D30 retention |
| **4** | Integrate Ausbildungsatlas data into Moeglichkeitsraum | Provide data access | Build landscape integration |
| **5** | Present results at IHK Bildungsausschuss | Arrange presentation slot | Deliver engagement report |
| **6** | Evaluate: formalize partnership or stop | Go/no-go decision | Aggregate learnings |

### What Success Looks Like at Month 6

For IHK:
- "200 Schueler haben freiwillig durchschnittlich 8 Stationen erkundet"
- "Wir wissen jetzt, dass Klasse 9 in der Oberschule X sich ueberproportional fuer Gesundheit und IT interessiert"
- "Der naechste Azubibotschafter-Einsatz dort bringt gezielt einen Fachinformatiker und eine MFA mit"

For us:
- D30 retention data from 200+ real students
- One institutional partner with validated engagement proof
- A story we can tell to the next 78 IHK chambers in Germany

For parents:
- "Mein Kind hat sich freiwillig mit Berufsorientierung beschaeftigt — das hat noch kein Lehrer geschafft"

---

## Related
- [challenge.md](challenge.md) — The 7 hard problems this proposal answers
- BC-003 (Chamber Visibility and Regional Matching — the IHK partnership model)
- BC-006 (Eltern als Enabler — parent engagement strategy)
- BC-008 (Multiplikatoren-Netzwerk — IHK as primary multiplier)
- BC-009 (Business Model — revenue model, adapted for gated approach)
- BC-010 (Kostenmodell — cost assumptions, revised downward for Phase 1)
- DC-001 (VUCA Bingo Matrix — reframed as invisible pedagogy, visible game)
- DC-007 (Digitale Wanderschaft — metaphor tested with actual users, not assumed)
- DC-008 (Rollenbasiertes VUCA-Oekosystem — parent and chamber roles defined)
- FR-005 (Gemini Dialogue Engine — curated skeletons + dynamic generation)
- FR-021 (Chamber Dashboard — aggregate analytics for IHK)
- FR-025 (Eltern-Dashboard — parent privacy boundary)
- FR-026 (Micro-Session UX — daily passport loop)
- US-015 (Kammer und Jobagentur als Wegweiser)
