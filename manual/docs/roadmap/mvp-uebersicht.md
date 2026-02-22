---
title: MVP-Uebersicht
description: Philosophie, Abhaengigkeitsgraph und Risikoregister der Future SkillR Roadmap
---

# MVP-Uebersicht

**82 Feature Requests. 7 Phasen. Ein roter Faden.**

Diese Seite erklaert die Philosophie hinter der phasenbasierten Entwicklung, zeigt den kritischen Pfad durch die Abhaengigkeiten und dokumentiert die bekannten Risiken.

---

## MVP-Philosophie

Jede Phase von Future SkillR folgt einem strengen Muster:

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Codename** | Ein einpraegsamer Name, der das Kernziel auf den Punkt bringt ("Es funktioniert", "Das bin ich", ...) |
| **Messbare Exit-Kriterien** | Eine Checkliste, die objektiv pruefbar ist. Die Phase gilt erst als abgeschlossen, wenn alle Kriterien erfuellt sind. |
| **Definierter FR-Umfang** | Jede Phase hat eine feste Menge an Feature Requests. Neue Anforderungen werden der naechsten Phase zugewiesen, nicht in die laufende Phase geschoben. |
| **Aufbauendes Fundament** | Jede Phase baut auf den Ergebnissen der vorherigen auf. MVP2 braucht MVP1, MVP3 sichert alles ab, MVP4 fuegt Datensouveraenitaet hinzu. |

### Verteilung der Feature Requests

| Phase | FRs | Anteil |
|-------|-----|--------|
| MVP1 "Es funktioniert" | 16 | 20 % |
| MVP2 "Das bin ich" | 10 | 12 % |
| MVP3 "Sicher unterwegs" | 2 | 2 % |
| MVP4 "Meine Daten, Mein Pod" | 3 | 4 % |
| MVP5 "Sponsor Showrooms" | 7 | 9 % |
| V1.0 "Zeig es der Welt" | 12 | 15 % |
| V2.0 "Oekosystem" | 7 | 9 % |
| Plattformuebergreifend | 25 | 30 % |
| **Gesamt** | **82** | **100 %** |

---

## Abhaengigkeitsgraph

Der folgende Graph zeigt den kritischen Pfad durch die wichtigsten Feature Requests. Pfeile bedeuten: "wird benoetigt fuer".

```mermaid
graph TD
    subgraph "Authentifizierung & Daten"
        FR001["FR-001/002<br/>Auth (Google + Email)"]
        FR003["FR-003<br/>Firebase Persistence"]
        FR012["FR-012<br/>Session Continuity"]
        FR014["FR-014<br/>Interest Tracking"]
        FR033["FR-033<br/>DSGVO Minors"]
        FR025["FR-025<br/>Eltern-Dashboard"]
        FR018["FR-018<br/>Job-Navigator"]

        FR001 --> FR003
        FR003 --> FR012
        FR003 --> FR014
        FR003 --> FR033
        FR014 --> FR018
        FR033 --> FR025
    end

    subgraph "KI-Dialog & Journey"
        FR005["FR-005<br/>Gemini Dialogue"]
        FR006["FR-006<br/>VUCA Navigation"]
        FR007["FR-007<br/>Bingo Matrix"]
        FR031["FR-031<br/>3D Globe"]
        FR010["FR-010/011<br/>Voice/Text"]
        FR051["FR-051<br/>API Gateway"]
        FR052["FR-052<br/>Local Staging"]
        FR016["FR-016<br/>Wikipedia"]
        FR017["FR-017<br/>Job-Daten"]

        FR005 --> FR006
        FR006 --> FR007
        FR007 --> FR031
        FR005 --> FR010
        FR005 --> FR051
        FR051 --> FR052
        FR005 --> FR016
        FR016 --> FR018
        FR017 --> FR018
    end

    subgraph "Engagement & Social"
        FR038["FR-038<br/>Streaks & XP"]
        FR035["FR-035<br/>Avatar System"]
        FR037["FR-037<br/>Items & Drops"]
        FR036["FR-036<br/>Team & Mentor"]

        FR038 --> FR035
        FR035 --> FR037
        FR037 --> FR036
    end

    subgraph "Sponsor-Plattform"
        FR027["FR-027<br/>Rollenbasierte Ansichten"]
        FR079["FR-079<br/>Sponsor Showrooms"]
        FR080["FR-080<br/>Lernreise-Editor"]
        FR082["FR-082<br/>Stripe Subscriptions"]
        FR081["FR-081<br/>Sponsor Analytics"]
        FR021["FR-021<br/>Chamber Dashboard"]

        FR027 --> FR079
        FR033 --> FR079
        FR079 --> FR080
        FR079 --> FR082
        FR079 --> FR081
        FR079 --> FR021
    end

    classDef done fill:#22c55e20,stroke:#22c55e,color:#22c55e
    classDef active fill:#4DA3FF20,stroke:#4DA3FF,color:#4DA3FF
    classDef planned fill:#7B61FF20,stroke:#7B61FF,color:#7B61FF

    class FR001,FR003,FR012,FR014,FR005,FR006,FR007,FR031,FR010,FR038 done
    class FR051,FR052 active
    class FR033,FR025,FR018,FR016,FR017,FR035,FR037,FR036,FR027,FR079,FR080,FR082,FR081,FR021 planned
```

### Kritische Pfade

Es gibt drei Hauptstraenge, die den Projektfortschritt bestimmen:

1. **Auth-Strang:** Auth → Firebase → Session Continuity → DSGVO → Eltern-Dashboard
2. **Journey-Strang:** Gemini → VUCA Navigation → Bingo → 3D Globe → API Gateway → Local Staging → Oeffentliche URL
3. **B2B-Strang:** Rollenbasierte Ansichten → Sponsor Showrooms → Lernreise-Editor + Stripe + Analytics → Kammer-Dashboard

Der Auth-Strang und der Journey-Strang sind bereits weitgehend abgeschlossen (MVP1 + MVP2). Der naechste Engpass liegt beim API-Gateway (MVP3), das den oeffentlichen Zugang freischaltet.

---

## Risikoregister

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Phase |
|--------|------------|----------------------------|-----------|-------|
| **Gemini API-Key im Bundle exponiert** | Key-Missbrauch, Kostenexplosion | Hoch (ohne MVP3) | FR-051: Server-seitiger Proxy. Key nie im Browser. | MVP3 |
| **Gemini Rate Limits (Free Tier)** | Kern-UX blockiert | Mittel | Response-Caching implementieren; bei Pilot auf Paid Tier upgraden | MVP2+ |
| **DSGVO fuer Minderjaehrige verzoegert Launch** | Kein Go-Live moeglich | Mittel | Rechtliche Pruefung bereits in MVP2-Phase starten, nicht auf V1.0 warten | V1.0 |
| **3D-Globus Performance auf Mobilgeraeten** | Schlechte UX auf Zielgeraeten | Niedrig (mitigiert) | Frueh in MVP2 prototypisiert; 2D-Fallback implementiert und getestet | MVP2 |
| **Go-Backend noch nicht gestartet** | FR-014 (Backend), FR-019 blockiert | Mittel | Prototyp mit Firebase Functions moeglich; Go ist V1.0-Scope | V1.0 |
| **TTS-Modell nicht verfuegbar** | Voice-Features unzuverlaessig | Niedrig | Browser-Fallback (Web Speech API) bereits implementiert | MVP2 |
| **Stripe-Integration Komplexitaet** | Verzoegerung bei MVP5 | Mittel | Standard Stripe Checkout + Subscription API nutzen, keine eigene Rechnungsstellung | MVP5 |
| **Wildcard-DNS fuer Sponsor-Subdomains** | Showroom-Routing funktioniert nicht | Niedrig | Cloud Run unterstuetzt Custom Domains; Wildcard-CNAME konfigurierbar | MVP5 |

---

## Phasenabhaengigkeiten

```mermaid
graph LR
    MVP1["MVP1<br/>Es funktioniert"]
    MVP2["MVP2<br/>Das bin ich"]
    MVP3["MVP3<br/>Sicher unterwegs"]
    MVP4["MVP4<br/>Meine Daten"]
    V10["V1.0<br/>Zeig es der Welt"]
    MVP5["MVP5<br/>Sponsor Showrooms"]
    V20["V2.0<br/>Oekosystem"]

    MVP1 --> MVP2
    MVP2 --> MVP3
    MVP3 --> MVP4
    MVP3 --> V10
    V10 --> MVP5
    MVP5 --> V20

    classDef done fill:#22c55e20,stroke:#22c55e,color:#22c55e
    classDef active fill:#4DA3FF20,stroke:#4DA3FF,color:#4DA3FF
    classDef planned fill:#7B61FF20,stroke:#7B61FF,color:#7B61FF

    class MVP1,MVP2 done
    class MVP3 active
    class MVP4,V10,MVP5,V20 planned
```

!!! note "MVP4 und V1.0 sind parallel moeglich"
    MVP4 (SOLID Pod) und V1.0 (Produktionsstart) teilen MVP3 als Voraussetzung, koennen aber weitgehend parallel entwickelt werden. MVP5 (Sponsor Showrooms) benoetigt jedoch V1.0-Fundamente (Rollensystem, DSGVO, Theming).
