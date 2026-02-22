# FR-066: Cookie-Consent-Banner, Legal Footer und Pflichtseiten (DSGVO/TMG/TTDSG)

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Updated:** 2026-02-20
**Entity:** maindset.ACADEMY
**Gate:** mvp3

## Problem

Die Website hat keine rechtlich vorgeschriebenen Pflichtlinks (Impressum, Datenschutzerklaerung, Cookie-Einstellungen). Der Cookie-Banner erfuellt nicht alle TTDSG-Anforderungen (ungleiche Button-Gestaltung, kein Link zur Datenschutzerklaerung, kein Widerrufsmechanismus). Fuer eine deutsche Website mit Zielgruppe 14+ sind folgende Gesetze relevant:

- **TMG §5** — Impressumspflicht
- **DSGVO Art. 12/13** — Informationspflichten, leicht zugaengliche Datenschutzerklaerung
- **DSGVO Art. 7 Abs. 3** — Widerruf der Einwilligung muss so einfach sein wie die Erteilung
- **DSGVO Art. 8** — Einwilligung Minderjaehriger (14-15: Hinweis auf Elternbestaetigung)
- **TTDSG §25** — Einwilligung fuer nicht-essenzielle Cookies/Tracking
- **JMStV §5** — Jugendschutz bei Telemedien

## Solution

### 1. Legal Footer (auf jeder Seite)

Wiederverwendbare `LegalFooter`-Komponente mit:
- Link zu `/impressum`
- Link zu `/datenschutz`
- Link zu Cookie-Einstellungen (oeffnet Modal)
- Copyright-Hinweis

Eingebaut in:
- `WelcomePage.tsx` (ersetzt minimalen Footer)
- `Layout.tsx` (ersetzt Tagline-Footer)

### 2. Impressum-Seite (`/impressum`)

Pflichtangaben nach TMG §5:
- Vollstaendiger Name / Firmenname
- Anschrift
- Kontakt (E-Mail, ggf. Telefon)
- Vertretungsberechtigte Person
- Registernummer (falls vorhanden)
- USt-IdNr. (falls vorhanden)
- Verantwortlich fuer redaktionelle Inhalte (§55 RStV)
- Hinweis auf EU-Streitschlichtung

### 3. Datenschutzerklaerung-Seite (`/datenschutz`)

Rendert die bestehende `docs/legal/privacy-policy.md` als gestylte HTML-Seite:
- Alle DSGVO Art. 13 Pflichtangaben
- Direkt von jeder Seite erreichbar
- Kontaktdaten des Verantwortlichen (Platzhalter ausgefuellt)

### 4. Cookie-Consent-Banner (verbessert)

Regulatorische Verbesserungen:
- **Gleichwertige Buttons** — Reject und Accept gleich prominent (TTDSG, kein Dark Pattern)
- **Link zur Datenschutzerklaerung** im Banner-Text (DSGVO Art. 13)
- **Cookie-Kategorien** erklaert (technisch notwendig vs. Marketing/Analytics)
- **Hinweis 14-15-Jaehrige** bleibt (DSGVO Art. 8)

### 5. Cookie-Einstellungen-Modal

Widerrufsmechanismus (DSGVO Art. 7 Abs. 3):
- Erreichbar ueber Footer-Link "Cookie-Einstellungen"
- Zeigt aktuellen Consent-Level
- Ermoeglicht Aenderung (Akzeptieren ↔ Nur notwendige)
- Widerruf genauso einfach wie Erteilung

### Neue Dateien
| Datei | Zweck |
|-------|-------|
| `frontend/components/legal/LegalFooter.tsx` | Wiederverwendbarer Footer mit Pflichtlinks |
| `frontend/components/legal/DatenschutzPage.tsx` | DSGVO Datenschutzerklaerung als Seite |
| `frontend/components/legal/ImpressumPage.tsx` | TMG §5 Impressum als Seite |
| `frontend/components/legal/CookieSettingsModal.tsx` | Cookie-Widerruf Modal |

### Modifizierte Dateien
| Datei | Aenderung |
|-------|-----------|
| `frontend/components/CookieConsentBanner.tsx` | Gleichwertige Buttons, Datenschutz-Link, Kategorien |
| `frontend/components/WelcomePage.tsx` | LegalFooter integriert |
| `frontend/components/Layout.tsx` | LegalFooter integriert |
| `frontend/App.tsx` | URL-Routing fuer /datenschutz und /impressum, Cookie-Modal State |

## Acceptance Criteria

### TMG §5 — Impressum
- [x] `/impressum` ist von jeder Seite ueber Footer-Link erreichbar
- [x] Impressum enthaelt: Name/Firma, Anschrift, Kontakt (E-Mail), Vertretungsberechtigten
- [x] Impressum enthaelt Hinweis auf EU-Streitschlichtungsplattform
- [x] Impressum laesst sich mit einem Klick aufrufen (max. 2 Klicks von jeder Seite)

### DSGVO Art. 12/13 — Datenschutzerklaerung
- [x] `/datenschutz` ist von jeder Seite ueber Footer-Link erreichbar
- [x] Datenschutzerklaerung enthaelt alle Art. 13 Pflichtangaben (Verantwortlicher, Zweck, Rechtsgrundlage, Empfaenger, Speicherdauer, Rechte)
- [x] Datenschutzerklaerung ist "in praeziser, transparenter, verstaendlicher und leicht zugaenglicher Form" (Art. 12)
- [x] Jugendgerechte Sprache fuer Zielgruppe 14+

### DSGVO Art. 7 Abs. 3 — Widerruf
- [x] Cookie-Einstellungen sind ueber Footer-Link erreichbar
- [x] Widerruf der Cookie-Einwilligung ist mit einem Klick moeglich
- [x] Widerruf ist genauso einfach wie die Erteilung (gleichwertige UI)
- [x] Nach Widerruf: Marketing-Cookies/Pixel werden deaktiviert
- [x] Widerruf wird server-seitig geloggt (Audit Trail, Art. 7 Abs. 1)

### DSGVO Art. 8 — Minderjaehrige
- [x] Banner zeigt Hinweis fuer 14-15-Jaehrige: Elternbestaetigung empfohlen
- [x] Datenschutzerklaerung erklaert Jugendschutz-Massnahmen (Art. 8, JMStV §5)

### TTDSG §25 — Cookie-Banner
- [x] Banner erscheint beim ersten Besuch, BEVOR Tracking-Cookies gesetzt werden
- [x] Zwei Optionen: "Akzeptieren" und "Nur notwendige" — gleichwertig gestaltet
- [x] Keine vorangekreuzten Checkboxen
- [x] Meta Pixel NUR nach explizitem "Akzeptieren" geladen
- [x] Internes First-Party-Analytics ohne PII funktioniert ohne Consent
- [x] Banner-Text erklaert Zwecke der Cookies (technisch notwendig vs. Marketing)
- [x] Link zur vollstaendigen Datenschutzerklaerung im Banner

### Footer-Links
- [x] Footer ist auf jeder Seite sichtbar (WelcomePage, Layout, Intro-Flow)
- [x] Footer enthaelt: Impressum, Datenschutz, Cookie-Einstellungen
- [x] Footer enthaelt Copyright-Hinweis mit Jahreszahl
- [x] Links sind auch auf mobilen Geraeten gut erreichbar
- [x] Kein Text "Zertifikat" (Projekt-Regel)

### Technisch
- [x] URL-basiertes Routing: /datenschutz und /impressum funktionieren als Direktlinks
- [x] SPA-Fallback: Seiten funktionieren auch bei direktem Aufruf (kein 404)
- [x] Zurueck-Navigation von Legal-Seiten zur vorherigen Ansicht
- [x] Alle bestehenden Tests passen weiterhin
- [x] `npm run build` und `npm run build:server` erfolgreich

## Dependencies

- Blocker fuer FR-064 (Campaign-Attribution / Meta Pixel)
- Nutzt bestehende `frontend/services/consent.ts`
- Nutzt bestehende `docs/legal/privacy-policy.md`

## Notes

- **Platzhalter:** Impressum-Daten (Firmenname, Adresse, Kontakt) als Platzhalter, da das Unternehmen noch in Gruendung ist
- **Datenschutzerklaerung:** Basiert auf dem bestehenden `docs/legal/privacy-policy.md` Text
- **Kein Cookie-Wall:** Der Banner darf die App-Nutzung nicht blockieren (nur transparente Information)
- **Zero Tracking by Default:** Ohne Consent werden keine Third-Party-Cookies gesetzt
- DSGVO-Compliance fuer 14+ Zielgruppe
