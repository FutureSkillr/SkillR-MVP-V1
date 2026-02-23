# OBS-001: Gemini API Quota Exceeded — Google AI Studio Free Tier

**Beobachtet:** 2026-02-22
**Berichtet von:** Kollege (AI Studio Entwickler)
**Severity:** blocking
**Status:** open

---

## Beobachtung

Beim Entwickeln und Testen der App im Google AI Studio tritt dauerhaft folgender Fehler auf:

> Der Aufruf der Gemini-API ist fehlgeschlagen: Das Benutzerkontingent wurde überschritten. Bitte versuchen Sie es spaeter erneut.

Der Fehler tritt auch nach Stunden und ueber Nacht nicht auf. Die Sprachausgabe (TTS) funktioniert ebenfalls nicht. Betroffene Deployment-URL:

```
https://future-skillr-intro-v-25-1041496140898.us-west1.run.app/
```

## Ursachenanalyse

Das GCP-Projekt nutzt den **Google AI Studio Free Tier**. Dieser hat harte Quotas:

| Modell | Free Tier RPM | Free Tier RPD | Free Tier TPM |
|--------|--------------|---------------|---------------|
| gemini-2.0-flash-lite | 15 | 1.500 | 1.000.000 |
| gemini-2.5-flash-preview-tts | 10 | 1.000 | — |

Diese Limits sind fuer Entwicklung unbrauchbar, sobald mehrere Requests pro Minute anfallen (Chat + TTS + Extraction). Der Free Tier regeneriert sich **nicht** zuverlaessig — einmal erschoepft, bleibt er stundenlang blockiert.

**Erschwerender Faktor:** Selbst Tier 1 (mit Billing, aber ohne Nutzung) kann restriktiver sein als Free bei manchen Modellen (z.B. nur 250 RPD).

## Betroffene Komponenten

| Komponente | Datei | Betroffen |
|------------|-------|-----------|
| Express Gemini Proxy | `frontend/server/routes/gemini.ts` | Alle 7 Endpoints blockiert |
| Chat-Funktion | `/api/gemini/chat` | Ja |
| TTS (Sprachausgabe) | `/api/gemini/tts` | Ja |
| STT (Spracheingabe) | `/api/gemini/stt` | Ja |
| Insight-Extraction | `/api/gemini/extract-insights` | Ja |

---

## Loesungsvorschlag

### Sofortmassnahme: Billing aktivieren + neuer API-Key

**Zeitaufwand:** ~10 Minuten
**Kosten:** Pay-as-you-go, geschaetzt < $5/Monat fuer Entwicklung

Schritte:

1. **Billing aktivieren** im GCP-Projekt
   - Google Cloud Console → Billing → Kreditkarte hinterlegen
   - Budget-Alert auf $10/Monat setzen (Sicherheitsnetz)

2. **Generative Language API pruefen**
   ```bash
   gcloud services list --enabled --filter="generativelanguage"
   # Falls nicht aktiv:
   gcloud services enable generativelanguage.googleapis.com
   ```

3. **Neuen API-Key erstellen** unter https://aistudio.google.com/apikey
   - Projekt mit aktiver Billing auswaehlen
   - Key auf `generativelanguage.googleapis.com` einschraenken (API Restriction)

4. **Key deployen**
   ```bash
   # In .env oder Cloud Run Env-Vars:
   GEMINI_API_KEY=AIza...neuerKey
   ```

5. **Redeployen** und Funktion verifizieren

**Quotas nach Billing-Aktivierung (Pay-as-you-go):**

| Modell | RPM | RPD | TPM |
|--------|-----|-----|-----|
| gemini-2.0-flash-lite | 2.000 | unbegrenzt | 4.000.000 |
| gemini-2.5-flash-preview-tts | 500 | unbegrenzt | — |

### Mittelfristig: Migration auf Vertex AI (bereits vorbereitet)

Das Go-Backend (`backend/internal/ai/vertexai.go`) hat bereits einen vollstaendigen VertexAI-Client implementiert. Die Migration eliminiert API-Keys komplett.

**Voraussetzungen:**

1. Billing aktiv (gleich wie oben)
2. Vertex AI API aktivieren:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```
3. Service Account mit Rolle `roles/aiplatform.user`:
   ```bash
   gcloud iam service-accounts create vertexai-sa \
     --display-name="VertexAI Service Account"
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:vertexai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```
4. Cloud Run Environment:
   ```bash
   GCP_PROJECT_ID=future-skillr  # oder die tatsaechliche Projekt-ID
   GCP_REGION=europe-west3
   ```

**Vorteile von Vertex AI gegenueber API-Key:**

| Aspekt | API-Key (AI Studio) | Vertex AI |
|--------|---------------------|-----------|
| Auth | API-Key in Env-Var | ADC / Service Account |
| Key-Rotation | Manuell | Automatisch (GCP-managed) |
| Quotas | Fest, per Key | Anpassbar per Projekt |
| IAM | Keine | Volle GCP IAM-Kontrolle |
| Audit-Log | Begrenzt | Cloud Audit Logs |
| Preise | Identisch | Identisch |
| DSGVO | Key-Exposure-Risiko | Kein Key im Umlauf |

### Preisreferenz (gemini-2.0-flash-lite)

| Metrik | Preis |
|--------|-------|
| Input | $0.075 / 1M Tokens |
| Output | $0.30 / 1M Tokens |
| TTS Audio | In Output-Tokens enthalten |

Bei geschaetzt 10.000 Requests/Monat (Entwicklung + Testing): **< $5/Monat**.

---

## Empfehlung

| Phase | Aktion | Wann |
|-------|--------|------|
| **Sofort** | Billing aktivieren, neuer API-Key, Budget-Alert setzen | Heute |
| **MVP3** | Weiterhin Express-Proxy mit API-Key (funktioniert) | Naechste Wochen |
| **V1.0** | Go-Backend mit Vertex AI (bereits implementiert) | Gemaess Roadmap |

## Verwandte Dokumente

- TC-016: Gemini Server Proxy Architecture (`docs/arch/TC-016-gemini-server-proxy.md`)
- TC-018: Agentic Backend & VertexAI (`docs/arch/TC-018-agentic-backend-vertexai.md`)
- FR-069: GCP Credentials Management
- Operator Quickstart (`docs/ops/operator-quickstart.md`)
- OBS-003: Prompt-Logs 401 waehrend Intro-Flow (verwandt: Frontend TTS Fallback-Fehlermeldung "Gemini API key not configured" tritt als Folge dieses Quota-Problems auf)
