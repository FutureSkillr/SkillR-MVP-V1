# FR-053: Agent Consent Dashboard

**Status:** draft
**Priority:** must
**Gate:** role:admin
**Created:** 2026-02-19
**Entity:** maindset.ACADEMY | maindfull.LEARNING

## Problem

The platform runs multiple AI agents (Entdecker, Reflexions, Skill, Match) that access user data in SOLID Pods. Users currently have no visibility into which agents access their data, what data each agent reads/writes, or the ability to control optional agent access. TC-020 introduces per-agent identity and tiered consent, but there is no user-facing interface to manage it.

Users need a clear, age-appropriate dashboard to:
- See which agents have access to their data
- Understand what each agent does and why
- Control optional agents (grant/revoke consent)
- Manage learning pipeline participation (fine-tuning opt-in)

## Solution

A consent management dashboard accessible from **Einstellungen → Meine Daten & KI-Agenten** that displays agent access status and provides consent controls.

### Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│ Meine Daten & KI-Agenten                             │
│                                                      │
│ Diese KI-Agenten helfen dir auf deiner Reise.        │
│ Du kannst sehen, was jeder Agent tut und welche      │
│ Daten er verwendet.                                  │
│                                                      │
│ ── Kern-Agenten (erforderlich) ─────────────────── │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🧭 Entdecker-Agent              [Erforderlich]  │ │
│ │ Begleitet dich auf deiner Reise und schlaegt     │ │
│ │ neue Stationen vor.                              │ │
│ │                                                  │ │
│ │ Liest: Reisestatus, Reiseverlauf, Interaktionen  │ │
│ │ Schreibt: Reisestatus, Interaktionen, Engagement │ │
│ │ Datennutzung: Nur fuer deine Reise               │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🪞 Reflexions-Agent              [Erforderlich]  │ │
│ │ Hilft dir, ueber deine Erlebnisse nachzudenken   │ │
│ │ und deine Staerken zu erkennen.                  │ │
│ │                                                  │ │
│ │ Liest: Sitzungen, Interaktionen, Profil          │ │
│ │ Schreibt: Reflexionsergebnisse                   │ │
│ │ Datennutzung: Nur fuer deine Reise               │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 📊 Skill-Agent                   [Erforderlich]  │ │
│ │ Berechnet dein Interessenprofil aus allen         │ │
│ │ gesammelten Erfahrungen.                         │ │
│ │                                                  │ │
│ │ Liest: Tagebuch, Portfolio, Interessen           │ │
│ │ Schreibt: Skill-Profil                           │ │
│ │ Datennutzung: Profil + anonyme Verbesserung      │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ── Optionale Agenten ──────────────────────────── │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🔍 Match-Agent                      [── ○ Aus]  │ │
│ │ Findet passende Ausbildungsplaetze basierend     │ │
│ │ auf deinem Skill-Profil.                         │ │
│ │                                                  │ │
│ │ Liest: Skill-Profil (nur lesen)                  │ │
│ │ Schreibt: Nichts in deinem Pod                   │ │
│ │ Datennutzung: Matching + anonyme Verbesserung    │ │
│ │                                                  │ │
│ │ Hinweis: Der Match-Agent sieht nur dein          │ │
│ │ zusammengefasstes Profil, nicht deine einzelnen  │ │
│ │ Gespraeche oder Antworten.                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ── KI-Training ─────────────────────────────────── │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🧠 KI-Verbesserung                 [── ○ Aus]  │ │
│ │ Deine anonymisierten Interaktionen helfen uns,   │ │
│ │ die KI fuer alle Reisenden zu verbessern.        │ │
│ │                                                  │ │
│ │ Deine Daten werden pseudonymisiert und nach      │ │
│ │ 90 Tagen geloescht. Du kannst jederzeit          │ │
│ │ widerrufen.                                      │ │
│ │                                                  │ │
│ │ [Mehr erfahren]                                  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ── Zugriffsverlauf ─────────────────────────────── │
│                                                      │
│ [Zugriffsverlauf anzeigen →]                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Agent Cards

Each agent is displayed as a card showing:

| Element | Description |
|---------|-------------|
| **Icon** | Visual identifier for the agent |
| **Name** | Agent display name (German) |
| **Status badge** | "Erforderlich" (core) or toggle switch (optional) |
| **Description** | 1-2 sentence plain-German explanation of what the agent does |
| **Reads** | Which data containers the agent reads (German labels, not path names) |
| **Writes** | Which data containers the agent writes |
| **Data usage** | How the data is used (inference only, or training contribution) |
| **Info note** | Optional reassurance text for optional agents |

### Container Path to German Label Mapping

| Pod Path | German Label |
|----------|-------------|
| `profile/state` | Reisestatus |
| `journey/` | Reiseverlauf |
| `journal/interactions/` | Interaktionen |
| `journal/sessions/` | Sitzungen |
| `journal/reflections/` | Reflexionsergebnisse |
| `portfolio/` | Portfolio |
| `portfolio/evidence/` | Nachweise |
| `portfolio/endorsements/` | Empfehlungen |
| `profile/interests` | Interessen |
| `profile/skill-profile` | Skill-Profil |
| `profile/engagement` | Engagement |

### Consent Toggle Behavior

**Granting consent (toggle ON):**
1. Show confirmation dialog: "Moechtest du dem [Agent-Name] Zugriff auf dein [Daten] erlauben?"
2. On confirm: `POST /api/v1/consent/agents/{agentId}/grant`
3. Toggle animates to ON state
4. Success toast: "[Agent-Name] hat jetzt Zugriff"

**Revoking consent (toggle OFF):**
1. Show confirmation dialog: "Moechtest du dem [Agent-Name] den Zugriff entziehen? Dies wirkt sofort."
2. On confirm: `DELETE /api/v1/consent/agents/{agentId}/revoke`
3. Toggle animates to OFF state
4. Success toast: "Zugriff fuer [Agent-Name] wurde entzogen"

**Error handling:**
- If the API call fails, toggle reverts to previous state
- Error toast: "Fehler beim Aendern der Einstellung. Bitte versuche es erneut."

### Under-16 View

Users under 16 (as determined by FR-033 age gate) see a simplified dashboard:

- Core agents shown as "Erforderlich" (same as 16+ view)
- Optional agents section is **hidden entirely** (not shown as disabled)
- Fine-tuning opt-in is **hidden entirely**
- Explanatory note: "Deine Eltern haben der Nutzung dieser Agenten zugestimmt."

### Audit Trail View

Accessible via "Zugriffsverlauf anzeigen" link. Shows recent agent access to the user's data:

```
┌──────────────────────────────────────────────────────┐
│ Zugriffsverlauf                                      │
│                                                      │
│ Heute                                                │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 14:30  📊 Skill-Agent                            │ │
│ │        Hat dein Skill-Profil aktualisiert         │ │
│ │        Gelesen: Tagebuch, Portfolio               │ │
│ │        Geschrieben: Skill-Profil                  │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 14:15  🪞 Reflexions-Agent                       │ │
│ │        Hat Reflexionsergebnisse erstellt          │ │
│ │        Gelesen: Sitzungen, Interaktionen          │ │
│ │        Geschrieben: Reflexionsergebnisse          │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 13:45  🧭 Entdecker-Agent                        │ │
│ │        Hat deine Reise begleitet                  │ │
│ │        Gelesen: Reisestatus, Interaktionen        │ │
│ │        Geschrieben: Interaktionen, Engagement     │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Gestern                                              │
│ ...                                                  │
│                                                      │
│ [Aeltere Eintraege laden]                            │
└──────────────────────────────────────────────────────┘
```

The audit trail calls `GET /api/v1/consent/agents/{agentId}/audit` for each agent and merges results chronologically.

### Navigation

- Accessible from: Einstellungen (settings gear icon) → "Meine Daten & KI-Agenten"
- Back navigation returns to settings
- Deep link: `/settings/agents`

## Acceptance Criteria

- [ ] Dashboard shows all 4 agents with correct name, description, and data access info
- [ ] Core agents display "Erforderlich" badge (not toggleable)
- [ ] Optional agents (Match-Agent) display toggle switch
- [ ] Toggle ON triggers consent grant API call and updates Pod ACL
- [ ] Toggle OFF triggers consent revoke API call and removes Pod ACL
- [ ] Consent changes take immediate effect (verified by agent execution test)
- [ ] Under-16 users see only core agents (optional agents and fine-tuning hidden)
- [ ] Fine-tuning opt-in toggle is separate from agent toggles
- [ ] Confirmation dialog shown before granting or revoking consent
- [ ] Error states handled gracefully (toast notification, toggle revert)
- [ ] Audit trail shows recent agent access with timestamp, agent name, and containers
- [ ] All user-facing text is in German
- [ ] Dashboard is accessible from Einstellungen → "Meine Daten & KI-Agenten"
- [ ] Data container paths are translated to German labels (not raw paths)

## Dependencies

- [TC-020](../arch/TC-020-bot-fleet-identity.md) — Bot Fleet Identity (agent WebIDs, tiered consent, ACL model)
- [TC-019](../arch/TC-019-solid-pod-storage-layer.md) — SOLID Pod Storage Layer (Pod ACL management)
- [TC-018](../arch/TC-018-agentic-backend-vertexai.md) — Agentic Backend (AgentConfig schema)
- [FR-033](FR-033-datenschutz-minors.md) — Datenschutz for Minors (age gate, under-16 rules)
- [FR-024](FR-024-multi-agent-reisebegleiter.md) — Multi-Agent Reisebegleiter (agent personas)

## Notes

- The dashboard uses the same design language as the rest of the settings UI (FR-006 settings pattern)
- Agent icons and colors should match the agent personas defined in DC-006
- The "Mehr erfahren" link on the fine-tuning card opens a modal with the detailed explanation from the Datenschutzerklaerung (teen version)
- Audit trail pagination loads 20 entries at a time to avoid slow initial render
- The consent API endpoints are defined in the OpenAPI spec (portfolio-api.yml) under the `consent` tag
