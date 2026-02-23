# OBS-006: Google Login Bypasses OAuth — Creates Fake Account Instantly

**Beobachtet:** 2026-02-23
**Severity:** medium
**Status:** open

---

## Beobachtung

Beim Klick auf "Mit Google anmelden" wird der Nutzer sofort eingeloggt, ohne dass ein Google OAuth-Consent-Screen erscheint. Es wird ein Fake-Account erstellt (z.B. `google-user-abc12345@google.local`).

## Ursachenanalyse

### Entscheidungslogik im Frontend

`LoginPage.tsx` (Zeile 54-56):
```typescript
const user = useFirebase
  ? await firebaseLoginWithProvider(provider)   // ← Real OAuth via Firebase
  : await loginWithProvider(provider);           // ← Dev-Stub, kein OAuth
```

`useFirebase` = `isFirebaseConfigured()` — prueft ob Firebase-Config vorhanden ist. Wenn Firebase **nicht konfiguriert** ist (lokaler Dev-Modus), wird der Stub-Pfad gewaehlt.

### Backend-Stub

`backend/internal/server/auth.go` Zeile 278-340 — `LoginProvider()`:
- Empfaengt `{ "provider": "google" }` vom Frontend
- Erstellt eine Fake-E-Mail: `google-user-<uuid>@google.local`
- Inserted einen neuen User in die DB
- Gibt sofort ein User-Objekt zurueck — **kein OAuth-Redirect, kein Token-Austausch**

### Betroffene Dateien

| Datei | Zeile | Befund |
|-------|-------|--------|
| `frontend/components/LoginPage.tsx` | 54-56 | `isFirebaseConfigured()` steuert den Pfad |
| `frontend/services/auth.ts` | 58-73 | `loginWithProvider()` ruft den Stub-Endpoint auf |
| `backend/internal/server/auth.go` | 278-340 | `LoginProvider()` Stub erstellt Fake-User |
| `frontend/services/firebase.ts` | 38-42 | `getGoogleProvider()` — echte OAuth-Config |

## Warum passiert das?

Firebase ist in der lokalen Entwicklungsumgebung nicht konfiguriert. Ohne Firebase-Konfiguration (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, etc.) faellt `isFirebaseConfigured()` auf `false` zurueck, und alle Social-Logins verwenden den Stub.

## Loesungsvorschlag

### Option A: Firebase konfigurieren (empfohlen fuer Staging/Produktion)
- Firebase-Umgebungsvariablen in `.env.local` / docker-compose setzen
- Google als Auth-Provider in der Firebase Console aktivieren
- Dann wird der echte OAuth-Pfad (`firebaseLoginWithProvider`) verwendet

### Option B: Stub-Hinweis im UI (fuer Dev-Modus)
- Wenn `isFirebaseConfigured() === false`, Social-Login-Buttons als "(Dev-Modus)" kennzeichnen
- Oder Social-Login-Buttons ausblenden wenn Firebase nicht konfiguriert

### Option C: Google OAuth direkt (ohne Firebase)
- `/api/auth/login-provider` mit echtem Google OAuth 2.0 Flow implementieren
- Backend leitet zu `accounts.google.com/o/oauth2/v2/auth` weiter
- Callback verarbeitet den Authorization Code und erstellt/aktualisiert den User

## Verwandte Dokumente

- FR-001: Social Login (Google OAuth + Apple + Meta)
- FR-056: Server-Side Authentication & Session Management
- `frontend/services/firebase.ts` — Firebase-Initialisierung
- `frontend/services/firebaseAuth.ts` — Echter OAuth-Flow via Firebase
