# FR-033: Datenschutz for Minors (DSGVO/GDPR Compliance Framework)

**Status:** draft
**Priority:** must
**Created:** 2026-02-18

## Problem

Future Skiller handles content and interaction data for minors (14+). German data protection law is among the strictest in Europe for processing children's data. We must comply with:

| Law | Scope | Key Requirement |
|---|---|---|
| **DSGVO Art. 8** (EU GDPR) | Consent for data processing of children | Germany chose **16** as the age threshold. Under 16: parental consent required. |
| **DSGVO Art. 6** | Legal basis for processing | Consent (Art. 6(1)(a)) or legitimate interest (Art. 6(1)(f)) — for minors, consent is the safest basis |
| **DSGVO Art. 12-14** | Transparency / information duties | Privacy notice must be understandable for the target audience (teenagers) |
| **DSGVO Art. 17** | Right to erasure ("Recht auf Vergessenwerden") | Minors have a strengthened right to deletion — especially for data collected during childhood |
| **DSGVO Art. 25** | Data protection by design and default | Minimal data collection, purpose limitation, privacy-first defaults |
| **TTDSG §25** | Cookie/tracking consent | Consent required for non-essential cookies/tracking on German websites |
| **JMStV §5-6** | Youth media protection | Content directed at minors must not include harmful material; commercial content must be clearly separated |
| **BGB §§104-113** | Legal capacity of minors | Minors (7-17) have limited legal capacity; contracts and consent require parental involvement |

**The critical rule:** In Germany, a person under 16 **cannot independently consent** to data processing. A 14-year-old can use the app, but their parent/guardian must consent to the data processing.

## Solution

Build a layered consent and data protection system that is legally compliant AND doesn't destroy the user experience.

### Age-Based User Flows

```
User opens app → Login (FR-001/FR-002)
     │
     ▼
Age Gate: "Wie alt bist du?"
     │
     ├── 16+ → Full consent flow (self)
     │         User reads & accepts Datenschutzerklaerung
     │         → Full access
     │
     ├── 14-15 → Parental consent flow
     │           User provides parent email
     │           Parent receives consent link
     │           Parent reads & accepts Datenschutzerklaerung
     │           Parent confirms: "Ich erlaube meinem Kind die Nutzung"
     │           → Full access (after parent confirms)
     │           → LIMITED access while waiting for parent consent
     │
     └── Under 14 → Blocked
                    "Future Skiller ist ab 14 Jahren."
                    → No account creation
```

### Limited Access (Waiting for Parental Consent)

While a 14-15-year-old waits for their parent to confirm consent, they can:
- Explore the globe (visual only)
- Complete 1 station (so they experience the magic moment)
- See their first passport stamp

They CANNOT:
- Have their interaction data stored permanently
- Build a persistent profile
- Be matched or visible to companies/chambers
- Share any data with third parties

This means: the first experience is NOT blocked by the consent flow. The teenager gets hooked BEFORE the parent email arrives. The parent sees an enthusiastic kid saying "Mama, bestaetig mal bitte die Mail" — which is the best conversion mechanism possible.

### Data Categories and Legal Basis

| Data Category | What | Legal Basis | Retention |
|---|---|---|---|
| **Account data** | Email, name, age, login provider | Contract performance (Art. 6(1)(b)) | Until account deletion |
| **Journey data** | Station visits, dialogue interactions, choices | Consent (Art. 6(1)(a)) | Until account deletion or erasure request |
| **Profile data** | Skill dimensions, interest tags, VUCA progress | Consent (Art. 6(1)(a)) | Until account deletion or erasure request |
| **Timing data** | Response timing, session duration, engagement | Legitimate interest (Art. 6(1)(f)) | Anonymized after 90 days |
| **Endorsements** | Third-party stamps, external artifacts | Consent of BOTH endorser and learner | Until either party requests deletion |
| **Matching data** | Interest-based matches with companies | Explicit consent (Art. 6(1)(a)) — separate from general consent | Until matching opt-out |
| **Analytics (aggregate)** | Anonymized trends for chamber dashboard | Legitimate interest (Art. 6(1)(f)) | Indefinite (anonymized = not personal data) |

### Privacy by Design Principles

1. **Data minimization.** We collect only what the product needs. No friend lists, no contacts, no location tracking (the globe is a metaphor, not GPS).

2. **Purpose limitation.** Journey data is used for: (a) the student's own profile, (b) anonymized aggregate analytics for chambers, (c) matching — ONLY with explicit separate consent. No other use. Ever.

3. **No data selling.** Explicit rule from BC-009: "Nicht der Unternehmer saugt deine Daten ab." Companies buy access to matching opportunities, not to raw data. This is a PRODUCT DECISION, not just a legal one.

4. **Right to erasure — strengthened for minors.** A student (or their parent) can request full deletion at any time. Deletion means: account, all journey data, all profile data, all endorsements, all matching history. The only thing that remains is anonymized aggregate data (which is no longer personal data).

5. **Transparency in age-appropriate language.** The Datenschutzerklaerung has TWO versions:
   - **Teen version:** Simple German, short sentences, no legal jargon. "Wir speichern, was du auf deiner Reise erlebst. Nur du und deine Eltern koennen das sehen. Kein Unternehmen sieht deine Daten, es sei denn, du sagst ausdruecklich Ja."
   - **Legal version:** Full DSGVO-compliant text for parents and auditors.

6. **No tracking beyond the product.** No third-party analytics (no Google Analytics, no Facebook Pixel). Internal analytics only, processed on our own infrastructure. TTDSG §25 compliance: no non-essential cookies.

7. **Parental dashboard with privacy boundary (FR-025).** Parents see: interest clusters, journey progress, engagement level. Parents do NOT see: individual conversations, specific answers, raw interaction data. The parent sees the map, not the diary.

### Matching Consent (Separate, Explicit, Revocable)

Matching (connecting students with companies) is a SEPARATE consent from general app usage:

- General consent: "Ich erlaube die Nutzung der App und die Speicherung meiner Reisedaten"
- Matching consent: "Ich moechte, dass Unternehmen mein Interessenprofil sehen koennen, um mir passende Ausbildungsplaetze vorzuschlagen"

Matching consent:
- Is available only from age 16 (no matching for under-16, even with parental consent)
- Must be given by the student themselves (not the parent)
- Is revocable at any time with immediate effect
- Shows exactly what companies will see (anonymized profile preview before opt-in)

### JMStV Compliance (Sponsored Content)

When sponsored content (FR-028) is implemented:
- All sponsored content is clearly labeled: "Unterstuetzt von [Unternehmen]"
- No direct purchase appeals to minors (JMStV §6)
- No behavioral targeting for commercial content — matching is interest-based, not tracking-based
- Editorial control remains with Future Skiller, not the sponsor
- A formal JMStV legal opinion must be obtained BEFORE launching sponsored content (budgeted in BC-010)

### Technical Implementation

| Component | Implementation |
|---|---|
| Age gate | First-login modal, age stored in Firebase Auth custom claims |
| Parental consent | Email with unique token + consent form (Firebase Dynamic Links) |
| Consent records | Firestore collection: who consented, when, to what, version of privacy policy |
| Consent versioning | Each Datenschutzerklaerung version is stored; re-consent required on material changes |
| Data deletion | Cloud Function triggered by deletion request; cascading delete across all collections |
| Data export | DSGVO Art. 20 (data portability): user can export all their data as JSON |
| Analytics | Self-hosted (no third-party trackers); or privacy-compliant tool (Plausible, Matomo) |
| Cookie banner | Not needed if no non-essential cookies are set (TTDSG §25) — design the app to avoid cookies |

## Acceptance Criteria

- [ ] Age gate blocks users under 14 from creating accounts
- [ ] Users aged 14-15 trigger parental consent flow
- [ ] Parental consent email is sent and consent is recorded with timestamp
- [ ] Limited access mode works while awaiting parental consent (1 station, no persistent data)
- [ ] Users aged 16+ can consent independently
- [ ] Datenschutzerklaerung exists in teen-friendly AND legal versions
- [ ] Account deletion cascades across all data collections
- [ ] Data export (JSON) is available to every user
- [ ] No third-party tracking cookies or analytics pixels
- [ ] Matching consent is separate from general consent, available only 16+
- [ ] All sponsored content is labeled per JMStV §6
- [ ] Consent records are immutable and timestamped

## Dependencies
- FR-001 (Social Login — login triggers age gate)
- FR-002 (Email Login — login triggers age gate)
- FR-003 (Firebase User Data — consent records stored here)
- FR-025 (Eltern-Dashboard — parent sees child's progress with privacy boundary)
- FR-028 (Sponsored Content — JMStV compliance)
- BC-005 (Portfolio-Backed Skill Verification — what third parties can see)
- TC-009 (Multimodaler Erinnerungsraum — data that falls under DSGVO)

## Notes
- The age threshold of 16 for independent consent is German law (DSGVO Art. 8, Germany chose 16). Other EU countries chose 13-16. If Future Skiller expands internationally, age thresholds must be adapted per country.
- Firebase Auth does NOT enforce age restrictions — we must build the age gate ourselves.
- The "limited access while waiting for consent" pattern is critical for UX. Blocking the teenager entirely until the parent responds (which could take days) would kill engagement. Let them taste the experience. The parent consent converts because the kid is already excited.
