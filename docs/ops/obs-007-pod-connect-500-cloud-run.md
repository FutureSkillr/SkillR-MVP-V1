# OBS-007: Pod Connect Failed (500) in Deployed Environment

**Beobachtet:** 2026-02-23
**Severity:** blocking
**Status:** open

---

## Beobachtung

Beim Versuch, online (Cloud Run) einen Solid Pod zu verbinden, erscheint die Fehlermeldung:

```
Pod connect failed (500)
Erneut versuchen
```

Lokal funktioniert die Pod-Verbindung (docker-compose startet einen separaten CSS-Container). Im deployed Cloud Run Environment schlaegt der Connect fehl.

## Ursachenanalyse

### Primaere Ursache: CSS-Server wird in Cloud Run nicht gestartet

Die deploy.sh setzt `SOLID_POD_ENABLED` standardmaessig auf `false`:

```bash
# deploy.sh:131-132
yaml_kv SOLID_POD_ENABLED "${SOLID_POD_ENABLED:-false}"
```

Die `.env.deploy` enthaelt **keine Solid-Pod-Konfiguration**. Es fehlen `SOLID_POD_URL` und `SOLID_POD_ENABLED` komplett.

### Ablauf des Fehlers

1. Cloud Run startet den Container
2. `entrypoint.sh` prueft `SOLID_POD_ENABLED` → ist `false` → CSS wird **nicht** gestartet
3. Go-Backend startet und akzeptiert Requests
4. Frontend ruft `POST /api/v1/pod/connect` auf
5. Backend-Service versucht HTTP-Verbindung zu `http://localhost:3000` (Dockerfile-Default)
6. Kein CSS-Server laeuft auf Port 3000 → `connection refused`
7. `handler.go:50` loggt den Fehler, gibt HTTP 500 zurueck: `"failed to connect pod"`
8. Frontend zeigt: `Pod connect failed (500)`

### Betroffene Dateien

| Datei | Zeile | Befund |
|-------|-------|--------|
| `.env.deploy` | — | Keine Solid-Pod-Konfiguration vorhanden |
| `scripts/deploy.sh` | 131-132 | `SOLID_POD_ENABLED` Default ist `false` |
| `Dockerfile` | 61 | Hardcoded `SOLID_POD_URL=http://localhost:3000` |
| `scripts/entrypoint.sh` | 5 | CSS startet nur wenn `SOLID_POD_ENABLED=true` |
| `scripts/entrypoint.sh` | 22 | Bei CSS-Startup-Timeout nur WARNING, kein Abbruch |
| `backend/internal/solid/handler.go` | 48-51 | Generische 500-Antwort ohne Ursachendetails |

### Sekundaere Probleme

1. **Kein Health-Check fuer CSS:** Backend prueft nie, ob CSS erreichbar ist, bevor Requests angenommen werden
2. **Generischer Fehler:** Handler gibt nur `"failed to connect pod"` zurueck — die eigentliche Ursache (`connection refused`) wird verschluckt
3. **Entrypoint-Timeout nicht fatal:** Wenn CSS nicht innerhalb 30s startet, laeuft das Backend trotzdem weiter (Zeile 22)

## Loesungsvorschlag

### Option A: CSS in Cloud Run aktivieren (empfohlen)

1. In `.env.deploy` hinzufuegen:
   ```
   SOLID_POD_ENABLED=true
   SOLID_POD_URL=http://localhost:3000
   ```
2. `entrypoint.sh` haerten: Bei fehlgeschlagenem CSS-Start mit `exit 1` abbrechen statt WARNING
3. Re-deploy ausfuehren

### Option B: Pod-Feature im Frontend deaktivieren (Workaround)

Wenn CSS in Cloud Run nicht benoetigt wird, Pod-UI ausblenden wenn `SOLID_POD_ENABLED=false`.

### Zusaetzliche Verbesserungen (beide Optionen)

1. **Handler verbessern:** Bei nicht erreichbarem CSS `503 Service Unavailable` statt `500` zurueckgeben
2. **Health-Check:** Pod-Erreichbarkeit in den bestehenden `/health`-Endpoint integrieren
3. **Logging:** Tatsaechliche Fehlermeldung (`connection refused`) im Error-Response mitgeben

## Verwandte Dokumente

- FR-076: Solid Pod Connection (`docs/features/FR-076-solid-pod-connection.md`)
- FR-095: Custom Solid Pod Server (`docs/features/FR-095-custom-solid-pod-server.md`)
- OBS-005: Admin Seed Skipped (`docs/ops/obs-005-admin-seed-skipped.md`) — aehnliches Deploy-Config-Problem
