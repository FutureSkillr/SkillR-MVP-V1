# FR-067: Legal Placeholder Management (Admin)

**Status:** done
**Priority:** must
**Created:** 2026-02-20
**Entity:** SkillR
**Gate:** role:admin

## Problem

Die Impressum-Seite und Datenschutzerklaerung enthalten Platzhalter fuer Firmendaten, die vor dem Go-Live ausgefuellt werden muessen:

- Firmenname / Inhaber
- Anschrift (Strasse, PLZ, Ort)
- Kontakt (E-Mail, Telefon)
- Vertretungsberechtigte Person
- Registernummer (Handelsregister / Vereinsregister)
- USt-IdNr. (gemaess §27a UStG)
- Verantwortlich fuer Inhalt (§55 Abs. 2 RStV)
- Datenschutzbeauftragter (falls bestellt)

Aktuell sind diese als `[Platzhalter]` im Frontend-Code hardcoded. Eine Aenderung erfordert ein neues Deployment — das ist fuer Nicht-Entwickler nicht praktikabel.

## Solution

### 1. Business-Unit-Konfiguration in der Datenbank

Neues DB-Schema `business_config` (PostgreSQL):

```sql
CREATE TABLE business_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  TEXT
);
```

Vorbelegte Keys:

| Key | Beschreibung | TMG/DSGVO |
|-----|-------------|-----------|
| `company_name` | Firmenname | TMG §5 |
| `company_address` | Strasse, PLZ, Ort | TMG §5 |
| `company_country` | Land (default: Deutschland) | TMG §5 |
| `contact_email` | Kontakt-E-Mail | TMG §5, DSGVO Art. 13 |
| `contact_phone` | Telefonnummer | TMG §5 |
| `legal_representative` | Vertretungsberechtigte Person | TMG §5 |
| `register_entry` | Handelsregister / Vereinsregister | TMG §5 |
| `vat_id` | USt-IdNr. | TMG §5 |
| `content_responsible` | Verantwortlich fuer Inhalt (§55 RStV) | RStV §55 |
| `content_responsible_address` | Anschrift des Verantwortlichen | RStV §55 |
| `dpo_name` | Datenschutzbeauftragter (optional) | DSGVO Art. 37 |
| `dpo_email` | DSB-Kontakt (optional) | DSGVO Art. 37 |

### 2. API-Endpunkte

**`GET /api/config/legal`** (public, cached)
```json
{
  "companyName": "maindset.ACADEMY GmbH i.G.",
  "companyAddress": "Musterstrasse 1, 12345 Musterstadt",
  "contactEmail": "info@maindset.academy",
  "contactPhone": "+49 123 456789",
  "legalRepresentative": "Max Mustermann",
  "registerEntry": "HRB 12345, Amtsgericht Musterstadt",
  "vatId": "DE123456789",
  "contentResponsible": "Max Mustermann",
  "contentResponsibleAddress": "Musterstrasse 1, 12345 Musterstadt",
  "dpoName": null,
  "dpoEmail": null
}
```

**`PUT /api/config/legal`** (admin-only, requireAuth + requireAdmin)
```json
{
  "companyName": "maindset.ACADEMY GmbH i.G.",
  "companyAddress": "Musterstrasse 1, 12345 Musterstadt",
  ...
}
```

### 3. Admin-UI: "Geschaeftsdaten" Tab

Neuer Tab im Admin-Console (FR-047):
- Formular mit allen Business-Config-Feldern
- Vorschau der Impressum-Seite mit Live-Daten
- Speichern-Button mit Bestaetigung
- Audit-Log: Wer hat wann was geaendert

### 4. Frontend-Integration

`ImpressumPage.tsx` und `DatenschutzPage.tsx` laden Firmendaten von `/api/config/legal` statt hardcodierter Platzhalter. Fallback auf `[Bitte im Admin-Bereich konfigurieren]` wenn leer.

### Neue Dateien
| Datei | Zweck |
|-------|-------|
| `backend/migrations/NNN_business_config.up.sql` | DB-Schema |
| `backend/internal/config/legal_handler.go` | GET/PUT Handler |
| `frontend/components/admin/BusinessConfigEditor.tsx` | Admin-Formular |
| `frontend/services/legalConfig.ts` | API-Client |

### Modifizierte Dateien
| Datei | Aenderung |
|-------|-----------|
| `frontend/components/legal/ImpressumPage.tsx` | Daten von API laden statt Platzhalter |
| `frontend/components/legal/DatenschutzPage.tsx` | Verantwortliche Stelle von API |
| `frontend/components/admin/AdminConsole.tsx` | Neuer Tab "Geschaeftsdaten" |
| `frontend/types/admin.ts` | AdminTab um 'business-config' erweitern |
| `backend/internal/server/routes.go` | Neue Routen registrieren |

## Acceptance Criteria

- [x] Admin kann Firmendaten im Admin-Bereich unter "Geschaeftsdaten" pflegen
- [x] Aenderungen sind sofort live ohne Deployment
- [x] `GET /api/config/legal` liefert aktuelle Firmendaten (public, gecached)
- [x] `PUT /api/config/legal` erfordert Admin-Auth
- [x] Impressum-Seite zeigt DB-Daten statt Platzhalter
- [x] Datenschutzerklaerung zeigt DB-Daten fuer "Verantwortliche Stelle"
- [x] Fallback-Text wenn Felder leer: "[Bitte im Admin-Bereich konfigurieren]"
- [x] Audit-Log: Letzte Aenderung mit Timestamp und User sichtbar
- [x] Alle TMG §5 Pflichtfelder sind im Formular abgedeckt
- [x] Validierung: E-Mail-Format, Pflichtfelder markiert
- [x] Bestehende Tests passen weiterhin

## Dependencies

- FR-066 (Cookie-Consent-Banner, Legal Footer, Pflichtseiten)
- FR-047 (Management Console)

## Notes

- **MVP-Phase:** Platzhalter im Code sind akzeptabel, solange die App nicht oeffentlich ist
- **Vor Go-Live:** Dieses FR MUSS abgeschlossen sein — TMG §5 Verstoss kann abgemahnt werden
- **Caching:** `/api/config/legal` kann mit 5min Cache-Control ausgeliefert werden (Impressum aendert sich selten)
- **Migration:** Beim ersten Deployment werden die Keys mit leeren Werten angelegt; Admin fuellt sie ueber die UI
