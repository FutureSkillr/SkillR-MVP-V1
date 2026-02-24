# OBS-009: Solid Pod Connect Returns 401 on Staging

**Beobachtet:** 2026-02-24
**Severity:** medium
**Status:** fixed

---

## Beobachtung

Nach erfolgreichem Google OAuth Login auf der Staging-Instanz schlaegt die Verbindung
zum Solid Pod fehl. Beide Endpoints geben `401 Unauthorized` zurueck:

```
GET  https://future-skillr-staging-3fjvhlhlra-ey.a.run.app/api/v1/pod/status  → 401
POST https://future-skillr-staging-3fjvhlhlra-ey.a.run.app/api/v1/pod/connect → 401
```

## Ursache

Firebase login (`signInWithPopup`) speichert den User in `skillr-session`, aber
**nie einen Bearer Token in `skillr-token`**. Alle API-Aufrufe nutzen `getAuthHeaders()`,
das `skillr-token` aus localStorage liest. Fuer Firebase-User war dieser Key leer,
daher wurde kein `Authorization`-Header gesendet.

Das Backend-Middleware kann Firebase ID Tokens bereits verifizieren — es hat nur
nie einen erhalten.

## Loesung

1. **`frontend/services/firebaseAuth.ts`**: Neue Hilfsfunktion `storeFirebaseToken()`
   speichert den Firebase ID Token in `skillr-token` bei jedem Login
   (`firebaseLoginWithProvider`, `firebaseRegister`, `firebaseLogin`).
   Token wird auch bei `refreshAuthUser()` aktualisiert und bei `firebaseLogout()`
   entfernt.

2. **`frontend/App.tsx`**: Neuer `useEffect`-Interval refresht den Token alle
   50 Minuten (Firebase ID Tokens laufen nach 1 Stunde ab).

## Verifizierung

1. Google OAuth Login durchfuehren
2. DevTools → Application → LocalStorage → `skillr-token` muss vorhanden sein
3. Pod-Einstellungen oeffnen → kein 401 mehr
4. Network Tab → `/api/v1/pod/status` hat `Authorization: Bearer <token>` Header

## Verwandte Dokumente

- OBS-007: Pod Connect 500 on Cloud Run
- OBS-006: Google Login Bypasses OAuth
- OBS-008: CSP Blocks Google OAuth
- FR-001: Social Login (Google OAuth)
- FR-056: Server-Side Authentication & Session Management
