# TC-020: Bot Fleet Identity & Purpose-Bound Pod Access

**Status:** draft
**Created:** 2026-02-19
**Entity:** maindfull.LEARNING + SkillR

## Context

The current architecture (TC-018 + TC-019) uses a **single platform service account** to access all user Pods. All four agents (Entdecker, Reflexions, Skill, Match) share the same client credentials and the same WebACL grant (`<https://maindset.academy/app#id>`). This creates three problems:

1. **No agent isolation** — Any agent can read/write any container in any user's Pod. The Entdecker-Agent could read portfolio endorsements it has no business accessing. The Match-Agent could write to journal containers.
2. **No machine-readable purpose** — There is no verifiable declaration of what an agent does with data. The platform claims "the Skill-Agent only computes profiles," but nothing in the architecture enforces or verifies this.
3. **No learning pipeline consent** — The architecture has no framework for collecting, anonymizing, or using interaction data for model improvement. Fine-tuning, embedding generation, and recommendation training are undocumented.
4. **No user control** — Users cannot choose which agents access their data. All agents are all-or-nothing.

**Goal:** Give each bot its own identity (WebID), limit what it can access (purpose-scoped ACLs), enable a full learning pipeline with consent, and let users control optional agents via tiered consent.

---

## Decision

**Each platform agent gets its own WebID, separate client credentials, and purpose-scoped Pod access. A tiered consent model separates core agents (required for product function) from optional agents (explicit per-agent consent). A three-level learning pipeline (inference, aggregated training, fine-tuning) operates within consent boundaries. All agent data access is logged to an immutable audit trail.**

---

## 1. Bot Identity Model — Agent WebIDs

Each agent gets its own WebID hosted on the platform at `https://maindset.academy/agents/{agent-id}/profile/card#me`. This is a lightweight WebID profile document (not a full Pod) that declares the agent's identity, purpose, and capabilities.

### Agent WebID Profiles

**Entdecker-Agent:**

```turtle
@prefix foaf:  <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
@prefix dpv:   <https://w3id.org/dpv#> .
@prefix fs:    <https://vocab.maindset.academy/ns/> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<#me>
    a fs:PlatformAgent, dpv:DataProcessor ;
    foaf:name "Entdecker-Agent" ;
    fs:agentId "entdecker-agent" ;
    fs:role "Exploration guidance, Gegensatzsuche, and journey navigation" ;
    fs:consentTier "core" ;
    fs:operatedBy <https://maindset.academy/org/card#me> ;
    fs:purpose [
        a fs:AgentPurpose ;
        dpv:hasPurpose dpv:ServiceProvision ;
        fs:readsContainer "profile/state", "journey/", "journal/interactions/" ;
        fs:writesContainer "profile/state", "journal/interactions/", "profile/engagement" ;
        fs:dataUsage "inference" ;
        fs:dataRetention "P0D" ;
        dcterms:description "Guides exploration dialogue, manages journey state, records interactions"
    ] .
```

**Reflexions-Agent:**

```turtle
@prefix foaf:  <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
@prefix dpv:   <https://w3id.org/dpv#> .
@prefix fs:    <https://vocab.maindset.academy/ns/> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<#me>
    a fs:PlatformAgent, dpv:DataProcessor ;
    foaf:name "Reflexions-Agent" ;
    fs:agentId "reflexions-agent" ;
    fs:role "Level 2 reflection coaching, capability scoring, self-awareness probes" ;
    fs:consentTier "core" ;
    fs:operatedBy <https://maindset.academy/org/card#me> ;
    fs:purpose [
        a fs:AgentPurpose ;
        dpv:hasPurpose dpv:ServiceProvision ;
        fs:readsContainer "journal/sessions/", "journal/interactions/", "profile/" ;
        fs:writesContainer "journal/reflections/" ;
        fs:dataUsage "inference" ;
        fs:dataRetention "P0D" ;
        dcterms:description "Reads session and interaction history, triggers reflection coaching, writes reflection results"
    ] .
```

**Skill-Agent:**

```turtle
@prefix foaf:  <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
@prefix dpv:   <https://w3id.org/dpv#> .
@prefix fs:    <https://vocab.maindset.academy/ns/> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<#me>
    a fs:PlatformAgent, dpv:DataProcessor ;
    foaf:name "Skill-Agent" ;
    fs:agentId "skill-agent" ;
    fs:role "Profile computation from evidence, reflections, and endorsements" ;
    fs:consentTier "core" ;
    fs:operatedBy <https://maindset.academy/org/card#me> ;
    fs:purpose [
        a fs:AgentPurpose ;
        dpv:hasPurpose dpv:ServicePersonalisation ;
        fs:readsContainer "journal/", "portfolio/" ;
        fs:writesContainer "profile/skill-profile" ;
        fs:dataUsage "inference", "aggregated-training" ;
        fs:dataRetention "P0D" ;
        dcterms:description "Aggregates evidence to compute skill profile"
    ] .
```

**Match-Agent:**

```turtle
@prefix foaf:  <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
@prefix dpv:   <https://w3id.org/dpv#> .
@prefix fs:    <https://vocab.maindset.academy/ns/> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<#me>
    a fs:PlatformAgent, dpv:DataProcessor ;
    foaf:name "Match-Agent" ;
    fs:agentId "match-agent" ;
    fs:role "Job and opportunity matching based on skill profile" ;
    fs:consentTier "optional" ;
    fs:operatedBy <https://maindset.academy/org/card#me> ;
    fs:purpose [
        a fs:AgentPurpose ;
        dpv:hasPurpose dpv:ServicePersonalisation ;
        fs:readsContainer "profile/skill-profile" ;
        fs:writesContainer "" ;
        fs:dataUsage "inference", "aggregated-training" ;
        fs:dataRetention "P0D" ;
        dcterms:description "Reads skill profile to compute job matches (writes to PostgreSQL only, not Pod)"
    ] .
```

### Agent WebID Registry

All agent WebID documents are hosted under `https://maindset.academy/agents/` as static RDF documents served by the Go backend (not CSS). The registry at `https://maindset.academy/agents/` lists all agents.

```turtle
@prefix fs:    <https://vocab.maindset.academy/ns/> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<>
    a fs:AgentRegistry ;
    dcterms:title "Future SkillR Agent Registry" ;
    fs:agent <entdecker-agent/profile/card#me> ;
    fs:agent <reflexions-agent/profile/card#me> ;
    fs:agent <skill-agent/profile/card#me> ;
    fs:agent <match-agent/profile/card#me> .
```

### Relationship to AgentConfig

The Firebase `agents/{agentId}` document (TC-018) gains new fields:

```
Collection: agents/{agentId}

New Fields:
  webid: string              # URI of the agent's WebID
                             # e.g., "https://maindset.academy/agents/skill-agent/profile/card#me"
  clientId: string           # CSS client credentials ID for this agent
                             # e.g., "skill-agent-client"
  consentTier: string        # "core" | "optional"
  podAccessScope:
    reads: string[]          # Pod container paths the agent reads
                             # e.g., ["journal/", "portfolio/"]
    writes: string[]         # Pod container paths the agent writes
                             # e.g., ["profile/skill-profile"]
```

These fields are read-only for admin users (set during agent registration) and are used by the Go backend to:
1. Select the correct client credentials when authenticating to the CSS
2. Validate that an agent's actual Pod access matches its declared scope
3. Determine consent requirements before executing an agent

---

## 2. Per-Agent Authentication — Separate Client Credentials

Each agent is registered as a separate client on the CSS instance. The Go backend manages a credential store mapping agent IDs to client credentials.

### Credential Management

- **Storage:** GCP Secret Manager: `projects/PROJECT/secrets/agent-{id}-client-secret`
- **Rotation:** 90-day schedule via Cloud Scheduler
- **Loading:** Go backend loads credentials at startup, caches in memory with TTL (15 minutes)
- **Fallback:** If Secret Manager is unreachable, cached credentials are used until TTL expires

**Secrets layout:**

```
projects/future-skillr/secrets/
  agent-entdecker-agent-client-id/versions/latest
  agent-entdecker-agent-client-secret/versions/latest
  agent-reflexions-agent-client-id/versions/latest
  agent-reflexions-agent-client-secret/versions/latest
  agent-skill-agent-client-id/versions/latest
  agent-skill-agent-client-secret/versions/latest
  agent-match-agent-client-id/versions/latest
  agent-match-agent-client-secret/versions/latest
```

### Token Flow

```
Go Backend                         CSS (Pod Server)
    |                                   |
    |-- Which agent is executing?       |
    |   (from AgentConfig.clientId)     |
    |                                   |
    |-- POST /token                     |
    |   client_id: skill-agent-client   |
    |   client_secret: <from Secret Mgr>|
    |   DPoP proof (bound to agent key) |
    |                                   |
    |<-- DPoP-bound access token        |
    |    (scoped to skill-agent WebID)  |
    |                                   |
    |-- GET /{user}/portfolio/evidence/ |
    |   Authorization: DPoP <token>     |
    |   DPoP: <proof>                   |
    |                                   |
    |<-- 200 OK (if ACL allows)         |
    |    403 Forbidden (if not)         |
```

### Key Design Principle

The CSS validates that the DPoP token identifies the agent's WebID, and the Pod's WebACL grants that specific WebID access. A Skill-Agent token **cannot** access containers only granted to Entdecker-Agent. Even if the Go backend code has a bug that routes a request through the wrong agent's token, the CSS will reject the request at the ACL level.

### Credential Rotation Flow

```
1. Cloud Scheduler triggers rotation job (every 90 days)
2. Go backend generates new client credentials for one agent
3. Go backend registers new credentials with CSS
4. Go backend stores new credentials in Secret Manager
5. Go backend invalidates cached credentials for that agent
6. Old credentials remain valid for 24h grace period
7. After grace period, old credentials are revoked on CSS
```

---

## 3. Purpose-Scoped WebACL — Per-Agent Access Matrix

Each user Pod gets per-agent ACL rules provisioned at Pod creation time (core agents) or at consent grant time (optional agents).

### Access Matrix

| Agent | Consent Tier | Reads | Writes | Learning |
|-------|-------------|-------|--------|----------|
| **Entdecker** | Core | `profile/state`, `journey/`, `journal/interactions/` | `profile/state`, `journal/interactions/`, `profile/engagement` | Inference only |
| **Reflexions** | Core | `journal/sessions/`, `journal/interactions/`, `profile/` | `journal/reflections/` | Inference only |
| **Skill** | Core | `journal/`, `portfolio/`, `profile/interests` | `profile/skill-profile` | Inference + aggregated training |
| **Match** | Optional | `profile/skill-profile` (read-only) | — (writes to PostgreSQL only) | Inference + aggregated training |

### WebACL for Core Agents (provisioned at Pod creation)

```turtle
@prefix acl: <http://www.w3.org/ns/auth/acl#> .

# ── Entdecker-Agent ──────────────────────────────────────────

# Entdecker-Agent: read/write journey + state + engagement
<#entdecker-journey>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/entdecker-agent/profile/card#me> ;
    acl:accessTo <./profile/state>, <./journey/>, <./profile/engagement> ;
    acl:default <./journey/> ;
    acl:mode acl:Read, acl:Write .

# Entdecker-Agent: read/write interactions
<#entdecker-interactions>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/entdecker-agent/profile/card#me> ;
    acl:accessTo <./journal/interactions/> ;
    acl:default <./journal/interactions/> ;
    acl:mode acl:Read, acl:Write .

# ── Reflexions-Agent ─────────────────────────────────────────

# Reflexions-Agent: read sessions + interactions + profile
<#reflexions-read>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/reflexions-agent/profile/card#me> ;
    acl:accessTo <./journal/sessions/>, <./journal/interactions/>, <./profile/> ;
    acl:default <./journal/sessions/>, <./journal/interactions/> ;
    acl:mode acl:Read .

# Reflexions-Agent: write reflections
<#reflexions-write>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/reflexions-agent/profile/card#me> ;
    acl:accessTo <./journal/reflections/> ;
    acl:default <./journal/reflections/> ;
    acl:mode acl:Read, acl:Write .

# ── Skill-Agent ──────────────────────────────────────────────

# Skill-Agent: read all evidence sources
<#skill-read-evidence>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/skill-agent/profile/card#me> ;
    acl:accessTo <./journal/>, <./portfolio/>, <./profile/interests> ;
    acl:default <./journal/>, <./portfolio/> ;
    acl:mode acl:Read .

# Skill-Agent: write computed skill profile
<#skill-write-profile>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/skill-agent/profile/card#me> ;
    acl:accessTo <./profile/skill-profile> ;
    acl:mode acl:Read, acl:Write .
```

### WebACL for Optional Agents (provisioned on consent grant)

Match-Agent ACL is **only** added to the Pod when the user explicitly grants consent:

```turtle
@prefix acl: <http://www.w3.org/ns/auth/acl#> .

# Match-Agent: read skill-profile only (provisioned on consent grant)
<#match-read-profile>
    a acl:Authorization ;
    acl:agent <https://maindset.academy/agents/match-agent/profile/card#me> ;
    acl:accessTo <./profile/skill-profile> ;
    acl:mode acl:Read .
```

### ACL Lifecycle

1. **Pod creation:** Core agent ACLs are provisioned as part of the Pod init flow (TC-019 step 7)
2. **Consent grant:** Optional agent ACLs are added via `PATCH` to the Pod's `.acl` resource
3. **Consent revoke:** Optional agent ACLs are removed via `PATCH` to the Pod's `.acl` resource
4. **Enforcement:** ACL changes are immediate — the CSS enforces them on the next request
5. **Validation:** The Go backend validates that the declared `podAccessScope` in AgentConfig matches the provisioned ACLs

### ACL Provisioning Implementation

```
Pod Init (TC-019 step 7, extended):

1. Create container structure (profile/, journal/, portfolio/, legal/, settings/)
2. Set owner ACL on all containers (user WebID: full control)
3. Set core agent ACLs:
   a. For each agent where consentTier == "core":
      - Read AgentConfig.podAccessScope from Firebase
      - Generate ACL entries granting agent WebID access to declared containers
      - PATCH .acl on each container
4. Do NOT set optional agent ACLs (Match-Agent)
5. Store ACL version hash in PostgreSQL users table for reconciliation
```

---

## 4. Purpose Declaration Vocabulary

Extend the `fs:` namespace (`https://vocab.maindset.academy/ns/`) with agent-specific terms. Use W3C Data Privacy Vocabulary (DPV) for purpose categories.

### New RDF Classes

| Class | URI | Description |
|-------|-----|-------------|
| `fs:PlatformAgent` | `fs:PlatformAgent` | An AI agent operated by the platform |
| `fs:AgentPurpose` | `fs:AgentPurpose` | Declared purpose of an agent's data access |
| `fs:AgentConsent` | `fs:AgentConsent` | User consent record for agent access |
| `fs:AgentRegistry` | `fs:AgentRegistry` | Registry listing all platform agents |

### New RDF Properties

| Property | Domain | Range | Description |
|----------|--------|-------|-------------|
| `fs:agentId` | `fs:PlatformAgent` | `xsd:string` | Agent identifier (matches Firebase agentId) |
| `fs:consentTier` | `fs:PlatformAgent` | `xsd:string` | "core" or "optional" |
| `fs:operatedBy` | `fs:PlatformAgent` | `foaf:Organization` | Organization operating the agent |
| `fs:purpose` | `fs:PlatformAgent` | `fs:AgentPurpose` | The agent's declared purpose |
| `fs:readsContainer` | `fs:AgentPurpose` | `xsd:string` | Pod container paths the agent reads |
| `fs:writesContainer` | `fs:AgentPurpose` | `xsd:string` | Pod container paths the agent writes |
| `fs:dataUsage` | `fs:AgentPurpose` | `xsd:string` | "inference", "aggregated-training", "fine-tuning" |
| `fs:dataRetention` | `fs:AgentPurpose` | `xsd:duration` | ISO 8601 duration (P0D = no retention) |
| `fs:agent` | `fs:AgentConsent` | `fs:PlatformAgent` | The agent this consent applies to |
| `fs:consentGrantedAt` | `fs:AgentConsent` | `xsd:dateTime` | When consent was given |
| `fs:consentWithdrawnAt` | `fs:AgentConsent` | `xsd:dateTime` | When consent was withdrawn |
| `fs:consentScope` | `fs:AgentConsent` | `fs:AgentPurpose` | What the consent covers |
| `fs:consentVersion` | `fs:AgentConsent` | `xsd:string` | Version of the consent text accepted |

### Integration with DPV

The W3C Data Privacy Vocabulary (DPV) provides standardized purpose categories:

| DPV Purpose | Used By | Meaning |
|-------------|---------|---------|
| `dpv:ServiceProvision` | Entdecker, Reflexions | Core service delivery |
| `dpv:ServicePersonalisation` | Skill, Match | Personalizing the service based on user data |
| `dpv:DataProcessor` | All agents | Agent acts as data processor under DSGVO |

---

## 5. Learning Pipeline & Data Minimization

Three levels of data usage, each with different consent requirements and data handling rules.

### Level 1: Inference (No Data Retained)

| Aspect | Detail |
|--------|--------|
| **Description** | Agent reads Pod data, computes result, returns output. No data retained outside the execution context. |
| **Consent** | Core tier (blanket consent at signup) |
| **Data flow** | Pod → Agent → Result → Pod (same user) |
| **Retention** | P0D — zero retention. Raw data exists only in memory during execution. |
| **Audit** | Execution logged in `agent_executions` (Tier C) with output summary, not raw data. |

**Example:** Skill-Agent reads `journal/` and `portfolio/` from user Pod, computes skill profile via VertexAI, writes `profile/skill-profile` back to the same user's Pod. No raw data leaves the execution context.

### Level 2: Aggregated Training (Anonymized)

| Aspect | Detail |
|--------|--------|
| **Description** | Anonymized, aggregated data used to improve recommendation models and platform analytics. |
| **Consent** | Core tier (blanket consent, disclosed in Datenschutzerklaerung) |
| **Data flow** | Pod → Anonymizer → Aggregate Store → Training Pipeline |
| **Retention** | Indefinite (anonymized data is no longer personal data under DSGVO) |
| **Audit** | Anonymization event logged in Tier C. |

**Anonymization pipeline:**

```
1. Agent execution completes (e.g., Skill-Agent computes profile)
2. If data usage includes "aggregated-training":
   a. Extract anonymized features from the computation
   b. Strip: user ID, WebID, names, locations, free-text fields
   c. Round timestamps to nearest week
   d. Keep: skill dimension scores, journey patterns, interaction
      modality counts, engagement metric aggregates
3. Store anonymized features in Tier C analytics (append-only)
4. Training pipeline reads from Tier C only — never from Pods
5. k-anonymity guarantee: features only stored if at least 50
   users share the same feature combination
```

### Level 3: Fine-Tuning (Pseudonymized, Opt-In)

| Aspect | Detail |
|--------|--------|
| **Description** | Pseudonymized interaction data used to fine-tune prompt quality via VertexAI. |
| **Consent** | Optional (explicit opt-in, 16+ only per FR-033) |
| **Data flow** | Pod → Pseudonymizer → Training Dataset → VertexAI Fine-tuning |
| **Retention** | P90D — 90 days after fine-tuning run, then purged |
| **Audit** | Pseudonymization event, training run, and purge all logged in Tier C. |

**Fine-tuning pipeline:**

```
1. User opts in via consent dashboard (FR-053)
2. Pseudonymization:
   a. Replace user ID with random token (not reversible without lookup table)
   b. Strip names, emails, and identifying free-text
   c. Retain: interaction structure, prompt/response pairs, skill signals
3. Store pseudonymized transcripts in dedicated Cloud Storage bucket
   (encrypted at rest, access-controlled via IAM)
4. VertexAI fine-tuning job reads from Cloud Storage bucket
5. After fine-tuning run completes:
   a. Log training run metadata to Tier C
   b. Start 90-day retention countdown
   c. After 90 days: purge source transcripts from Cloud Storage
6. User revocation:
   a. User opts out via consent dashboard
   b. Mark their data for exclusion from next training batch
   c. Purge their pseudonymized data from Cloud Storage within 72 hours
   d. Note: data already used in a completed training run cannot be
      "unlearned" from the model — this is disclosed in the consent text
```

### Data Minimization Guarantees

1. **Agents NEVER store raw Pod data** outside the execution context
2. **Agent execution logs** (`agent_executions`) store summaries, not raw data
3. **Training datasets** are pseudonymized and time-bounded (90 days)
4. **Aggregate models** cannot be reverse-engineered to identify individuals (k-anonymity >= 50)
5. **No cross-user data sharing** — agents only access one user's Pod per execution
6. **Purpose limitation** — each agent's data usage is declared in its WebID and enforced by ACLs

---

## 6. Tiered Consent Model

Builds on FR-033 (Datenschutz for Minors) consent framework.

### Core Tier (Blanket Consent at Signup)

**Agents:** Entdecker-Agent, Reflexions-Agent, Skill-Agent

These agents are essential for the product to function. The VUCA journey requires exploration (Entdecker), reflection (Reflexions), and profile computation (Skill).

- Consent is part of the general Datenschutzerklaerung accepted at signup
- Under-16: parental consent covers core agents (FR-033 parental consent flow)
- **Cannot be individually revoked** without deactivating the account
- Data usage: inference + aggregated training (anonymized)

### Optional Tier (Explicit Per-Agent Consent)

**Agents:** Match-Agent, future agents (company-specific, recommendation)

These agents provide additional features that are not required for the core product.

- Requires explicit consent from the user (16+ only, per FR-033 age gate)
- Under-16: optional agents are **not available** (aligns with FR-033 matching rule: "Matching consent is available only from age 16")
- Revocable at any time with immediate effect
- Each optional agent consent is a separate action (not bundled)

**Learning pipeline participation:**

- Fine-tuning opt-in is a separate consent toggle within the optional tier
- Available only for users 16+ (same as optional agents)
- Revocable at any time (data purged within 72 hours)

### Consent Record Format (Stored in User Pod)

```turtle
@prefix fs:    <https://vocab.maindset.academy/ns/> .
@prefix dpv:   <https://w3id.org/dpv#> .
@prefix xsd:   <http://www.w3.org/2001/XMLSchema#> .

# ── Consent for Match-Agent ──────────────────────────────────
<#consent-match-agent>
    a fs:AgentConsent ;
    fs:agent <https://maindset.academy/agents/match-agent/profile/card#me> ;
    fs:consentScope [
        fs:readsContainer "profile/skill-profile" ;
        fs:dataUsage "inference", "aggregated-training" ;
        dpv:hasPurpose dpv:ServicePersonalisation
    ] ;
    fs:consentGrantedAt "2026-02-19T10:00:00Z"^^xsd:dateTime ;
    fs:consentVersion "1.0" ;
    dpv:hasDataSubject <../../profile/card#me> .

# ── Consent for Fine-Tuning Pipeline ────────────────────────
<#consent-fine-tuning>
    a fs:AgentConsent ;
    fs:agent <https://maindset.academy/org/card#me> ;
    fs:consentScope [
        fs:dataUsage "fine-tuning" ;
        fs:dataRetention "P90D" ;
        dpv:hasPurpose dpv:ServiceOptimisation
    ] ;
    fs:consentGrantedAt "2026-02-19T10:05:00Z"^^xsd:dateTime ;
    fs:consentVersion "1.0" ;
    dpv:hasDataSubject <../../profile/card#me> .
```

### Consent Withdrawal Record

When a user revokes consent, the original consent record is updated (not deleted):

```turtle
<#consent-match-agent>
    a fs:AgentConsent ;
    fs:agent <https://maindset.academy/agents/match-agent/profile/card#me> ;
    fs:consentScope [
        fs:readsContainer "profile/skill-profile" ;
        fs:dataUsage "inference", "aggregated-training" ;
        dpv:hasPurpose dpv:ServicePersonalisation
    ] ;
    fs:consentGrantedAt "2026-02-19T10:00:00Z"^^xsd:dateTime ;
    fs:consentWithdrawnAt "2026-02-20T14:30:00Z"^^xsd:dateTime ;
    fs:consentVersion "1.0" ;
    dpv:hasDataSubject <../../profile/card#me> .
```

### Consent Grant Flow

```
1. User opens consent dashboard (FR-053)
2. User toggles Match-Agent ON
3. Frontend: POST /api/v1/consent/agents/match-agent/grant
4. Go backend:
   a. Verify user is 16+ (from Firebase Auth custom claims age)
   b. Load Match-Agent AgentConfig from Firebase
   c. Generate ACL entries for Match-Agent WebID
   d. PATCH Match-Agent ACL into user's Pod .acl
   e. Write consent record to user's Pod: legal/consent/agent-match-agent
   f. Index consent in PostgreSQL: consent_index table
   g. Return 200 with updated AgentConsentStatus
5. Match-Agent can now access user's Pod on next execution
```

### Consent Withdrawal Flow

```
1. User opens consent dashboard (FR-053)
2. User toggles Match-Agent OFF
3. Frontend: DELETE /api/v1/consent/agents/match-agent/revoke
4. Go backend:
   a. Remove Match-Agent ACL from user's Pod .acl (immediate)
   b. Update consent record in Pod: add fs:consentWithdrawnAt
   c. Update PostgreSQL consent_index: set revoked_at
   d. Return 204
5. Match-Agent's next execution attempt gets 403 Forbidden from Pod
```

---

## 7. Audit Trail

Extend the `agent_executions` table (TC-018) with access tracking fields.

### Schema Extension

```sql
ALTER TABLE agent_executions ADD COLUMN agent_webid TEXT;
ALTER TABLE agent_executions ADD COLUMN containers_accessed TEXT[];
ALTER TABLE agent_executions ADD COLUMN data_purpose TEXT;
ALTER TABLE agent_executions ADD COLUMN consent_ref TEXT;
```

### Field Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `agent_webid` | `TEXT` | Full WebID URI of the executing agent |
| `containers_accessed` | `TEXT[]` | Pod container paths actually accessed during execution |
| `data_purpose` | `TEXT` | Declared purpose from AgentPurpose (e.g., "inference") |
| `consent_ref` | `TEXT` | URI of the consent record that authorized this access |

### Audit Logging Flow

```
Every agent Pod access:

1. Before execution:
   a. Resolve agent WebID from AgentConfig
   b. Verify consent record exists for this agent + user (optional tier)
   c. Record consent_ref URI

2. During execution:
   a. Track which Pod containers are actually accessed (read or write)
   b. Record in-memory access log

3. After execution:
   a. Write agent_executions row with:
      - Standard fields: agent_id, prompt_id, prompt_version, etc.
      - New fields: agent_webid, containers_accessed, data_purpose, consent_ref
   b. Append-only in Tier C — immutable audit trail
   c. If containers_accessed exceeds declared podAccessScope:
      - Log warning to Cloud Logging
      - Alert ops team (this indicates a code bug)
```

### Audit Query Examples

```sql
-- All accesses to a specific user's Pod by any agent
SELECT agent_webid, containers_accessed, data_purpose, created_at
FROM agent_executions
WHERE user_id = $1
ORDER BY created_at DESC;

-- All accesses by Match-Agent across all users
SELECT user_id, containers_accessed, consent_ref, created_at
FROM agent_executions
WHERE agent_webid = 'https://maindset.academy/agents/match-agent/profile/card#me'
ORDER BY created_at DESC;

-- Detect out-of-scope access (should return 0 rows)
SELECT ae.id, ae.agent_webid, ae.containers_accessed
FROM agent_executions ae
JOIN agents_config ac ON ae.agent_id = ac.agent_id
WHERE NOT ae.containers_accessed <@ ac.pod_access_scope_reads || ac.pod_access_scope_writes;
```

---

## Architecture Diagram

```
+─────────────────────────────────────────────────────────────+
│                    Go Backend (Cloud Run)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Agent Orchestrator (TC-018)                           │   │
│  │                                                       │   │
│  │  1. Determine active agent                           │   │
│  │  2. Load AgentConfig (Firebase) → get clientId       │   │
│  │  3. Load credentials (Secret Manager)                │   │
│  │  4. Obtain DPoP token for agent WebID                │   │
│  │  5. Execute agent with agent-scoped token            │   │
│  └──────────┬────────────┬────────────┬─────────────────┘   │
│             │            │            │                       │
│     ┌───────▼───┐  ┌────▼────┐  ┌───▼──────┐               │
│     │Entdecker  │  │Reflexions│  │Skill     │  ┌──────────┐ │
│     │Agent      │  │Agent    │  │Agent     │  │Match     │ │
│     │WebID: A   │  │WebID: B │  │WebID: C  │  │Agent     │ │
│     │Token: A   │  │Token: B │  │Token: C  │  │WebID: D  │ │
│     │Core       │  │Core     │  │Core      │  │Optional  │ │
│     └─────┬─────┘  └────┬───┘  └────┬─────┘  │Token: D  │ │
│           │              │           │         │(if consent│ │
│           │              │           │         └─────┬────┘ │
│           ▼              ▼           ▼               ▼       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 CSS (Pod Server)                       │   │
│  │                                                       │   │
│  │  WebACL enforcement per agent WebID:                  │   │
│  │  • Token A → journey/, interactions/, state           │   │
│  │  • Token B → sessions/, interactions/, reflections/   │   │
│  │  • Token C → journal/, portfolio/, skill-profile      │   │
│  │  • Token D → skill-profile (read only, if ACL set)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Audit Trail (Tier C — PostgreSQL)                     │   │
│  │                                                       │   │
│  │  agent_webid | containers_accessed | purpose | consent │   │
│  └──────────────────────────────────────────────────────┘   │
+──────────────────────────────────────────────────────────────+
```

---

## Consequences

### Benefits

- **Least-privilege access** — Each agent can only access the Pod containers it needs. A compromised agent credential cannot access unrelated data.
- **Verifiable purpose** — Agent WebIDs declare what data they access and why. This is machine-readable and auditable.
- **User control** — Users can grant/revoke access to optional agents at any time. Revocation is immediate (ACL-enforced).
- **DSGVO alignment** — Tiered consent with purpose limitation aligns with Art. 5(1)(b) (purpose limitation) and Art. 6 (legal basis).
- **Audit compliance** — Every agent data access is logged with agent identity, containers accessed, purpose, and consent reference.
- **Learning pipeline with guardrails** — Three levels of data usage, each with clear consent requirements and data handling rules.
- **Minor protection** — Optional agents and fine-tuning are unavailable to under-16 users, aligning with FR-033.

### Trade-offs

- **Credential management complexity** — Four sets of client credentials to manage, rotate, and monitor (vs. one platform credential).
- **ACL provisioning overhead** — Each Pod gets multiple ACL entries at creation time. Pod provisioning is ~100ms slower.
- **Secret Manager costs** — Four credential sets × rotation = more Secret Manager API calls. Estimated: <$1/month at current scale.
- **DPoP token overhead** — Each agent execution requires a separate DPoP token. Mitigated by token caching (tokens valid for 5 minutes).

### Risks

- **ACL drift** — If ACLs are not properly provisioned or updated, agents may lose access. Mitigation: reconciliation job runs daily, compares declared scope with actual ACLs.
- **Credential rotation failure** — If rotation fails, the agent loses access after the grace period. Mitigation: alert on rotation failure, manual fallback procedure documented.
- **Consent state inconsistency** — Pod consent record and PostgreSQL index could diverge. Mitigation: Pod is canonical; reconciliation job syncs PostgreSQL from Pod.

---

## Alternatives Considered

### 1. Keep Single Platform Credential

Continue using `<https://maindset.academy/app#id>` for all agents. Simpler but provides no agent isolation, no verifiable purpose, and no per-agent user control. Rejected because it violates the principle of least privilege and makes DSGVO Art. 5(1)(b) compliance harder to demonstrate.

### 2. Per-Agent Pods (Full Pod Per Agent)

Give each agent its own SOLID Pod instead of just a WebID. Rejected because agents don't need storage — they compute and return results. A WebID profile document is sufficient for identity and purpose declaration.

### 3. Application-Level Access Control (Not ACL)

Enforce access control in the Go backend code instead of CSS WebACLs. Rejected because it requires trusting the backend code to correctly restrict access. WebACLs are enforced by the CSS regardless of backend bugs.

### 4. OAuth Scopes Instead of WebACLs

Use OAuth 2.0 scopes to limit agent access. Rejected because SOLID Pods use WebACL for access control, not OAuth scopes. Scopes would require a custom authorization server that maps scopes to container paths — adding complexity with no benefit over native WebACL.

### 5. Third-Party Agent Support

Allow external developers to register agents with their own WebIDs. Deferred — the current plan covers platform agents only. Third-party support requires an app marketplace, vetting process, and more complex consent flows. This can be added in V2.0.

---

## Dependencies

- [TC-018](TC-018-agentic-backend-vertexai.md) — Agentic backend (AgentConfig schema, orchestration, execution flow)
- [TC-019](TC-019-solid-pod-storage-layer.md) — SOLID Pod storage layer (Pod provisioning, WebACL, DPoP)
- [FR-033](../features/FR-033-datenschutz-minors.md) — Datenschutz for Minors (age-gated consent, data categories)
- [FR-053](../features/FR-053-agent-consent-dashboard.md) — Agent Consent Dashboard (user-facing consent UI)
- [FR-024](../features/FR-024-multi-agent-reisebegleiter.md) — Multi-Agent Reisebegleiter (agent personas)

## Notes

- Agent WebID documents are static RDF served by the Go backend at `/agents/{id}/profile/card`. They are not stored in CSS Pods. This keeps agent identity under platform control.
- The `dpv:` namespace (W3C Data Privacy Vocabulary) is used for purpose categories. This enables interoperability with other privacy-aware systems and DSGVO compliance tools.
- The access matrix is intentionally minimal — agents get the fewest containers needed. If a future feature requires an agent to access a new container, the access matrix must be updated here and in the Pod ACL templates.
- Credential rotation uses a 24-hour grace period where both old and new credentials are valid. This avoids disruption during rolling deployments.
- The audit trail is append-only in Tier C (PostgreSQL). It cannot be modified or deleted — this is required for DSGVO compliance audits.
- k-anonymity >= 50 for aggregated training means features are only stored if at least 50 users share the same feature profile. This threshold may need adjustment as the user base grows.
