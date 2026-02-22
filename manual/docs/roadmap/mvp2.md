---
title: "MVP2: Das bin ich"
description: MVP2 — Der Jugendliche sieht sein Profil und sagt "Das bin ich." 10 Feature Requests abgeschlossen.
---

# MVP2 — "Das bin ich"

<span class="status-badge status-badge--done">Abgeschlossen</span>

> **Ziel:** Der Jugendliche schliesst die Reise ab, sieht sein Profil und sagt: "Das bin ich." Drei Reisetypen, 3D-Globus, Engagement-Hooks, Mikro-Sessions und Audio-Modus machen die Erfahrung persoenlich und fesselnd.

---

## Ueberblick

MVP2 verwandelt den funktionalen Prototyp aus MVP1 in ein Erlebnis, das Jugendliche begeistert. Der 3D-Globus macht die Reise visuell greifbar, Streaks und XP motivieren zur Rueckkehr, und der Audio-Modus ermoeglicht Nutzung unterwegs.

| Kennzahl | Wert |
|----------|------|
| Feature Requests | 10 |
| Status | <span class="status-badge status-badge--done">Abgeschlossen</span> |
| Zeitraum | Februar 2026 |
| Schwerpunkt | 3D-Globus, Engagement, Mikro-Sessions, Reflexion, Audio |

---

## Feature Requests

| FR | Titel | Prioritaet | Status |
|----|-------|------------|--------|
| FR-031 | 3D World Globe Interface | must | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-038 | Duolingo-Style Engagement (Streaks, XP, Leagues) | must | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-026 | Micro-Session UX (5-Minuten-Modus) | should | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-045 | Meta Kurs Editor (Prompt & Journey Manager) | must | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-020 | Level 2 Reflection Engine | should | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-014 | Interest Profile Tracking | must | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-032 | Transit Audio Mode (Reise-Podcast) | should | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-024 | AI Multi-Agent Reisebegleiter | should | <span class="status-badge status-badge--planned">Verschoben auf V1.0</span> |
| FR-019 | Multimodal Storage Layer | must | <span class="status-badge status-badge--planned">Verschoben auf V1.0</span> |
| FR-034 | UI Theme System | should | <span class="status-badge status-badge--planned">Verschoben auf V1.0</span> |

---

## Neue Features im Detail

### 3D World Globe Interface (FR-031)

Die Reise nach VUCA wird auf einem interaktiven 3D-Globus dargestellt. Technologie: **react-globe.gl** mit automatischem 2D-Fallback (TC-015) fuer Geraete mit geringer GPU-Leistung. Orte auf dem Globus repraesentieren VUCA-Stationen, die der Jugendliche besuchen kann.

### Duolingo-Style Engagement (FR-038)

Gamification-Elemente nach dem Vorbild von Duolingo:

- **Streaks** — Taegliche Anmeldestreifen motivieren zur Regelmaessigkeit
- **XP (Erfahrungspunkte)** — Jede Aktivitaet bringt Punkte
- **5 Stufen** — Sichtbarer Fortschritt durch aufsteigende Level
- **EngagementBar** — Visuelle Darstellung des aktuellen Status

### Micro-Session UX (FR-026)

Der 5-Minuten-Modus ist fuer mobile Nutzung optimiert:

- Quick-Start-Panel fuer schnellen Einstieg
- Session-Timer zeigt verbleibende Zeit
- Automatisches Speichern bei Zeitablauf
- Perfekt fuer Pausen, Schulweg oder Wartezeiten

### Meta Kurs Editor (FR-045)

Administratoren koennen ohne Code:

- Dimensionen bearbeiten
- Stationen erstellen, aendern und loeschen (CRUD)
- Eigene Journey-Definitionen abspielen
- Prompts und Reiseverlaeufe anpassen

### Level 2 Reflection Engine (FR-020)

Nach Abschluss einer Station loest die KI einen Reflexionsdialog aus. Dieser "Level 2"-Modus geht tiefer als der explorative Dialog:

- Verstaendnis-Pruefung: "Was hat dich ueberrascht?"
- Capability Scoring: KI bewertet Soft Skills basierend auf Reflexionsqualitaet
- Ergebnisse fliessen ins Skill-Profil ein

### Transit Audio Mode (FR-032)

Audio-Modus fuer unterwegs — die "Reise-Podcast"-Erfahrung:

- Audio-Overlay ueber der App
- Text-to-Speech-Narration der KI-Antworten
- 2-Button-Tap-UI fuer einfache Bedienung waehrend der Fahrt
- Browser-Fallback (Web Speech API) bei fehlender TTS-Verfuegbarkeit

---

## Architektur-Entscheidungen

| TC | Titel | Inhalt |
|----|-------|--------|
| TC-014 | Engagement System | Streaks, XP, 5 Level, EngagementBar |
| TC-015 | 3D Globe Fallback | react-globe.gl mit 2D-Fallback fuer schwache Geraete |

---

## Exit-Kriterien

- [x] 3D-Globus ist die primaere Navigation fuer die Reise
- [x] Alle 3 Reisetypen (VUCA, Entrepreneur, Self-Learning) sind spielbar
- [x] Hinzugefuegte Reisen koennen ebenfalls gespielt werden (VucaStation-Fallback)
- [x] Streaks und XP sind sichtbar; Nutzer spuert den Anreiz zur Rueckkehr
- [x] 5-Minuten-Mikro-Sessions funktionieren auf Mobilgeraeten
- [x] Admin kann Prompts und Reise-Definitionen ohne Code bearbeiten
- [x] Audio-Modus funktioniert waehrend der Fahrt

!!! success "MVP2 abgeschlossen"
    7 von 10 FRs vollstaendig umgesetzt. 3 FRs (Multi-Agent, Multimodal Storage, UI Theme System) wurden bewusst auf V1.0 verschoben — sie erfordern das Go-Backend, das in V1.0 priorisiert wird.

!!! note "Hinweis zu FR-014"
    Interest Profile Tracking wurde als Frontend-Service mit Firestore-Persistence implementiert, nicht als Go-Backend-Service. Der Go-Backend-Endpunkt folgt in V1.0.
