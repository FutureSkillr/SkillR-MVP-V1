# FR-054: Pre-Login Intro-Sequenz mit KI-Coach Avataren

**Status:** done
**Priority:** must
**Gate:** env:dev
**Created:** 2026-02-19
**Entity:** maindset.ACADEMY | maindfull.LEARNING

## Problem

Besucher muessen sich aktuell anmelden, bevor sie das Produkt erleben koennen. Das ist eine hohe Huerde fuer Jugendliche (14+). Die Conversion-Rate vom Erstkontakt zur Registrierung ist niedrig.

## Solution

Eine Intro-Sequenz laesst neue User **vor der Registrierung** mit einem von 6 KI-Coach-Charakteren chatten, 5 Smalltalk-Fragen beantworten, eine Mini-Skill-Sequenz absolvieren und dabei einen Skillpunkt (25 XP) verdienen. Erst danach kommt die Registrierung mit DSGVO-Altersgate. Der verdiente Skillpunkt wird ins echte Profil uebertragen.

### Ablauf

```
WelcomePage ("Jetzt ausprobieren")
    ↓
1. intro-coach-select  — Waehle deinen Coach (6 Personas)
    ↓
2. intro-chat          — Smalltalk (5 Fragen) + Smart-Skill-Demo → 1 Skillpunkt
    ↓
3. intro-register      — Registrierung mit DSGVO-Altersgate
    ↓
handleLogin()          — Intro-State ins echte Profil uebertragen
```

### Die 6 KI-Coach-Personas

| Coach | Setting | Dialekt | Farbe | Persoenlichkeit |
|-------|---------|---------|-------|-----------------|
| Susi | Kunstatelier Koeln-Ehrenfeld | Koelsch | pink | Kreativ, warmherzig |
| Karlshains | Hobbywerkstatt Schwabenland | Schwaebisch | orange | Tueftler, bodenstaendig |
| Rene | Surfcamp Nordsee | Hochdeutsch | cyan | Entspannt, philosophisch |
| Heiko | Co-Working Berlin-Kreuzberg | Berlinerisch | purple | Witzig, direkt |
| Andreas | Berghuette Alpen | Bayerisch | emerald | Naturverbunden, abenteuerlustig |
| Cloudia | Digitaler Raum | Saechsisch | blue | KI, selbstironisch |

### DSGVO-Altersgate

- Unter 14: Blockiert
- 14-15: Registrierung + Eltern-Hinweis
- 16+: Self-Consent + Datenschutz-Checkbox

### Fast-Forward Skip ("Weiter >")

A "Weiter >" link is shown in the page header (next to the back link) during the intro chat. Clicking it:

1. Skips the remaining smalltalk/demo dialog
2. Sets `fastForward: true` in the IntroState (localStorage)
3. Navigates directly to `intro-register`
4. The user is treated as someone who already knows VUCA — no penalty, no lost XP opportunity
5. The `intro-fast-forward` property is tracked as an analytics event so we can measure skip rates

This allows returning users or those familiar with the concept to bypass the chat without friction.

## Acceptance Criteria

- [x] WelcomePage zeigt "Jetzt ausprobieren" Button
- [x] Coach-Auswahl-Seite mit 6 Personas im 2x3 Grid
- [x] IntroChat mit Smalltalk (5 Fragen) und nahtlosem Demo-Uebergang
- [x] Marker [SMALLTALK_DONE] und [DEMO_COMPLETE] werden erkannt und aus der Anzeige entfernt
- [x] IntroRegisterPage mit DSGVO-Altersgate (unter 14 blockiert, 14-15 Eltern-Hinweis, 16+ normal)
- [x] Intro-State wird in localStorage gespeichert und bei Registrierung ins Profil uebertragen
- [x] Anonymes Rate-Limiting: 15 Requests / 5 Min fuer unauthentifizierte Gemini-Anfragen
- [x] XPAction 'intro_demo_complete' (25 XP) im Engagement-System
- [x] "Weiter >" link in intro-chat header skips to intro-register
- [x] Fast-forward sets `fastForward: true` in IntroState and tracks `intro-fast-forward` event
- [ ] Alle bestehenden Tests bestehen weiterhin

## Dependencies

- FR-033 (DSGVO-Altersgate Konzept)
- TC-016 (Gemini Server Proxy)

## Notes

- Intro-State wird komplett in localStorage gehalten (kein Firestore fuer anonyme User)
- Die Intro-Sequenz benoetigt ca. 10 Gemini-API-Calls (6 Smalltalk + 4 Demo)
- Bei Wiederbesuch kann der Intro-State aus localStorage wiederhergestellt werden
