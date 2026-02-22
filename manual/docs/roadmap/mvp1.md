---
title: "MVP1: Es funktioniert"
description: MVP1 — Core-Loop stabil, demo-faehig. 16 Feature Requests abgeschlossen.
---

# MVP1 — "Es funktioniert"

<span class="status-badge status-badge--done">Abgeschlossen</span>

> **Ziel:** Der komplette Kern-Loop funktioniert End-to-End. Ein Nutzer kann sich anmelden, das Onboarding durchlaufen, eine VUCA-Station abschliessen, sein Profil sehen und spaeter zurueckkommen. Demo-faehig fuer IHK-Stakeholder.

---

## Ueberblick

MVP1 legt das Fundament fuer alles Weitere. Die grundlegenden Bausteine — Authentifizierung, Dialog-Engine, Journey-Navigation, Profil-Generierung und Admin-Konsole — werden implementiert und stabilisiert.

| Kennzahl | Wert |
|----------|------|
| Feature Requests | 16 |
| Status | <span class="status-badge status-badge--done">Abgeschlossen</span> |
| Zeitraum | Januar — Februar 2026 |
| Schwerpunkt | Auth, Onboarding, VUCA-Station, Profil, Firebase, Admin, Deployment |

---

## Feature Requests

### Neuimplementiert und stabilisiert

| FR | Titel | Status |
|----|-------|--------|
| FR-001 | Social Login (Google OAuth) | <span class="status-badge status-badge--done">Erledigt</span> (Apple/Meta auf V1.0 verschoben) |
| FR-002 | E-Mail/Passwort-Login | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-003 | Firebase Persistence | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-012 | Session Continuity | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-006 | VUCA Navigation mit Gegensatzsuche | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-039 | Prompt Tracking | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-043 | Admin Panel (5-Tab-Konsole) | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-044 | Role Management | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-046 | User Administration | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-047 | Management Console | <span class="status-badge status-badge--done">Erledigt</span> |

### Bereits implementiert und verifiziert

| FR | Titel | Status |
|----|-------|--------|
| FR-004 | Interest-Based Journey Entry | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-005 | Gemini Dialogue Engine | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-007 | VUCA Bingo Matrix | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-008 | Skill Profile Generation | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-009 | Profile Visualization (Radar Chart) | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-010 | AI Coach Voice | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-011 | Text/Voice Switching | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-013 | Web App Deployment | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-040 | Docker & Cloud Run | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-041 | Project Makefile | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-042 | CI/CD Pipeline | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-048 | Journey Progress Cards | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-049 | Profile + Activity History | <span class="status-badge status-badge--done">Erledigt</span> |
| FR-050 | Clickstream Analytics | <span class="status-badge status-badge--done">Erledigt</span> |

---

## Wichtigste Errungenschaften

### Authentifizierung
Google OAuth und E-Mail/Passwort-Login ueber Firebase Auth. Beide Methoden erzeugen ein Firebase Auth Token, das fuer alle API-Aufrufe verwendet wird. Passwort-Reset-Flow inklusive.

### Onboarding & Dialog
Die Gemini Dialogue Engine (FR-005) fuehrt Jugendliche dialogbasiert durch die Interessenerfassung. Der KI-Coach stellt Fragen, reagiert auf Antworten und empfiehlt eine passende Reise. Gegensatzsuche (kontrastierende Vorschlaege) erweitert den Moeglichkeitsraum.

### VUCA-Station
Eine vollstaendige Station umfasst: Curriculum-Generierung, modulare Inhalte, Quiz, und Auswertung. Die VUCA-Bingo-Matrix trackt den Fortschritt ueber alle vier Dimensionen (Volatility, Uncertainty, Complexity, Ambiguity).

### Profil-Visualisierung
Ein Radar-Chart zeigt Hard Skills, Soft Skills, Future Skills und Resilienz auf einen Blick. Das Profil waechst mit jeder abgeschlossenen Interaktion.

### Firebase Persistence
Alle Nutzerdaten werden in Firestore gespeichert (TC-013). Zustandserhaltung ueber Geraetewechsel hinweg. localStorage dient als Fallback bei Offline-Nutzung.

### Admin-Konsole
Fuenf Tabs: Users, Roles, Prompt Logs, Meta Kurs, Analytics. Admins koennen Nutzer verwalten, Rollen zuweisen, Prompt-Verlaeufe einsehen und exportieren.

### Cloud Run Deployment
Containerisierte Anwendung auf Google Cloud Run. Deployment mit `make deploy`. CI/CD-Pipeline ueber GitHub Actions.

---

## Exit-Kriterien

- [x] Nutzer kann sich anmelden (Google OAuth oder E-Mail)
- [x] Onboarding-Chat erfasst Interessen und empfiehlt eine Reise
- [x] VUCA-Station generiert Curriculum, Nutzer absolviert Module und Quiz
- [x] Profil-Radar-Chart aktualisiert sich nach Stationsabschluss
- [x] Zustand wird in Firebase ueber Sessions hinweg gespeichert
- [x] Admin kann Nutzer und Prompt-Logs einsehen
- [x] Deploybar auf Cloud Run mit `make deploy`

!!! success "Alle Exit-Kriterien erfuellt"
    MVP1 wurde im Februar 2026 abgeschlossen. 23 von 24 FRs vollstaendig erledigt; FR-001 partiell (Google funktioniert, Apple/Meta auf V1.0 verschoben).
