# FR-080: Lernreise-Editor (Gestufter Zugang)

**Status:** draft
**Priority:** must
**Gate:** env:dev+plan:pro
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY | maindfull.LEARNING

## Problem

Sponsoren sollen Lernreisen erstellen koennen, die ihre Skills mit dem VUCA-Journey-System verknuepfen. Jedoch brauchen verschiedene Tiers unterschiedliche Bearbeitungsmoeglichkeiten: Professional-Sponsoren sollen schnell mit Vorlagen starten koennen, Enterprise-Sponsoren brauchen volle kreative Kontrolle. Der bestehende Meta-Kurs-Editor (FR-045) bietet die Grundlage, muss aber fuer Sponsor-Nutzung erweitert werden.

## Loesung

Ein gestufter Lernreise-Editor mit drei Zugangsstufen:

### Zugangsstufen

| Faehigkeit | Professional | Enterprise | SkillR-Admin |
|-----------|-------------|-----------|--------------|
| Reisen erstellen | Vorlagen-Assistent (max 2) | Voller Editor (unbegrenzt) | Voller Editor (alle Sponsoren) |
| Stationsreihenfolge | Fest (aus Vorlage) | Drag & Drop | Drag & Drop |
| Eigene Prompts | Nein (Vorlagen-Prompts) | Ja | Ja |
| Eigene Skills verknuepfen | Ja | Ja | Ja |
| Skills anderer Sponsoren | Nein | Nein | Ja |
| Vorlagen erstellen | Nein | Nein | Ja |
| Cross-Sponsor-Reisen | Nein | Nein | Ja |
| Veroeffentlichen/Zurueckziehen | Nur eigene | Nur eigene | Alle |

### Professional: Vorlagen-Assistent

Professional-Sponsoren waehlen aus SkillR-kuratierten Vorlagen und fuellen eigene Inhalte ein:

```
+------------------------------------------------------+
| Lernreise erstellen — Vorlage waehlen                |
|                                                      |
| +----------------+  +----------------+               |
| | "Berufswelt    |  | "Technologie   |               |
| |  entdecken"    |  |  verstehen"    |               |
| |  4 Stationen   |  |  6 Stationen   |               |
| |  ~30 Min       |  |  ~45 Min       |               |
| |  [Waehlen]     |  |  [Waehlen]     |               |
| +----------------+  +----------------+               |
|                                                      |
| Nach der Auswahl:                                    |
| -> Station 1: Titel + eigenen Kontext einfuegen      |
| -> Station 2: Skills aus eigenem Katalog verknuepfen |
| -> ...                                               |
| -> [Vorschau] -> [Veroeffentlichen]                  |
+------------------------------------------------------+
```

### Enterprise: Voller Editor

Enterprise-Sponsoren erhalten den vollstaendigen Drag-and-Drop-Editor:

```
+----------------------------------------------------------+
| Lernreise: "Entdecke die Welt der Fertigung"             |
| Status: Entwurf | 6 Stationen | ~45 Min                 |
| [Bearbeiten] [Vorschau] [Veroeffentlichen]               |
|----------------------------------------------------------|
| STATIONEN (Drag & Drop zum Sortieren):                   |
| = 1. Die Fabrik der Zukunft                              |
|     Skills: [3D-Modellierung] [Prozesssteuerung]         |
|     VUCA: [Complexity]  [Bearbeiten] [Entfernen]         |
| = 2. Rohstoffe und Lieferketten                          |
|     Skills: [Logistik] [Datenanalyse]                    |
|     VUCA: [Volatility]  [Bearbeiten] [Entfernen]        |
| [+ Station hinzufuegen]                                  |
+----------------------------------------------------------+
```

### Stations-Bearbeitung (Modal)

- **Titel**: Stationsname
- **Setting**: Beschreibung der Umgebung/Situation
- **Charakter**: Wer spricht? (fuer AI-Dialog)
- **Skill-Auswahl**: Checkboxen der eigenen Skills
- **VUCA-Dimension**: Dropdown (Volatility/Uncertainty/Complexity/Ambiguity)
- **Prompt-Kontext** (nur Enterprise): Freies Textfeld fuer benutzerdefinierte AI-Prompts

### Wie Reisen auf Skills verweisen

Station → Skill-Verknuepfung liefert Praxiskontext an das LLM. Wenn ein Schueler eine gesponserte Station betritt, erhaelt die AI `sponsor_context` als Grounding-Daten neben dem Standard-VUCA-Prompt. Die VUCA-Bingo-Matrix wird nie modifiziert — Sponsor-Kontext bereichert, schraenkt aber nicht ein.

## Akzeptanzkriterien

- [ ] Professional-Sponsor kann eine Reise aus Vorlage erstellen
- [ ] Professional-Sponsor ist auf maximal 2 Reisen begrenzt
- [ ] Professional-Reise hat feste Stationsreihenfolge aus Vorlage
- [ ] Professional kann eigenen Kontext pro Station einfuegen
- [ ] Professional kann eigene Skills mit Stationen verknuepfen
- [ ] Enterprise-Sponsor kann Reise mit vollem Editor erstellen
- [ ] Enterprise hat unbegrenzte Reisen
- [ ] Enterprise kann Stationen per Drag & Drop sortieren
- [ ] Enterprise kann benutzerdefinierte AI-Prompts pro Station schreiben
- [ ] SkillR-Admin kann Vorlagen erstellen und verwalten
- [ ] SkillR-Admin kann alle Sponsor-Reisen sehen und bearbeiten
- [ ] Vorschau-Modus zeigt Reise aus Schueler-Perspektive
- [ ] Veroeffentlichen/Zurueckziehen-Toggle pro Reise
- [ ] Skills aus eigenem Katalog sind als Checkboxen verfuegbar
- [ ] Jede Station hat VUCA-Dimension-Dropdown
- [ ] Reise erscheint auf Showroom-Landing nach Veroeffentlichung
- [ ] Tier-Limits werden serverseitig durchgesetzt

## Abhaengigkeiten

- FR-045 (Meta-Kurs-Editor — bestehende Editor-Patterns als Grundlage)
- FR-079 (Sponsor Showrooms — Sponsor-Kontext, Skill-Katalog)
- FR-082 (Stripe Subscriptions — Tier-Enforcement fuer Professional vs. Enterprise)
- TC-030 (Multi-Tenant Showrooms — Datenmodell fuer `sponsor_journeys`)

## Notizen

- Baut auf bestehenden Meta-Kurs-Editor-Patterns (FR-045) auf
- Vorlagen werden initial von SkillR-Team erstellt, koennen spaeter durch Community-Vorlagen erweitert werden
- Zeitziel: Professional-Sponsor erstellt erste Reise in unter 30 Minuten
