# OBS-008: CSP Blocks Google OAuth Popup — auth/internal-error

**Beobachtet:** 2026-02-24
**Severity:** high
**Status:** fixed

---

## Beobachtung

Nach dem Fix von OBS-006 (Runtime Config Bootstrap) zeigt der Google Login nun korrekt
den Firebase OAuth-Flow an, aber der Popup schlaegt mit `auth/internal-error` fehl.

### Fehler 1: CSP blockiert Google Scripts

```
Loading the script 'https://apis.google.com/js/api.js?onload=__iframefcb829969'
violates the following Content Security Policy directive:
"script-src 'self' blob: https://cdn.tailwindcss.com".
```

### Fehler 2: CSP blockiert Firebase Auth Helper Iframe

```
Framing 'https://gen-lang-client-0456368718.firebaseapp.com/' violates the
following Content Security Policy directive:
"frame-src https://accounts.google.com https://apis.google.com".
```

### Fehler 3: COOP blockiert Popup-Kommunikation

```
Cross-Origin-Opener-Policy policy would block the window.closed call.
Cross-Origin-Opener-Policy policy would block the window.close call.
```

## Ursachenanalyse

Firebase `signInWithPopup()` benoetigt:

| Ressource | Domain | CSP-Direktive |
|-----------|--------|---------------|
| Google API Loader | `https://apis.google.com/js/api.js` | `script-src` |
| Firebase Auth UI | `https://www.gstatic.com` | `script-src` |
| OAuth Consent Screen | `https://accounts.google.com` | `frame-src` |
| Google API Iframe | `https://apis.google.com` | `frame-src` |
| Firebase Auth Helper | `https://{project}.firebaseapp.com` | `frame-src` |
| Popup window.closed | Cross-origin popup | COOP |

Die urspruengliche CSP (FR-059) war fuer eine App ohne OAuth-Popups ausgelegt:

```
script-src 'self' blob: https://cdn.tailwindcss.com
```

Kein `frame-src` definiert → faellt auf `default-src 'self'` zurueck.

### COOP-Problem

`Cross-Origin-Opener-Policy: same-origin-allow-popups` ist **zu restriktiv** fuer
Firebase `signInWithPopup()`. Der OAuth-Popup (Google) und der Firebase Auth Helper
Iframe muessen `window.closed` und `window.close()` aufrufen koennen. Der Browser-
Default (`unsafe-none`) erlaubt dies — ein expliziter COOP-Header schraenkt es ein.

**Kein COOP-Header setzen** ist die korrekte Loesung fuer Apps mit OAuth-Popups.

### Betroffene Dateien

| Datei | Zeile | Befund |
|-------|-------|--------|
| `backend/internal/server/server.go` | 59 | CSP Header — `script-src` und `frame-src` zu restriktiv |
| `backend/internal/server/server_test.go` | 42 | Test prueft die gleiche CSP |

## Loesung

### CSP erweitert

| Direktive | Hinzugefuegt | Grund |
|-----------|--------------|-------|
| `script-src` | `https://apis.google.com https://www.gstatic.com` | Google API Loader + Firebase Auth |
| `frame-src` | `https://accounts.google.com https://apis.google.com https://*.firebaseapp.com` | OAuth Popup + Firebase Auth Helper |

`img-src` (`https:`) und `connect-src` (`https://*.googleapis.com`) deckten Google-
Domains bereits ab — keine Aenderung noetig.

### Kein COOP-Header

Expliziter `Cross-Origin-Opener-Policy` Header wurde **nicht** gesetzt. Der Browser-
Default (`unsafe-none`) ist korrekt fuer Firebase `signInWithPopup()`.

### Endgueltige CSP

```
default-src 'self';
script-src 'self' blob: https://cdn.tailwindcss.com https://apis.google.com https://www.gstatic.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://unpkg.com;
frame-src https://accounts.google.com https://apis.google.com https://*.firebaseapp.com;
worker-src 'self' blob:;
frame-ancestors 'none'
```

## Gesamtloesung: Google OAuth auf Cloud Run (OBS-006 + OBS-008)

Das vollstaendige Fix fuer Google OAuth auf Cloud Run umfasste drei Aenderungen:

### 1. Runtime Config Bootstrap (`frontend/index.tsx`)

`firebase.ts` liest Config aus `globalThis.process.env` — existiert im Browser nicht.
Fix: Vor dem React-Render `/api/config` fetchen und Firebase-Werte in
`globalThis.process.env` injizieren. Damit gibt `isFirebaseConfigured()` `true` zurueck.

### 2. CSP-Erweiterung (`backend/internal/server/server.go`)

Die CSP aus FR-059 war fuer eine App ohne OAuth-Popups. Firebase `signInWithPopup()`
braucht `script-src` fuer Google APIs und `frame-src` fuer OAuth-Iframes.

### 3. OAuth Authorized Domains (`scripts/setup-oauth-domains.sh`)

Die Cloud Run URL muss als authorized domain in Firebase Auth registriert sein, sonst
blockiert Firebase den OAuth-Flow. Automatisiert als Post-Deploy-Schritt in `deploy.sh`.

## Verwandte Dokumente

- OBS-006: Google Login Bypasses OAuth
- FR-001: Social Login (Google OAuth + Apple + Meta)
- FR-059: Security Headers
- `backend/internal/server/server.go` — CSP Middleware
- `frontend/index.tsx` — Runtime Config Bootstrap
- `scripts/setup-oauth-domains.sh` — Post-Deploy OAuth Domain Setup
