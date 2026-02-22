# Datenschutz-Folgenabschaetzung (DPIA) — Future SkillR

**DSGVO Art. 35**
**Stand:** 2026-02-20
**Status:** Entwurf

---

## 1. Beschreibung der Verarbeitung

### 1.1 Zweck
Future SkillR ist eine webbasierte Anwendung, in der Jugendliche (14+) durch gamifizierte KI-Dialoge ihre Interessen entdecken. Das Ergebnis ist ein persoenliches Interessenprofil.

### 1.2 Art der Daten
| Datenkategorie | Beispiele | Sensibilitaet |
|---------------|-----------|---------------|
| Identifikation | E-Mail, Anzeigename | Mittel |
| Authentifizierung | Passwort-Hash, OAuth-Token | Hoch |
| Chat-Inhalte | Freitext-Antworten an KI-Coach | Hoch (moeglicherweise sensibel) |
| Interessen-Profil | Extrahierte Interessen, Staerken, Lernstil | Mittel |
| Nutzungsverhalten | Seitenaufrufe, Klickpfade, Wartezeiten | Niedrig |
| Technische Daten | IP (gehasht), Browser, Viewport | Niedrig |

### 1.3 Betroffene Personen
- Jugendliche ab 14 Jahren (Hauptzielgruppe)
- Erwachsene Nutzer (IHK-Mitarbeiter, Lehrkraefte)

### 1.4 Auftragsverarbeiter
| Anbieter | Dienst | Verarbeitungsort | AVV |
|----------|--------|------------------|-----|
| Google Cloud | Cloud Run, Cloud SQL | EU/US | Standard Contractual Clauses |
| Google AI | Gemini API | US | Google AI Studio ToS |
| Google Firebase | Auth | EU/US | Firebase Data Processing Terms |

---

## 2. Notwendigkeit und Verhaeltnismaessigkeit

### 2.1 Warum ist die Verarbeitung notwendig?
- KI-Coaching erfordert Chat-Inhalte fuer personalisierte Antworten
- Registrierung ermoeglicht Fortschritts-Speicherung ueber Sessions hinweg
- Analytics dient der Produktverbesserung und Missbrauchs-Erkennung

### 2.2 Verhaeltnismaessigkeit
- Keine Erhebung von Klarnamen, Adresse oder Geburtsdatum
- Chat-Inhalte werden nach 90 Tagen geloescht
- Analytics verwendet pseudonymisierte Session-IDs
- IP-Adressen werden gehasht, nicht im Klartext gespeichert
- Kein Profiling, keine automatisierten Einzelentscheidungen

---

## 3. Risikobewertung

### 3.1 Identifizierte Risiken

| # | Risiko | Eintritt | Schwere | Gesamt | Massnahme |
|---|--------|----------|---------|--------|-----------|
| R1 | Unbefugter Zugriff auf Chat-Inhalte | Mittel | Hoch | Hoch | Firebase Auth, JWT, TLS, Zugriffskontrolle |
| R2 | KI generiert unangemessene Inhalte | Niedrig | Hoch | Mittel | Safety-Settings (HarmBlockMediumAndAbove), Content-Review |
| R3 | Datenabfluss durch Drittanbieter-Pixel | Niedrig | Mittel | Niedrig | Cookie-Consent-Banner, Pixel nur nach Einwilligung |
| R4 | Brute-Force auf Login | Mittel | Mittel | Mittel | Rate Limiting, Brute-Force-Schutz (5 Versuche/15 Min) |
| R5 | Jugendliche geben sensible Infos im Chat preis | Mittel | Hoch | Hoch | System-Prompts mit Grenzen, Safety-Filter, 90-Tage-Loeschung |
| R6 | SQL-Injection | Niedrig | Hoch | Mittel | Prepared Statements, Input-Validierung |
| R7 | Prompt-Injection | Mittel | Mittel | Mittel | Server-seitige Prompt-Registry, Input-Sanitization |

### 3.2 Restrisiko
Nach Implementierung aller Massnahmen wird das Restrisiko als **akzeptabel** eingestuft.

---

## 4. Massnahmen (Art. 32 DSGVO)

### 4.1 Technische Massnahmen
- [x] TLS/HTTPS fuer alle Verbindungen
- [x] Passwort-Hashing mit bcrypt
- [x] JWT-basierte Authentifizierung
- [x] Firebase Auth fuer OAuth
- [x] Input-Validierung und Laengenbegrenzung
- [x] Rate Limiting (per User/IP)
- [x] CORS auf explizite Origins beschraenkt
- [x] CSP-Headers (Helmet)
- [x] IP-Anonymisierung in Logs
- [x] KI-Safety-Settings (HarmBlockMediumAndAbove)
- [x] Prompt-Injection-Schutz (Server-seitige Registry, Input-Sanitization)
- [x] Brute-Force-Schutz (Login-Versuche begrenzt)
- [x] CSRF-Schutz (Origin-Validierung)

### 4.2 Organisatorische Massnahmen
- [ ] Regelmaessige Security-Audits (geplant: vierteljaehrlich)
- [ ] Datenschutz-Schulung fuer Entwickler
- [ ] Incident-Response-Plan
- [ ] Regelmaessige Ueberpruefung der Auftragsverarbeiter

### 4.3 Betroffenenrechte
- [x] Auskunft: Profil-Export-Funktion
- [x] Loeschung: Account-Loeschung per API
- [x] Datenportabilitaet: JSON-Export
- [x] Widerruf: Cookie-Einstellungen im Footer

---

## 5. Konsultation der Aufsichtsbehoerde

Eine Konsultation der Aufsichtsbehoerde (Art. 36 DSGVO) ist nicht erforderlich, da:
- Das Restrisiko als akzeptabel eingestuft wird
- Keine besonders sensiblen Datenkategorien (Art. 9) systematisch verarbeitet werden
- Technische und organisatorische Massnahmen angemessen sind

---

## 6. Ueberpruefung

Diese DPIA wird bei wesentlichen Aenderungen der Verarbeitung aktualisiert, mindestens jedoch jaehrlich ueberprueft.

| Datum | Version | Aenderung |
|-------|---------|-----------|
| 2026-02-20 | 1.0 | Erstfassung |
