# Feature Requests

82 Feature Requests (FRs) bilden das Rueckgrat der Produktplanung von Future SkillR. Jeder FR ist ein Markdown-Dokument in `docs/features/` und beschreibt ein einzelnes, abgrenzbares Feature mit klaren Akzeptanzkriterien.

---

## Ueberblick

| Eigenschaft | Wert |
|-------------|------|
| **Anzahl FRs** | 82 (FR-001 bis FR-082) |
| **Verzeichnis** | `docs/features/` |
| **Format** | Markdown mit strukturierten Metadaten |
| **Phasen** | MVP1 (16), MVP2 (10), MVP3 (2), MVP4 (3), V1.0 (12), MVP5 (7), V2.0 (7) |

---

## Template

Jeder neue Feature Request folgt diesem Template:

```markdown
# FR-NNN: Titel

**Status:** draft | specified | in-progress | done | rejected
**Priority:** must | should | could | wont
**Gate:** env:all | env:dev | role:admin | ...
**Created:** YYYY-MM-DD

## Problem
Was ist das Problem, das dieses Feature loest?

## Solution
Was bauen wir?

## Acceptance Criteria
- [ ] Kriterium 1
- [ ] Kriterium 2
- [ ] Kriterium 3

## Dependencies
- FR-NNN: Abhaengiges Feature
- TC-NNN: Zugehoerige Architekturentscheidung

## Notes
Zusaetzlicher Kontext, Einschraenkungen, offene Fragen.
```

---

## Status-Flow

Feature Requests durchlaufen einen definierten Lebenszyklus:

```
draft ──> specified ──> in-progress ──> done
                                    └──> rejected
```

| Status | Bedeutung |
|--------|-----------|
| **draft** | Entwurf -- Idee erfasst, Details fehlen noch |
| **specified** | Spezifiziert -- Problem, Loesung und Akzeptanzkriterien definiert |
| **in-progress** | In Bearbeitung -- Implementierung laeuft |
| **done** | Abgeschlossen -- Alle Akzeptanzkriterien erfuellt, Tests vorhanden |
| **rejected** | Abgelehnt -- Nicht im Scope oder durch andere Loesung ersetzt |

---

## Prioritaeten

Das MoSCoW-Schema definiert die Wichtigkeit:

| Prioritaet | Bedeutung |
|-----------|-----------|
| **must** | Muss im aktuellen Release enthalten sein. Ohne dieses Feature ist das Release nicht lieferbar. |
| **should** | Sollte enthalten sein. Wichtig, aber das Release funktioniert auch ohne. |
| **could** | Koennte enthalten sein. Nice-to-have, wenn Zeit und Ressourcen verfuegbar. |
| **wont** | Wird in diesem Release nicht umgesetzt. Bewusst zurueckgestellt. |

---

## Gate-System (TC-024)

Jeder FR hat ein `Gate`-Feld, das die Sichtbarkeit des Features steuert. Das Gate-System basiert auf einer dreilagigen DSL:

### Syntax

```
gate   := clause ( "+" clause )*
clause := layer ":" value
layer  := "env" | "role" | "level" | "progress" | "plan"
```

### Umgebungs-Gates

| Gate | Bedeutung | Sichtbar in |
|------|-----------|------------|
| `env:all` | Ueberall sichtbar | Produktion, Staging, Entwicklung |
| `env:dev` | Nur Entwicklung | Entwicklung, Staging |
| `env:staging` | Staging und Entwicklung | Staging, Entwicklung |

### Rollen- und Fortschritts-Gates

| Gate | Bedeutung |
|------|-----------|
| `role:admin` | Nur fuer Admin-Benutzer sichtbar |
| `level:2` | Erfordert Engagement-Level 2+ |
| `progress:onboarding` | Erfordert abgeschlossenes Onboarding |
| `plan:enterprise` | Erfordert Enterprise-Plan (zukuenftig) |

### Kombinationen

Gates koennen mit `+` kombiniert werden (logisches UND):

```
env:all+role:admin       # Ueberall, aber nur fuer Admins
env:dev+plan:enterprise  # Nur Entwicklung + Enterprise-Plan
env:all+progress:onboarding+level:2  # Alle Umgebungen, nach Onboarding, ab Level 2
```

!!! info "Standard-Gate"
    Features ohne explizites `Gate`-Feld erhalten standardmaessig `env:all` -- sie sind ueberall sichtbar.

---

## Neuen FR erstellen

### Schritt 1: Naechste Nummer ermitteln

```bash
ls docs/features/ | sort | tail -5
# Beispiel-Output:
# FR-080-lernreise-editor.md
# FR-081-sponsor-analytics.md
# FR-082-stripe-subscriptions.md
# => Naechste Nummer: FR-083
```

### Schritt 2: Datei erstellen

```bash
# Dateiname: FR-NNN-kurzbeschreibung.md (Kleinbuchstaben, Bindestriche)
touch docs/features/FR-083-mein-neues-feature.md
```

### Schritt 3: Template ausfuellen

Fuellen Sie alle Pflichtfelder aus:

- **Status:** Beginnt als `draft`
- **Priority:** Nach MoSCoW einordnen
- **Gate:** Sichtbarkeitsregel definieren
- **Problem:** Was ist das Problem?
- **Solution:** Was ist die Loesung?
- **Acceptance Criteria:** Mindestens 3 messbare Kriterien
- **Dependencies:** Verwandte FRs und TCs verlinken

### Schritt 4: Querverweise aktualisieren

- Abhaengige FRs und TCs in der `Dependencies`-Sektion verlinken
- Falls ein neuer TC noetig ist, diesen in `docs/arch/` anlegen
- Roadmap pruefen und Phase zuordnen

---

## Beispiele aus dem Projekt

### Einfaches Feature

```markdown
# FR-052: Docker Compose Local Staging

**Status:** done
**Priority:** must
**Gate:** env:all
**Created:** 2026-02-19

## Problem
Es gibt keinen Weg, den vollstaendigen Produktions-Stack lokal zu testen.

## Solution
Eine docker-compose.yml, die dasselbe Dockerfile wie Cloud Run verwendet.

## Acceptance Criteria
- [x] docker-compose.yml existiert
- [x] make local-stage baut und startet den Container
- [x] App erreichbar unter http://localhost:9090
```

### Feature mit Gate

```markdown
# FR-072: Honeycomb Service Configuration

**Status:** in-progress
**Priority:** must
**Gate:** env:dev
**Created:** 2026-02-21
```

Dieses Feature ist nur in Entwicklungs- und Staging-Umgebungen sichtbar (`env:dev`).

---

## Phasenzuordnung

Features sind Release-Phasen zugeordnet. Die vollstaendige Zuordnung finden Sie in der [Roadmap](../roadmap/index.md).

| Phase | Anzahl FRs | Beispiele |
|-------|-----------|----------|
| **MVP1** | 16 | FR-001 (Auth), FR-005 (Gemini), FR-007 (VUCA Bingo) |
| **MVP2** | 10 | FR-031 (3D Globe), FR-038 (Engagement), FR-020 (Reflection) |
| **MVP3** | 2 | FR-051 (API Gateway), FR-052 (Local Staging) |
| **MVP4** | 3 | FR-076 (Pod Connection), FR-077 (Pod Sync), FR-078 (Pod Viewer) |
| **V1.0** | 12 | FR-033 (DSGVO), FR-018 (Job-Navigator), FR-025 (Eltern-Dashboard) |
| **MVP5** | 7 | FR-079 (Showrooms), FR-082 (Stripe), FR-080 (Lernreise Editor) |
| **V2.0** | 7 | FR-021 (Kammer-Dashboard), FR-023 (Bedarfserfassung) |

---

## Statistiken abfragen

### Alle FRs nach Status zaehlen

```bash
grep -r "^\*\*Status:\*\*" docs/features/ | \
  sed 's/.*\*\*Status:\*\* //' | sort | uniq -c | sort -rn
```

### Alle offenen FRs finden

```bash
grep -rl "Status:\*\* in-progress" docs/features/
grep -rl "Status:\*\* draft" docs/features/
```

### FRs einer bestimmten Phase finden

Filtern Sie nach dem Gate-Wert oder pruefen Sie die Roadmap fuer die Phasenzuordnung.
