# TC-019: SOLID Pod Decentralized Storage Layer

**Status:** draft
**Created:** 2026-02-19
**Entity:** SkillR

## Context

The current architecture (TC-017) uses a three-tier storage model: Firestore (real-time), PostgreSQL (structured), and Analytics (append-only). All user data resides on platform-controlled infrastructure. This creates a data sovereignty gap: the platform owns the data, and users have no portable, self-sovereign store.

TC-019 adds a fourth tier — **SOLID Pods** — as the canonical store for personal and company data. SOLID (Social Linked Data) is a W3C-backed specification that gives users full control over where their data is stored and who can access it.

**Why SOLID Pods?**

1. **Data sovereignty (DSGVO Art. 20):** Users own their data in a portable, interoperable format. Data portability is built into the architecture, not bolted on.
2. **Decentralized trust:** Aligns with TC-007 (immutable evidence chains), TC-009 (multi-source trust), and TC-010 (W3C Verifiable Credentials + DIDs). SOLID Pods are the storage mechanism for these trust layers.
3. **Company data isolation:** Companies publish Lernreisen (learning journeys) to their own Pods, maintaining ownership and access control.
4. **Interoperability:** RDF-based linked data enables federation with other education platforms, credential verifiers, and job portals.

**Pod hosting model (user choice):** Hybrid — Future SkillR hosts Community Solid Server (CSS) as the default. Users can optionally link an external Pod provider (BYOP — Bring Your Own Pod).

---

## Decision

We adopt a **four-tier storage architecture** with SOLID Pods as the canonical store for personal and company data. Firestore becomes a reactive cache mirroring Pod data. PostgreSQL becomes a queryable index with materialized views. The platform does not own personal data — it indexes and caches it with user consent.

---

## Four-Tier Storage Architecture

```
Tier S: SOLID Pod   (canonical personal/company data, user-sovereign)
Tier A: Firestore   (real-time cache, mirrors Pod for frontend reactivity)
Tier B: PostgreSQL  (materialized views, computed scores, platform index)
Tier C: Analytics   (append-only audit/observability, anonymized)
```

### Tier S — SOLID Pod (canonical, user-sovereign)

The SOLID Pod is the source of truth for all personal and company data. Data is stored as RDF (Turtle/JSON-LD) in Pod containers. Access is controlled by WebACL policies set by the data owner.

- **User Pods** store: profile state, journey progress, interactions, portfolio evidence, endorsements, reflections, legal consents, preferences
- **Company Pods** store: journey definitions, station definitions, job postings (federated)
- **Platform data** (prompts, agent configs, blockchain anchors) does NOT live in Pods — it remains in Firestore/PostgreSQL

### Tier A — Firestore (real-time cache)

Firestore mirrors a subset of Pod data for frontend reactivity. The frontend reads from Firestore via the Firebase SDK for real-time listeners. Writes go to the Pod first (canonical), then async-mirror to Firestore.

Only high-frequency, frontend-accessed entities are mirrored:
- UserState, VucaState, EngagementState, InterestProfile, UserPreferences, SkillProfile

### Tier B — PostgreSQL (queryable index)

PostgreSQL stores materialized views and computed data for cross-user queries. It indexes Pod data for features that require relational queries (leaderboards, job matching, endorsement verification, compliance dashboards).

### Tier C — Analytics (append-only, anonymized)

Unchanged from TC-017. Clickstream events, prompt logs, agent executions, and blockchain anchors. Anonymized — no personal data.

---

## Entity-to-Pod Mapping

All 21 entity categories classified by canonical location, Pod container path, and mirror/index strategy.

### User Pod Entities

| Entity | Pod Container Path | Firestore Mirror? | PostgreSQL Index? |
|--------|-------------------|-------------------|-------------------|
| **UserState** | `/{webid}/profile/state` | Yes (real-time UI) | No |
| **VucaState** | `/{webid}/journey/vuca-state` | Yes (real-time UI) | No |
| **EngagementState** | `/{webid}/profile/engagement` | Yes (real-time UI) | Partial (leaderboard) |
| **InterestProfile** | `/{webid}/profile/interests` | Yes (real-time UI) | Yes (matching) |
| **UserPreferences** | `/{webid}/settings/preferences` | Yes (real-time UI) | No |
| **DsgvoConsent** | `/{webid}/legal/consent/{id}` | No | Yes (compliance) |
| **ParentLink** | `/{webid}/legal/parents/{id}` | No | Yes (parent dashboard) |
| **Session** | `/{webid}/journal/sessions/{id}` | No | Yes (queryable) |
| **Interaction** | `/{webid}/journal/interactions/{id}` | No | Metadata only |
| **PortfolioEntry** | `/{webid}/portfolio/evidence/{id}` | No | Yes (evidence chain) |
| **Endorsement** | `/{webid}/portfolio/endorsements/{id}` | No | Yes (cross-user) |
| **ExternalArtifact** | `/{webid}/portfolio/artifacts/{id}` | No | Metadata only |
| **ReflectionResult** | `/{webid}/journal/reflections/{id}` | No | Yes (capability scores) |
| **SkillProfile** | `/{webid}/profile/skill-profile` | Yes (real-time UI) | Yes (dual-write) |

### Company Pod Entities

| Entity | Pod Container Path | Firestore Mirror? | PostgreSQL Index? |
|--------|-------------------|-------------------|-------------------|
| **JourneyDefinition** | `/org/{slug}/journeys/{id}` | No | Yes (discovery) |
| **StationDefinition** | `/org/{slug}/journeys/{id}/stations/{sid}` | No | Yes (discovery) |

### Platform Entities (no Pod)

| Entity | Storage | Firestore? | PostgreSQL? |
|--------|---------|------------|-------------|
| **User** (identity) | PostgreSQL | — | Yes (index, webid mapping) |
| **PromptTemplate** | Firestore | Yes | No |
| **AgentConfig** | Firestore | Yes | No |
| **JobPosting** | PostgreSQL | — | Yes (federation) |
| **BlockchainAnchor** | PostgreSQL | — | Yes (immutable) |

### Tier C Entities (Analytics, unchanged)

| Entity | Storage |
|--------|---------|
| **ClickstreamEvent** | PostgreSQL (`user_events`) |
| **PromptLog** | PostgreSQL (`prompt_logs`) |
| **AgentExecution** | PostgreSQL (`agent_executions`) |

---

## RDF Vocabulary

### Namespace

```turtle
@prefix fs:      <https://vocab.maindset.academy/ns/> .
@prefix schema:  <http://schema.org/> .
@prefix foaf:    <http://xmlns.com/foaf/0.1/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix solid:   <http://www.w3.org/ns/solid/terms#> .
@prefix acl:     <http://www.w3.org/ns/auth/acl#> .
@prefix vc:      <https://www.w3.org/2018/credentials#> .
```

### Core Classes

| Class | URI | Description |
|-------|-----|-------------|
| `fs:InterestProfile` | `fs:InterestProfile` | User's computed interest/skill profile |
| `fs:SkillCategory` | `fs:SkillCategory` | Category of skills (hard, soft, future, resilience) |
| `fs:PortfolioEntry` | `fs:PortfolioEntry` | Evidence entry in the portfolio |
| `fs:Endorsement` | `fs:Endorsement` | Third-party skill endorsement |
| `fs:ReflectionResult` | `fs:ReflectionResult` | Level 2 reflection outcome |
| `fs:JourneyDefinition` | `fs:JourneyDefinition` | Company-defined learning journey |
| `fs:StationDefinition` | `fs:StationDefinition` | Station within a journey |
| `fs:Session` | `fs:Session` | Journey session record |
| `fs:Interaction` | `fs:Interaction` | Single user-AI interaction |
| `fs:VucaState` | `fs:VucaState` | VUCA journey progress state |
| `fs:EngagementState` | `fs:EngagementState` | XP, streaks, level |
| `fs:DsgvoConsent` | `fs:DsgvoConsent` | DSGVO consent record |
| `fs:ExternalArtifact` | `fs:ExternalArtifact` | Uploaded evidence artifact |
| `fs:PlatformAgent` | `fs:PlatformAgent` | An AI agent operated by the platform (TC-020) |
| `fs:AgentPurpose` | `fs:AgentPurpose` | Declared purpose of an agent's data access (TC-020) |
| `fs:AgentConsent` | `fs:AgentConsent` | User consent record for agent access (TC-020) |

### Core Properties

| Property | Domain | Range | Description |
|----------|--------|-------|-------------|
| `fs:skillDimension` | `fs:SkillCategory` | `xsd:string` | Skill dimension identifier |
| `fs:score` | `fs:SkillCategory` | `xsd:decimal` | Score (0-100) |
| `fs:completeness` | `fs:InterestProfile` | `xsd:decimal` | Profile completeness (0.0-1.0) |
| `fs:evidenceType` | `fs:PortfolioEntry` | `xsd:string` | auto, manual, endorsed |
| `fs:confidence` | `fs:PortfolioEntry` | `xsd:decimal` | Confidence score (0.0-1.0) |
| `fs:endorserRole` | `fs:Endorsement` | `xsd:string` | teacher, mentor, employer, peer, parent, other |
| `fs:endorserVerified` | `fs:Endorsement` | `xsd:boolean` | Whether endorser identity is verified |
| `fs:vucaDimension` | `fs:VucaState` | `xsd:string` | volatility, uncertainty, complexity, ambiguity |
| `fs:journeyType` | `fs:JourneyDefinition` | `xsd:string` | vuca, entrepreneur, self-learning |
| `fs:consentType` | `fs:DsgvoConsent` | `xsd:string` | Consent type identifier |
| `fs:consentVersion` | `fs:DsgvoConsent` | `xsd:string` | Consent version |

### Turtle Examples

#### InterestProfile

```turtle
@prefix fs:      <https://vocab.maindset.academy/ns/> .
@prefix schema:  <http://schema.org/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

<#interest-profile>
    a fs:InterestProfile ;
    fs:completeness "0.72"^^xsd:decimal ;
    dcterms:modified "2026-02-19T14:30:00Z"^^xsd:dateTime ;
    fs:skillCategory [
        a fs:SkillCategory ;
        fs:key "hard-skills" ;
        schema:name "Hard Skills" ;
        fs:score "68"^^xsd:decimal ;
        fs:contributingDimension "analytical-thinking", "problem-solving"
    ] ;
    fs:skillCategory [
        a fs:SkillCategory ;
        fs:key "soft-skills" ;
        schema:name "Soft Skills" ;
        fs:score "75"^^xsd:decimal ;
        fs:contributingDimension "communication", "teamwork"
    ] ;
    fs:skillCategory [
        a fs:SkillCategory ;
        fs:key "future-skills" ;
        schema:name "Future Skills" ;
        fs:score "80"^^xsd:decimal ;
        fs:contributingDimension "change", "uncertainty", "complexity", "ambiguity"
    ] ;
    fs:skillCategory [
        a fs:SkillCategory ;
        fs:key "resilience" ;
        schema:name "Resilienz" ;
        fs:score "62"^^xsd:decimal ;
        fs:contributingDimension "resilience", "persistence"
    ] ;
    fs:topInterest "Robotik", "Umwelttechnik", "Mediendesign" ;
    fs:topStrength "Kreativitaet", "Analytisches Denken" .
```

#### PortfolioEntry

```turtle
@prefix fs:      <https://vocab.maindset.academy/ns/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

<#evidence-a1b2c3>
    a fs:PortfolioEntry ;
    fs:evidenceType "auto" ;
    dcterms:description "Demonstrated creative problem-solving during the Complexity station by proposing three alternative approaches to urban planning challenges." ;
    fs:confidence "0.85"^^xsd:decimal ;
    fs:skillDimensionScore [
        fs:dimension "complexity" ;
        fs:score "82"^^xsd:decimal
    ] ;
    fs:skillDimensionScore [
        fs:dimension "creativity" ;
        fs:score "78"^^xsd:decimal
    ] ;
    fs:sourceInteraction <../journal/interactions/int-001> ;
    fs:sourceInteraction <../journal/interactions/int-002> ;
    fs:context [
        fs:stationId "station-complexity-01" ;
        fs:journeyType "vuca" ;
        fs:vucaDimension "complexity"
    ] ;
    dcterms:created "2026-02-18T10:15:00Z"^^xsd:dateTime .
```

#### Endorsement

```turtle
@prefix fs:      <https://vocab.maindset.academy/ns/> .
@prefix foaf:    <http://xmlns.com/foaf/0.1/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

<#endorsement-d4e5f6>
    a fs:Endorsement ;
    fs:learner <https://pods.maindset.academy/user123/profile/card#me> ;
    fs:endorser [
        foaf:name "Frau Mueller" ;
        fs:endorserRole "teacher" ;
        fs:endorserVerified true
    ] ;
    fs:skillDimensionScore [
        fs:dimension "teamwork" ;
        fs:score "90"^^xsd:decimal
    ] ;
    fs:skillDimensionScore [
        fs:dimension "communication" ;
        fs:score "85"^^xsd:decimal
    ] ;
    fs:statement "Excellent teamwork during the school project on renewable energy. Consistently helped peers understand complex concepts." ;
    fs:context "Schulprojekt Erneuerbare Energien, Q1 2026" ;
    fs:artifactRef <../artifacts/artifact-x1y2> ;
    fs:visible true ;
    dcterms:created "2026-02-15T09:00:00Z"^^xsd:dateTime .
```

#### Company JourneyDefinition

```turtle
@prefix fs:      <https://vocab.maindset.academy/ns/> .
@prefix schema:  <http://schema.org/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

<#journey-ihk-digital>
    a fs:JourneyDefinition ;
    schema:name "Digitale Berufe entdecken" ;
    schema:description "Entdecke die Welt der digitalen Berufe — von Softwareentwicklung bis UX Design." ;
    fs:journeyType "entrepreneur" ;
    fs:dimension "complexity", "uncertainty" ;
    fs:station <stations/station-01> ;
    fs:station <stations/station-02> ;
    fs:station <stations/station-03> ;
    schema:creator <https://pods.maindset.academy/org/ihk-muenchen/profile/card#me> ;
    fs:isCustom true ;
    dcterms:created "2026-01-15T08:00:00Z"^^xsd:dateTime .

<stations/station-01>
    a fs:StationDefinition ;
    schema:name "Code-Werkstatt" ;
    schema:description "Tauche ein in die Welt des Programmierens" ;
    fs:setting "Digitale Werkstatt in einem Co-Working Space" ;
    fs:character "Kai, ein junger Softwareentwickler" ;
    fs:challenge "Entwickle eine kleine App fuer deinen Alltag" ;
    fs:technique "Pair Programming Simulation" ;
    fs:dimension "complexity", "creativity" ;
    fs:coordinates [
        fs:latitude "48.1351"^^xsd:decimal ;
        fs:longitude "11.5820"^^xsd:decimal
    ] .
```

---

## Pod Container Structure

### User Pod

```
/{webid}/
├── profile/
│   ├── card              # WebID Profile Document (foaf:Person)
│   ├── state             # UserState (real-time journey state)
│   ├── interests         # InterestProfile
│   ├── skill-profile     # SkillProfile (computed, dual-write)
│   └── engagement        # EngagementState (XP, streaks, level)
├── journey/
│   ├── vuca-state        # VucaState (VUCA bingo progress)
│   └── ...               # Future journey types
├── journal/
│   ├── sessions/
│   │   └── {session-id}  # Session records
│   ├── interactions/
│   │   └── {interaction-id}  # Individual interactions
│   └── reflections/
│       └── {reflection-id}   # Level 2 reflection results
├── portfolio/
│   ├── evidence/
│   │   └── {entry-id}    # PortfolioEntry records
│   ├── endorsements/
│   │   └── {endorsement-id}  # Endorsement records
│   └── artifacts/
│       └── {artifact-id}     # ExternalArtifact metadata + binary
├── legal/
│   ├── consent/
│   │   └── {consent-id}  # DsgvoConsent records
│   └── parents/
│       └── {parent-id}   # ParentLink records
└── settings/
    └── preferences       # UserPreferences
```

### Company Pod

```
/org/{slug}/
├── profile/
│   └── card              # Organization WebID Profile (schema:Organization)
├── journeys/
│   └── {journey-id}/
│       ├── definition    # JourneyDefinition
│       └── stations/
│           └── {station-id}  # StationDefinition
└── jobs/
    └── {job-id}          # JobPosting (federated, optional)
```

### WebACL Defaults

Each container has a `.acl` resource defining access control.

**User Pod defaults:**
- `profile/card`: public read, owner write
- `profile/state`: owner read/write, Entdecker-Agent read/write
- `profile/interests`: owner read/write, Skill-Agent read
- `profile/skill-profile`: owner read/write, Skill-Agent read/write (Match-Agent read — only if consent granted, see TC-020)
- `profile/engagement`: owner read/write, Entdecker-Agent read/write
- `journey/*`: owner read/write, Entdecker-Agent read/write
- `journal/interactions/*`: owner read/write, Entdecker-Agent read/write, Reflexions-Agent read
- `journal/sessions/*`: owner read/write, Reflexions-Agent read
- `journal/reflections/*`: owner read/write, Reflexions-Agent read/write
- `portfolio/evidence/*`: owner read/write, Skill-Agent read, public read (with consent per-resource)
- `portfolio/endorsements/*`: owner read/write, Skill-Agent read, endorser append (during endorsement flow)
- `legal/*`: owner read/write (compliance read via Go backend, not agent-direct)
- `settings/*`: owner read/write

Core agent ACLs (Entdecker, Reflexions, Skill) are provisioned at Pod creation. Optional agent ACLs (Match) are provisioned only when the user grants explicit consent (see TC-020 Section 3 and Section 6).

**Company Pod defaults:**
- `profile/card`: public read, org-admin write
- `journeys/*`: public read, org-admin write
- `jobs/*`: public read, org-admin write

---

## Authentication Bridge

### Firebase JWT to WebID Mapping

The Go backend bridges Firebase Authentication with SOLID Pod authentication.

**Database mapping (PostgreSQL `users` table):**

```sql
ALTER TABLE users ADD COLUMN webid TEXT UNIQUE;
ALTER TABLE users ADD COLUMN pod_url TEXT;
ALTER TABLE users ADD COLUMN pod_provider TEXT DEFAULT 'managed';
-- pod_provider: 'managed' (CSS hosted), 'external' (BYOP)
```

**Authentication flow:**

```
1. User authenticates via Firebase (Google OAuth / email)
2. Frontend sends Firebase JWT to Go backend
3. Go backend verifies JWT via Firebase Admin SDK
4. Go backend looks up user's WebID + Pod URL from PostgreSQL
5. Go backend uses CSS client credentials + DPoP to access Pod
6. Pod data returned to frontend via Go API (or mirrored to Firestore)
```

### DPoP Token Flow

The Go backend authenticates to Pods using DPoP (Demonstration of Proof-of-Possession) tokens. Each agent has its own client credentials registered on the CSS instance (see Bot Identity below).

```
Go Backend                    CSS (Pod Server)
    |                              |
    |-- POST /token (client_id,   |
    |   client_secret, DPoP proof)|
    |                              |
    |<-- Access Token + DPoP bound |
    |                              |
    |-- GET /user123/profile/      |
    |   (Authorization: DPoP ...)  |
    |   (DPoP: <proof>)            |
    |                              |
    |<-- 200 OK (Turtle/JSON-LD)   |
```

**For BYOP (external Pods):**
The user grants the Future SkillR application access to their external Pod via the standard SOLID authorization flow. The user's Pod provider must support client credentials or the user must authorize the app interactively once.

### Bot Identity — Per-Agent WebIDs and DPoP

Each platform agent (Entdecker, Reflexions, Skill, Match) has its own WebID and separate client credentials on the CSS instance (TC-020). This replaces the single platform identity (`<https://maindset.academy/app#id>`) with per-agent identities:

| Agent | WebID | Consent Tier |
|-------|-------|-------------|
| Entdecker-Agent | `https://maindset.academy/agents/entdecker-agent/profile/card#me` | Core |
| Reflexions-Agent | `https://maindset.academy/agents/reflexions-agent/profile/card#me` | Core |
| Skill-Agent | `https://maindset.academy/agents/skill-agent/profile/card#me` | Core |
| Match-Agent | `https://maindset.academy/agents/match-agent/profile/card#me` | Optional |

Each agent authenticates to the CSS with its own DPoP token. The CSS validates that the token identifies the agent's WebID, and the Pod's WebACL grants that specific WebID access. This enforces least-privilege access at the Pod server level — the Skill-Agent cannot access containers only granted to the Entdecker-Agent, even if a backend code bug routes the request incorrectly.

Agent credentials are stored in GCP Secret Manager and rotated on a 90-day schedule. See TC-020 Section 2 for the full credential management and token flow.

### WebID Profile Document

Each user's Pod contains a WebID Profile Document at `/{webid}/profile/card`:

```turtle
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .

<#me>
    a foaf:Person ;
    foaf:name "Max Mustermann" ;
    solid:oidcIssuer <https://accounts.google.com> ;
    solid:account <https://pods.maindset.academy/max-mustermann/> .
```

---

## Sync Architecture

### Write Path

```
Frontend → Go API → Pod (canonical) → Firestore (mirror, async) → PostgreSQL (index, async)
```

1. **Frontend** sends write request to Go API (e.g., `PUT /api/v1/pods/data/{path}`)
2. **Go API** validates request, authenticates user, writes to SOLID Pod via DPoP
3. **Go API** enqueues async tasks:
   - If entity is Firestore-mirrored: update Firestore `users/{uid}/state/{key}`
   - If entity is PostgreSQL-indexed: upsert into PostgreSQL index table
4. **Async workers** (Cloud Tasks / Pub/Sub) process mirror + index updates

### Read Path

```
Frontend → Firestore (real-time listener)     [for mirrored entities]
Backend  → Pod (canonical)                     [for canonical reads]
Backend  → PostgreSQL (index)                  [for cross-user queries]
```

- **Real-time UI state** (UserState, VucaState, etc.): Frontend reads from Firestore via Firebase SDK. Firestore is kept in sync with Pod via the write path.
- **Portfolio, journal, legal data**: Go API reads directly from Pod (canonical).
- **Cross-user queries** (leaderboard, job matching, endorsement search): Go API queries PostgreSQL index.

### Conflict Resolution

**Pod wins.** The Pod is the canonical store for personal data. If Firestore or PostgreSQL diverge from the Pod, the Pod version takes precedence.

**Conflict detection:**
- Each mirrored entity includes a `last_modified` timestamp in both Pod and Firestore
- Periodic reconciliation job compares timestamps and re-syncs from Pod if diverged
- PostgreSQL index entries include `pod_etag` for conditional updates

**Offline handling:**
- Frontend continues to write to Firestore directly if the Pod is unreachable (e.g., BYOP Pod is down)
- When Pod becomes reachable, reconciliation syncs Firestore → Pod (with conflict check)
- User is notified of any conflicts requiring manual resolution

---

## CSS Deployment Architecture

### Community Solid Server (CSS)

Future SkillR hosts a CSS instance as the default Pod provider.

**Deployment:**

| Component | Infrastructure | URL |
|-----------|---------------|-----|
| CSS Server | Cloud Run (separate service) | `pods.maindset.academy` |
| Pod Storage Backend | PostgreSQL (Cloud SQL, shared instance, separate database) | — |
| Pod Identity | WebID-TLS + DPoP | `pods.maindset.academy/{username}/profile/card#me` |

**Why PostgreSQL backend (not filesystem)?**
- Cloud Run is stateless — no persistent filesystem
- PostgreSQL provides ACID transactions for Pod data
- Shared Cloud SQL instance reduces operational overhead
- CSS supports PostgreSQL via `@solid/community-server` storage adapter

**CSS Configuration:**

```json
{
  "@context": "https://linkedsoftwaredependencies.org/bundles/npm/@solid/community-server/^7.0.0/components/context.jsonld",
  "import": [
    "css:config/app/main/default.json",
    "css:config/app/init/initialize-root.json",
    "css:config/http/handler/default.json",
    "css:config/http/middleware/websockets.json",
    "css:config/identity/handler/default.json",
    "css:config/identity/ownership/token.json",
    "css:config/storage/backend/postgres.json",
    "css:config/ldp/authorization/webacl.json"
  ],
  "@graph": [
    {
      "@id": "urn:solid-server:default:ServerConfig",
      "baseUrl": "https://pods.maindset.academy/",
      "port": 8080
    }
  ]
}
```

**Cloud Run service definition:**

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: solid-pods
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: PROJECT:REGION:INSTANCE
    spec:
      containers:
        - image: gcr.io/PROJECT/solid-pods:latest
          ports:
            - containerPort: 8080
          env:
            - name: CSS_BASE_URL
              value: "https://pods.maindset.academy"
            - name: CSS_PORT
              value: "8080"
            - name: CSS_STORAGE_BACKEND
              value: "postgres"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: solid-pods-db-url
                  key: latest
          resources:
            limits:
              memory: 1Gi
              cpu: "1"
```

### Pod Provisioning Flow

```
1. User signs up → Firebase Auth creates account
2. Go backend creates PostgreSQL user record
3. Go backend calls CSS API to provision Pod:
   POST https://pods.maindset.academy/.account/
   Body: { name: "user123", email: "user@example.com", password: <generated> }
4. CSS creates Pod at https://pods.maindset.academy/user123/
5. Go backend stores pod_url + webid in PostgreSQL users table
6. Go backend initializes Pod container structure (profile/, journal/, portfolio/, legal/, settings/)
7. Go backend sets default WebACL on each container:
   a. Owner ACL: user WebID gets full control on all containers
   b. Core agent ACLs: for each agent where consentTier == "core",
      grant the agent's WebID access to its declared containers (TC-020 access matrix)
   c. Optional agent ACLs are NOT set at this stage — they are
      provisioned only when the user grants explicit consent (TC-020 Section 6)
8. Go backend stores ACL version hash in PostgreSQL for reconciliation
```

---

## Cross-Pod Endorsement Flow

Endorsements are a key cross-user interaction that requires cross-Pod writes.

### Flow

```
1. Learner requests endorsement → Go API creates invitation
2. Endorser receives link/QR → follows link to endorsement form
3. Endorser submits endorsement → Go API validates

4. Go API writes endorsement to LEARNER's Pod:
   PUT /{learner-webid}/portfolio/endorsements/{id}
   (using platform client credentials — learner has granted append access)

5. If endorser has a Pod:
   Go API writes reference to ENDORSER's Pod:
   PUT /{endorser-webid}/portfolio/endorsements-given/{id}
   (reference only, pointing to learner's Pod)

6. Go API indexes endorsement in PostgreSQL:
   INSERT INTO endorsements (...) VALUES (...)

7. Endorsement Verification Agent runs (TC-018):
   - Verifies endorser identity
   - Assigns trust weight per TC-009
   - Updates learner's SkillProfile
```

### ACL for Endorsement Container

```turtle
@prefix acl: <http://www.w3.org/ns/auth/acl#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

# Owner has full control
<#owner>
    a acl:Authorization ;
    acl:agent <./../../profile/card#me> ;
    acl:accessTo <./> ;
    acl:default <./> ;
    acl:mode acl:Read, acl:Write, acl:Control .

# Skill-Agent can read endorsements (for profile computation)
<#skill-agent-read>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/skill-agent/profile/card#me> ;
    acl:accessTo <./> ;
    acl:default <./> ;
    acl:mode acl:Read .

# Entdecker-Agent can append (for new endorsements during endorsement flow)
<#entdecker-agent-append>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/entdecker-agent/profile/card#me> ;
    acl:accessTo <./> ;
    acl:default <./> ;
    acl:mode acl:Append .
```

Note: The single platform identity (`<https://maindset.academy/app#id>`) has been replaced with per-agent WebIDs. See TC-020 for the full agent identity model and access matrix.

---

## Agent Adaptation

TC-018 agents are adapted to read evidence from Pods and write computed results to Pod + PostgreSQL + Firestore. Each agent authenticates with its own WebID and DPoP token (TC-020), and Pod ACLs enforce that each agent can only access its declared containers. See TC-020 Section 3 for the full access matrix.

### Profile Computation Agent (adapted)

```
Trigger: station_complete, evidence_added, endorsement_received

1. Read from learner's Pod:
   - GET /{webid}/journal/interactions/ (all interactions)
   - GET /{webid}/journal/reflections/ (all reflections)
   - GET /{webid}/portfolio/endorsements/ (all endorsements)
   - GET /{webid}/portfolio/evidence/ (all evidence)

2. Compute updated SkillProfile via VertexAI

3. Write to learner's Pod (canonical):
   PUT /{webid}/profile/skill-profile

4. Mirror to Firestore (async):
   SET users/{uid}/state/interest-profile

5. Index in PostgreSQL (async):
   UPSERT skill_profiles SET ... WHERE user_id = ...
```

### Evidence Extraction Agent (adapted)

```
Trigger: session_end

1. Read session interactions from Pod:
   GET /{webid}/journal/sessions/{session-id}
   GET /{webid}/journal/interactions/?session={session-id}

2. Analyze via VertexAI → extract portfolio entries

3. Write evidence to Pod (canonical):
   PUT /{webid}/portfolio/evidence/{entry-id}

4. Index in PostgreSQL (async):
   INSERT INTO portfolio_entries (...)
```

### Job Matching Agent (adapted)

```
Trigger: profile_updated, new_job_posting

1. Read SkillProfile from PostgreSQL index (for batch matching)
   OR from Pod (for single-user matching)

2. Match against job_postings in PostgreSQL

3. Write match results to PostgreSQL only (no Pod storage — matches are platform-computed)
```

---

## DSGVO Alignment

### Data Sovereignty (Art. 20 — Data Portability)

SOLID Pods provide built-in data portability:
- All personal data is stored in the user's Pod in standard RDF formats (Turtle, JSON-LD)
- Users can export their entire Pod as a JSON-LD archive via `POST /api/v1/pods/export`
- Users can switch Pod providers (BYOP) and take their data with them
- The platform's PostgreSQL index is derived data — deletion of Pod data triggers deletion of index entries

### Right to Erasure (Art. 17)

**Deletion flow:**

```
1. User requests account deletion
2. Go API revokes all platform access tokens
3. Go API deletes PostgreSQL index entries (users, skill_profiles, endorsements, etc.)
4. Go API deletes Firestore mirror data (users/{uid}/*)
5. For managed Pods: Go API deletes Pod via CSS admin API
6. For BYOP Pods: Go API revokes app authorization — user retains their data
7. Analytics data is already anonymized (Tier C) — no deletion needed
```

### Consent Management

DSGVO consent records are stored in the user's Pod at `/{webid}/legal/consent/{id}`. This ensures:
- The user has a copy of all consents they've granted
- The platform indexes consent status in PostgreSQL for compliance queries
- Consent withdrawal is recorded in both Pod and PostgreSQL

### Data Processing Agreement

The platform acts as a data processor for managed Pod data. When users choose BYOP, the platform only processes data that the user explicitly shares via WebACL grants.

---

## Phased Migration

### V1.0: No Pods (Current Plan)

- Firestore for real-time app state (Tier A)
- PostgreSQL for structured data (Tier B)
- Analytics in PostgreSQL (Tier C)
- No SOLID Pods deployed
- Architecture designed Pod-ready: entity boundaries match Pod containers

### V1.5: Deploy CSS + Managed Pods

**Scope:**
- Deploy CSS on Cloud Run at `pods.maindset.academy`
- Provision managed Pods for new users at registration
- Dual-write: Go API writes to Pod (canonical) AND Firestore/PostgreSQL (existing paths)
- Read path unchanged: frontend still reads from Firestore
- Pod data is "write-ahead" — canonical but not yet read-primary

**Migration for existing users:**
- Background job provisions Pods for existing users
- Background job migrates Firestore data to Pods (one-time)
- After migration: dual-write active for all users

**New database columns:**

```sql
ALTER TABLE users ADD COLUMN webid TEXT UNIQUE;
ALTER TABLE users ADD COLUMN pod_url TEXT;
ALTER TABLE users ADD COLUMN pod_provider TEXT DEFAULT 'managed';
ALTER TABLE users ADD COLUMN pod_migrated_at TIMESTAMP;
```

### V1.5+: Pod-Primary Reads

**Scope:**
- Go API reads from Pod (canonical) for non-mirrored entities
- Firestore mirror remains for real-time UI state
- PostgreSQL index fully populated from Pods
- Reconciliation job runs daily to detect drift

### V2.0: Company Pods + BYOP + Federation

**Scope:**
- Company Pod provisioning for organizations
- BYOP support: users can link external Pod providers
- Federated discovery: platform indexes journey definitions from Company Pods
- Cross-platform endorsement flow via SOLID protocol
- WebID-based identity federation with other education platforms

---

## Architecture Diagram

```
+---------------------------------------------------------------+
|                      FRONTEND (Browser)                        |
|  TypeScript SPA — Firebase SDK for real-time, Go API for CRUD |
+-------+---------------------------+---------------------------+
        |                           |
  Firebase SDK (direct)        REST API (JWT)
        |                           |
        v                           v
+----------------+    +------------------------------------------+
|  Firestore     |    |  Go Backend (Cloud Run)                  |
|  (Tier A)      |    |                                          |
|                |    |  +-------------------------------------+ |
|  Mirrors of:   |    |  | Auth Bridge                         | |
|  - UserState   |    |  | Firebase JWT → WebID → DPoP         | |
|  - VucaState   |    |  +---+---------------------------------+ |
|  - Engagement  |    |      |                                   |
|  - Interests   |    |  +---v---------------------------------+ |
|  - SkillProfile|    |  | SOLID Pod Client                    | |
|  - Preferences |    |  | Read/Write via DPoP tokens          | |
|  - Prompts RO  |    |  +---+---------+-----------------------+ |
|  - Agents RO   |    |      |         |                         |
+-------+--------+    |  +---v---+ +---v---------------------+  |
        |             |  | User  | | Company                 |  |
        |             |  | Pods  | | Pods                    |  |
  async mirror        |  | (CSS) | | (CSS)                   |  |
        |             |  +---+---+ +---+---------------------+  |
        |             |      |         |                         |
+-------v--------+    |  +--v---------v-----------------------+ |
                  |    |  | PostgreSQL (Tier B)                | |
                  |    |  | - User index (webid, pod_url)      | |
                  |    |  | - Materialized views               | |
                  |    |  | - Cross-user queries               | |
                  |    |  | - Endorsement index                | |
                  |    |  +-----------------------------------+  |
                  |    |                                          |
                  |    |  +-----------------------------------+  |
                  |    |  | VertexAI (service account)        |  |
                  |    |  | Agents read from Pods             |  |
                  |    |  | Write results to Pod + PG + FS    |  |
                  |    |  +-----------------------------------+  |
                  |    +------------------------------------------+
                  |
                  |    +------------------------------------------+
                  +--->|  CSS (Cloud Run, separate service)       |
                       |  pods.maindset.academy                   |
                       |  PostgreSQL storage backend              |
                       |  WebACL authorization                    |
                       +------------------------------------------+
```

---

## Consequences

### Benefits

- **True data sovereignty:** Users own their data in a portable, standard format (RDF/Linked Data)
- **DSGVO compliance by design:** Art. 20 (portability) and Art. 17 (erasure) are architectural properties, not afterthoughts
- **Decentralized trust:** Evidence chains, endorsements, and credentials are stored in user Pods — the platform cannot alter them
- **Company data isolation:** Organizations control their journey content in their own Pods
- **Interoperability:** RDF + SOLID protocol enables federation with other education platforms
- **Future-proof:** Aligns with EU Data Governance Act and emerging self-sovereign identity standards

### Trade-offs

- **Complexity:** Four storage tiers require sync discipline and conflict resolution
- **Latency:** Pod reads add network hops compared to direct Firestore/PostgreSQL reads
- **CSS maturity:** Community Solid Server is newer than Firebase/PostgreSQL — requires monitoring
- **BYOP variability:** External Pod providers may have different performance/availability characteristics
- **Dual-write overhead:** During V1.5 migration, every write goes to Pod + Firestore + PostgreSQL

### Mitigation

- Firestore mirror eliminates latency for real-time UI state (most frequent reads)
- PostgreSQL index handles all cross-user queries (leaderboards, matching) without Pod reads
- Pod reads are only needed for canonical data access (export, verification, agent processing)
- Reconciliation job catches sync drift before it becomes user-visible
- BYOP is optional — managed Pods are the default and fully controlled

---

## Alternatives Considered

### 1. Encrypted Blobs in Firebase Storage

Store encrypted user data in Firebase Storage with user-held keys. Rejected because it doesn't provide linked data interoperability, standard access control (WebACL), or federation capabilities.

### 2. IPFS / Decentralized Storage

Use IPFS or Filecoin for decentralized storage. Rejected because IPFS doesn't support fine-grained access control, mutable data is complex, and the ecosystem is less mature for structured data than SOLID.

### 3. Personal Data Store (PDS) without SOLID

Build a proprietary personal data store. Rejected because it would lock users into the platform's PDS format, defeating the purpose of data sovereignty. SOLID provides a standard protocol.

### 4. Pod-only (no Firestore/PostgreSQL)

Eliminate Firestore and PostgreSQL entirely, reading all data from Pods. Rejected because SOLID Pods don't support real-time listeners (needed for frontend reactivity) or complex relational queries (needed for leaderboards, matching).

---

## Dependencies

- [TC-007](TC-007-portfolio-evidence-layer.md) — Portfolio evidence layer (evidence stored in Pod)
- [TC-009](TC-009-multimodaler-erinnerungsraum.md) — Multimodal memory space (endorsement trust model)
- [TC-010](TC-010-blockchain-learning-records.md) — Blockchain verification (anchors reference Pod data)
- [TC-013](TC-013-firestore-persistence-strategy.md) — Firestore persistence (becomes mirror layer)
- [TC-017](TC-017-unified-data-model.md) — Unified data model (extended with Tier S)
- [TC-018](TC-018-agentic-backend-vertexai.md) — Agentic backend (agents adapted for Pod reads/writes)
- [TC-020](TC-020-bot-fleet-identity.md) — Bot Fleet Identity (per-agent WebIDs, purpose-scoped ACLs, tiered consent)
- [TC-032](TC-032-custom-solid-pod-server.md) — Custom Solid Pod Server & PodProxy Federation (replaces CSS deployment)

## Notes

- Community Solid Server (CSS) v7.x supports PostgreSQL storage backend
- The `fs:` namespace (`https://vocab.maindset.academy/ns/`) should be registered and published as a public vocabulary
- WebACL is the W3C standard for access control in SOLID — it operates at the resource/container level
- DPoP (RFC 9449) is the recommended token binding mechanism for SOLID
- The CSS Cloud Run service should be deployed in the same GCP region as the main backend to minimize latency
- Pod container paths use the WebID as the root, not the Firebase UID — the mapping is maintained in PostgreSQL `users.webid`

---

## MVP4 Scope Clarification (2026-02-21)

TC-019 describes the full four-tier architecture where Pods become the canonical data store. **MVP4 implements only the first step:** a Pod as a transparency mirror.

### What MVP4 implements
- **App-primary, Pod-mirror model:** App backend (Firestore + PostgreSQL) remains the source of truth. The Pod receives a one-directional copy on demand.
- **5 entity types synced:** User Profile, Skill Profile, Journey Progress, Engagement, Reflections
- **On-demand sync only:** User triggers sync manually from the profile page
- **CSS v7 as Docker Compose service:** Local development only, no production deployment
- **No DPoP auth:** CSS local mode, simplified authentication
- **Turtle serialization:** Using TC-019's `fs:` namespace vocabulary

### What MVP4 does NOT implement (remains V2.0)
- Pod as canonical data store (Tier S)
- Pod-to-app sync (bidirectional)
- Automatic/event-driven sync
- Per-agent Pod identities (TC-020)
- Company Pods
- DPoP token binding for production
- WebACL-based access control policies
- Firestore-as-reactive-cache pattern
- CSS Cloud Run deployment

### Related Feature Requests
- FR-076: Solid Pod Connection
- FR-077: Pod Data Sync
- FR-078: Pod Data Viewer

---

## Custom Solid Pod Server Phase (2026-02-21)

> **Supersedes:** The CSS-based deployment described in the "CSS Deployment Architecture" section above is replaced by a custom Go-native Solid Pod server. See **TC-032** for the full architecture.

TC-019's vision of Pods as the canonical data store remains unchanged. The path to get there evolves: instead of deploying the Community Solid Server (CSS v7, Node.js) as a separate service, we build our own Solid-compliant Pod server in Go, integrated directly into the SkillR backend.

**Specification basis:** ©2019–2025 Inrupt Inc. and imec — https://solidproject.org/

- Solid Protocol v0.11.0: https://solidproject.org/TR/protocol
- Web Access Control v1.0.0: https://solidproject.org/TR/wac
- Solid-OIDC v0.1.0: https://solidproject.org/TR/oidc

### Why Custom Instead of CSS

1. **Unified runtime:** One Go binary serves both SkillR API and Pod server. No Node.js dependency.
2. **Deep integration:** Firebase JWT → WebID auth bridge is native, not a middleware adapter.
3. **PodProxy:** The custom server can proxy requests to external Pods — enabling BYOP and Pod federation natively.
4. **Single deployment:** One Cloud Run service instead of two.

### Revised Phased Migration

The migration phases from Section "Phased Migration" above are updated:

| Phase | Original Plan | Revised Plan |
|-------|--------------|-------------|
| V1.0 | No Pods | No Pods (unchanged) |
| V1.5 | Deploy CSS + managed Pods | **FR-086:** Deploy custom Go Pod server + managed Pods |
| V1.5+ | Pod-primary reads | **FR-088:** Pod-canonical SkillR profile with event-driven sync |
| V2.0 | Company Pods + BYOP + Federation | **FR-087:** PodProxy federation + BYOP; Company Pods |

### Implementation Phases

**Phase 1 — Custom Solid Pod Server (FR-086):**
Replace CSS with a Go-native Solid server. Implements LDP resource lifecycle, WAC authorization, WebID Profile Documents, PostgreSQL-backed storage. Firebase auth bridge (no DPoP yet). Removes CSS Docker dependency entirely.

**Phase 2 — PodProxy & BYOP (FR-087):**
Add PodProxy transparent forwarding to external Pods. Solid-OIDC for external Pod authentication. Token management via Secret Manager. Pod migration (managed ↔ external). Read caching. Error resilience.

**Phase 3 — Pod-Canonical SkillR Profile (FR-088):**
Make the Pod the source of truth for SkillR skill profiles. Event-driven sync (app → Pod on profile changes). Bidirectional sync (detect external Pod edits). Vocabulary validation. Profile export as portable Turtle/ZIP archive.

**Phase 4 — Federation (future):**
Cross-Pod endorsements. Company Pod provisioning. Federated journey discovery. Solid Notifications for real-time events.

### New Feature Requests
- **FR-086:** Custom Solid Pod Server (Go) — Core Solid Protocol implementation
- **FR-087:** PodProxy Federation Layer — Proxy for external Pods, BYOP, federation
- **FR-088:** SkillR Profile Pod Storage — Pod-canonical skill profile with automatic sync

### Architecture Reference
See [TC-032: Custom Solid Pod Server & PodProxy Federation](TC-032-custom-solid-pod-server.md) for the complete architecture, component design, database schema, and implementation details.
