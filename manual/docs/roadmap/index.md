---
title: Roadmap
description: Produkt-Roadmap von Future SkillR — Alle Phasen von MVP1 bis V2.0
---

# Produkt-Roadmap

**82 Feature Requests. 7 Phasen. Ein Ziel: Jugendliche entdecken, was in ihnen steckt.**

Future SkillR wird in klar abgegrenzten Phasen entwickelt. Jede Phase hat einen Codenamen, ein messbares Ziel und einen definierten Umfang an Feature Requests (FRs). Diese Seite gibt einen Ueberblick ueber alle Phasen, ihren aktuellen Status und die Abhaengigkeiten untereinander.

---

## Phasenuebersicht

| Phase | Codename | Ziel | Status | FRs |
|-------|----------|------|--------|-----|
| **MVP1** | "Es funktioniert" | Core-Loop stabil, demo-faehig | <span class="status-badge status-badge--done">Abgeschlossen</span> | 16 |
| **MVP2** | "Das bin ich" | Jugendliche sagen "Das bin ich" beim Profil | <span class="status-badge status-badge--done">Abgeschlossen</span> | 10 |
| **MVP3** | "Sicher unterwegs" | API-Gateway schuetzt Secrets, lokales Staging | <span class="status-badge status-badge--in-progress">In Arbeit</span> | 2 |
| **MVP4** | "Meine Daten, Mein Pod" | SOLID Pod als Transparenzspiegel | <span class="status-badge status-badge--planned">Geplant</span> | 3 |
| **MVP5** | "Sponsor Showrooms" | Multi-Tenant B2B-Plattform fuer Bildungssponsoring | <span class="status-badge status-badge--planned">Geplant</span> | 7 |
| **V1.0** | "Zeig es der Welt" | Produktionsstart, DSGVO, echte Daten | <span class="status-badge status-badge--planned">Geplant</span> | 12 |
| **V2.0** | "Oekosystem" | Kammer-Oekosystem, Matching-Erloese | <span class="status-badge status-badge--planned">Geplant</span> | 7 |

**Gesamt: 57 dedizierte FRs + 25 plattformuebergreifende FRs = 82 Feature Requests**

---

## Zeitlicher Verlauf

```mermaid
gantt
    title Future SkillR — Produkt-Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Abgeschlossen
    MVP1 — Es funktioniert        :done, mvp1, 2026-01-15, 2026-02-10
    MVP2 — Das bin ich             :done, mvp2, 2026-02-10, 2026-02-18

    section In Arbeit
    MVP3 — Sicher unterwegs        :active, mvp3, 2026-02-18, 2026-03-01

    section Geplant
    MVP4 — Meine Daten, Mein Pod   :mvp4, 2026-03-01, 2026-03-15
    V1.0 — Zeig es der Welt        :v10, 2026-03-15, 2026-04-15
    MVP5 — Sponsor Showrooms       :mvp5, 2026-04-15, 2026-06-01
    V2.0 — Oekosystem              :v20, 2026-06-01, 2026-08-01
```

---

## Aktueller Stand

!!! success "MVP1 + MVP2 abgeschlossen"
    26 von 26 Feature Requests sind implementiert oder stabilisiert. Die Kern-Journey (Onboarding, VUCA-Station, Profil, 3D-Globus, Engagement) funktioniert End-to-End.

!!! info "MVP3 in Arbeit"
    Das API-Gateway (FR-051) und das lokale Staging (FR-052) sind die naechsten Meilensteine. Ziel: Kein API-Key im JS-Bundle, Rate Limiting, Health Check. Danach kann die URL oeffentlich geteilt werden.

---

## Phasen im Detail

| Phase | Detailseite | Schwerpunkt |
|-------|-------------|-------------|
| MVP1 | [Es funktioniert](mvp1.md) | Auth, Onboarding, VUCA-Station, Profil, Firebase, Admin |
| MVP2 | [Das bin ich](mvp2.md) | 3D-Globus, Streaks/XP, Mikro-Sessions, Meta-Kurs-Editor, Reflexion, Audio |
| MVP3 | [Sicher unterwegs](mvp3.md) | API-Gateway, Docker Compose, Security |
| MVP4 | [Meine Daten, Mein Pod](mvp4.md) | SOLID Pod, Datentransparenz, Datensouveraenitaet |
| MVP5 | [Sponsor Showrooms](mvp5.md) | Multi-Tenant, B2B, Bildungssponsoring, Stripe |
| V1.0 | [Zeig es der Welt](v1.md) | DSGVO, Job-Navigator, Eltern-Dashboard, Produktionsstart |
| V2.0 | [Oekosystem](v2.md) | Kammer-Dashboard, Bedarfserfassung, Matching-Erloese |

---

## Uebergreifende Philosophie

Jede Phase folgt drei Prinzipien:

1. **Klarer Codename** — Jede Phase hat einen einpraegsamen Namen, der das Ziel auf den Punkt bringt.
2. **Messbare Exit-Kriterien** — Die Phase ist erst abgeschlossen, wenn alle Kriterien erfuellt sind.
3. **Definierter FR-Umfang** — Kein Feature-Creep: Nur die zugewiesenen FRs gehoeren zur Phase.

Mehr zur MVP-Philosophie und zum kritischen Pfad: [MVP-Uebersicht](mvp-uebersicht.md)
