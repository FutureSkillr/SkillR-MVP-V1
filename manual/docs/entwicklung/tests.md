# Tests

Teststrategie, Ausfuehrung und Konventionen fuer das Future-Skiller-Projekt.

---

## Grundprinzip

> **Keine Funktion ohne Unit Test. Kein Konzept ohne Integration Test.**

Dies ist eine der zentralen Arbeitsregeln des Projekts (siehe [Konventionen](konventionen.md)). Jede neue Funktion muss von Tests begleitet werden, bevor sie als abgeschlossen gilt.

---

## Test-Dateibenennung

| Quellcode | Unit Test | Integration Test |
|-----------|----------|-----------------|
| `foo.go` | `foo_test.go` | `foo_integration_test.go` |
| `foo.ts` | `foo.test.ts` | `foo.integration.test.ts` |

Testdateien liegen **neben dem Quellcode**, nicht in separaten Verzeichnissen. Dies erleichtert die Navigation und stellt sicher, dass Tests gemeinsam mit dem Code gepflegt werden.

---

## Go-Backend Tests

### Alle Tests ausfuehren

```bash
# Ueber Makefile
make go-test

# Direkt
cd backend && go test ./...
```

### Einzelnes Package testen

```bash
cd backend && go test ./internal/server/...
cd backend && go test ./internal/ai/...
cd backend && go test ./internal/middleware/...
```

### Einen bestimmten Test ausfuehren

```bash
cd backend && go test ./internal/server/ -run TestHealthHandler
```

### Verbose-Modus (Details sehen)

```bash
cd backend && go test -v ./internal/server/...
```

### Integration Tests

Integration Tests verwenden den Build-Tag `integration` und werden standardmaessig uebersprungen:

```bash
# Nur Integration Tests ausfuehren
cd backend && go test -tags=integration ./...

# Integration Tests eines bestimmten Packages
cd backend && go test -tags=integration ./internal/ai/...
```

### Test-Coverage

```bash
# Coverage-Report im Terminal
cd backend && go test -cover ./...

# HTML-Coverage-Report generieren
cd backend && go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
open coverage.html
```

### Race-Condition-Erkennung

```bash
cd backend && go test -race ./...
```

---

## Frontend Tests

### Alle Tests ausfuehren

```bash
# Ueber Makefile
cd frontend && npm test

# Als Teil von test-all
make test-all
```

### Einen bestimmten Test ausfuehren

```bash
cd frontend && npx vitest run services/gemini.test.ts
```

### Watch-Modus (Tests bei Aenderungen automatisch ausfuehren)

```bash
cd frontend && npx vitest watch
```

### TypeScript-Typpruefung

Die Typpruefung ist kein Test im engeren Sinne, aber ein wichtiger Qualitaetssicherungsschritt:

```bash
make typecheck
# Fuehrt aus: cd frontend && npx tsc --noEmit
```

---

## Was testen?

### Unit Tests

Unit Tests pruefen einzelne Funktionen oder Methoden isoliert:

| Bereich | Beispiele |
|---------|----------|
| **Backend Handler** | HTTP-Statuscode, Response-Body, Fehlerbehandlung |
| **Backend Middleware** | Auth-Token-Validierung, Rate Limiting, CORS-Header |
| **Backend Config** | Korrekte Werte aus Umgebungsvariablen |
| **Frontend Services** | API-Client-Aufrufe, Datenformatierung |
| **Frontend Hooks** | State-Management, Seiteneffekte |
| **Frontend Utils** | Hilfsfunktionen, Validierung |

### Integration Tests

Integration Tests pruefen das Zusammenspiel mehrerer Komponenten end-to-end:

| Bereich | Was wird geprueft |
|---------|------------------|
| **Firebase Auth Flow** | Login, Token-Generierung, Token-Validierung im Backend |
| **Gemini API Interaktion** | Prompts senden, Antworten verarbeiten, Fehlerbehandlung bei API-Ausfall |
| **VUCA Journey State Transitions** | Stationswechsel, Bingo-Matrix-Fortschritt, Profilaktualisierung |
| **Profil-Generierung** | Vollstaendiger Pfad: Interessen-Input, KI-Analyse, Profil-Output |
| **Health Check** | Alle Komponenten (DB, Redis, AI) werden korrekt geprueft |
| **API Gateway** | Proxy-Routen, Config-Injection, Rate Limiting |

---

## Test-Organisation im Backend

Beispielhafte Dateistruktur:

```
backend/internal/server/
├── server.go              # Server-Setup
├── server_test.go         # Unit Tests fuer Server
├── health.go              # Health-Endpoint
├── health_test.go         # Unit Tests fuer Health
├── routes.go              # Routing
├── auth.go                # Auth-Endpunkte
└── static.go              # Statische Dateien
```

### Test-Helper

Fuer wiederverwendbare Test-Hilfsfunktionen:

```
backend/internal/middleware/
├── auth.go
├── ratelimit.go
├── requestlog.go
└── testhelpers_test.go    # Gemeinsame Test-Hilfsfunktionen
```

!!! tip "testhelpers_test.go"
    Dateien mit dem Suffix `_test.go` werden nur waehrend `go test` kompiliert. `testhelpers_test.go` ist ein guter Platz fuer Mock-Objekte, Test-Fixtures und Hilfsfunktionen, die in mehreren Tests des Packages benoetigt werden.

---

## Test-Organisation im Frontend

```
frontend/
├── services/
│   ├── gemini.ts           # Gemini API Client
│   ├── gemini.test.ts      # Unit Tests
│   ├── pod.ts              # Pod Service
│   └── pod.test.ts         # Unit Tests
├── tests/
│   └── ...                 # Uebergreifende Tests
└── package.json            # npm test Konfiguration
```

---

## Alle Tests auf einmal

```bash
make test-all
```

Dies fuehrt aus:

1. `cd frontend && npm test` -- Frontend-Tests
2. `cd backend && go test ./...` -- Backend-Tests

!!! warning "Reihenfolge"
    `make test-all` fuehrt Frontend-Tests zuerst aus. Falls ein Test fehlschlaegt, werden die nachfolgenden nicht mehr ausgefuehrt.

---

## Test-Coverage-Erwartungen

| Bereich | Erwartung |
|---------|----------|
| **Backend Handler** | Jeder Endpoint mit mindestens einem Happy-Path und einem Error-Path Test |
| **Backend Middleware** | Jede Middleware-Funktion mit Tests fuer erlaubte und abgelehnte Anfragen |
| **Frontend Services** | Jede oeffentliche Funktion mit Tests |
| **Frontend Hooks** | Jeder Custom Hook mit Tests fuer verschiedene States |
| **Kritische Pfade** | Gemini-Integration, Auth-Flow, Profil-Generierung mit Integration Tests |

Es gibt aktuell kein erzwungenes Coverage-Minimum, aber das Ziel ist eine sinnvolle Abdeckung aller kritischen Pfade und oeffentlichen Schnittstellen.

---

## Tipps fuer gute Tests

1. **Aussagekraeftige Testnamen:** `TestHealthHandler_ReturnsOK_WhenAllComponentsHealthy` statt `TestHealth`
2. **Arrange-Act-Assert:** Tests klar in Vorbereitung, Ausfuehrung und Pruefung gliedern
3. **Unabhaengige Tests:** Jeder Test muss einzeln ausfuehrbar sein, ohne auf andere Tests angewiesen zu sein
4. **Keine externen Abhaengigkeiten in Unit Tests:** Mocks verwenden fuer Datenbanken, APIs, etc.
5. **Integration Tests klar kennzeichnen:** Build-Tag `integration` (Go) bzw. separater Dateiname `.integration.test.ts` (Frontend)
