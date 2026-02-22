# Datenschutzerklaerung — Future SkillR

**Stand:** 2026-02-20

DSGVO Art. 12/13 — Informationspflichten bei Erhebung personenbezogener Daten

---

## 1. Verantwortliche Stelle

Future SkillR (Projektname)
Kontakt: [Kontaktdaten des Verantwortlichen einfuegen]

## 2. Welche Daten wir erheben

### 2.1 Registrierungsdaten
- E-Mail-Adresse
- Anzeigename
- Authentifizierungsanbieter (Google, E-Mail)

### 2.2 Nutzungsdaten (pseudonymisiert)
- Browser-Session-ID (zufaellig generiert, kein Tracking ueber Sessions hinweg)
- Seitenaufrufe und Klickpfade
- Warteraum-Interaktionen
- Gewaehlter Coach

### 2.3 Gespraeche mit KI-Coaches
- Texteingaben im Chat mit dem KI-Coach
- Extrahierte Interessen und Staerken (automatisch analysiert)
- Lernfortschritte und VUCA-Bingo-Status

### 2.4 Technische Daten
- IP-Adresse (anonymisiert/gehasht in Logs)
- Browser-Typ und Viewport-Groesse
- Zeitstempel der Zugriffe

## 3. Rechtsgrundlage (Art. 6 DSGVO)

| Zweck | Rechtsgrundlage |
|-------|----------------|
| Registrierung und Login | Art. 6 Abs. 1 lit. b (Vertragsdurchfuehrung) |
| KI-Coach-Gespraeche | Art. 6 Abs. 1 lit. b (Vertragsdurchfuehrung) |
| Internes Analytics | Art. 6 Abs. 1 lit. f (berechtigtes Interesse) |
| Meta Pixel / Marketing | Art. 6 Abs. 1 lit. a (Einwilligung) |
| Sicherheit / Rate Limiting | Art. 6 Abs. 1 lit. f (berechtigtes Interesse) |

## 4. Empfaenger der Daten

| Dienst | Zweck | Standort |
|--------|-------|----------|
| Google Cloud Run | Hosting | EU / US |
| Google Gemini API | KI-Coach-Antworten | US |
| Google Firebase | Authentifizierung | EU / US |
| PostgreSQL (Cloud SQL) | Nutzerdaten | EU |

## 5. Speicherdauer

- **Nutzerkonto-Daten:** Bis zur Loeschung des Kontos
- **Chat-Verlaeufe:** 90 Tage nach Session-Ende
- **Analytics-Events:** 12 Monate, dann anonymisiert
- **Logs:** 30 Tage

## 6. Deine Rechte (Art. 15-22 DSGVO)

Du hast das Recht auf:

- **Auskunft** (Art. 15): Welche Daten wir ueber dich speichern
- **Berichtigung** (Art. 16): Falsche Daten korrigieren lassen
- **Loeschung** (Art. 17): Dein Konto und alle Daten loeschen lassen
- **Datenportabilitaet** (Art. 20): Deine Daten in maschinenlesbarem Format erhalten
- **Widerspruch** (Art. 21): Der Verarbeitung widersprechen
- **Widerruf der Einwilligung** (Art. 7 Abs. 3): Cookie-Einwilligung jederzeit widerrufen

### So uebst du deine Rechte aus:
- **Konto loeschen:** Einstellungen → Konto loeschen (oder DELETE /api/auth/account)
- **Daten exportieren:** Profil → Daten exportieren (oder GET /api/v1/portfolio/profile/export)
- **Cookie-Einwilligung widerrufen:** Footer → Cookie-Einstellungen

## 7. Jugendschutz (JMStV §5, Art. 8 DSGVO)

- Die App richtet sich an Jugendliche ab 14 Jahren.
- Bei 14-15-Jaehrigen empfehlen wir die Einwilligung der Erziehungsberechtigten.
- KI-Antworten werden durch Safety-Filter geschuetzt (HarmCategory-Schwellwerte).
- Es werden keine Karriereempfehlungen gegeben — nur Interessen-Exploration.

## 8. Cookies und Tracking

### Technisch notwendige Cookies
- Session-Token (httpOnly, SameSite=Strict)
- Consent-Entscheidung (localStorage)

### Optionale Cookies (nur nach Einwilligung)
- Meta Pixel (Facebook) fuer Kampagnen-Messung

## 9. Aenderungen

Wir behalten uns vor, diese Datenschutzerklaerung anzupassen. Die aktuelle Version ist immer unter /datenschutz abrufbar.

## 10. Kontakt

Bei Fragen zum Datenschutz wende dich an: [E-Mail-Adresse einfuegen]
