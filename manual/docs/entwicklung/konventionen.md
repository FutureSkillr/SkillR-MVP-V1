# Konventionen

Entwicklungskonventionen, Arbeitsregeln und Teamstruktur fuer das Future-Skiller-Projekt. Diese Regeln sind in `CLAUDE.md` definiert und gelten fuer alle Beitragenden -- menschliche Entwickler und KI-Agenten gleichermassen.

---

## Dokumenten-Namensgebung

Alle verfolgten Dokumente verwenden ein einheitliches Praefix-Schema mit dreistelligen, nullgefuellten Nummern:

| Typ | Praefix | Verzeichnis | Beispiel |
|-----|---------|-------------|---------|
| **User Stories** | `US-NNN` | `docs/user-story/` | `US-001-interest-profile-discovery.md` |
| **Feature Requests** | `FR-NNN` | `docs/features/` | `FR-005-gemini-dialogue-engine.md` |
| **Technische Architektur** | `TC-NNN` | `docs/arch/` | `TC-016-secure-api-gateway.md` |
| **Didaktische Konzepte** | `DC-NNN` | `concepts/didactical/` | `DC-001-vuca-bingo-matrix.md` |
| **Geschaeftskonzepte** | `BC-NNN` | `concepts/business/` | `BC-007-bildungssponsoring.md` |

### Namensregeln

- Dateiname: `PREFIX-NNN-kurzbeschreibung.md` (Kleinbuchstaben, Bindestriche)
- Nummern: Sequentiell, nicht wiederverwendet
- Jedes Dokument beginnt mit `# PREFIX-NNN: Titel`
- Jedes Dokument enthaelt die Felder `Status`, `Priority` (bei FR), `Created`

---

## Code-Konventionen

### Go (Backend)

- Testdateien liegen neben dem Quellcode: `foo.go` hat `foo_test.go`
- Integration Tests in separaten Dateien: `foo_integration_test.go`
- Build-Tags fuer Integration Tests: `//go:build integration`
- Package-Struktur: `backend/internal/` fuer interne Packages
- Fehlerbehandlung: Explizit, kein `panic` in Produktionscode
- Formatierung: `gofmt` / `goimports`
- Linting: `golangci-lint run ./...`

### TypeScript (Frontend)

- Testdateien neben dem Quellcode: `foo.ts` hat `foo.test.ts`
- Integration Tests: `foo.integration.test.ts`
- Komponenten in `frontend/components/`
- Services in `frontend/services/`
- Hooks in `frontend/hooks/`
- Typen in `frontend/types/`
- Formatierung: Prettier

### Allgemein

- Code und Dokumentation in **Englisch**
- User-facing Text in **Deutsch** (Zielgruppe: deutschsprachige Jugendliche)
- Keine Umlaute in Dateinamen (verwende ae, oe, ue)
- Kein `console.log` in Produktionscode
- Keine Secrets in committiertem Code

---

## Git-Workflow

### Branching

- Ein Branch pro Feature oder Bugfix
- Branch-Name: `feature/FR-NNN-kurzbeschreibung` oder `fix/beschreibung`
- Basis: `main`-Branch

### Commits

- Kleine, fokussierte Commits -- jeder Commit adressiert ein Anliegen
- Commit-Message: Beschreibend, im Imperativ ("Add ...", "Fix ...", "Update ...")
- Keine unzugehoerigen Aenderungen in einem Commit mischen

### Pull Requests

- PR-Beschreibung verlinkt den zugehoerigen FR oder TC
- Review durch mindestens ein Teammitglied (oder Agent)
- Tests muessen gruen sein vor dem Merge

---

## Agent-Team

Das Projekt nutzt ein virtuelles Agent-Team. Jeder Agent hat eine definierte Rolle und Verantwortlichkeit:

### Architect Agent

- **Scope:** `docs/arch/`, Systemdesign, API-Spezifikationen
- **Verantwortung:** Technische Architektur definieren und pflegen. Alle TC-Dokumente reviewen. Konsistenz zwischen API-Specs und Implementierung sicherstellen.

### Backend Agent

- **Scope:** `backend/`, Go-Code, Firebase-Integration
- **Verantwortung:** Go-Services implementieren, Firebase-Datenschicht, Authentifizierung, Gemini-API-Integration. Unit- und Integrationstests fuer alle Backend-Funktionen schreiben.

### Frontend Agent

- **Scope:** `frontend/`, TypeScript-Code, UI
- **Verantwortung:** Web-App implementieren, VUCA-Journey UI, Profil-Visualisierung, Sprach-/Text-Interaktion. Unit- und Integrationstests fuer alle Frontend-Funktionen schreiben.

### Concept Agent

- **Scope:** `concepts/`, `docs/features/`
- **Verantwortung:** Didaktische Konzepte, Geschaeftskonzepte und Feature Requests entwerfen und verfeinern. Sicherstellen, dass Konzepte vollstaendig, validiert und auf Features rueckverfolgbar sind.

### QA Agent

- **Scope:** Alle Testdateien, CI/CD
- **Verantwortung:** Testabdeckung fuer alle Funktionen und Konzepte sicherstellen. Tests ausfuehren, Fehler melden, Akzeptanzkriterien aus Feature Requests verifizieren.

---

## Arbeitsregeln

Die folgenden 10 Regeln gelten fuer alle Beitragenden:

### 1. Lesen vor Schreiben

Bestehende Dateien immer zuerst lesen, bevor sie geaendert werden. Kontext verstehen, dann handeln.

### 2. Namenskonventionen einhalten

Das NNN-Praefix-Schema fuer alle verfolgten Dokumente verwenden. Keine Ad-hoc-Benennungen.

### 3. Alles testen

Keine Funktion ohne Unit Test. Kein Konzept ohne Integration Test. Details unter [Tests](tests.md).

### 4. Im Scope bleiben

Der MVP schliesst folgendes **aus**:

- Berufsempfehlungen
- Zertifizierung
- Kursplattformen
- Avatare (erst V1.0)
- Industrie-Matching (erst V2.0)
- Zahlungssysteme (erst MVP5)

### 5. Sprache des Nutzers sprechen

Das Produkt richtet sich an deutschsprachige Jugendliche. Code und Docs sind Englisch; nutzersichtbarer Text ist Deutsch.

### 6. Oft committen, klein committen

Jeder Commit adressiert genau ein Anliegen. Keine Mega-Commits.

### 7. Entscheidungen dokumentieren

Jede technische Entscheidung bekommt ein TC-Dokument. Jedes neue Feature bekommt ein FR-Dokument.

### 8. Firebase nur fuer persoenliche Daten

Nutzer-bezogene Daten liegen in Firebase. Nicht-persoenliche Daten (Inhalte, Konfiguration) koennen anderswo liegen (PostgreSQL, Umgebungsvariablen).

### 9. Keine Secrets im Code

API-Keys, Credentials und Tokens duerfen niemals in committiertem Code erscheinen. Immer Umgebungsvariablen oder Secret Manager verwenden.

### 10. Das Wort "Zertifikat" vermeiden

In allen nutzersichtbaren Texten wird das Wort "Zertifikat" bewusst vermieden. Dies ist eine Produktentscheidung -- Future SkillR erstellt persoenliche Skill-Profile, keine Zertifikate.

---

## Rueckverfolgbarkeitskette

Jedes Artefakt muss in der folgenden Kette rueckverfolgbar sein:

```
User Story (US)
  └── Konzept (DC / BC)
        └── Technisches Konzept (TC)
              └── Feature Request (FR)
                    └── Implementierung (Code)
                          └── Test
```

| Artefakt | Beschreibt |
|----------|-----------|
| **User Story** (US) | Was der Nutzer will und warum |
| **Konzept** (DC/BC) | Die fachliche Idee |
| **Technisches Konzept** (TC) | Die Architekturentscheidung |
| **Feature Request** (FR) | Was gebaut werden soll |
| **Code** | Die Implementierung des FR |
| **Test** | Die Verifikation der Akzeptanzkriterien |

Jeder FR verlinkt seine Abhaengigkeiten in der `## Dependencies`-Sektion. Jeder TC wird von mindestens einem FR referenziert.

---

## Querverweise pflegen

Beim Erstellen neuer Dokumente:

1. **FR/TC/DC/BC erstellen** mit vollstaendigem Template
2. **Dependencies-Sektion** mit allen verwandten Artefakten fuellen
3. **Subfolder-README** aktualisieren (Index-Tabelle)
4. **Haupt-README.md** aktualisieren, falls sich die Verzeichnisstruktur aendert
5. **Bestehende Dokumente** aktualisieren, die auf das neue Dokument verweisen sollten
