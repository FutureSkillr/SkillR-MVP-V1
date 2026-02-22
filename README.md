# MVP72 – Future Skiller

**Die Reise nach VUCA.**

Eine KI-gestuetzte Web-App, mit der Jugendliche ab 14 Jahren ihre Interessen entdecken und ein persoenliches Skill-Profil aufbauen -- durch eine dialogbasierte, gamifizierte Weltreise.

**Live-Demo:** https://future-skillr-1041496140898.us-west1.run.app/

---

## Was ist das hier?

Future Skiller ist **keine klassische Lern-App**. Statt fertiger Kurse fuehrt ein KI-Coach (powered by Google Gemini) Jugendliche durch eine interaktive "Reise nach VUCA":

- **Starte wo du bist** -- die Reise beginnt an deinem echten Standort
- **Folge deinen Interessen** -- waehle ein Thema (Holz, Kochen, Geschichte, ...) und entdecke passende Orte weltweit
- **Sammle VUCA-Erfahrungen** -- die Reise ist abgeschlossen, wenn du alle vier Dimensionen erlebt hast: Volatilitaet, Unsicherheit, Komplexitaet, Ambiguitaet
- **Bekomme dein Profil** -- aus deinen Dialogen entsteht automatisch ein Interessenprofil (Hard Skills, Soft Skills, Future Skills, Resilienz)

Das Ziel: Ein Jugendlicher schaut auf sein Profil und sagt *"Stimmt, das bin ich."*

---

## Projektstruktur

```
mvp72/
├── CLAUDE.md              <-- Agent-Instruktionen und Konventionen
├── README.md              <-- Du bist hier
├── Dockerfile             <-- Container-Build
├── Makefile               <-- Build- und Deployment-Befehle
├── docs/
│   ├── user-story/        <-- User Stories (US-001 bis US-006)
│   ├── features/          <-- Feature Requests (FR-001 bis FR-020)
│   ├── arch/              <-- Technische Architektur (TC-001 bis TC-005)
│   └── protocol/          <-- Session-Protokolle (nach Datum geordnet)
│       └── 2026-02-17/    <-- Session-Transkripte und Scope-Dokumente
├── concepts/
│   ├── didactical/        <-- Didaktische Konzepte (DC-001 bis DC-004)
│   └── business/          <-- Business-Konzepte (BC-001 bis BC-002)
├── engineering/           <-- Technische Spezifikationen und IHK-Unterlagen
├── integrations/
│   └── api-spec/          <-- OpenAPI-Spezifikationen
├── frontend/              <-- TypeScript Frontend
├── scripts/               <-- Hilfs- und Deployment-Skripte
└── .claude/               <-- Claude Code Worktrees (Git-Branches)
```

---

## Technik-Stack

| Was              | Womit                                          |
|------------------|------------------------------------------------|
| Frontend         | TypeScript Web-App (kein App-Store noetig)     |
| Backend          | Go (Echo Framework)                            |
| KI / Sprache     | Google Gemini (Content, Voice, Text-to-Speech) |
| Cloud            | Google Cloud Platform                          |
| API-Design       | OpenAPI 3.0 Spezifikationen                    |
| Code-Generierung | OpenAPI Generator v7.12.0 (Docker)             |
| Versionierung    | Git + GitHub                                   |

---

## Fuer neue Teammitglieder: So startest du

### Schritt 1: Projekt herunterladen

Oeffne dein Terminal (Mac: "Terminal"-App, Windows: "Git Bash") und fuehre aus:

```
git clone https://github.com/FutureSkillr/MVP72.git
cd MVP72
```

Das laedt das gesamte Projekt auf deinen Rechner. Du brauchst das nur **einmal** zu machen.

### Schritt 2: Eigenen Arbeitsbereich erstellen

Bevor du Aenderungen machst, erstelle einen eigenen Branch (Arbeitsbereich). So bleiben deine Aenderungen getrennt vom Hauptprojekt, bis sie fertig sind.

```
git checkout -b mein-feature
```

Ersetze `mein-feature` durch einen kurzen, beschreibenden Namen, z.B. `vuca-bingo-logik` oder `profil-diagramm`.

### Schritt 3: Arbeiten und Speichern

Nachdem du Dateien geaendert hast, speichere deinen Fortschritt:

```
# 1. Zeige an, was sich geaendert hat
git status

# 2. Fuege deine Aenderungen hinzu
git add .

# 3. Erstelle einen Speicherpunkt mit Beschreibung
git commit -m "Kurze Beschreibung was du gemacht hast"
```

**Tipp:** Mache oft kleine Commits. "Bingo-Logik fuer V-Dimension hinzugefuegt" ist besser als "Viele Sachen geaendert".

### Schritt 4: Aenderungen hochladen

Lade deinen Branch auf GitHub hoch, damit andere ihn sehen koennen:

```
git push -u origin mein-feature
```

### Schritt 5: Pull Request erstellen

Ein Pull Request (PR) ist dein Vorschlag, deine Aenderungen ins Hauptprojekt zu uebernehmen.

1. Gehe zu https://github.com/FutureSkillr/MVP72
2. GitHub zeigt dir automatisch einen gelben Banner: "mein-feature had recent pushes"
3. Klicke auf "Compare & pull request"
4. Schreibe kurz, was du gemacht hast und warum
5. Klicke auf "Create pull request"

Jemand aus dem Team schaut sich deinen Code an und merged ihn dann.

### Wichtig: Auf dem neuesten Stand bleiben

Bevor du anfaengst zu arbeiten, hole dir immer die neuesten Aenderungen:

```
git checkout main
git pull
git checkout mein-feature
git merge main
```

Falls dabei Konflikte auftreten (Git zeigt dir das an), frag im Team nach -- das ist normal und kein Grund zur Panik.

---

## Code aus den API-Specs generieren

Wenn du die OpenAPI-Spezifikationen aenderst, musst du den Code neu generieren. Du brauchst dafuer **Docker**.

```
cd integrations/api-spec
make all
```

Das erzeugt automatisch:

- Go-Server-Code (Backend)
- TypeScript-Client-Code (Frontend)
- Go-Clients fuer die Services
- HTML-Dokumentation

---

## Wichtige Dokumente

| Dokument | Beschreibung |
|----------|--------------|
| [docs/protocol/2026-02-17/Scope.md](docs/protocol/2026-02-17/Scope.md) | Was der MVP kann, was er nicht kann, und warum |
| [docs/protocol/2026-02-17/Checkliste.md](docs/protocol/2026-02-17/Checkliste.md) | Woran wir messen, ob der MVP erfolgreich ist |
| [docs/user-story/](docs/user-story/) | User Stories -- was Nutzer erreichen wollen |
| [docs/features/](docs/features/) | Feature Requests -- technische Anforderungen (FR-001 bis FR-020) |
| [docs/arch/](docs/arch/) | Technische Architektur -- Systementscheidungen (TC-001 bis TC-005) |
| [concepts/didactical/](concepts/didactical/) | Didaktische Konzepte -- VUCA, Gegensatzsuche, Moeglichkeitsraum, Level 2 |
| [concepts/business/](concepts/business/) | Business-Konzepte -- Life-Long-Learning, Job-Navigator |
| [CLAUDE.md](CLAUDE.md) | Agent-Instruktionen und Projektkonventionen |

---

## Was der MVP bewusst NICHT macht

- Keine Berufsempfehlungen ("werde Foerster")
- Keine fertige Kursplattform
- Keine TUeV-Zertifizierung (kommt spaeter)
- Kein Avatar-System
- Kein Unternehmens-Matching
- Kein Bezahlsystem
- Das Wort "Zertifikat" wird bewusst vermieden

Details: siehe [Scope.md](docs/protocol/2026-02-17/Scope.md)

---

## Git-Spickzettel

| Was du tun willst         | Befehl                                                  |
|---------------------------|---------------------------------------------------------|
| Projekt herunterladen     | `git clone https://github.com/FutureSkillr/MVP72.git` |
| Neuen Branch erstellen    | `git checkout -b name-des-branches`                   |
| Status anzeigen           | `git status`                                          |
| Aenderungen hinzufuegen   | `git add .`                                           |
| Speicherpunkt erstellen   | `git commit -m "Beschreibung"`                        |
| Hochladen                 | `git push -u origin name-des-branches`                |
| Neueste Version holen     | `git pull`                                            |
| Branch wechseln           | `git checkout name-des-branches`                      |
| Alle Branches anzeigen    | `git branch -a`                                       |

---

## Fragen?

Erstelle ein [Issue auf GitHub](https://github.com/FutureSkillr/MVP72/issues) oder sprich das Team direkt an.
