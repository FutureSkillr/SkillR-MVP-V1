# FR-079: Sponsor Showrooms

**Status:** draft
**Priority:** must
**Gate:** env:dev+plan:enterprise
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY | SkillR

## Problem

maindset.ACADEMY monetarisiert ueber B2B-Sichtbarkeit: Unternehmen sponsern Skills und erhalten Sichtbarkeit durch echte Bildungsexpertise (BC-007 Bildungssponsoring). Die bestehende Codebasis hat keine Multi-Tenant-, Branding- oder Sponsor-Unterstuetzung — sie ist Single-Tenant mit zwei Rollen (`user`, `admin`). Ohne eine konkrete Plattform, auf der Unternehmen ihre Expertise praesentieren koennen, bleibt das Bildungssponsoring-Modell ein Konzept ohne Umsetzungskanal.

## Loesung

**Sponsor Showrooms**: Gebrandete Micro-Sites unter `{slug}.maindset.academy`, auf denen Unternehmen zeigen, warum bestimmte Faehigkeiten wichtig sind, diese als Inspiration praesentieren und mit Lernreisen verknuepfen.

### Oeffentliche Showroom-Seiten

1. **Showroom-Landing** (`{sponsor}.maindset.academy/`): Hero-Bereich mit Sponsor-Branding, scrollbare Skill-Karten, Skill Sets, Lernreisen-Vorschau, "Ueber uns"-Bereich
2. **Skill-Detailseite** (`/skills/{skill-slug}`): "Warum ist das wichtig?" (Praxiskontext), "Was kannst du damit machen?" (Berufsfelder, Taetigkeiten), Verwandte Skills, Einstieg in Lernreise
3. **Skill-Set-Detailseite** (`/skillsets/{set-slug}`): Gruppierte Skills mit verbindender Erzaehlung, Link zur zugehoerigen Lernreise

### Sponsor-Dashboard

7-Tab-Dashboard fuer authentifizierte Sponsor-Admins:
- **Uebersicht**: Status, Tier, URL, Zaehler
- **Skills**: CRUD fuer einzelne Skills (Name, Beschreibung, VUCA-Dimension, Praxiskontext)
- **Skill Sets**: CRUD, Skill-Mitglieder verwalten, Erzaehlungs-Editor
- **Lernreisen**: Reise-Editor (siehe FR-080)
- **Showroom**: Branding-Konfiguration (Logo, Farben, Tagline, Hero-Bild)
- **Analytics**: Aggregierter Traffic, Skill-Engagement, Conversion-Funnel (siehe FR-081)
- **Vertrag**: Plan-Details, Upgrade, Zahlungsmethode, Rechnungen (siehe FR-082)

### Sponsor-Onboarding (7-Schritte-Flow)

1. Entdeckung (Landing oder Direktlink)
2. Konto-Erstellung (Firmenname, Ansprechpartner, E-Mail, Branche, Groesse)
3. Subdomain-Auswahl (`{slug}.maindset.academy`, unveraenderlich)
4. Showroom-Konfiguration (Branding → Firmenprofil → Erster Skill)
5. Tier-Auswahl (Basic/Professional/Enterprise)
6. Vertrag & Zahlung (30-Tage-Testphase, optionale sofortige Zahlung)
7. Live-Schaltung (URL, QR-Code, naechste Schritte)

### Subdomain-Architektur

- Wildcard-CNAME: `*.maindset.academy → Cloud Run Service`
- Frontend: `TenantProvider`-Komponente liest Hostname, laedt Sponsor-Konfiguration
- Backend: `TenantResolver`-Middleware extrahiert Slug aus Host-Header
- Unbekannte Subdomains: "Showroom nicht gefunden" mit Redirect zu `maindset.academy`

### Theming

Sponsoren konfigurieren: Logo (SVG/PNG, max 200px), Hero-Bild (max 5MB, 16:9), Primaerfarbe (WCAG AA auf `#0f172a`), Akzentfarbe, Tagline (max 60 Zeichen). CSS Custom Properties (`--sponsor-primary`, `--sponsor-accent`) werden zur Laufzeit injiziert.

### LLM-Kontext-Integration

Wenn ein Schueler ueber einen Showroom eine Reise startet, erhaelt der AI-Dialog `sponsor_context` als Grounding-Daten. Die VUCA-Bingo-Matrix bleibt unbeeinflusst — Sponsor-Kontext bereichert, schraenkt aber nicht ein.

### Referral-Tracking

`referred_by_sponsor` auf der User-Registrierung speichert die Herkunft. Showroom-Besuche werden als aggregierte Tageszaehler erfasst, nie als individuelle Nutzerdaten.

## Akzeptanzkriterien

- [ ] `{slug}.maindset.academy` rendert den gebrandeten Showroom des Sponsors
- [ ] Unbekannte Subdomains zeigen "Showroom nicht gefunden"-Seite
- [ ] Sponsor kann sich in unter 15 Minuten selbst onboarden (Konto → Showroom → erster Skill)
- [ ] Skills werden mit Praxiskontext angezeigt ("Warum wichtig" + "Was kann man damit machen")
- [ ] Skill Sets zeigen gruppierte Skills mit verbindender Erzaehlung
- [ ] "Reise starten" fuehrt in den Standard-Intro-Flow mit Sponsor-Kontext
- [ ] "Supported by {Sponsor}" ist auf allen gesponserten Inhalten sichtbar
- [ ] SkillR-Header und -Footer bleiben auf allen Showroom-Seiten praesent
- [ ] Schueler, der ueber Showroom einsteigt, erhaelt Sponsor-Kontext im AI-Dialog
- [ ] VUCA-Bingo-Matrix bleibt unbeeinflusst durch Sponsor-Kontext
- [ ] Sponsor-Branding (Logo, Farben, Tagline) ist im Dashboard konfigurierbar
- [ ] Skill-CRUD funktioniert im Sponsor-Dashboard (erstellen, bearbeiten, veroeffentlichen, sortieren)
- [ ] Skill-Set-CRUD funktioniert (erstellen, Skills hinzufuegen/entfernen, Erzaehlung bearbeiten)
- [ ] Tier-Limits werden durchgesetzt (Skill-/Set-/Reise-Zaehler)
- [ ] Alle sponsor-seitigen Texte sind auf Deutsch

## Abhaengigkeiten

### Harte Abhaengigkeiten (muessen vor MVP5 existieren)

- FR-027 (Rollenbasierte App-Ansichten — `sponsor_admin`-Rolle)
- FR-033 (DSGVO-Compliance — Einwilligungsmanagement fuer Sponsor-Daten)
- FR-034 (UI-Theme-System — CSS-Variablen, dynamisches Theming)
- FR-059 (Security Headers & CORS — per-Origin-Validierung fuer Subdomains)
- FR-067 (Legal Placeholder Admin — konfigurierbare Impressum/Datenschutz-Seiten pro Sponsor)

### Weiche Abhaengigkeiten (existieren bereits)

- FR-005 (Gemini Dialogue Engine — LLM-Grounding fuer Sponsor-Kontext)
- FR-050 (Clickstream Analytics — Referral-Tracking)
- FR-044 (Role Management — `sponsor_admin`-Rolle hinzufuegen)
- FR-051 (API Gateway — Showroom-oeffentliche API)
- FR-060 (Rate Limiting — pro Sponsor)

### Neue begleitende Features

- FR-080 (Lernreise-Editor — gestufter Zugang Professional/Enterprise)
- FR-081 (Sponsor Analytics Dashboard — aggregierte Metriken)
- FR-082 (Stripe Subscription Management — Trial, Tier-Enforcement)

## Absorbierte V2.0-Features

| FR | Ursprungsphase | Wie absorbiert |
|----|---------------|----------------|
| FR-022 | V2.0 | Wird zum Showroom-Firmenprofil + "Ueber uns"-Bereich |
| FR-028 | V2.0 | Wird zum Skill-Showcase mit LLM-Grounding-Kontext |
| FR-029 | V2.0 | Wird zum 7-Schritte-Sponsor-Self-Service-Onboarding |

## Implementierungsphasen

### MVP5.1: Grundlagen (2–3 Wochen)
- Datenbank-Migrationen: `sponsors`, `sponsor_skills`, `sponsor_skill_sets`, Enums
- Backend: Sponsor-CRUD, Skill-CRUD, Showroom-oeffentliche API
- Backend: `TenantResolver`-Middleware
- Frontend: `TenantProvider`, Subdomain-Aufloesung
- Frontend: Showroom-Landing, Skill-Detail, Skill-Set-Seite
- DNS: Wildcard-CNAME

### MVP5.2: Dashboard & Onboarding (2–3 Wochen)
- 7-Schritte-Onboarding-Wizard
- 7-Tab-Sponsor-Dashboard
- Theme-System
- Skill- und Skill-Set-CRUD-UI

### MVP5.3: Reisen & Zahlung (2–3 Wochen)
- Lernreise-Editor (FR-080)
- Stripe-Integration (FR-082)
- Trial-Logik und Tier-Enforcement

### MVP5.4: Integration & Feinschliff (1–2 Wochen)
- LLM-Kontext-Injektion
- Referral-Tracking
- Analytics (FR-081)
- Admin-Erweiterungen
- QR-Code-Generierung

## Notizen

- MVP5 sitzt bewusst nach V1.0 (benoetigt Rollen, DSGVO, Theming) und vor V2.0 (baut Sponsor-Infrastruktur, die V2.0 fuer Kammer-Features nutzt)
- Technische Architektur in TC-030 definiert
- Geschaeftsmodell in BC-011 beschrieben
