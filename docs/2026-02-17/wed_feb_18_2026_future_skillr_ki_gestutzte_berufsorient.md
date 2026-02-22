# Copilot Chat Conversation Export: Future Skillr: KI-gestützte Berufsorient

**User:** @de4nde
**Thread URL:** https://github.com/copilot/c/86cd8e52-e523-4670-9da0-6153448b0efb

## @de4nde

gehe alle dateien durch, und erkläre mir was skillr ist. wir bauen aktuell unser projekt skillr und brauchen eine übersicht.

## Copilot

Ich werde alle Dateien im Ordner durchgehen und dir einen Überblick über das Skillr-Projekt geben.Jetzt lese ich die Dateien, um dir einen umfassenden Überblick zu geben:## 📊 Übersicht: Was ist Skillr (Future Skillr)?

Basierend auf all den durchgelesenen Dateien gebe ich dir eine strukturierte Zusammenfassung deines Projekts:

---

## **Die Kernidee**

**Future Skillr** ist eine KI-gestützte Web-App, die **Jugendlichen ab 14 Jahren hilft, ihre Interessen und Fähigkeiten zu entdecken** – nicht durch Tests oder Fragebögen, sondern durch eine spielerische **"VUCA-Weltreise"**.

Das Besondere: Die App erstellt ein **lebenslanges Interessenprofil**, das den Nutzer vom ersten Berufsorientierungsprozess über Ausbildung und Studium bis zur Weiterbildung begleitet.

---

## **Wie es funktioniert**

### **Phase 1: Die VUCA-Reise (Onboarding)**
1. **Nutzer startet**: Nennt ein Interesse (z.B. "Kochen", "Holz", "Astronomie")
2. **KI-Coach schlägt Reiseziele vor**: Eine Weltreise mit konkreten Orten (Rom, Tokyo, Great Barrier Reef, etc.)
3. **Dialogbasiertes Lernen**: Der Nutzer hilft Charakteren, echte Probleme zu lösen (z.B. Koch in Rom mit 200 Gästen)
4. **VUCA-Dimensionen erlebbar machen**: Dabei lernt der Nutzer nebenbei:
   - **V**olatilität (Unsicherheit bei Plänen)
   - **U**ncertainty (Ungewissheit)
   - **C**omplexity (Komplexität)
   - **A**mbiguity (Mehrdeutigkeit)

### **Phase 2: Interessenprofil-Bildung**
- Aus den Dialog-Verläufen entsteht automatisch ein visuelles **Profil-Diagramm** (Spinnennetz)
- Sichtbare Dimensionen: Hard Skills, Soft Skills, Future Skills, Resilienz
- Der Nutzer sieht, was ihn ausmacht – ohne dass das System sagt "werde X Beruf"

---

## **Die 7 größten Herausforderungen (aus dem Challenge-Dokument)**

Das Team hat sich selbst **hart kritisiert**:

| Problem | Status |
|---------|--------|
| **1. Warum sollte ein 14-Jähriger das nutzen statt TikTok?** | 💬 Addictive Mechanics nötig, nicht nur Pädagogik |
| **2. 5-Jahr-Retention ist unrealistisch** | ✅ Gelöst: Cohort Cycling statt Individual Retention |
| **3. Chicken-Egg-Problem (Startups brauchen Unternehmen & Daten)** | ✅ Gelöst: MVP startet mit KI-generierten Inhalten ohne Companies |
| **4. Content Marketing vs. "Trust"?** | ⚠️ JMStV-Compliance muss geprüft werden (Jugendmedienschutz) |
| **5. KI-Qualität – Gemini-Output gut genug?** | 🔧 Curated Skeletons + Dynamic Generation (nicht rein generativ) |
| **6. Keine Validierungs-Checkpoints im Plan** | ✅ Definiert: Gates bei Week 4, Month 3, 6, 9, 12 |
| **7. Zero Moat während Aufbau?** | ✅ Moat: Institutions (IHK), Content Library, Speed |

---

## **Die Lösung: Ein radikaler Schnitt (Proposal.md)**

Der Vorschlag: **Nicht auf 50.000 Nutzer warten. Erst 25 Jugendliche testen.**

### **90-Tage-Proof:**
- **Week 1-3**: Minimale "Magic Moment" bauen (15k EUR)
  - 1 Weltreise, 20 Stationen, KI-Dialog, Profil-Update, Passport-Stamps
- **Week 4**: 25 Schüler testen (1 Realschule, 2h BO-Stunde)
  - Target: >5 von 25 kommen freiwillig zurück (Day 14)
- **Woche 5-6**: IHK-Gespräch mit echten Engagement-Daten
  - Pilot mit 10 Schulen, 200-300 Schülern
- **Woche 9-12**: 200-Schüler-Validation (D30 Retention)
  - Kill-Ziel: >10% D30 Retention (Duolingo schafft 15-20%)

**Wenn alles gut läuft:** 1 IHK-Pilot, 5.000 EUR Revenue, Go/No-Go-Entscheidung vor Month 6.

---

## **MVP-Scope: Was NICHT dabei ist**

```
❌ Berufsempfehlungen aussprechen
❌ Formale Zertifikate
❌ Kursplattform / Creator-Platform
❌ Avatar-Systeme
❌ Company Matching (kommt später)
❌ Jobbörsen-Integration
❌ Bezahl-Systeme
```

**Das reicht für den MVP:**
- Web-App (Leaflet.js Map + Gemini API)
- VUCA-Reise + AI-Dialog
- Interessenprofil-Visualisierung
- Passport-Stamps

---

## **Go-to-Market: Warum IHK Dresden?**

Die Chambers (**IHK**) sind der Schlüssel:
- 287 offene Lehrstellen in Dresden allein
- 4:1 Ratio (offene Positionen : unversorgte Jugendliche)
- IHK hat Budget, Schulpartnerschaften, Mandates
- Sie brauchen: **Better Matching zwischen Interesse & Ausbildungsmarkt**

**Der Pitch:**
> "Wir machen euren Azubibotschafter digital – 365 Tage/Jahr, statt 2-3 Besuche/Jahr"

---

## **Techstack**

```
Frontend: Leaflet.js (Maps), Chart.js (Profile), Tailwind CSS
Backend: Google Cloud Run, Firebase
AI: Gemini (Text + Voice Generation)
Duration: 3 Weeks Build, ~15k EUR
```

---

## **Deine nächsten Schritte**

Basierend auf der Checkliste (Checkliste.md) musst ihr prüfen:

1. ✅ **VUCA-Reise**: Funktioniert der Dialog intuitiv?
2. ✅ **Profile entstehen**: Verändert sich das Spinnennetz live?
3. ✅ **KI-Qualität**: Fühlt es sich "nicht wie eine Lern-App" an?
4. ✅ **16-Jährige sagen**: "Das bin ich" (Ultimate Success Test)

---

**Fazit**: Skillr ist ein **Orientierungs-Abenteuer mit Profiling als Nebenprodukt** – nicht ein Berufstest mit Gamification. Das Innovative: Die VUCA-Welt wird *erlebt*, nicht erklärt.

Brauchst du noch Details zu einem spezifischen Bereich?
