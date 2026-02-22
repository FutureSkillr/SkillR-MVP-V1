# Design System

Referenz fuer das visuelle Designsystem von Future SkillR. Dark Theme durchgehend, optimiert fuer Mobile-First.

---

## Farbpalette

### Kernfarben

| Name | Hex-Wert | CSS Variable | Verwendung |
|------|----------|-------------|------------|
| **Background** | `#0f172a` | `--bg` | Haupthintergrund der Anwendung |
| **Surface** | `#1e293b` | `--surface` | Karten, Panels, erhoehte Flaechen |
| **Border** | `#334155` | `--border` | Trennlinien, Rahmen |
| **Primary Blue** | `#4DA3FF` | `--primary` | Primaere Aktionen, Links, aktive Zustaende |
| **Accent Purple** | `#7B61FF` | `--accent` | Sekundaere Aktionen, Hervorhebungen, Badges |
| **Text** | `#e2e8f0` | `--text` | Haupttext |
| **Muted Text** | `#94a3b8` | `--muted` | Sekundaertext, Beschriftungen, Zeitstempel |

### Statusfarben

| Name | Hex-Wert | Verwendung |
|------|----------|------------|
| **Green** | `#4ade80` | Erfolg, abgeschlossen, "done" |
| **Red** | `#f87171` | Fehler, kritisch, "failed" |
| **Yellow** | `#facc15` | Warnung, Aufmerksamkeit |
| **Cyan** | `#38bdf8` | Information, Links, Deployment-URLs |

### CSS-Variablen

```css
:root {
  --bg: #0f172a;
  --surface: #1e293b;
  --border: #334155;
  --primary: #4DA3FF;
  --accent: #7B61FF;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --green: #4ade80;
  --red: #f87171;
  --yellow: #facc15;
  --cyan: #38bdf8;
}
```

---

## Typografie

### Schriftart

**Inter** ist die primaere Schriftart fuer alle UI-Elemente.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Fuer Monospace-Elemente (Code, SHA-Werte, Daten):

```css
font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
```

### Schriftgroessen

| Verwendung | Groesse | Gewicht |
|-----------|---------|---------|
| Ueberschrift H1 | `1.5rem` (24px) | 700 (Bold) |
| Ueberschrift H2 | `0.875rem` (14px) | 600 (Semibold), Uppercase, Letter-Spacing 0.05em |
| Fliesstext | `0.95rem` (15px) | 400 (Regular) |
| Sekundaertext | `0.85rem` (13.6px) | 400 (Regular), Farbe: `--muted` |
| Label / Caption | `0.8rem` (12.8px) | 400 oder 500 |
| Monospace | `0.85rem` (13.6px) | 400 |

---

## Dark Theme

Die gesamte Anwendung verwendet ein dunkles Farbschema. Es gibt keinen Light Mode. Das Design orientiert sich an modernen Developer-Tools und Gaming-Interfaces, passend zur Zielgruppe (14+).

### Hintergrund-Hierarchie

```
#0f172a  ──  Seiten-Hintergrund (dunkelste Ebene)
#1e293b  ──  Surface (Karten, Panels)
#334155  ──  Rahmen, Trennlinien
```

### Glass-Panel-Effekt

Fuer hervorgehobene Panels (z.B. Coach-Karten, Bingo-Matrix):

```css
.glass-panel {
  background: rgba(30, 41, 59, 0.8);  /* --surface mit Transparenz */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.5);  /* --border mit Transparenz */
  border-radius: 0.75rem;
}
```

---

## Status-Badges

Badges fuer den Feature-Status und andere Zustandsanzeigen:

| Status | Hintergrund | Textfarbe | Beispiel |
|--------|------------|-----------|---------|
| **done** | `#064e3b` | `#4ade80` (Green) | Abgeschlossene Features |
| **in-progress** | `#0c4a6e` | `#38bdf8` (Cyan) | Aktive Entwicklung |
| **planned** | `#3b0764` | `#c084fc` (Purple) | Geplante Features |
| **draft** | `#1e293b` | `#94a3b8` (Muted) | Entwuerfe |
| **rejected** | `#450a0a` | `#f87171` (Red) | Abgelehnte Features |

### CSS fuer Badges

```css
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-done { background: #064e3b; color: #4ade80; }
.badge-in-progress { background: #0c4a6e; color: #38bdf8; }
.badge-planned { background: #3b0764; color: #c084fc; }
.badge-draft { background: #1e293b; color: #94a3b8; }
```

---

## Komponenten-Patterns

### Karten (Cards)

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.25rem;
}

.card h2 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 0.75rem;
}
```

### Buttons

```css
/* Primaer */
.btn-primary {
  background: var(--primary);
  color: #0f172a;
  padding: 0.4rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

/* Sekundaer (Ghost) */
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 0.4rem 0.75rem;
  border-radius: 0.375rem;
}
```

### Quick-Links (Action Pills)

```css
.quicklink {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  background: #0c4a6e;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--cyan);
}

.quicklink:hover {
  background: #075985;
}
```

### Key-Value-Paare

Fuer strukturierte Daten (Health Check, Deployment-Reports):

```css
.kv {
  margin-bottom: 0.5rem;
}

.kv .label {
  color: var(--muted);
  font-size: 0.8rem;
}

.kv .value {
  font-size: 0.95rem;
  color: var(--text);
}
```

### Tabellen

```css
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  overflow: hidden;
}

th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  background: var(--bg);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
}

td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}
```

---

## Responsive Design

### Mobile-First

Die Anwendung ist Mobile-First gestaltet. Das Basis-Layout ist fuer Smartphones optimiert (360px+), Erweiterungen fuer groessere Bildschirme folgen ueber Media Queries.

### Breakpoints

| Breakpoint | Breite | Zielgeraete |
|-----------|--------|------------|
| **Base** | 0-639px | Smartphones |
| **sm** | 640px+ | Grosse Smartphones, kleine Tablets |
| **md** | 768px+ | Tablets |
| **lg** | 1024px+ | Laptops, Desktops |

### Grid-System

```css
/* Einspaltig auf Mobile, zweispaltig ab md */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Container

```css
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

---

## Zustandsindikatoren

### Status-Punkte

Fuer Komponentenstatus (Health Check):

| Zustand | Darstellung | Farbe |
|---------|------------|-------|
| OK | Gefuellter Kreis | Green `#4ade80` |
| Degraded | Gefuellter Kreis | Yellow `#facc15` |
| Down / Error | Gefuellter Kreis | Red `#f87171` |
| Not Configured | Leerer Kreis | Muted `#94a3b8` |

---

## Kontrast und Zugaenglichkeit

- Text auf Background: `#e2e8f0` auf `#0f172a` -- Kontrastratio ca. 12:1 (AAA)
- Muted Text auf Surface: `#94a3b8` auf `#1e293b` -- Kontrastratio ca. 4.6:1 (AA)
- Primary Blue auf Background: `#4DA3FF` auf `#0f172a` -- Kontrastratio ca. 7:1 (AAA)
- Alle interaktiven Elemente haben sichtbare Hover-Zustaende
- Fokus-Indikatoren fuer Tastaturnavigation
