# OBS-006: Google Login Bypasses OAuth — Creates Fake Account Instantly

**Beobachtet:** 2026-02-23
**Severity:** medium
**Status:** fixed (runtime config bootstrap in `index.tsx` + `make setup-firebase`)

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

## Analyse: Code ist bereits vorhanden

Vergleich mit der Referenz-Implementierung (mvp72) zeigt: **Der gesamte OAuth-Code ist bereits in SkillR-MVP-V1 kopiert und sogar erweitert:**

| Komponente | Status |
|------------|--------|
| `frontend/services/firebase.ts` | Identisch mit mvp72 |
| `frontend/services/firebaseAuth.ts` | Identisch (nur SESSION_KEY umbenannt) |
| `backend/internal/firebase/` | Vollstaendig (client, auth, agents, prompts) |
| `backend/internal/middleware/auth.go` | FirebaseAuth + OptionalFirebaseAuth vorhanden |
| `scripts/setup-firebase.sh` | 358 Zeilen, vollautomatisch |
| `make setup-firebase` | Makefile-Target vorhanden |

**Das Problem ist keine fehlende Implementierung, sondern fehlende Konfiguration.**

## Loesung (Teil 1): Firebase konfigurieren

```bash
make setup-firebase
```

Dieses Script:
1. Aktiviert Firebase APIs im GCP-Projekt
2. Erstellt die Firebase Web-App
3. Aktiviert Google als Sign-In-Provider
4. Schreibt die Config in `.env.deploy` und `.env.local`

## Loesung (Teil 2): Runtime Config Bootstrap

`make setup-firebase` allein reicht **nicht** fuer Deployments. Das Frontend liest
Firebase-Config aus `(globalThis as any).process?.env?.FIREBASE_API_KEY` — aber
`process.env` existiert im Browser nicht. Der Backend-Endpoint `/api/config` liefert
die Config, aber sie wurde nie in `globalThis.process.env` injiziert.

**Fix in `frontend/index.tsx`:** Vor dem React-Render wird `/api/config` gefetcht
und die Firebase-Werte in `globalThis.process.env` geschrieben. Damit gibt
`isFirebaseConfigured()` beim ersten Render `true` zurueck.

Nach Re-Deploy verwendet Google Login den echten OAuth-Popup-Flow.

## Verwandte Dokumente

- FR-001: Social Login (Google OAuth + Apple + Meta)
- FR-056: Server-Side Authentication & Session Management
- `frontend/services/firebase.ts` — Firebase-Initialisierung
- `frontend/services/firebaseAuth.ts` — Echter OAuth-Flow via Firebase
