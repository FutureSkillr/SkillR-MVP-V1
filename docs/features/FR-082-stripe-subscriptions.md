# FR-082: Stripe Subscription Management

**Status:** draft
**Priority:** must
**Gate:** env:dev+plan:pro
**Created:** 2026-02-21
**Entity:** SkillR | maindset.ACADEMY

## Problem

Das Sponsor-Showroom-Modell (BC-011) benoetigt eine Zahlungsinfrastruktur fuer drei Abo-Tiers (Basic/Professional/Enterprise) mit 30-Tage-Testphase und automatischer Umwandlung. Ohne eine zuverlaessige Zahlungsabwicklung kann das B2B-Geschaeftsmodell nicht aktiviert werden.

## Loesung

Stripe als Zahlungsdienstleister fuer Sponsor-Abonnements mit folgender Logik:

### Stripe-Integrationsfluss

```
Onboarding (Schritt 6)
  |
  v
stripe.customers.create        → Stripe-Customer-ID in `sponsors`-Tabelle
  |
  v
stripe.setupIntents.create     → Zahlungsmittel optional hinterlegen
  |                               (Deferred Collection)
  v
30-Tage-Testphase              → Showroom aktiv, alle Features verfuegbar
  |
  v
Tag 30: Testphase endet
  |
  +--> Zahlungsmittel vorhanden:
  |      stripe.subscriptions.create → Automatische Umwandlung in Abo
  |
  +--> Kein Zahlungsmittel:
         Showroom pausiert (nicht geloescht)
         → E-Mail: "Showroom pausiert — jetzt Zahlungsmittel hinterlegen"
         → Sponsor kann jederzeit reaktivieren
```

### E-Mail-Timeline waehrend der Testphase

| Tag | E-Mail | Inhalt |
|-----|--------|--------|
| 0 | Willkommen | Showroom-URL, erste Schritte, Dashboard-Link |
| 7 | Wochen-Report | "Ihre erste Woche — hier sind Ihre Besucher" |
| 21 | Erinnerung | "Testphase endet in 9 Tagen" |
| 28 | Letzte Erinnerung | "Letzte Erinnerung — 2 Tage bis zum Ende" |
| 30 | Umwandlung/Pause | Bestaetigung des Abo-Starts oder Pausierungsinfo |

### Tier-Enforcement

Serverseitige Pruefung bei jeder Schreiboperation:

| Ressource | Basic | Professional | Enterprise |
|-----------|-------|-------------|-----------|
| Skills | max 5 | max 20 | unbegrenzt |
| Skill Sets | max 1 | max 3 | unbegrenzt |
| Lernreisen | 0 | max 2 | unbegrenzt |
| Analytics-Zugang | nein | ja | ja |
| Matching | nein | nein | ja |
| Gebrandete Reisen | nein | nein | ja |

Bei Ueberschreitung: HTTP 403 mit Nachricht "Limit fuer Ihren Plan erreicht. Upgraden Sie fuer mehr Kapazitaet."

### Tier-Wechsel

- **Upgrade**: Sofort wirksam. Stripe erstellt anteilige Rechnung (Prorated).
- **Downgrade**: Zum Ende der aktuellen Abrechnungsperiode. Wenn Limits ueberschritten: Sponsor muss vor Downgrade ueberzaehlige Ressourcen deaktivieren oder loeschen.
- **Kuendigung**: Monatliche Kuendigung moeglich. Showroom bleibt bis Periodenende aktiv, dann pausiert.

### Stripe-Webhooks

| Event | Aktion |
|-------|--------|
| `customer.subscription.created` | Tier aktivieren, Showroom-Status auf `active` |
| `customer.subscription.updated` | Tier-Wechsel verarbeiten, Limits aktualisieren |
| `customer.subscription.deleted` | Showroom pausieren, E-Mail an Sponsor |
| `invoice.payment_succeeded` | Rechnung als bezahlt markieren |
| `invoice.payment_failed` | E-Mail an Sponsor, 3 Wiederholungsversuche |
| `customer.subscription.trial_will_end` | Erinnerungs-E-Mail (3 Tage vor Ende) |

### Vertrag-Tab im Dashboard

```
+----------------------------------------------------------+
| Ihr Plan: Professional                                   |
| Status: Aktiv | Naechste Abrechnung: 15.04.2026         |
|                                                          |
| Nutzung:                                                 |
|   Skills:     12 / 20                                    |
|   Skill Sets:  2 / 3                                     |
|   Lernreisen:  1 / 2                                     |
|                                                          |
| [Plan upgraden]  [Zahlungsmethode aendern]               |
|                                                          |
| Rechnungen:                                              |
| 15.03.2026  Professional  199,00 EUR  [PDF]              |
| 15.02.2026  Professional  199,00 EUR  [PDF]              |
|                                                          |
| [Plan kuendigen]                                         |
+----------------------------------------------------------+
```

### Sicherheit

- Stripe-Webhook-Signatur-Verifizierung (`stripe-signature` Header)
- Zahlungsmittel werden nie auf eigenen Servern gespeichert (PCI-DSS-konform ueber Stripe)
- SCA (Strong Customer Authentication) ueber Stripe integriert
- Idempotenzschluessel fuer alle Stripe-API-Aufrufe

## Akzeptanzkriterien

- [ ] Stripe-Customer wird bei Sponsor-Erstellung angelegt
- [ ] Setup-Intent ermoeglicht optionale Zahlungsmittel-Hinterlegung beim Onboarding
- [ ] 30-Tage-Testphase startet automatisch bei Sponsor-Erstellung
- [ ] Am Ende der Testphase: automatische Umwandlung wenn Zahlungsmittel vorhanden
- [ ] Am Ende der Testphase: Showroom pausiert wenn kein Zahlungsmittel
- [ ] E-Mail-Timeline (Tag 0, 7, 21, 28, 30) wird ausgeloest
- [ ] Tier-Limits werden serverseitig bei jeder Schreiboperation geprueft
- [ ] Upgrade ist sofort wirksam mit anteiliger Abrechnung
- [ ] Downgrade wird zum Periodenende wirksam
- [ ] Kuendigung ist monatlich moeglich
- [ ] Stripe-Webhooks werden mit Signatur-Verifizierung verarbeitet
- [ ] Vertrag-Tab zeigt Plan, Nutzung, Rechnungen
- [ ] Rechnungen sind als PDF downloadbar
- [ ] Pausierter Showroom ist reaktivierbar (Daten bleiben erhalten)
- [ ] Keine Zahlungsdaten auf eigenen Servern gespeichert

## Abhaengigkeiten

- FR-079 (Sponsor Showrooms — Sponsor-Entitaet, Tier-Feld)
- TC-030 (Multi-Tenant Showrooms — `sponsors`-Tabelle mit `tier`, `status`, `stripe_customer_id`)
- Stripe API (externe Abhaengigkeit)

## Notizen

- Stripe wurde gewaehlt wegen: EU-Konformitaet, SCA-Support, etablierte Subscription-API, gute Go-SDK
- Preise (99–299 / 499–999 EUR) werden initial als feste Produkte in Stripe angelegt, spaeter dynamisch konfigurierbar
- Keine eigene Rechnungsstellung noetig — Stripe erstellt automatisch Rechnungen
- Testphase kann auch nach Ablauf reaktiviert werden (kein Datenverlust)
