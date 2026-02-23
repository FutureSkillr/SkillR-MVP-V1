# OBS-005: Default Admin Account Not Found After Login

**Beobachtet:** 2026-02-23
**Severity:** blocking
**Status:** fixed

---

## Beobachtung

Beim Login mit den im Startup-Log angezeigten Default-Admin-Credentials (`admin@skillr.local` / `Admin1local`) wird der Account nicht gefunden. Der Startup-Log zeigt die Credentials bei jedem Start:

```
Admin Email:    admin@skillr.local
Admin Password: Admin1local
```

Aber der Login schlaegt fehl, weil der Account nicht in der Datenbank existiert.

## Ursachenanalyse

`SeedAdmin` in `backend/internal/server/auth.go` (Zeile 425-460) prueft `SELECT COUNT(*) FROM users`. Wenn **irgendein** User existiert (z.B. durch vorherige Registrierung oder vorherigen DB-Stand), wird das Seeding uebersprungen — **ohne Logmeldung**.

```go
if count > 0 {
    return  // ← silent skip, admin never created
}
```

### Zusaetzliches Problem: Password-Mismatch

Der Go-Config-Default (`config.go:120`) ist `Skillr1dev`, aber `docker-compose.yml` und `.env.example` setzen `Admin1local`. Bei direktem Start ohne docker-compose wird das falsche Passwort verwendet.

### Betroffene Dateien

| Datei | Zeile | Befund |
|-------|-------|--------|
| `backend/internal/server/auth.go` | 438 | `count > 0` Guard verhindert Seeding |
| `backend/internal/config/config.go` | 120 | Default-Passwort `Skillr1dev` weicht von docker-compose ab |

## Loesungsvorschlag

`SeedAdmin` soll pruefen, ob der **spezifische Admin-Account** (by email) existiert, nicht ob die Users-Tabelle leer ist. Upsert-Logik:

1. Pruefe `SELECT COUNT(*) FROM users WHERE email = $1` statt `SELECT COUNT(*) FROM users`
2. Wenn der Admin-Account nicht existiert → INSERT
3. Logge ob geskipped (Account existiert) oder erstellt

## Verwandte Dokumente

- FR-115: Dev Admin Seed Defaults (`docs/features/FR-115-dev-admin-seed-defaults.md`)
- `backend/internal/config/config.go` — Config-Defaults
- `docker-compose.yml` — Env-Var-Overrides
