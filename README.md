# SkillR-MVP-V1

**Bist Du ein SkillR? — Die Reise nach VUCA.**

Eine KI-gestuetzte Web-App, mit der Jugendliche ab 14 Jahren ihre Interessen entdecken und ein persoenliches Skill-Profil aufbauen — durch eine dialogbasierte, gamifizierte Weltreise.

---

## Was ist SkillR?

SkillR ist **keine klassische Lern-App**. Statt fertiger Kurse fuehrt ein KI-Coach (powered by Google Gemini) Jugendliche durch eine interaktive "Reise nach VUCA":

- **Starte wo du bist** — die Reise beginnt an deinem echten Standort
- **Folge deinen Interessen** — waehle ein Thema (Holz, Kochen, Geschichte, ...) und entdecke passende Orte weltweit
- **Sammle VUCA-Erfahrungen** — die Reise ist abgeschlossen, wenn du alle vier Dimensionen erlebt hast
- **Bekomme dein Profil** — aus deinen Dialogen entsteht automatisch ein Interessenprofil (Hard Skills, Soft Skills, Future Skills, Resilienz)

Das Ziel: Ein Jugendlicher schaut auf sein Profil und sagt *"Stimmt, das bin ich."*

---

## Entity Context

| Entity | Role |
|--------|------|
| **SkillR** | Kids education brand. This repo. App + backend + SkillR-scoped concepts |
| **maindset.ACADEMY** | Learning education brand. SkillR runs on maindfull.LEARNING by maindset.ACADEMY |
| **maindfull.LEARNING** | AI engine by maindset.ACADEMY. The backend in this repo IS a custom instance |

---

## Projektstruktur

```
SkillR-MVP-V1/
├── CLAUDE.md              <-- Agent-Instruktionen und Konventionen
├── SCOPE-MATRIX.md        <-- Feature-Klassifikation: CORE / SELECT / PLATFORM
├── README.md              <-- Du bist hier
├── Dockerfile             <-- Container-Build
├── Makefile               <-- Build- und Deployment-Befehle
├── docs/
│   ├── ROADMAP.md         <-- SkillR-spezifische Roadmap
│   ├── user-story/        <-- User Stories
│   ├── features/          <-- Feature Requests (FR-NNN)
│   ├── arch/              <-- Technische Architektur (TC-NNN)
│   └── 2026-02-17/        <-- Session-Protokolle
├── concepts/
│   ├── maindset-academy/  <-- Referenzdokumente (MA-001, MA-002, MA-005)
│   ├── didactical/        <-- Didaktische Konzepte (DC-001..DC-016)
│   └── business/          <-- Business-Konzepte (BC-001..BC-010)
├── backend/               <-- Go Backend (maindfull.LEARNING Engine)
├── frontend/              <-- TypeScript Frontend (SkillR App)
├── terraform/             <-- GCP Infrastruktur
├── k6/                    <-- Load- und Szenario-Tests
├── manual/                <-- MkDocs Dokumentationsseite
├── solid/                 <-- Solid Pod Konfiguration
├── scripts/               <-- Deploy-, Setup-, Health-Skripte
└── integrations/          <-- OpenAPI-Spezifikationen
```

---

## Technik-Stack

| Was | Womit |
|-----|-------|
| Frontend | TypeScript Web-App (kein App-Store noetig) |
| Backend | Go (Echo Framework) |
| KI / Sprache | Google Gemini (Content, Voice, Text-to-Speech) |
| Profile | Solid Pod-basierte lebenslange Profile |
| Datenbank | Google Firebase (persoenliche Daten) |
| Auth | Google OAuth + optionaler Email Login |
| Cloud | Google Cloud Platform |
| API-Design | OpenAPI 3.0 Spezifikationen |

---

## Quick Start

### Lokal starten

```bash
make run-local
```

Das installiert die Abhaengigkeiten und startet:
- Vite Dev Server auf http://localhost:3000
- Express API Server auf http://localhost:3001

### Docker (Full Stack)

```bash
docker compose up
```

Startet App + PostgreSQL + Redis + Solid Pod.

### Build

```bash
make build            # Frontend Build
cd backend && go build ./...   # Backend Build
```

---

## Feature-Steuerung

Alle Features sind in **`SCOPE-MATRIX.md`** klassifiziert:

| Tag | Bedeutung |
|-----|-----------|
| `[CORE]` | Muss in SkillR V1.0 ausgeliefert werden |
| `[SELECT]` | Verfuegbar, kann fuer zukuenftige Sprints aktiviert werden |
| `[PLATFORM]` | maindfull.LEARNING Plattform-Feature — nicht in diesem Repo |

---

## Roadmap

Siehe `docs/ROADMAP.md` fuer die SkillR-spezifische Roadmap:

| Phase | Ziel |
|-------|------|
| **V1.0** "Erste Reise" | Produktionsreife SkillR App fuer IHK-Pilot |
| **V1.1** "Mehr entdecken" | Erweiterte Erfahrung — SELECT Features |
| **V2.0** "Partner & Sponsoren" | B2B Sponsor-Integration |

---

## Wichtige Dokumente

| Dokument | Beschreibung |
|----------|--------------|
| [SCOPE-MATRIX.md](SCOPE-MATRIX.md) | Feature-Klassifikation (CORE/SELECT/PLATFORM) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | SkillR Roadmap (V1.0 / V1.1 / V2.0) |
| [CLAUDE.md](CLAUDE.md) | Agent-Instruktionen und Konventionen |
| [docs/features/](docs/features/) | Feature Requests |
| [docs/arch/](docs/arch/) | Technische Architektur |
| [concepts/didactical/](concepts/didactical/) | Didaktische Konzepte |
| [concepts/business/](concepts/business/) | Business-Konzepte |

---

## Was SkillR V1.0 bewusst NICHT macht

- Keine Berufsempfehlungen ("werde Foerster")
- Keine fertige Kursplattform
- Kein Avatar-System
- Kein Unternehmens-Matching
- Kein Bezahlsystem
- Das Wort "Zertifikat" wird bewusst vermieden
