# FR-081: Sponsor Analytics Dashboard

**Status:** draft
**Priority:** should
**Gate:** env:dev+plan:pro
**Created:** 2026-02-21
**Entity:** maindset.ACADEMY | SkillR

## Problem

Sponsoren brauchen Einblick in die Wirksamkeit ihres Showrooms, um den Wert ihres Abonnements zu verstehen und ihre Inhalte zu optimieren. Gleichzeitig duerfen niemals individuelle Schueler-Daten an Sponsoren weitergegeben werden — das wuerde das Vertrauensmodell (BC-007) zerstoeren.

## Loesung

Ein Analytics-Dashboard im Sponsor-Dashboard-Tab, das **ausschliesslich aggregierte Metriken** zeigt. Keine individuellen Nutzer-Daten, keine identifizierbaren Profile, keine Tracking-IDs.

### Metriken

#### Showroom-Traffic
- Besuche (gesamt, eindeutig)
- Durchschnittliche Verweildauer
- Herkunft (Direkt, Suchmaschine, Referral, QR-Code)
- 30-Tage-Sparkline-Diagramm

#### Skill-Engagement
- Aufrufe pro Skill
- Durchschnittliche Verweildauer pro Skill
- Conversion: Skill-Ansicht → Reise-Start
- Beliebteste Skills (Rangfolge)

#### Conversion-Funnel
```
Showroom-Besuch
  |
  v
Skill-Ansicht          [xx% Conversion]
  |
  v
Reise-Start            [xx% Conversion]
  |
  v
Registrierung          [xx% Conversion]
```

#### Zeitreihen
- Taeglich aggregierte Zaehler
- 7-Tage- und 30-Tage-Vergleich
- Trend-Indikatoren (steigend/fallend/stabil)

### Datenmodell

Aggregierte Tageszaehler in der `sponsor_analytics`-Tabelle:

```
sponsor_id | date       | metric_type      | value
-----------+------------+------------------+------
uuid       | 2026-03-15 | showroom_visits  | 142
uuid       | 2026-03-15 | unique_visitors  | 98
uuid       | 2026-03-15 | skill_views      | 234
uuid       | 2026-03-15 | journey_starts   | 17
uuid       | 2026-03-15 | registrations    | 5
```

Keine Rohdaten, keine Session-IDs, keine User-IDs — nur aggregierte Tagessummen.

### Datenschutz-Garantien

| Garantie | Umsetzung |
|----------|-----------|
| Keine individuellen Nutzerdaten | Nur aggregierte Tageszaehler gespeichert |
| Keine Tracking-IDs | Zaehler werden serverseitig inkrementiert, ohne Session-Bezug |
| Mindestanzahl fuer Anzeige | Metriken werden erst ab 10 Nutzern pro Tag angezeigt (k-Anonymitaet) |
| Keine Rueckfuehrbarkeit | Kein Skill-Engagement pro einzelnem Nutzer, nur Gesamtsummen |
| DSGVO-konform | Keine personenbezogenen Daten verlassen die Plattform |

## Akzeptanzkriterien

- [ ] Analytics-Tab im Sponsor-Dashboard zeigt aggregierte Showroom-Daten
- [ ] Showroom-Traffic: Besuche, Eindeutige, Verweildauer sichtbar
- [ ] Skill-Engagement: Aufrufe und Verweildauer pro Skill sichtbar
- [ ] Conversion-Funnel: Besuch → Skill → Reise → Registrierung visualisiert
- [ ] 30-Tage-Sparkline-Diagramm fuer Traffic-Trend
- [ ] Metriken werden erst ab 10 Nutzern pro Tag angezeigt (k-Anonymitaet)
- [ ] Keine individuellen Nutzerdaten sind fuer Sponsoren zugaenglich
- [ ] Nur Professional- und Enterprise-Tier haben Zugang (Basic: kein Analytics)
- [ ] Tageszaehler werden im Backend aggregiert, nicht im Frontend berechnet
- [ ] API-Endpunkt `GET /api/sponsors/me/analytics` liefert nur aggregierte Daten
- [ ] Daten koennen als CSV exportiert werden (nur aggregiert)

## Abhaengigkeiten

- FR-079 (Sponsor Showrooms — Showroom-Seiten als Datenquelle)
- FR-050 (Clickstream Analytics — bestehendes Event-Tracking als Grundlage)
- FR-082 (Stripe Subscriptions — Tier-Pruefung fuer Analytics-Zugang)
- TC-030 (Multi-Tenant Showrooms — `sponsor_analytics`-Tabelle)

## Notizen

- Analytics ist ein zentrales Verkaufsargument fuer Professional- und Enterprise-Tiers
- Die k-Anonymitaets-Schwelle (min. 10 Nutzer) verhindert Rueckschluesse auf Einzelpersonen
- Spaetere Erweiterung: A/B-Testing-Insights fuer Skill-Beschreibungen (Enterprise)
- Keine Echtzeit-Daten noetig — taegliche Aggregation reicht fuer Sponsor-Entscheidungen
