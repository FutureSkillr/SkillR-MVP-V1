---
title: Sicherheit & Datenschutz
description: Wie maindset.ACADEMY die Daten Ihres Kindes schuetzt — DSGVO, Verschluesselung und Ihre Rechte
---

# Sicherheit & Datenschutz

**Ihre Daten und die Ihres Kindes sind bei uns sicher.** Wir nehmen Datenschutz ernst — nicht als Pflicht, sondern als Grundprinzip. Hier erklaeren wir transparent, welche Daten wir erheben, wie wir sie schuetzen und welche Rechte Sie haben.

---

## Unsere Datenschutz-Grundsaetze

1. **Datensparsamkeit** — Wir erheben nur die Daten, die fuer den Betrieb notwendig sind
2. **Zweckbindung** — Daten werden ausschliesslich fuer den angegebenen Zweck verwendet
3. **Kein Datenhandel** — Wir verkaufen keine Daten an Dritte — niemals
4. **Transparenz** — Sie koennen jederzeit erfahren, welche Daten gespeichert sind
5. **Kontrolle** — Sie koennen Daten jederzeit loeschen lassen

---

## DSGVO-Konformitaet

maindset.ACADEMY ist vollstaendig konform mit der **Datenschutz-Grundverordnung (DSGVO)** der Europaeischen Union. Das bedeutet konkret:

| DSGVO-Recht | Umsetzung bei maindset.ACADEMY |
|-------------|------------------------------|
| **Art. 6** — Rechtmaessigkeit der Verarbeitung | Einwilligung des Nutzers (bzw. der Eltern bei unter 16-Jaehrigen) |
| **Art. 7** — Bedingungen fuer die Einwilligung | Klare, verstaendliche Einwilligungserklaerung bei der Registrierung |
| **Art. 8** — Einwilligung von Kindern | Elterliche Zustimmung erforderlich fuer Nutzer unter 16 Jahren |
| **Art. 13** — Informationspflicht | Diese Dokumentation sowie Datenschutzerklaerung in der App |
| **Art. 15** — Auskunftsrecht | Sie koennen jederzeit eine Kopie aller gespeicherten Daten anfordern |
| **Art. 16** — Recht auf Berichtigung | Fehlerhafte Daten koennen korrigiert werden |
| **Art. 17** — Recht auf Loeschung | Vollstaendige Loeschung aller Daten auf Anfrage |
| **Art. 20** — Datenportabilitaet | Export der Daten in maschinenlesbarem Format |

---

## Altersverifikation und elterliche Einwilligung

!!! warning "Wichtig fuer Eltern von Kindern unter 16 Jahren"
    Gemaess Art. 8 DSGVO benoetigen Kinder und Jugendliche unter 16 Jahren die Einwilligung eines Erziehungsberechtigten, um maindset.ACADEMY zu nutzen. Diese Einwilligung wird waehrend des Registrierungsprozesses eingeholt.

**So funktioniert die Altersverifikation:**

1. Bei der Registrierung gibt der Jugendliche sein Geburtsjahr an
2. Ist der Nutzer unter 16, wird ein Einwilligungsschritt fuer Eltern eingeblendet
3. Ein Erziehungsberechtigter bestaetigt die Nutzung per E-Mail
4. Ohne diese Bestaetigung kann das Konto nicht vollstaendig genutzt werden

---

## Welche Daten werden erhoben?

### Persoenliche Daten (in Firebase gespeichert)

| Datum | Zweck | Loeschbar? |
|-------|-------|------------|
| E-Mail-Adresse | Anmeldung und Kontowiederherstellung | Ja |
| Anzeigename | Persoenliche Ansprache durch den KI-Coach | Ja |
| Geburtsjahr | Altersverifikation und altersgerechte Inhalte | Ja |
| Gewaehlter Coach | Personalisierung der Interaktion | Ja |
| Skill-Profil | Darstellung der entdeckten Interessen | Ja |
| VUCA-Bingo-Fortschritt | Speicherung des Reisefortschritts | Ja |
| Journey-Fortschritt | Ermoeglicht Fortsetzung der Reise | Ja |

### Technische Daten (automatisch erhoben)

| Datum | Zweck | Speicherdauer |
|-------|-------|---------------|
| IP-Adresse | Missbrauchsschutz und Rate Limiting | Max. 24 Stunden |
| Geraetetyp und Browser | Optimierung der Darstellung | Anonymisiert |
| Zeitpunkt der Nutzung | Systemstabilitaet und Lastverteilung | Anonymisiert |

### Daten, die wir NICHT erheben

- :material-close-circle:{ style="color: #e53935" } Standortdaten
- :material-close-circle:{ style="color: #e53935" } Kontakte oder Adressbuch
- :material-close-circle:{ style="color: #e53935" } Fotos oder Dateien vom Geraet
- :material-close-circle:{ style="color: #e53935" } Browsing-Verlauf ausserhalb von maindset.ACADEMY
- :material-close-circle:{ style="color: #e53935" } Daten aus anderen Apps oder sozialen Netzwerken

---

## Technische Sicherheitsmassnahmen

### Verschluesselung

- **In Transit:** Alle Daten werden ueber **HTTPS** (TLS 1.3) verschluesselt uebertragen. Unverschluesselte Verbindungen werden automatisch umgeleitet.
- **At Rest:** Persoenliche Daten werden in **Google Firebase** mit AES-256-Verschluesselung gespeichert.

### Authentifizierung

- **JWT-Token:** Nach der Anmeldung erhaelt der Nutzer ein signiertes JSON Web Token, das bei jeder Anfrage ueberprueft wird
- **OAuth 2.0:** Die Google-Anmeldung nutzt den sicheren OAuth-2.0-Standard — wir sehen nie das Google-Passwort Ihres Kindes
- **Session-Management:** Sitzungen werden serverseitig verwaltet und laufen nach Inaktivitaet automatisch ab

### Missbrauchsschutz

- **Rate Limiting:** Die Anzahl der Anfragen pro Nutzer und Zeitraum ist begrenzt, um Missbrauch zu verhindern
- **Input Validation:** Alle Nutzereingaben werden serverseitig validiert und bereinigt, bevor sie verarbeitet werden
- **Security Headers:** Moderne Sicherheits-Header schuetzen vor Cross-Site-Scripting (XSS) und anderen Angriffsarten
- **CORS-Richtlinien:** Nur autorisierte Domains koennen auf die API zugreifen

### Infrastruktur

- **Google Cloud Platform:** maindset.ACADEMY laeuft auf der Google Cloud Platform mit ISO-27001-Zertifizierung
- **Serverstandort EU:** Die Datenverarbeitung erfolgt innerhalb der Europaeischen Union
- **Regelmaessige Updates:** Abhaengigkeiten und Sicherheitspatches werden regelmaeassig aktualisiert

---

## KI-Sicherheit

!!! info "Wie sicher sind die KI-Gespraeche?"
    Die KI-Gespraeche Ihres Kindes mit dem Coach werden ueber Google Gemini verarbeitet. Dabei gelten strenge Sicherheitsregeln.

**Schutzmassnahmen bei der KI-Interaktion:**

- **Prompt Security:** Der KI-Coach arbeitet innerhalb definierter Grenzen und kann nicht dazu gebracht werden, unangemessene Inhalte zu erzeugen
- **Content Filtering:** Google Gemini verfuegt ueber integrierte Inhaltsfilter fuer die Erkennung schaedlicher Inhalte
- **Keine Speicherung durch Google:** Die Gespraeche werden von Google nicht fuer das Training von KI-Modellen verwendet (gemaess Google AI Studio Nutzungsbedingungen fuer API-Kunden)
- **Paedagogischer Rahmen:** Der Coach ist auf positive, ermutigende Interaktionen programmiert und vermeidet bewertende oder druckausuebende Aussagen

---

## Ihre Rechte als Eltern

### Recht auf Auskunft (Art. 15 DSGVO)

Sie koennen jederzeit eine vollstaendige Uebersicht aller gespeicherten Daten Ihres Kindes anfordern. Wir stellen diese innerhalb von 30 Tagen bereit.

### Recht auf Loeschung (Art. 17 DSGVO)

Sie koennen die vollstaendige Loeschung aller Daten Ihres Kindes verlangen. Dies umfasst:

- Kontodaten und Profil
- Skill-Profil und VUCA-Fortschritt
- Gespeicherte Gespraeche und Interaktionen
- Alle technischen Nutzungsdaten

!!! tip "So fordern Sie die Loeschung an"
    Senden Sie eine E-Mail an **datenschutz@maindset.academy** mit dem Betreff "Datenloeschung" und der registrierten E-Mail-Adresse des Kontos. Wir bestaetigen die Loeschung innerhalb von 7 Werktagen.

### Recht auf Datenportabilitaet (Art. 20 DSGVO)

Sie koennen einen Export aller Daten in einem maschinenlesbaren Format (JSON) anfordern, um sie zu einem anderen Dienst mitzunehmen.

### Widerspruchsrecht (Art. 21 DSGVO)

Sie koennen der Verarbeitung bestimmter Daten widersprechen. Beachten Sie, dass dies die Nutzung einzelner Funktionen einschraenken kann.

---

## SOLID Pods — Zukunft der Datensouveraenitaet

!!! info "Geplante Funktion"
    In einer zukuenftigen Version wird maindset.ACADEMY die Moeglichkeit bieten, Daten in einem persoenlichen **SOLID Pod** zu speichern. Ein Pod ist ein persoenlicher Online-Datenspeicher, ueber den Ihr Kind die volle Kontrolle hat — unabhaengig von maindset.ACADEMY. Diese Funktion befindet sich derzeit in der Entwicklung.

---

## Kontakt

Bei Fragen zum Datenschutz erreichen Sie uns unter:

- **E-Mail:** datenschutz@maindset.academy
- **Betreff:** Bitte geben Sie "Datenschutzanfrage" als Betreff an
- **Antwortzeit:** Wir antworten innerhalb von 5 Werktagen

---

## Naechste Schritte

- [:material-eye: Was sieht mein Kind?](was-sieht-mein-kind.md) — Welche Inhalte Ihr Kind sieht und was Sie einsehen koennen
- [:material-frequently-asked-questions: Haeufige Fragen](haeufige-fragen.md) — Weitere Antworten auf Ihre Fragen
