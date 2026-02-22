# Future Skiller – MVP Scope-Analyse

*Extrahiert aus der Diskussion vom 17.02.2026*

---

## 1. Was wollen wir erreichen? (Vision & Ziele)

### Kernvision
Future Skiller ist eine App, die Menschen – angefangen bei Kindern und Jugendlichen ab ca. 14 Jahren – dabei hilft, ihre **Interessen zu entdecken** und ein **lebenslanges Skill-Profil** aufzubauen. Es geht nicht um eine klassische Lern-App oder Kursplattform, sondern um eine neuartige Form der Selbsterkundung und Kompetenz-Dokumentation.

### Strategische Ziele

**Interessenprofil statt Berufsempfehlung:** Die App soll Jugendlichen helfen, überhaupt erst herauszufinden, was sie interessiert. Nicht das System sagt "werde Förster", sondern der Nutzer erkennt selbst: "Mich fasziniert Natur und Holz." Das Ergebnis der VUCA-Reise ist eine Bestandsaufnahme – ein Interessenprofil, kein Berufsprofil.

**Zertifiziertes Skill-Profil als Alleinstellungsmerkmal:** Der zentrale Unterschied zu ChatGPT und anderen Angeboten: Skiller kann ein Profil ausstellen, das zertifiziert und nachvollziehbar ist. Nicht der einzelne Kurs wird zertifiziert, sondern die *Methodik*, mit der das Profil erstellt wird. Langfristig soll diese Methodik durch eine externe Instanz (z.B. TÜV) geprüft werden können.

**Skill-Profil fürs Leben:** Das Profil begleitet den Nutzer ein Leben lang – von der ersten Entdeckungsreise mit 14 über Ausbildung, Studium, Berufswechsel bis zur Weiterbildung. Es ist eine Art "digitale Skill-Akte", die unabhängig vom Arbeitgeber existiert und dem Menschen selbst gehört.

**Monetarisierung über Matching:** Unternehmen mit konkretem Bedarf (z.B. Siemens sucht Werkstudenten Metalltechnik) können ihre Anforderungsprofile auf der Plattform hinterlegen. Das Matching von Interessenprofilen auf Unternehmensbedarfe ist ein klarer Umsatzkanal. Zusätzlich können Unternehmen Kurse/Inhalte sponsern (z.B. Nescafé sponsert einen Kaffee-Kurs), was eine neue Form der Sichtbarkeit jenseits klassischer Werbung schafft.

### Vier Zielgruppen
1. **Kinder/Jugendliche** (Hauptzielgruppe, ab ~14 Jahre) – die primären Nutzer
2. **Eltern** – enablen die Nutzung, haben Interesse am Vorwärtskommen des Kindes
3. **Unternehmen/Industrie** – haben konkreten Bedarf für Stellen, pumpen Inhalte rein
4. **Kammern (IHK, Handwerkskammer) und Arbeitsamt** – Multiplikatoren, haben allgemeines Wissen über Berufe und Bedarf

---

## 2. Was tun wir? (MVP-Scope)

### Phase 1: Die "Reise nach VUCA" (Onboarding / Interessenerkundung)

Der Einstieg in die App ist eine gamifizierte Weltreise – die "Reise nach VUCA". Dabei gilt:

- **Start am eigenen Standort:** Der Nutzer startet dort, wo er ist (Geokoordinate/Foto), nicht an einem vordefinierten Ort.
- **Interessengetriebene Navigation:** Der Nutzer gibt ein Thema oder Interesse an (z.B. "Holocaust", "Kochen", "Holz"). Der KI-Assistent (Scout/Coach) schlägt daraufhin eine Reise zu relevanten Orten vor – lokal oder global.
- **Immer zwei Optionen:** Bei jedem Schritt kann der Nutzer wählen: hier in der Nähe bleiben oder weit weg springen. Thematisch vertiefen oder Thema wechseln.
- **Potpourri-Prinzip:** Das System zeigt immer ein breites Angebot ("Potpourri") an Themen. Was der Nutzer anklickt/wählt, wird als Interessensignal getrackt. Was er ignoriert, ebenfalls. Kein Bias: Das System soll nicht nur noch Holz anzeigen, weil einmal Holz gewählt wurde. Es muss immer Ausstiegsmöglichkeiten in andere Themen geben.
- **VUCA als Bingo-Matrix:** Die Reise hat ein Abschlusskriterium: Wenn der Nutzer zu allen vier VUCA-Dimensionen (Volatilität, Unsicherheit, Komplexität, Ambiguität) hinreichend viele Erfahrungen gesammelt hat, ist die Reise beendet. Am Ende weiß jedes Kind, was VUCA bedeutet – unabhängig davon, ob es das in Dresden oder Shanghai erlebt hat.
- **Dialogbasiert, nicht kursbasiert:** Kein klassischer Kurs mit fester Struktur, sondern ein KI-gestützter Dialog. Das LLM generiert Inhalte dynamisch basierend auf dem Interesse des Nutzers. Mikrolektionen mit Fragen entstehen im Dialog.
- **Kein fertiger Kurs nötig:** Der Inhalt wird vom LLM aus dem Weltwissen (inkl. Wikipedia) generiert. Kein Content-Creator muss vorher Kurse erstellen – das ist ein Unterscheidungsmerkmal.

### Phase 2: Skill-Profil aufbauen

- Nach Abschluss der VUCA-Reise liegt ein **Interessenprofil** vor (visualisiert z.B. als Spinnennetz-Diagramm mit Dimensionen wie Hard Skills, Soft Skills, Future Skills, Resilienz).
- Das Profil wird aus den Dialogverläufen und Antworten des Nutzers abgeleitet.
- Jede Interaktion baut ein "Reisetagebuch" auf – die Daten werden gespeichert und bilden das Portfolio/Profil.

### Technische Umsetzung (MVP)

- **Web-App** (kein nativer App-Store-Zwang), erreichbar über die Webseite mit Start-Button
- **Google-basiert:** Frontend über Google AI Studio (Gemini), Backend und Datenbank bei Google Cloud. Sprachmodelle und Sprachausgabe über Gemini.
- **KI-Coach mit Stimme:** Der Begleiter (Scout/Coach) spricht mit dem Nutzer. Stimmenauswahl ist möglich (über Gemini Sprachmodelle). Die Stimme ist wichtig für Akzeptanz bei Jugendlichen.
- **Text und Sprache:** Nutzer sollen sowohl per Sprache als auch per Text interagieren können (z.B. im Bus 5 Minuten Textmodus, zuhause Sprachmodus).

### Was dem IHK-Vertreter zeigen

Der MVP soll so weit gehen, dass er dem Ausbildungsmanager der IHK präsentiert werden kann:
- VUCA-Reise als Einstieg (Interessenerkundung)
- Resultierendes Interessenprofil
- Perspektive: Wie dieses Profil auf Ausbildungsbedarfe gematcht werden kann

---

## 3. Was grenzen wir ab? (Nicht im MVP)

### Explizit ausgeschlossen

**Keine Berufsempfehlungen aussprechen:** Das System sagt niemandem "werde Förster" oder "werde Friseur". Es zeigt nur den Ist-Stand der Interessen. Die Schlussfolgerung bleibt beim Menschen.

**Kein formales Zertifizierungsverfahren:** Die TÜV/ISO-Zertifizierung der eigenen Methodik ist wichtig, aber kostet viel Geld und Zeit. Das kommt erst, wenn Geld oder Fördermittel da sind. Auch das Wort "Zertifikat" wird bewusst vermieden, um der IHK nicht ins Gehege zu kommen (die IHK hat das Alleinstellungsmerkmal der Prüfungsabnahme).

**Keine Kursplattform:** Future Skiller ist keine Delivery-Plattform für klassische Kurse und keine Creator-Plattform. Kurse sind nur Mittel zum Zweck. Das Skill-Profil ist das entscheidende Produkt.

**Kein Avatar-System / Gamification-Optik:** Avatare (sowohl für den Nutzer als auch für den KI-Coach) werden als Ausblick/Vision gezeigt, aber im MVP nicht umgesetzt. Die Lernreise wird zunächst ohne visuelle Avatare gestaltet.

**Kein Industrie-Matching:** Das Matching von Interessenprofilen auf konkrete Unternehmensbedarfe oder Berufsprofile ist ein späterer Schritt, nicht Teil des MVP.

**Keine Headhunter-/Jobbörsen-Funktionalität:** Der Export des Skill-Profils in Jobbörsen wie Indeed ist ein zukünftiger Monetarisierungskanal, aber nicht jetzt.

**Kein Ausbildungsberichtsheft / externe Zertifikats-Integration:** Die Idee, dass IHK oder andere Stellen ihren Stempel in der App geben, ist eine spätere Phase.

**Keine physischen Elemente:** Physische Austauschprogramme, lokale Außenposten oder QR-Code-Karten sind Vision, nicht MVP.

**Keine Zielgruppe 45-jährige Umschüler:** Der MVP startet mit Kindern/Jugendlichen, weil dort die bestehenden Kontakte und die Reichweite liegen.

**Keine kuratierte Inhalte im Detail:** Die Inhalte werden dynamisch vom LLM generiert. Die Kuratierung der Rahmenstruktur (Orte, Dimensionen) ist nötig, aber keine redaktionelle Einzelkurs-Erstellung.

**Kein Bezahl-/Checkout-System:** Obwohl erwähnt, dass der MVP bis zum "Bezahlen" gehen sollte, liegt der Fokus klar auf der VUCA-Reise + Profil als funktionaler Kern.

---

## Zusammenfassung: Der MVP in einem Satz

> **Der MVP ist eine Web-App, in der Jugendliche eine KI-gestützte, dialogbasierte "Reise nach VUCA" machen, dabei ihre Interessen entdecken und am Ende ein erstes Skill-/Interessenprofil erhalten – als Grundlage für alles Weitere.**
